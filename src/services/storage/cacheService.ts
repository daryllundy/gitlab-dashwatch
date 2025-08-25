// Cache service for temporary data storage and retrieval
// This service provides in-memory and persistent caching capabilities

import type { CacheEntry, CacheStats } from '@/types';

class CacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  set<T>(key: string, value: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: new Date(),
      ttl
    };

    this.memoryCache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.memoryCache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (entry.ttl && Date.now() - entry.timestamp.getTime() > entry.ttl) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  clear(): void {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    // Clean up expired entries first
    this.cleanupExpired();

    const totalEntries = this.memoryCache.size;
    const totalRequests = this.hits + this.misses;
    
    return {
      totalEntries,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.misses / totalRequests) * 100 : 0
    };
  }

  getAllKeys(): string[] {
    this.cleanupExpired();
    return Array.from(this.memoryCache.keys());
  }

  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.ttl && now - entry.timestamp.getTime() > entry.ttl) {
        this.memoryCache.delete(key);
      }
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0;
    
    for (const entry of this.memoryCache.values()) {
      size += JSON.stringify(entry).length * 2; // Rough estimate for UTF-16
    }
    
    return size;
  }
}

export const cacheService = new CacheService();
