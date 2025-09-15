// GitLab Webhook Service
// Provides comprehensive webhook support for real-time GitLab updates

import { logger } from '@/lib/logger';

// Webhook configuration
interface WebhookConfig {
  enableWebhooks: boolean;
  enableSignatureVerification: boolean;
  enableEventFiltering: boolean;
  enableRetryLogic: boolean;
  maxRetries: number;
  retryDelay: number; // seconds
  enableRateLimiting: boolean;
  rateLimitPerMinute: number;
  enableEventLogging: boolean;
  enableEventAnalytics: boolean;
  webhookTimeout: number; // seconds
  enableWebhookHealthChecks: boolean;
  healthCheckInterval: number; // minutes
}

interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  instanceId: string;
  projectId?: number;
  userId?: number;
  username?: string;
  userEmail?: string;
  timestamp: Date;
  payload: any;
  headers: Record<string, string>;
  signature?: string;
  verified: boolean;
  processed: boolean;
  processingTime?: number;
  error?: string;
  retryCount: number;
  lastRetryAt?: Date;
}

enum WebhookEventType {
  PUSH = 'push',
  TAG_PUSH = 'tag_push',
  NOTE = 'note',
  ISSUE = 'issue',
  CONFIDENTIAL_ISSUE = 'confidential_issue',
  MERGE_REQUEST = 'merge_request',
  WIKI_PAGE = 'wiki_page',
  PIPELINE = 'pipeline',
  BUILD = 'build',
  JOB = 'job',
  DEPLOYMENT = 'deployment',
  RELEASE = 'release',
  PROJECT = 'project',
  GROUP = 'group',
  SUBGROUP = 'subgroup',
  MEMBER = 'member',
  USER = 'user',
  KEY = 'key',
  DEPLOY_KEY = 'deploy_key',
  SERVICE = 'service',
}

interface WebhookEndpoint {
  id: string;
  instanceId: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  failureCount: number;
  successCount: number;
}

interface WebhookMetrics {
  instanceId: string;
  totalEvents: number;
  eventsByType: Record<WebhookEventType, number>;
  eventsByStatus: {
    processed: number;
    failed: number;
    pending: number;
    retried: number;
  };
  averageProcessingTime: number;
  errorRate: number;
  lastEventAt?: Date;
  uptime: number; // percentage
}

interface WebhookHealth {
  instanceId: string;
  status: 'healthy' | 'warning' | 'error';
  lastHealthCheck: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  errorRate: number;
  recommendations: string[];
}

class GitlabWebhookService {
  private config: WebhookConfig;
  private endpoints: Map<string, WebhookEndpoint> = new Map(); // instanceId -> endpoint
  private events: Map<string, WebhookEvent[]> = new Map(); // instanceId -> events
  private metrics: Map<string, WebhookMetrics> = new Map(); // instanceId -> metrics
  private health: Map<string, WebhookHealth> = new Map(); // instanceId -> health
  private isDestroyed = false;

  constructor(config: Partial<WebhookConfig> = {}) {
    this.config = {
      enableWebhooks: true,
      enableSignatureVerification: true,
      enableEventFiltering: true,
      enableRetryLogic: true,
      maxRetries: 3,
      retryDelay: 60, // 1 minute
      enableRateLimiting: true,
      rateLimitPerMinute: 1000,
      enableEventLogging: true,
      enableEventAnalytics: true,
      webhookTimeout: 30, // 30 seconds
      enableWebhookHealthChecks: true,
      healthCheckInterval: 5, // 5 minutes
      ...config,
    };

    this.startHealthChecks();
  }

