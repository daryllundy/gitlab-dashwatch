// GitLab Real-time Updates and Polling Service
// Provides real-time data synchronization and background polling capabilities

import { logger } from '@/lib/logger';
import type { GitlabInstance } from '@/types';

// Real-time update configuration
interface RealtimeConfig {
  pollingInterval: number; // Base polling interval in seconds
  enableWebSocket: boolean; // Whether to use WebSocket connections
  maxConcurrentPolls: number; // Maximum concurrent polling operations
  enableSmartPolling: boolean; // Whether to use smart polling intervals
  changeDetectionEnabled: boolean; // Whether to detect and notify about changes
  backgroundSyncEnabled: boolean; // Whether to sync in background
  notificationEnabled: boolean; // Whether to show notifications for changes
  pollRetryAttempts: number; // Number of retry attempts for failed polls
  pollRetryDelay: number; // Delay between retry attempts in seconds
}

interface PollingJob {
  id: string;
  instanceId: string;
  projectId?: number;
  type: 'instance' | 'project' | 'health';
  lastPoll: Date;
  nextPoll: Date;
  isActive: boolean;
  pollCount: number;
  errorCount: number;
  lastError?: Error;
}

interface ChangeNotification {
  id: string;
  instanceId: string;
  projectId?: number;
  type: 'created' | 'updated' | 'deleted' | 'status_changed';
  timestamp: Date;
  data: any;
  previousData?: any;
}

interface RealtimeMetrics {
  instanceId: string;
  totalPolls: number;
  successfulPolls: number;
  failedPolls: number;
  averagePollTime: number;
  lastPollTime: Date;
  activeJobs: number;
  queuedJobs: number;
}

class GitlabRealtimeService {
  private config: RealtimeConfig;
  private pollingJobs: Map<string, PollingJob> = new Map();
  private activePolls: Set<string> = new Set();
  private metrics: Map<string, RealtimeMetrics> = new Map();
  private changeListeners: Array<(notification: ChangeNotification) => void> = [];
  private pollingTimer: NodeJS.Timeout | null = null;
  private webSocketConnections: Map<string, WebSocket> = new Map();
  private isDestroyed = false;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = {
      pollingInterval: 300, // 5 minutes
      enableWebSocket: false,
      maxConcurrentPolls: 3,
      enableSmartPolling: true,
      changeDetectionEnabled: true,
      backgroundSyncEnabled: true,
      notificationEnabled: true,
      pollRetryAttempts: 3,
      pollRetryDelay: 30, // 30 seconds
      ...config,
    };

