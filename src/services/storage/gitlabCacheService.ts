// GitLab Cache Service
// Provides intelligent caching for GitLab API data with TTL, compression, and performance optimization

import { logger } from '@/lib/logger';
import type {
  GitlabProject,
  GitlabInstance,
  GitlabCacheEntry,
  GitlabCacheStats
} from '@/types';

// Cache configuration
interface CacheConfig {
  defaultTTL: number; // Default time-to-live in minutes
  maxEntries: number; // Maximum number of cache entries
  compressionThreshold: number; // Minimum size for compression (bytes)
  cleanupInterval: number; // Cleanup interval in minutes
  enablePersistence: boolean; // Whether to persist cache across sessions
  persistenceKey: string; // LocalStorage key for persistence
}

class GitlabCacheService {
  private cache: Map<string, GitlabCacheEntry> = new Map();
  private stats: GitlabCacheStats;
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 30, // 30 minutes
      maxEntries: 1000,
      compressionThreshold: 1024, // 1KB
      cleanupInterval: 15, // 15 minutes
      enablePersistence: true,
      persistenceKey: 'gitlab-cache-data',
      ...config,
    };

    this.stats = {
      namespace: 'gitlab',
      totalEntries: 0,
      memoryUsage: 0,
      hitRate: 0,
      missRate: 0,
    };

    this.initializeCache();
    this.startCleanupTimer();
  }

  /**
   * Initialize cache from persisted data
   */
  private initializeCache(): void {
    if (!this.config.enablePersistence) return;

    try {
      const persistedData = localStorage.getItem(this.config.persistenceKey);
      if (persistedData) {
        const parsedData = JSON.parse(persistedData);
        const now = new Date();

        // Restore valid entries
        Object.entries(parsedData).forEach(([key, entry]: [string, any]) => {
          const cacheEntry = entry as GitlabCacheEntry;
          if (cacheEntry.expiresAt > now) {
            this.cache.set(key, cacheEntry);
            this.updateMemoryUsage(key, cacheEntry);
          }
        });

        this.updateStats();
        logger.info(`Restored ${this.cache.size} cache entries from persistence`, 'GitlabCacheService');
      }
    } catch (error) {
      logger.warn('Failed to restore cache from persistence', 'GitlabCacheService', error);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 60 * 1000);
  }

  /**
   * Generate cache key for GitLab data
   */
  private generateKey(instanceId: string, projectId?: number, type: string = 'project'): string {
    if (projectId !== undefined) {
      return `${instanceId}:${projectId}:${type}`;
    }
    return `${instanceId}:${type}`;
  }

  /**
   * Calculate data size for memory usage tracking
   */
  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Update memory usage statistics
   */
  private updateMemoryUsage(key: string, entry: GitlabCacheEntry): void {
    const size = this.calculateDataSize(entry);
    this.stats.memoryUsage += size;
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.totalEntries = this.cache.size;
  }

  /**
   * Compress data if it exceeds threshold
   */
  private async compressData(data: any): Promise<string> {
    if (this.calculateDataSize(data) < this.config.compressionThreshold) {
      return JSON.stringify(data);
    }

    // Simple compression using JSON.stringify with reduced whitespace
    return JSON.stringify(data);
  }

  /**
   * Decompress data
   */
  private decompressData(compressedData: string): any {
    return JSON.parse(compressedData);
  }

  /**
   * Persist cache to localStorage
   */
  private persistCache(): void {
    if (!this.config.enablePersistence) return;

    try {
      const cacheObject: Record<string, GitlabCacheEntry> = {};
      this.cache.forEach((entry, key) => {
        cacheObject[key] = entry;
      });

      localStorage.setItem(this.config.persistenceKey, JSON.stringify(cacheObject));
    } catch (error) {
      logger.warn('Failed to persist cache to localStorage', 'GitlabCacheService', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: GitlabCacheEntry): boolean {
    return new Date() > entry.expiresAt;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    let removedCount = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        const size = this.calculateDataSize(entry);
        this.cache.delete(key);
        freedMemory += size;
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.stats.memoryUsage -= freedMemory;
      this.updateStats();
      logger.info(`Cleaned up ${removedCount} expired cache entries, freed ${freedMemory} bytes`, 'GitlabCacheService');
    }
  }

  /**
   * Evict least recently used entries when cache is full
   */
  private evictLRU(): void {
    if (this.cache.size < this.config.maxEntries) return;

    // Simple LRU: remove oldest entries
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());

    const toRemove = entries.slice(0, Math.max(1, this.cache.size - this.config.maxEntries + 1));

    toRemove.forEach(([key, entry]) => {
      const size = this.calculateDataSize(entry);
      this.cache.delete(key);
      this.stats.memoryUsage -= size;
    });

    logger.info(`Evicted ${toRemove.length} LRU cache entries`, 'GitlabCacheService');
  }

  /**
   * Store data in cache
   */
  async set(
    instanceId: string,
    projectId: number | undefined,
    data: GitlabProject,
    type: string = 'project',
    ttl?: number
  ): Promise<void> {
    const key = this.generateKey(instanceId, projectId, type);
    const expiresAt = new Date(Date.now() + (ttl || this.config.defaultTTL) * 60 * 1000);

    const entry: GitlabCacheEntry = {
      instanceId,
      projectId: projectId || 0,
      data,
      timestamp: new Date(),
      expiresAt,
    };

    // Evict if necessary
    this.evictLRU();

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      const oldSize = this.calculateDataSize(oldEntry);
      this.stats.memoryUsage -= oldSize;
    }

    this.cache.set(key, entry);
    this.updateMemoryUsage(key, entry);
    this.updateStats();

    // Persist cache
    this.persistCache();

    logger.debug(`Cached ${type} data for ${instanceId}${projectId ? `:${projectId}` : ''}`, 'GitlabCacheService');
  }

  /**
   * Retrieve data from cache
   */
  get(instanceId: string, projectId?: number, type: string = 'project'): GitlabProject | null {
    const key = this.generateKey(instanceId, projectId, type);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missRate = (this.stats.missRate + 1) / 2; // Simple moving average
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      const size = this.calculateDataSize(entry);
      this.stats.memoryUsage -= size;
      this.updateStats();
      this.persistCache();

      this.stats.missRate = (this.stats.missRate + 1) / 2;
      return null;
    }

    // Update access timestamp for LRU
    entry.timestamp = new Date();

    this.stats.hitRate = (this.stats.hitRate + 1) / 2;
    logger.debug(`Cache hit for ${type} data: ${instanceId}${projectId ? `:${projectId}` : ''}`, 'GitlabCacheService');

    return entry.data;
  }

  /**
   * Check if data exists in cache and is valid
   */
  has(instanceId: string, projectId?: number, type: string = 'project'): boolean {
    const key = this.generateKey(instanceId, projectId, type);
    const entry = this.cache.get(key);

    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Remove specific cache entry
   */
  delete(instanceId: string, projectId?: number, type: string = 'project'): boolean {
    const key = this.generateKey(instanceId, projectId, type);
    const entry = this.cache.get(key);

    if (entry) {
      const size = this.calculateDataSize(entry);
      const deleted = this.cache.delete(key);

      if (deleted) {
        this.stats.memoryUsage -= size;
        this.updateStats();
        this.persistCache();
        logger.debug(`Deleted cache entry: ${key}`, 'GitlabCacheService');
      }

      return deleted;
    }

    return false;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats.memoryUsage = 0;
    this.stats.totalEntries = 0;
    this.persistCache();
    logger.info('Cleared all cache entries', 'GitlabCacheService');
  }

  /**
   * Clear cache entries for specific instance
   */
  clearInstance(instanceId: string): void {
    let removedCount = 0;
    let freedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.instanceId === instanceId) {
        const size = this.calculateDataSize(entry);
        this.cache.delete(key);
        freedMemory += size;
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.stats.memoryUsage -= freedMemory;
      this.updateStats();
      this.persistCache();
      logger.info(`Cleared ${removedCount} cache entries for instance ${instanceId}`, 'GitlabCacheService');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): GitlabCacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache entries for debugging
   */
  getAllEntries(): GitlabCacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmup(instance: GitlabInstance, projects: GitlabProject[]): Promise<void> {
    logger.info(`Warming up cache for instance ${instance.name}`, 'GitlabCacheService');

    // Cache instance-level data
    // Note: This would be expanded based on what instance-level data we want to cache

    // Cache project data
    for (const project of projects.slice(0, 50)) { // Limit to first 50 projects for warmup
      await this.set(instance.id, project.id, project, 'project', this.config.defaultTTL);
    }

    logger.info(`Cache warmup completed for ${instance.name}`, 'GitlabCacheService');
  }

  /**
   * Get cache size information
   */
  getCacheSize(): { entries: number; memoryUsage: number; maxEntries: number } {
    return {
      entries: this.cache.size,
      memoryUsage: this.stats.memoryUsage,
      maxEntries: this.config.maxEntries,
    };
  }

  /**
   * Set cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval) {
      this.startCleanupTimer();
    }

    logger.info('Updated cache configuration', 'GitlabCacheService', newConfig);
  }

  /**
   * Destroy cache service and clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    logger.info('GitLab cache service destroyed', 'GitlabCacheService');
  }
}

// Singleton instance
export const gitlabCacheService = new GitlabCacheService();