  /**
   * Register a webhook endpoint for a GitLab instance
   */
  async registerEndpoint(
    instanceId: string,
    url: string,
    secret: string,
    events: WebhookEventType[] = []
  ): Promise<WebhookEndpoint> {
    if (!this.config.enableWebhooks) {
      throw new Error('Webhooks are disabled');
    }

    const endpoint: WebhookEndpoint = {
      id: `webhook-${instanceId}-${Date.now()}`,
      instanceId,
      url,
      secret,
      events: events.length > 0 ? events : Object.values(WebhookEventType),
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      failureCount: 0,
      successCount: 0,
    };

    this.endpoints.set(instanceId, endpoint);

    // Initialize metrics and health for this instance
    this.initializeMetrics(instanceId);
    this.initializeHealth(instanceId);

    logger.info(`Webhook endpoint registered for instance ${instanceId}`, 'GitlabWebhookService', {
      endpointId: endpoint.id,
      url: endpoint.url,
      events: endpoint.events,
    });

    return endpoint;
  }

  /**
   * Process an incoming webhook event
   */
  async processWebhookEvent(
    instanceId: string,
    headers: Record<string, string>,
    payload: any
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!this.config.enableWebhooks) {
      return { success: false, error: 'Webhooks are disabled' };
    }

    const endpoint = this.endpoints.get(instanceId);
    if (!endpoint || !endpoint.active) {
      return { success: false, error: 'Webhook endpoint not found or inactive' };
    }

    const startTime = Date.now();

    try {
      // Create webhook event
      const event = await this.createWebhookEvent(instanceId, headers, payload);

      // Verify signature if enabled
      if (this.config.enableSignatureVerification) {
        const verified = await this.verifyWebhookSignature(event, endpoint.secret);
        if (!verified) {
          event.verified = false;
          event.error = 'Signature verification failed';
          await this.updateEvent(event);
          return { success: false, error: 'Invalid signature' };
        }
        event.verified = true;
      }

      // Check rate limiting
      if (this.config.enableRateLimiting) {
        const rateLimited = await this.checkRateLimit(instanceId);
        if (rateLimited) {
          event.error = 'Rate limit exceeded';
          await this.updateEvent(event);
          return { success: false, error: 'Rate limit exceeded' };
        }
      }

      // Process the event
      await this.processEvent(event);

      // Update metrics
      await this.updateMetrics(instanceId, event, Date.now() - startTime);

      // Log event if enabled
      if (this.config.enableEventLogging) {
        logger.info(`Webhook event processed: ${event.eventType}`, 'GitlabWebhookService', {
          eventId: event.id,
          instanceId,
          projectId: event.projectId,
          processingTime: event.processingTime,
        });
      }

      return { success: true, eventId: event.id };

    } catch (error) {
      logger.error(`Failed to process webhook event for instance ${instanceId}`, 'GitlabWebhookService', error);

      // Update failure metrics
      await this.updateFailureMetrics(instanceId);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a webhook event from incoming payload
   */
  private async createWebhookEvent(
    instanceId: string,
    headers: Record<string, string>,
    payload: any
  ): Promise<WebhookEvent> {
    const eventType = this.determineEventType(headers, payload);
    const signature = headers['x-gitlab-token'] || headers['x-hub-signature-256'];

    const event: WebhookEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      instanceId,
      timestamp: new Date(),
      payload,
      headers,
      verified: false,
      processed: false,
      retryCount: 0,
    };

    if (signature) {
      event.signature = signature;
    }

    // Extract additional metadata from payload
    if (payload) {
      event.projectId = payload.project?.id || payload.project_id;
      event.userId = payload.user?.id || payload.user_id;
      event.username = payload.user?.username || payload.user_username;
      event.userEmail = payload.user?.email || payload.user_email;
    }

    // Store event
    const instanceEvents = this.events.get(instanceId) || [];
    instanceEvents.unshift(event);
    this.events.set(instanceId, instanceEvents);

    return event;
  }