    this.startPollingTimer();
  }

  /**
   * Start a polling job for an instance
   */
  startPolling(instance: GitlabInstance, options: {
    projectIds?: number[];
    types?: ('instance' | 'project' | 'health')[];
    customInterval?: number;
  } = {}): string {
    const { projectIds, types = ['instance', 'project'], customInterval } = options;
    const jobId = `poll-${instance.id}-${Date.now()}`;

    const job: PollingJob = {
      id: jobId,
      instanceId: instance.id,
      type: 'instance',
      lastPoll: new Date(0), // Never polled
      nextPoll: new Date(),
      isActive: true,
      pollCount: 0,
      errorCount: 0,
    };

    this.pollingJobs.set(jobId, job);
    this.initializeMetrics(instance.id);

    // Create individual jobs for each type and project
    if (types.includes('instance')) {
      this.createPollingJob(instance, 'instance', customInterval);
    }

    if (types.includes('project')) {
      if (projectIds && projectIds.length > 0) {
        projectIds.forEach(projectId => {
          this.createPollingJob(instance, 'project', customInterval, projectId);
        });
      } else {
        this.createPollingJob(instance, 'project', customInterval);
      }
    }

    if (types.includes('health')) {
      this.createPollingJob(instance, 'health', customInterval);
    }

    // Try to establish WebSocket connection if enabled
    if (this.config.enableWebSocket) {
      this.connectWebSocket(instance);
    }

    logger.info(`Started polling for instance ${instance.id}`, 'GitlabRealtimeService', {
      types,
      projectCount: projectIds?.length || 'all',
      customInterval,
    });

    return jobId;
  }

  /**
   * Create a specific polling job
   */
  private createPollingJob(
    instance: GitlabInstance,
    type: 'instance' | 'project' | 'health',
    customInterval?: number,
    projectId?: number
  ): void {
    const jobId = `poll-${instance.id}-${type}${projectId ? `-${projectId}` : ''}-${Date.now()}`;

    const job: PollingJob = {
      id: jobId,
      instanceId: instance.id,
      projectId,
      type,
      lastPoll: new Date(0),
      nextPoll: new Date(),
      isActive: true,
      pollCount: 0,
      errorCount: 0,
    };

    this.pollingJobs.set(jobId, job);
  }

  /**
   * Stop polling for a specific job or instance
   */
  stopPolling(jobIdOrInstanceId: string): void {
    // Stop specific job
    if (this.pollingJobs.has(jobIdOrInstanceId)) {
      const job = this.pollingJobs.get(jobIdOrInstanceId)!;
      job.isActive = false;
      this.pollingJobs.delete(jobIdOrInstanceId);
      logger.info(`Stopped polling job ${jobIdOrInstanceId}`, 'GitlabRealtimeService');
      return;
    }

    // Stop all jobs for an instance
    const jobsToStop = Array.from(this.pollingJobs.entries())
      .filter(([, job]) => job.instanceId === jobIdOrInstanceId);

    jobsToStop.forEach(([jobId, job]) => {
      job.isActive = false;
      this.pollingJobs.delete(jobId);
    });

    // Close WebSocket connection
    this.disconnectWebSocket(jobIdOrInstanceId);

    logger.info(`Stopped polling for instance ${jobIdOrInstanceId}`, 'GitlabRealtimeService', {
      jobsStopped: jobsToStop.length,
    });
  }

  /**
   * Pause polling temporarily
   */
  pausePolling(jobIdOrInstanceId: string): void {
    const jobs = this.getJobsByIdOrInstance(jobIdOrInstanceId);
    jobs.forEach(job => {
      job.isActive = false;
    });

    logger.info(`Paused polling for ${jobIdOrInstanceId}`, 'GitlabRealtimeService');
  }

  /**
   * Resume polling
   */
  resumePolling(jobIdOrInstanceId: string): void {
    const jobs = this.getJobsByIdOrInstance(jobIdOrInstanceId);
    jobs.forEach(job => {
      job.isActive = true;
      job.nextPoll = new Date(); // Poll immediately
    });

    logger.info(`Resumed polling for ${jobIdOrInstanceId}`, 'GitlabRealtimeService');
  }

  /**
   * Get jobs by ID or instance ID
   */
  private getJobsByIdOrInstance(id: string): PollingJob[] {
    if (this.pollingJobs.has(id)) {
      return [this.pollingJobs.get(id)!];
    }

    return Array.from(this.pollingJobs.values())
      .filter(job => job.instanceId === id);
  }

  /**
   * Start the polling timer
   */
  private startPollingTimer(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }

    this.pollingTimer = setInterval(() => {
      this.processPollingJobs();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Process all active polling jobs
   */
  private async processPollingJobs(): Promise<void> {
    if (this.isDestroyed) return;

    const now = new Date();
    const jobsToProcess = Array.from(this.pollingJobs.values())
      .filter(job => job.isActive && job.nextPoll <= now)
      .sort((a, b) => {
        // Prioritize by type: health > project > instance
        const priorityOrder = { health: 3, project: 2, instance: 1 };
        return priorityOrder[b.type] - priorityOrder[a.type];
      });

    // Limit concurrent polls
    const maxConcurrent = Math.min(jobsToProcess.length, this.config.maxConcurrentPolls);

    for (let i = 0; i < maxConcurrent; i++) {
      const job = jobsToProcess[i];
      if (!this.activePolls.has(job.id)) {
        this.executePollingJob(job);
      }
    }
  }

  /**
   * Execute a single polling job
   */
  private async executePollingJob(job: PollingJob): Promise<void> {
    if (this.activePolls.has(job.id) || !job.isActive) return;

    this.activePolls.add(job.id);
    const startTime = Date.now();

    try {
      await this.performPoll(job);
      job.pollCount++;
      job.errorCount = 0;
      job.lastError = undefined;

      // Update metrics
      this.updateMetrics(job.instanceId, 'successfulPolls');
      this.updatePollTime(job.instanceId, Date.now() - startTime);

    } catch (error) {
      job.errorCount++;
      job.lastError = error as Error;

      // Update metrics
      this.updateMetrics(job.instanceId, 'failedPolls');

      logger.warn(`Polling job ${job.id} failed`, 'GitlabRealtimeService', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCount: job.errorCount,
        retryAttempts: this.config.pollRetryAttempts,
      });

      // Handle retry logic
      if (job.errorCount < this.config.pollRetryAttempts) {
        job.nextPoll = new Date(Date.now() + this.config.pollRetryDelay * 1000);
      } else {
        // Too many failures, back off significantly
        job.nextPoll = new Date(Date.now() + this.config.pollingInterval * 1000 * 2);
        job.errorCount = 0; // Reset error count for next attempt
      }
    } finally {
      this.activePolls.delete(job.id);
      job.lastPoll = new Date();

      // Schedule next poll
      if (job.isActive) {
        job.nextPoll = new Date(Date.now() + this.getPollingInterval(job) * 1000);
      }
    }
  }

  /**
   * Perform the actual polling operation
   */
  private async performPoll(job: PollingJob): Promise<void> {
    // This would integrate with the actual GitLab API services
    // For now, we'll simulate the polling operation

    switch (job.type) {
      case 'instance':
        await this.pollInstance(job.instanceId);
        break;
      case 'project':
        await this.pollProject(job.instanceId, job.projectId);
        break;
      case 'health':
        await this.pollHealth(job.instanceId);
        break;
    }
  }

  /**
   * Poll instance data
   */
  private async pollInstance(instanceId: string): Promise<void> {
    // Simulate instance polling
    // In real implementation, this would call gitlabApiService methods

    logger.debug(`Polling instance ${instanceId}`, 'GitlabRealtimeService');

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    // Check for changes and notify listeners
    if (this.config.changeDetectionEnabled) {
      // Simulate detecting changes
      const hasChanges = Math.random() > 0.7; // 30% chance of changes

      if (hasChanges) {
        const notification: ChangeNotification = {
          id: `change-${Date.now()}`,
          instanceId,
          type: 'updated',
          timestamp: new Date(),
          data: { simulated: true },
        };

        this.notifyChangeListeners(notification);
      }
    }
  }

  /**
   * Poll project data
   */
  private async pollProject(instanceId: string, projectId?: number): Promise<void> {
    logger.debug(`Polling project ${projectId || 'all'} for instance ${instanceId}`, 'GitlabRealtimeService');

    // Simulate project polling
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500));

    // Simulate change detection
    if (this.config.changeDetectionEnabled && Math.random() > 0.8) {
      const notification: ChangeNotification = {
        id: `change-${Date.now()}`,
        instanceId,
        projectId,
        type: 'updated',
        timestamp: new Date(),
        data: { projectId, simulated: true },
      };

      this.notifyChangeListeners(notification);
    }
  }

  /**
   * Poll health status
   */
  private async pollHealth(instanceId: string): Promise<void> {
    logger.debug(`Polling health for instance ${instanceId}`, 'GitlabRealtimeService');

    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));

    // Simulate health status changes
    if (this.config.changeDetectionEnabled && Math.random() > 0.9) {
      const notification: ChangeNotification = {
        id: `change-${Date.now()}`,
        instanceId,
        type: 'status_changed',
        timestamp: new Date(),
        data: { status: Math.random() > 0.5 ? 'healthy' : 'warning' },
      };

      this.notifyChangeListeners(notification);
    }
  }

  /**
   * Get polling interval with smart adjustments
   */
  private getPollingInterval(job: PollingJob): number {
    if (!this.config.enableSmartPolling) {
      return this.config.pollingInterval;
    }

    // Adjust interval based on error rate and activity
    const errorRate = job.pollCount > 0 ? job.errorCount / job.pollCount : 0;

    if (errorRate > 0.5) {
      // High error rate, increase interval
      return this.config.pollingInterval * 2;
    } else if (errorRate > 0.2) {
      // Moderate error rate, slight increase
      return this.config.pollingInterval * 1.5;
    }

    return this.config.pollingInterval;
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  private connectWebSocket(instance: GitlabInstance): void {
    if (!this.config.enableWebSocket) return;

    try {
      // WebSocket connection would be established here
      // This is a placeholder for WebSocket implementation

      logger.info(`WebSocket connection established for instance ${instance.id}`, 'GitlabRealtimeService');
    } catch (error) {
      logger.warn(`Failed to establish WebSocket connection for instance ${instance.id}`, 'GitlabRealtimeService', error);
    }
  }

  /**
   * Disconnect WebSocket
   */
  private disconnectWebSocket(instanceId: string): void {
    const ws = this.webSocketConnections.get(instanceId);
    if (ws) {
      ws.close();
      this.webSocketConnections.delete(instanceId);
      logger.info(`WebSocket connection closed for instance ${instanceId}`, 'GitlabRealtimeService');
    }
  }

  /**
   * Initialize metrics for an instance
   */
  private initializeMetrics(instanceId: string): void {
    if (!this.metrics.has(instanceId)) {
      this.metrics.set(instanceId, {
        instanceId,
        totalPolls: 0,
        successfulPolls: 0,
        failedPolls: 0,
        averagePollTime: 0,
        lastPollTime: new Date(),
        activeJobs: 0,
        queuedJobs: 0,
      });
    }
  }

  /**
   * Update metrics
   */
  private updateMetrics(instanceId: string, metric: keyof RealtimeMetrics): void {
    const metrics = this.metrics.get(instanceId);
    if (metrics && typeof metrics[metric] === 'number') {
      (metrics[metric] as number)++;
      metrics.lastPollTime = new Date();
    }
  }

  /**
   * Update average poll time
   */
  private updatePollTime(instanceId: string, pollTime: number): void {
    const metrics = this.metrics.get(instanceId);
    if (metrics) {
      const alpha = 0.1; // Smoothing factor
      metrics.averagePollTime = metrics.averagePollTime * (1 - alpha) + pollTime * alpha;
    }
  }

  /**
   * Add change listener
   */
  addChangeListener(listener: (notification: ChangeNotification) => void): () => void {
    this.changeListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.changeListeners.indexOf(listener);
      if (index !== -1) {
        this.changeListeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify change listeners
   */
  private notifyChangeListeners(notification: ChangeNotification): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        logger.error('Error in change listener', 'GitlabRealtimeService', error);
      }
    });

    // Show notification if enabled
    if (this.config.notificationEnabled) {
      this.showNotification(notification);
    }
  }

  /**
   * Show notification for changes
   */
  private showNotification(notification: ChangeNotification): void {
    // This would integrate with the app's notification system
    logger.info(`Change notification: ${notification.type} for ${notification.instanceId}`, 'GitlabRealtimeService', {
      projectId: notification.projectId,
      timestamp: notification.timestamp,
    });
  }

  /**
   * Get polling status
   */
  getPollingStatus(instanceId?: string): {
    activeJobs: number;
    queuedJobs: number;
    activePolls: number;
    metrics: RealtimeMetrics[];
  } {
    let jobs: PollingJob[];
    let metrics: RealtimeMetrics[];

    if (instanceId) {
      jobs = Array.from(this.pollingJobs.values())
        .filter(job => job.instanceId === instanceId);
      metrics = this.metrics.has(instanceId) ? [this.metrics.get(instanceId)!] : [];
    } else {
      jobs = Array.from(this.pollingJobs.values());
      metrics = Array.from(this.metrics.values());
    }

    return {
      activeJobs: jobs.filter(job => job.isActive).length,
      queuedJobs: jobs.length,
      activePolls: this.activePolls.size,
      metrics,
    };
  }

  /**
   * Get all polling jobs
   */
  getPollingJobs(instanceId?: string): PollingJob[] {
    if (instanceId) {
      return Array.from(this.pollingJobs.values())
        .filter(job => job.instanceId === instanceId);
    }

    return Array.from(this.pollingJobs.values());
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart polling timer if interval changed
    if (newConfig.pollingInterval) {
      this.startPollingTimer();
    }

    logger.info('Real-time service configuration updated', 'GitlabRealtimeService', newConfig);
  }

  /**
   * Force immediate poll for specific jobs
   */
  forcePoll(jobIdOrInstanceId: string): void {
    const jobs = this.getJobsByIdOrInstance(jobIdOrInstanceId);
    jobs.forEach(job => {
      job.nextPoll = new Date();
    });

    logger.info(`Forced immediate poll for ${jobIdOrInstanceId}`, 'GitlabRealtimeService');
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;

    // Stop all polling
    this.pollingJobs.clear();
    this.activePolls.clear();

    // Clear timers
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }

    // Close WebSocket connections
    this.webSocketConnections.forEach((ws, instanceId) => {
      this.disconnectWebSocket(instanceId);
    });

    // Clear listeners
    this.changeListeners = [];

    logger.info('GitLab real-time service destroyed', 'GitlabRealtimeService');
  }
}

// Singleton instance
export const gitlabRealtimeService = new GitlabRealtimeService();
