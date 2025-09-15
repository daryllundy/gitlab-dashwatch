// GitLab Rate Limiting and API Optimization Service
// Provides advanced rate limiting, request queuing, and API call optimization

import { logger } from '@/lib/logger';
import type { GitlabInstance, RateLimitInfo } from '@/types';

// Rate limiting configuration
interface RateLimitConfig {
  maxConcurrentRequests: number;
  requestQueueSize: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
  rateLimitBuffer: number; // percentage buffer for rate limits
  enableRequestBatching: boolean;
  batchDelayMs: number;
  enableRequestPrioritization: boolean;
}

interface QueuedRequest {
  id: string;
  instanceId: string;
  priority: 'high' | 'normal' | 'low';
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  retryCount: number;
}

interface RateLimitMetrics {
  instanceId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageResponseTime: number;
  currentRateLimitInfo?: RateLimitInfo;
  lastUpdated: Date;
}

class GitlabRateLimitService {
  private config: RateLimitConfig;
  private activeRequests: Map<string, number> = new Map(); // instanceId -> active request count
  private requestQueue: QueuedRequest[] = [];
  private rateLimitMetrics: Map<string, RateLimitMetrics> = new Map();
  private processingQueue = false;
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      maxConcurrentRequests: 5,
      requestQueueSize: 100,
      baseBackoffMs: 1000,
      maxBackoffMs: 30000,
      backoffMultiplier: 2,
      rateLimitBuffer: 10, // 10% buffer
      enableRequestBatching: true,
      batchDelayMs: 100,
      enableRequestPrioritization: true,
      ...config,
    };

    // Start queue processing
    this.startQueueProcessing();
  }

  /**
   * Execute a request with rate limiting and optimization
   */
  async executeRequest<T>(
    instance: GitlabInstance,
    requestFn: () => Promise<T>,
    options: {
      priority?: 'high' | 'normal' | 'low';
      bypassQueue?: boolean;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { priority = 'normal', bypassQueue = false, timeout } = options;

    // Update metrics
    this.updateMetrics(instance.id, 'totalRequests');

    // Check if we should bypass queue for high priority or if queue is disabled
    if (bypassQueue || priority === 'high' || !this.config.enableRequestPrioritization) {
      return this.executeRequestDirectly(instance, requestFn, timeout);
    }

    // Queue the request
    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: `${instance.id}-${Date.now()}-${Math.random()}`,
        instanceId: instance.id,
        priority,
        request: requestFn,
        resolve,
        reject,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Add to queue with priority sorting
      this.addToQueue(queuedRequest);

      // Set timeout if specified
      if (timeout) {
        setTimeout(() => {
          this.removeFromQueue(queuedRequest.id);
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Execute request directly (bypassing queue)
   */
  private async executeRequestDirectly<T>(
    instance: GitlabInstance,
    requestFn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    const instanceId = instance.id;
    const startTime = Date.now();

    // Check concurrent request limits
    if (this.getActiveRequests(instanceId) >= this.config.maxConcurrentRequests) {
      throw new Error(`Maximum concurrent requests (${this.config.maxConcurrentRequests}) exceeded for instance ${instanceId}`);
    }

    // Check rate limit status
    if (this.isRateLimited(instanceId)) {
      const waitTime = this.getRateLimitWaitTime(instanceId);
      if (waitTime > 0) {
        await this.wait(waitTime);
      }
    }

    // Increment active requests
    this.incrementActiveRequests(instanceId);

    try {
      // Execute with timeout if specified
      let requestPromise = requestFn();

      if (timeout) {
        requestPromise = this.withTimeout(requestPromise, timeout);
      }

      const result = await requestPromise;
      const responseTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(instanceId, 'successfulRequests');
      this.updateResponseTime(instanceId, responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(instanceId, 'failedRequests');
      this.updateResponseTime(instanceId, responseTime);

      // Handle rate limiting
      if (this.isRateLimitError(error)) {
        this.updateMetrics(instanceId, 'rateLimitedRequests');
        this.handleRateLimit(instance, error);
      }

      throw error;
    } finally {
      // Decrement active requests
      this.decrementActiveRequests(instanceId);
    }
  }

  /**
   * Add request to queue with priority
   */
  private addToQueue(request: QueuedRequest): void {
    // Remove old requests if queue is full
    if (this.requestQueue.length >= this.config.requestQueueSize) {
      // Remove lowest priority items first
      this.requestQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      const toRemove = this.requestQueue.splice(0, this.requestQueue.length - this.config.requestQueueSize + 1);
      toRemove.forEach(req => req.reject(new Error('Request queue full')));
    }

    // Insert with priority (higher priority first)
    const insertIndex = this.requestQueue.findIndex(req => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[req.priority] < priorityOrder[request.priority];
    });

    if (insertIndex === -1) {
      this.requestQueue.push(request);
    } else {
      this.requestQueue.splice(insertIndex, 0, request);
    }
  }

  /**
   * Remove request from queue
   */
  private removeFromQueue(requestId: string): void {
    const index = this.requestQueue.findIndex(req => req.id === requestId);
    if (index !== -1) {
      this.requestQueue.splice(index, 1);
    }
  }

  /**
   * Start queue processing
   */
  private startQueueProcessing(): void {
    setInterval(() => {
      if (!this.processingQueue && this.requestQueue.length > 0) {
        this.processQueue();
      }
    }, 100); // Process every 100ms
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) return;

    this.processingQueue = true;

    try {
      // Process requests that can be executed
      const processableRequests = this.requestQueue.filter(req =>
        this.canExecuteRequest(req.instanceId)
      );

      // Execute processable requests
      const promises = processableRequests.map(async (req) => {
        try {
          this.removeFromQueue(req.id);
          if (req.request) {
            const result = await this.executeRequestDirectly(
              { id: req.instanceId } as GitlabInstance,
              req.request
            );
            req.resolve(result);
          } else {
            req.reject(new Error('Request function is undefined'));
          }
        } catch (error) {
          req.reject(error);
        }
      });

      await Promise.allSettled(promises);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Check if a request can be executed for an instance
   */
  private canExecuteRequest(instanceId: string): boolean {
    return this.getActiveRequests(instanceId) < this.config.maxConcurrentRequests &&
           !this.isRateLimited(instanceId);
  }

  /**
   * Get active request count for an instance
   */
  private getActiveRequests(instanceId: string): number {
    return this.activeRequests.get(instanceId) || 0;
  }

  /**
   * Increment active request count
   */
  private incrementActiveRequests(instanceId: string): void {
    const current = this.activeRequests.get(instanceId) || 0;
    this.activeRequests.set(instanceId, current + 1);
  }

  /**
   * Decrement active request count
   */
  private decrementActiveRequests(instanceId: string): void {
    const current = this.activeRequests.get(instanceId) || 0;
    if (current > 0) {
      this.activeRequests.set(instanceId, current - 1);
    }
  }

  /**
   * Check if instance is currently rate limited
   */
  private isRateLimited(instanceId: string): boolean {
    const metrics = this.rateLimitMetrics.get(instanceId);
    if (!metrics?.currentRateLimitInfo) return false;

    const bufferThreshold = metrics.currentRateLimitInfo.limit *
      (this.config.rateLimitBuffer / 100);
    return metrics.currentRateLimitInfo.remaining <= bufferThreshold;
  }

  /**
   * Get rate limit wait time
   */
  private getRateLimitWaitTime(instanceId: string): number {
    const metrics = this.rateLimitMetrics.get(instanceId);
    if (!metrics?.currentRateLimitInfo) return 0;

    const now = new Date();
    const resetTime = metrics.currentRateLimitInfo.resetTime;

    if (now >= resetTime) return 0;

    return resetTime.getTime() - now.getTime();
  }

  /**
   * Handle rate limit error
   */
  private handleRateLimit(instance: GitlabInstance, error: any): void {
    // Extract rate limit info from error if available
    const rateLimitInfo = this.extractRateLimitInfo(error);

    if (rateLimitInfo) {
      this.updateRateLimitInfo(instance.id, rateLimitInfo);
    }

    logger.warn(`Rate limit hit for instance ${instance.id}`, 'GitlabRateLimitService', {
      remaining: rateLimitInfo?.remaining,
      resetTime: rateLimitInfo?.resetTime,
    });
  }

  /**
   * Extract rate limit information from error
   */
  private extractRateLimitInfo(error: any): RateLimitInfo | null {
    // Try to extract from error response
    if (error?.response?.headers) {
      const headers = error.response.headers;
      const limit = headers['x-ratelimit-limit'] || headers['X-RateLimit-Limit'];
      const remaining = headers['x-ratelimit-remaining'] || headers['X-RateLimit-Remaining'];
      const reset = headers['x-ratelimit-reset'] || headers['X-RateLimit-Reset'];

      if (limit && remaining && reset) {
        return {
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          resetTime: new Date(parseInt(reset) * 1000),
        };
      }
    }

    return null;
  }

  /**
   * Update rate limit information
   */
  updateRateLimitInfo(instanceId: string, rateLimitInfo: RateLimitInfo): void {
    const metrics = this.rateLimitMetrics.get(instanceId) || this.createMetrics(instanceId);
    metrics.currentRateLimitInfo = rateLimitInfo;
    metrics.lastUpdated = new Date();
    this.rateLimitMetrics.set(instanceId, metrics);
  }

  /**
   * Check if error is rate limit related
   */
  private isRateLimitError(error: any): boolean {
    return error?.response?.status === 429 ||
           error?.status === 429 ||
           error?.message?.toLowerCase().includes('rate limit');
  }

  /**
   * Update metrics
   */
  private updateMetrics(instanceId: string, metric: keyof RateLimitMetrics): void {
    const metrics = this.rateLimitMetrics.get(instanceId) || this.createMetrics(instanceId);

    if (typeof metrics[metric] === 'number') {
      (metrics[metric] as number)++;
    }

    metrics.lastUpdated = new Date();
    this.rateLimitMetrics.set(instanceId, metrics);
  }

  /**
   * Update response time metrics
   */
  private updateResponseTime(instanceId: string, responseTime: number): void {
    const metrics = this.rateLimitMetrics.get(instanceId) || this.createMetrics(instanceId);

    // Simple moving average
    const alpha = 0.1; // Smoothing factor
    metrics.averageResponseTime = metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;

    metrics.lastUpdated = new Date();
    this.rateLimitMetrics.set(instanceId, metrics);
  }

  /**
   * Create new metrics object
   */
  private createMetrics(instanceId: string): RateLimitMetrics {
    return {
      instanceId,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageResponseTime: 0,
      lastUpdated: new Date(),
    };
  }

  /**
   * Wait for specified time
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add timeout to promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Get rate limiting statistics
   */
  getStats(instanceId?: string): RateLimitMetrics[] {
    if (instanceId) {
      const metrics = this.rateLimitMetrics.get(instanceId);
      return metrics ? [metrics] : [];
    }

    return Array.from(this.rateLimitMetrics.values());
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueLength: number;
    activeRequests: Record<string, number>;
    processing: boolean;
  } {
    return {
      queueLength: this.requestQueue.length,
      activeRequests: Object.fromEntries(this.activeRequests),
      processing: this.processingQueue,
    };
  }

  /**
   * Clear queue and reset state
   */
  clearQueue(): void {
    // Reject all queued requests
    this.requestQueue.forEach(req => {
      req.reject(new Error('Queue cleared'));
    });
    this.requestQueue = [];

    // Reset active requests
    this.activeRequests.clear();

    logger.info('Request queue cleared', 'GitlabRateLimitService');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Rate limiting configuration updated', 'GitlabRateLimitService', newConfig);
  }

  /**
   * Batch multiple requests for the same instance
   */
  async batchRequests<T>(
    instance: GitlabInstance,
    requests: Array<() => Promise<T>>,
    options: { delay?: number } = {}
  ): Promise<T[]> {
    if (!this.config.enableRequestBatching || requests.length === 1) {
      return Promise.all(requests.map(req => this.executeRequest(instance, req)));
    }

    const { delay = this.config.batchDelayMs } = options;
    const results: T[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      if (request) {
        const result = await this.executeRequest(instance, request);
        results.push(result);

        // Add delay between requests if not the last one
        if (i < requests.length - 1) {
          await this.wait(delay);
        }
      }
    }

    return results;
  }

  /**
   * Get optimal request timing for an instance
   */
  getOptimalTiming(instanceId: string): {
    canExecuteNow: boolean;
    recommendedDelay: number;
    activeRequests: number;
    rateLimitStatus: 'ok' | 'approaching' | 'limited';
  } {
    const activeRequests = this.getActiveRequests(instanceId);
    const isLimited = this.isRateLimited(instanceId);
    const waitTime = this.getRateLimitWaitTime(instanceId);

    let rateLimitStatus: 'ok' | 'approaching' | 'limited' = 'ok';
    if (isLimited) {
      rateLimitStatus = 'limited';
    } else if (activeRequests >= this.config.maxConcurrentRequests * 0.8) {
      rateLimitStatus = 'approaching';
    }

    return {
      canExecuteNow: !isLimited && activeRequests < this.config.maxConcurrentRequests,
      recommendedDelay: Math.max(0, waitTime),
      activeRequests,
      rateLimitStatus,
    };
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.clearQueue();

    // Clear all timers
    this.batchTimers.forEach(timer => clearTimeout(timer));
    this.batchTimers.clear();

    logger.info('GitLab rate limiting service destroyed', 'GitlabRateLimitService');
  }
}

// Singleton instance
export const gitlabRateLimitService = new GitlabRateLimitService();