  /**
   * Determine event type from headers and payload
   */
  private determineEventType(headers: Record<string, string>, payload: any): WebhookEventType {
    // Check GitLab event header
    const gitlabEvent = headers['x-gitlab-event'];
    if (gitlabEvent) {
      switch (gitlabEvent.toLowerCase()) {
        case 'push hook': return WebhookEventType.PUSH;
        case 'tag push hook': return WebhookEventType.TAG_PUSH;
        case 'note hook': return WebhookEventType.NOTE;
        case 'issue hook': return WebhookEventType.ISSUE;
        case 'confidential issue hook': return WebhookEventType.CONFIDENTIAL_ISSUE;
        case 'merge request hook': return WebhookEventType.MERGE_REQUEST;
        case 'wiki page hook': return WebhookEventType.WIKI_PAGE;
        case 'pipeline hook': return WebhookEventType.PIPELINE;
        case 'build hook': return WebhookEventType.BUILD;
        case 'job hook': return WebhookEventType.JOB;
        case 'deployment hook': return WebhookEventType.DEPLOYMENT;
        case 'release hook': return WebhookEventType.RELEASE;
        case 'project hook': return WebhookEventType.PROJECT;
        case 'group hook': return WebhookEventType.GROUP;
        case 'subgroup hook': return WebhookEventType.SUBGROUP;
        case 'member hook': return WebhookEventType.MEMBER;
        case 'user hook': return WebhookEventType.USER;
        case 'key hook': return WebhookEventType.KEY;
        case 'deploy key hook': return WebhookEventType.DEPLOY_KEY;
        case 'service hook': return WebhookEventType.SERVICE;
      }
    }

    // Fallback to payload-based detection
    if (payload) {
      if (payload.commits) return WebhookEventType.PUSH;
      if (payload.ref && payload.ref.startsWith('refs/tags/')) return WebhookEventType.TAG_PUSH;
      if (payload.object_kind === 'note') return WebhookEventType.NOTE;
      if (payload.object_kind === 'issue') return WebhookEventType.ISSUE;
      if (payload.object_kind === 'merge_request') return WebhookEventType.MERGE_REQUEST;
      if (payload.object_kind === 'wiki_page') return WebhookEventType.WIKI_PAGE;
      if (payload.object_kind === 'pipeline') return WebhookEventType.PIPELINE;
      if (payload.object_kind === 'build') return WebhookEventType.BUILD;
      if (payload.object_attributes?.source_type === 'Job') return WebhookEventType.JOB;
      if (payload.object_kind === 'deployment') return WebhookEventType.DEPLOYMENT;
      if (payload.tag) return WebhookEventType.RELEASE;
    }

    return WebhookEventType.PUSH; // Default fallback
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(event: WebhookEvent, secret: string): Promise<boolean> {
    if (!event.signature) return false;

    try {
      // GitLab uses HMAC-SHA256 for signature verification
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      const payloadString = JSON.stringify(event.payload);
      const expectedSignature = hmac.update(payloadString).digest('hex');

      // GitLab sends signature as "sha256=<signature>"
      const receivedSignature = event.signature.replace('sha256=', '');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Signature verification failed', 'GitlabWebhookService', error);
      return false;
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(instanceId: string): Promise<boolean> {
    const instanceEvents = this.events.get(instanceId) || [];
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const recentEvents = instanceEvents.filter(event =>
      event.timestamp >= oneMinuteAgo
    );

    return recentEvents.length >= this.config.rateLimitPerMinute;
  }

  /**
   * Process a webhook event
   */
  private async processEvent(event: WebhookEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // Map webhook event to internal activity
      await this.mapEventToActivity(event);

      // Update event status
      event.processed = true;
      event.processingTime = Date.now() - startTime;

      await this.updateEvent(event);

    } catch (error) {
      event.error = error instanceof Error ? error.message : 'Processing failed';
      event.processingTime = Date.now() - startTime;

      await this.updateEvent(event);

      // Retry logic if enabled
      if (this.config.enableRetryLogic && event.retryCount < this.config.maxRetries) {
        await this.scheduleRetry(event);
      }

      throw error;
    }
  }

  /**
   * Map webhook event to internal activity
   */
  private async mapEventToActivity(event: WebhookEvent): Promise<void> {
    // This would integrate with the GitlabActivityService
    // For now, we'll just log the mapping

    logger.debug(`Mapping webhook event to activity: ${event.eventType}`, 'GitlabWebhookService', {
      eventId: event.id,
      projectId: event.projectId,
      userId: event.userId,
    });

    // TODO: Integrate with GitlabActivityService.recordActivity()
  }

  /**
   * Update event in storage
   */
  private async updateEvent(event: WebhookEvent): Promise<void> {
    const instanceEvents = this.events.get(event.instanceId) || [];
    const eventIndex = instanceEvents.findIndex(e => e.id === event.id);

    if (eventIndex !== -1) {
      instanceEvents[eventIndex] = event;
      this.events.set(event.instanceId, instanceEvents);
    }
  }

  /**
   * Schedule retry for failed event
   */
  private async scheduleRetry(event: WebhookEvent): Promise<void> {
    event.retryCount++;
    event.lastRetryAt = new Date();

    setTimeout(async () => {
      try {
        await this.processEvent(event);
      } catch (error) {
        logger.error(`Retry failed for event ${event.id}`, 'GitlabWebhookService', error);
      }
    }, this.config.retryDelay * 1000 * Math.pow(2, event.retryCount - 1)); // Exponential backoff
  }

  /**
   * Update metrics after processing an event
   */
  private async updateMetrics(instanceId: string, event: WebhookEvent, processingTime: number): Promise<void> {
    if (!this.config.enableEventAnalytics) return;

    const metrics = this.metrics.get(instanceId);
    if (!metrics) return;

    metrics.totalEvents++;
    metrics.eventsByType[event.eventType] = (metrics.eventsByType[event.eventType] || 0) + 1;
    metrics.eventsByStatus.processed++;
    metrics.averageProcessingTime = (metrics.averageProcessingTime + processingTime) / 2;
    metrics.lastEventAt = new Date();

    // Calculate error rate
    const totalProcessed = metrics.eventsByStatus.processed + metrics.eventsByStatus.failed;
    metrics.errorRate = totalProcessed > 0 ? (metrics.eventsByStatus.failed / totalProcessed) * 100 : 0;

    this.metrics.set(instanceId, metrics);
  }

  /**
   * Update failure metrics
   */
  private async updateFailureMetrics(instanceId: string): Promise<void> {
    const metrics = this.metrics.get(instanceId);
    if (!metrics) return;

    metrics.eventsByStatus.failed++;

    const totalProcessed = metrics.eventsByStatus.processed + metrics.eventsByStatus.failed;
    metrics.errorRate = totalProcessed > 0 ? (metrics.eventsByStatus.failed / totalProcessed) * 100 : 0;

    this.metrics.set(instanceId, metrics);
  }

  /**
   * Initialize metrics for an instance
   */
  private initializeMetrics(instanceId: string): void {
    const metrics: WebhookMetrics = {
      instanceId,
      totalEvents: 0,
      eventsByType: {} as Record<WebhookEventType, number>,
      eventsByStatus: {
        processed: 0,
        failed: 0,
        pending: 0,
        retried: 0,
      },
      averageProcessingTime: 0,
      errorRate: 0,
      uptime: 100,
    };

    this.metrics.set(instanceId, metrics);
  }

  /**
   * Initialize health monitoring for an instance
   */
  private initializeHealth(instanceId: string): void {
    const health: WebhookHealth = {
      instanceId,
      status: 'healthy',
      lastHealthCheck: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: 0,
      errorRate: 0,
      recommendations: [],
    };

    this.health.set(instanceId, health);
  }

  /**
   * Get webhook events for an instance
   */
  getEvents(
    instanceId: string,
    filter?: {
      eventType?: WebhookEventType;
      processed?: boolean;
      verified?: boolean;
      dateRange?: { from: Date; to: Date };
    },
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): WebhookEvent[] {
    let instanceEvents = this.events.get(instanceId) || [];

    // Apply filters
    if (filter) {
      instanceEvents = instanceEvents.filter(event => {
        if (filter.eventType && event.eventType !== filter.eventType) return false;
        if (filter.processed !== undefined && event.processed !== filter.processed) return false;
        if (filter.verified !== undefined && event.verified !== filter.verified) return false;
        if (filter.dateRange) {
          if (event.timestamp < filter.dateRange.from || event.timestamp > filter.dateRange.to) return false;
        }
        return true;
      });
    }

    // Apply pagination
    const { limit, offset = 0 } = options;
    if (limit) {
      instanceEvents = instanceEvents.slice(offset, offset + limit);
    }

    return instanceEvents;
  }

  /**
   * Get webhook metrics for an instance
   */
  getMetrics(instanceId: string): WebhookMetrics | null {
    return this.metrics.get(instanceId) || null;
  }

  /**
   * Get webhook health for an instance
   */
  getHealth(instanceId: string): WebhookHealth | null {
    return this.health.get(instanceId) || null;
  }

  /**
   * Get webhook endpoint for an instance
   */
  getEndpoint(instanceId: string): WebhookEndpoint | null {
    return this.endpoints.get(instanceId) || null;
  }

  /**
   * Update webhook endpoint configuration
   */
  async updateEndpoint(
    instanceId: string,
    updates: Partial<Pick<WebhookEndpoint, 'url' | 'secret' | 'events' | 'active'>>
  ): Promise<void> {
    const endpoint = this.endpoints.get(instanceId);
    if (!endpoint) {
      throw new Error(`Webhook endpoint not found for instance ${instanceId}`);
    }

    Object.assign(endpoint, updates, { updatedAt: new Date() });
    this.endpoints.set(instanceId, endpoint);

    logger.info(`Webhook endpoint updated for instance ${instanceId}`, 'GitlabWebhookService', updates);
  }

  /**
   * Test webhook endpoint
   */
  async testEndpoint(instanceId: string): Promise<{ success: boolean; responseTime?: number; error?: string }> {
    const endpoint = this.endpoints.get(instanceId);
    if (!endpoint) {
      return { success: false, error: 'Endpoint not found' };
    }

    const startTime = Date.now();

    try {
      // This would make an actual HTTP request to test the endpoint
      // For now, we'll simulate the test
      await new Promise(resolve => setTimeout(resolve, 100));

      const responseTime = Date.now() - startTime;

      // Update endpoint stats
      endpoint.successCount++;
      endpoint.lastUsedAt = new Date();

      return { success: true, responseTime };

    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Update endpoint stats
      endpoint.failureCount++;

      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    if (!this.config.enableWebhookHealthChecks) return;

    setInterval(async () => {
      if (this.isDestroyed) return;

      for (const [instanceId] of this.endpoints) {
        await this.performHealthCheck(instanceId);
      }
    }, this.config.healthCheckInterval * 60 * 1000);
  }

  /**
   * Perform health check for an instance
   */
  private async performHealthCheck(instanceId: string): Promise<void> {
    const health = this.health.get(instanceId);
    if (!health) return;

    try {
      const testResult = await this.testEndpoint(instanceId);

      health.lastHealthCheck = new Date();

      if (testResult.success) {
        health.consecutiveFailures = 0;
        health.averageResponseTime = (health.averageResponseTime + (testResult.responseTime || 0)) / 2;
        health.status = 'healthy';
        health.recommendations = [];
      } else {
        health.consecutiveFailures++;

        if (health.consecutiveFailures >= 3) {
          health.status = 'error';
          health.recommendations = [
            'Check webhook endpoint URL',
            'Verify webhook secret',
            'Check network connectivity',
            'Review GitLab webhook configuration',
          ];
        } else {
          health.status = 'warning';
        }
      }

      // Calculate error rate
      const metrics = this.metrics.get(instanceId);
      if (metrics) {
        health.errorRate = metrics.errorRate;
      }

    } catch (error) {
      logger.error(`Health check failed for instance ${instanceId}`, 'GitlabWebhookService', error);
      health.status = 'error';
      health.consecutiveFailures++;
    }

    this.health.set(instanceId, health);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WebhookConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Webhook service configuration updated', 'GitlabWebhookService', newConfig);
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.endpoints.clear();
    this.events.clear();
    this.metrics.clear();
    this.health.clear();

    logger.info('GitLab webhook service destroyed', 'GitlabWebhookService');
  }
}

// Singleton instance
export const gitlabWebhookService = new GitlabWebhookService();
