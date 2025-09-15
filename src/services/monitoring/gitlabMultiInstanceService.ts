// GitLab Multi-Instance Management Service
// Provides comprehensive multi-instance coordination and management capabilities

import { logger } from '@/lib/logger';
import type { GitlabProject } from '@/types';

// Multi-instance configuration
interface MultiInstanceConfig {
  enableCrossInstanceSync: boolean;
  maxConcurrentInstances: number;
  instanceHealthCheckInterval: number; // seconds
  enableFailover: boolean;
  failoverTimeout: number; // seconds
  enableLoadBalancing: boolean;
  syncInterval: number; // seconds
  enableInstanceGrouping: boolean;
  maxInstancesPerGroup: number;
}

interface InstanceGroup {
  id: string;
  name: string;
  description?: string;
  instanceIds: string[];
  settings: {
    syncEnabled: boolean;
    priority: 'high' | 'normal' | 'low';
    loadBalancingEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface InstanceHealth {
  instanceId: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  lastChecked: Date;
  responseTime: number;
  errorCount: number;
  consecutiveFailures: number;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
  };
}

interface InstanceSyncStatus {
  instanceId: string;
  lastSync: Date;
  syncStatus: 'idle' | 'syncing' | 'completed' | 'failed';
  syncedProjects: number;
  totalProjects: number;
  errors: string[];
}

interface CrossInstanceData {
  projectMappings: Map<string, string[]>; // projectId -> instanceIds
  instanceProjects: Map<string, GitlabProject[]>; // instanceId -> projects
  lastSync: Date;
  syncErrors: Array<{
    instanceId: string;
    error: string;
    timestamp: Date;
  }>;
}

class GitlabMultiInstanceService {
  private config: MultiInstanceConfig;
  private instanceGroups: Map<string, InstanceGroup> = new Map();
  private instanceHealth: Map<string, InstanceHealth> = new Map();
  private syncStatus: Map<string, InstanceSyncStatus> = new Map();
  private crossInstanceData: CrossInstanceData;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private syncTimer: NodeJS.Timeout | null = null;
  private isDestroyed = false;

  constructor(config: Partial<MultiInstanceConfig> = {}) {
    this.config = {
      enableCrossInstanceSync: true,
      maxConcurrentInstances: 10,
      instanceHealthCheckInterval: 60, // 1 minute
      enableFailover: true,
      failoverTimeout: 30, // 30 seconds
      enableLoadBalancing: false,
      syncInterval: 300, // 5 minutes
      enableInstanceGrouping: true,
      maxInstancesPerGroup: 5,
      ...config,
    };

    this.crossInstanceData = {
      projectMappings: new Map(),
      instanceProjects: new Map(),
      lastSync: new Date(),
      syncErrors: [],
    };

    this.startHealthChecks();
    if (this.config.enableCrossInstanceSync) {
      this.startSyncTimer();
    }
  }

  /**
   * Create a new instance group
   */
  createInstanceGroup(
    name: string,
    instanceIds: string[],
    options: {
      description?: string;
      priority?: 'high' | 'normal' | 'low';
      syncEnabled?: boolean;
      loadBalancingEnabled?: boolean;
    } = {}
  ): string {
    const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (this.config.enableInstanceGrouping && instanceIds.length > this.config.maxInstancesPerGroup) {
      throw new Error(`Maximum instances per group exceeded (${this.config.maxInstancesPerGroup})`);
    }

    const group: InstanceGroup = {
      id: groupId,
      name,
      description: options.description,
      instanceIds: [...instanceIds],
      settings: {
        syncEnabled: options.syncEnabled ?? true,
        priority: options.priority ?? 'normal',
        loadBalancingEnabled: options.loadBalancingEnabled ?? false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.instanceGroups.set(groupId, group);

    // Initialize health monitoring for new instances
    instanceIds.forEach(instanceId => {
      this.initializeInstanceHealth(instanceId);
    });

    logger.info(`Created instance group: ${name}`, 'GitlabMultiInstanceService', {
      groupId,
      instanceCount: instanceIds.length,
    });

    return groupId;
  }

  /**
   * Add instances to a group
   */
  addInstancesToGroup(groupId: string, instanceIds: string[]): void {
    const group = this.instanceGroups.get(groupId);
    if (!group) {
      throw new Error(`Instance group not found: ${groupId}`);
    }

    const newTotal = group.instanceIds.length + instanceIds.length;
    if (this.config.enableInstanceGrouping && newTotal > this.config.maxInstancesPerGroup) {
      throw new Error(`Adding instances would exceed maximum group size (${this.config.maxInstancesPerGroup})`);
    }

    // Add new instances
    instanceIds.forEach(instanceId => {
      if (!group.instanceIds.includes(instanceId)) {
        group.instanceIds.push(instanceId);
        this.initializeInstanceHealth(instanceId);
      }
    });

    group.updatedAt = new Date();

    logger.info(`Added instances to group ${groupId}`, 'GitlabMultiInstanceService', {
      addedCount: instanceIds.length,
      totalCount: group.instanceIds.length,
    });
  }

  /**
   * Remove instances from a group
   */
  removeInstancesFromGroup(groupId: string, instanceIds: string[]): void {
    const group = this.instanceGroups.get(groupId);
    if (!group) {
      throw new Error(`Instance group not found: ${groupId}`);
    }

    const initialCount = group.instanceIds.length;
    group.instanceIds = group.instanceIds.filter(id => !instanceIds.includes(id));
    group.updatedAt = new Date();

    logger.info(`Removed instances from group ${groupId}`, 'GitlabMultiInstanceService', {
      removedCount: initialCount - group.instanceIds.length,
      remainingCount: group.instanceIds.length,
    });
  }

  /**
   * Delete an instance group
   */
  deleteInstanceGroup(groupId: string): void {
    const group = this.instanceGroups.get(groupId);
    if (!group) {
      throw new Error(`Instance group not found: ${groupId}`);
    }

    this.instanceGroups.delete(groupId);

    logger.info(`Deleted instance group: ${group.name}`, 'GitlabMultiInstanceService', {
      groupId,
      instanceCount: group.instanceIds.length,
    });
  }

  /**
   * Get instance groups
   */
  getInstanceGroups(): InstanceGroup[] {
    return Array.from(this.instanceGroups.values());
  }

  /**
   * Get instances in a group
   */
  getInstancesInGroup(groupId: string): string[] {
    const group = this.instanceGroups.get(groupId);
    return group ? [...group.instanceIds] : [];
  }

  /**
   * Initialize health monitoring for an instance
   */
  private initializeInstanceHealth(instanceId: string): void {
    if (!this.instanceHealth.has(instanceId)) {
      this.instanceHealth.set(instanceId, {
        instanceId,
        status: 'offline',
        lastChecked: new Date(0),
        responseTime: 0,
        errorCount: 0,
        consecutiveFailures: 0,
      });
    }
  }

  /**
   * Update instance health status
   */
  updateInstanceHealth(
    instanceId: string,
    health: Partial<InstanceHealth>
  ): void {
    const currentHealth = this.instanceHealth.get(instanceId);
    if (!currentHealth) {
      this.initializeInstanceHealth(instanceId);
      return;
    }

    Object.assign(currentHealth, health);
    currentHealth.lastChecked = new Date();

    // Update consecutive failures
    if (health.status === 'unhealthy' || health.status === 'offline') {
      currentHealth.consecutiveFailures++;
    } else {
      currentHealth.consecutiveFailures = 0;
    }

    logger.debug(`Updated health for instance ${instanceId}`, 'GitlabMultiInstanceService', {
      status: currentHealth.status,
      responseTime: currentHealth.responseTime,
    });
  }

  /**
   * Get instance health status
   */
  getInstanceHealth(instanceId?: string): InstanceHealth[] {
    if (instanceId) {
      const health = this.instanceHealth.get(instanceId);
      return health ? [health] : [];
    }

    return Array.from(this.instanceHealth.values());
  }

  /**
   * Get healthy instances
   */
  getHealthyInstances(): string[] {
    return Array.from(this.instanceHealth.values())
      .filter(health => health.status === 'healthy')
      .map(health => health.instanceId);
  }

  /**
   * Start health check timer
   */
  private startHealthChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.instanceHealthCheckInterval * 1000);
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    if (this.isDestroyed) return;

    const instancesToCheck = Array.from(this.instanceHealth.keys());

    // Check instances in parallel with concurrency limit
    const concurrencyLimit = 3;
    for (let i = 0; i < instancesToCheck.length; i += concurrencyLimit) {
      const batch = instancesToCheck.slice(i, i + concurrencyLimit);
      await Promise.allSettled(
        batch.map(instanceId => this.checkInstanceHealth(instanceId))
      );
    }
  }

  /**
   * Check health of a specific instance
   */
  private async checkInstanceHealth(instanceId: string): Promise<void> {
    const startTime = Date.now();

    try {
      // This would integrate with the actual GitLab API service
      // For now, we'll simulate health checking

      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      const responseTime = Date.now() - startTime;
      const isHealthy = Math.random() > 0.1; // 90% success rate

      this.updateInstanceHealth(instanceId, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        errorCount: isHealthy ? 0 : 1,
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.updateInstanceHealth(instanceId, {
        status: 'offline',
        responseTime,
        errorCount: 1,
      });

      logger.warn(`Health check failed for instance ${instanceId}`, 'GitlabMultiInstanceService', error);
    }
  }

  /**
   * Start sync timer for cross-instance synchronization
   */
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.performCrossInstanceSync();
    }, this.config.syncInterval * 1000);
  }

  /**
   * Perform cross-instance synchronization
   */
  private async performCrossInstanceSync(): Promise<void> {
    if (this.isDestroyed || !this.config.enableCrossInstanceSync) return;

    logger.info('Starting cross-instance synchronization', 'GitlabMultiInstanceService');

    try {
      // Get all healthy instances
      const healthyInstances = this.getHealthyInstances();

      if (healthyInstances.length < 2) {
        logger.debug('Not enough healthy instances for cross-sync', 'GitlabMultiInstanceService');
        return;
      }

      // Perform synchronization
      await this.syncInstanceData(healthyInstances);

      this.crossInstanceData.lastSync = new Date();

      logger.info('Cross-instance synchronization completed', 'GitlabMultiInstanceService');

    } catch (error) {
      logger.error('Cross-instance synchronization failed', 'GitlabMultiInstanceService', error);

      this.crossInstanceData.syncErrors.push({
        instanceId: 'cross-sync',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Sync data between instances
   */
  private async syncInstanceData(instanceIds: string[]): Promise<void> {
    // This would implement actual cross-instance data synchronization
    // For now, we'll simulate the process

    for (const instanceId of instanceIds) {
      try {
        // Simulate fetching projects from instance
        const projects: GitlabProject[] = [];
        // In real implementation, this would call gitlabApiService.getProjects(instance)

        this.crossInstanceData.instanceProjects.set(instanceId, projects);

        // Update sync status
        this.updateSyncStatus(instanceId, {
          lastSync: new Date(),
          syncStatus: 'completed',
          syncedProjects: projects.length,
          totalProjects: projects.length,
          errors: [],
        });

      } catch (error) {
        this.updateSyncStatus(instanceId, {
          lastSync: new Date(),
          syncStatus: 'failed',
          syncedProjects: 0,
          totalProjects: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });

        this.crossInstanceData.syncErrors.push({
          instanceId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // Update project mappings
    this.updateProjectMappings();
  }

  /**
   * Update project mappings across instances
   */
  private updateProjectMappings(): void {
    const projectMappings = new Map<string, string[]>();

    // Build mappings of projects across instances
    for (const [instanceId, projects] of this.crossInstanceData.instanceProjects) {
      projects.forEach(project => {
        const existingInstances = projectMappings.get(project.id) || [];
        if (!existingInstances.includes(instanceId)) {
          existingInstances.push(instanceId);
        }
        projectMappings.set(project.id, existingInstances);
      });
    }

    this.crossInstanceData.projectMappings = projectMappings;
  }

  /**
   * Update sync status for an instance
   */
  private updateSyncStatus(instanceId: string, status: Partial<InstanceSyncStatus>): void {
    const currentStatus = this.syncStatus.get(instanceId) || {
      instanceId,
      lastSync: new Date(0),
      syncStatus: 'idle' as const,
      syncedProjects: 0,
      totalProjects: 0,
      errors: [],
    };

    Object.assign(currentStatus, status);
    this.syncStatus.set(instanceId, currentStatus);
  }

  /**
   * Get sync status
   */
  getSyncStatus(instanceId?: string): InstanceSyncStatus[] {
    if (instanceId) {
      const status = this.syncStatus.get(instanceId);
      return status ? [status] : [];
    }

    return Array.from(this.syncStatus.values());
  }

  /**
   * Get cross-instance data
   */
  getCrossInstanceData(): {
    projectMappings: Map<string, string[]>;
    instanceProjects: Map<string, GitlabProject[]>;
    lastSync: Date;
    syncErrors: Array<{
      instanceId: string;
      error: string;
      timestamp: Date;
    }>;
  } {
    return {
      projectMappings: new Map(this.crossInstanceData.projectMappings),
      instanceProjects: new Map(this.crossInstanceData.instanceProjects),
      lastSync: this.crossInstanceData.lastSync,
      syncErrors: [...this.crossInstanceData.syncErrors],
    };
  }

  /**
   * Find instances that have a specific project
   */
  findInstancesWithProject(projectId: string): string[] {
    return this.crossInstanceData.projectMappings.get(projectId) || [];
  }

  /**
   * Get load balancing recommendation
   */
  getLoadBalancingRecommendation(instanceIds: string[]): {
    recommendedInstance: string;
    reason: string;
    alternatives: string[];
  } {
    if (!this.config.enableLoadBalancing || instanceIds.length === 0) {
      return {
        recommendedInstance: instanceIds[0],
        reason: 'Load balancing disabled or no instances available',
        alternatives: instanceIds.slice(1),
      };
    }

    // Simple load balancing based on health and response time
    const instanceMetrics = instanceIds.map(instanceId => {
      const health = this.instanceHealth.get(instanceId);
      const syncStatus = this.syncStatus.get(instanceId);

      return {
        instanceId,
        health: health?.status || 'offline',
        responseTime: health?.responseTime || Infinity,
        consecutiveFailures: health?.consecutiveFailures || 0,
        lastSync: syncStatus?.lastSync || new Date(0),
      };
    });

    // Sort by health, then response time, then recent sync
    instanceMetrics.sort((a, b) => {
      // Prioritize healthy instances
      if (a.health !== b.health) {
        const healthOrder = { healthy: 3, degraded: 2, unhealthy: 1, offline: 0 };
        return healthOrder[b.health] - healthOrder[a.health];
      }

      // Then by response time (lower is better)
      if (a.responseTime !== b.responseTime) {
        return a.responseTime - b.responseTime;
      }

      // Then by consecutive failures (lower is better)
      if (a.consecutiveFailures !== b.consecutiveFailures) {
        return a.consecutiveFailures - b.consecutiveFailures;
      }

      // Finally by most recent sync
      return b.lastSync.getTime() - a.lastSync.getTime();
    });

    const recommended = instanceMetrics[0];
    const alternatives = instanceMetrics.slice(1).map(m => m.instanceId);

    return {
      recommendedInstance: recommended.instanceId,
      reason: `Best instance based on health (${recommended.health}) and response time (${recommended.responseTime}ms)`,
      alternatives,
    };
  }

  /**
   * Handle instance failover
   */
  async handleInstanceFailover(failedInstanceId: string): Promise<{
    failoverSuccessful: boolean;
    newInstance?: string;
    reason?: string;
  }> {
    if (!this.config.enableFailover) {
      return {
        failoverSuccessful: false,
        reason: 'Failover disabled',
      };
    }

    logger.info(`Handling failover for instance ${failedInstanceId}`, 'GitlabMultiInstanceService');

    // Find alternative healthy instances in the same groups
    const groupsWithInstance = Array.from(this.instanceGroups.values())
      .filter(group => group.instanceIds.includes(failedInstanceId));

    const alternativeInstances: string[] = [];
    groupsWithInstance.forEach(group => {
      group.instanceIds.forEach(instanceId => {
        if (instanceId !== failedInstanceId && !alternativeInstances.includes(instanceId)) {
          const health = this.instanceHealth.get(instanceId);
          if (health?.status === 'healthy') {
            alternativeInstances.push(instanceId);
          }
        }
      });
    });

    if (alternativeInstances.length === 0) {
      return {
        failoverSuccessful: false,
        reason: 'No healthy alternative instances available',
      };
    }

    // Use load balancing to pick the best alternative
    const recommendation = this.getLoadBalancingRecommendation(alternativeInstances);

    logger.info(`Failover successful for instance ${failedInstanceId}`, 'GitlabMultiInstanceService', {
      newInstance: recommendation.recommendedInstance,
      reason: recommendation.reason,
    });

    return {
      failoverSuccessful: true,
      newInstance: recommendation.recommendedInstance,
      reason: recommendation.reason,
    };
  }

  /**
   * Get instance performance metrics
   */
  getInstanceMetrics(instanceId?: string): Array<{
    instanceId: string;
    health: InstanceHealth;
    syncStatus: InstanceSyncStatus;
    performance: {
      averageResponseTime: number;
      errorRate: number;
      uptime: number;
    };
  }> {
    const instances = instanceId ? [instanceId] : Array.from(this.instanceHealth.keys());

    return instances.map(id => {
      const health = this.instanceHealth.get(id);
      const syncStatus = this.syncStatus.get(id);

      if (!health) {
        throw new Error(`Health data not found for instance ${id}`);
      }

      // Calculate performance metrics
      const errorRate = health.errorCount > 0 ? health.consecutiveFailures / health.errorCount : 0;
      const uptime = health.status === 'healthy' ? 1 : 0; // Simplified

      return {
        instanceId: id,
        health,
        syncStatus: syncStatus || {
          instanceId: id,
          lastSync: new Date(0),
          syncStatus: 'idle',
          syncedProjects: 0,
          totalProjects: 0,
          errors: [],
        },
        performance: {
          averageResponseTime: health.responseTime,
          errorRate,
          uptime,
        },
      };
    });
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MultiInstanceConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart timers if intervals changed
    if (newConfig.instanceHealthCheckInterval) {
      this.startHealthChecks();
    }

    if (newConfig.syncInterval) {
      this.startSyncTimer();
    }

    logger.info('Multi-instance configuration updated', 'GitlabMultiInstanceService', newConfig);
  }

  /**
   * Export instance configuration for backup
   */
  exportConfiguration(): {
    groups: InstanceGroup[];
    config: MultiInstanceConfig;
    crossInstanceData: CrossInstanceData;
  } {
    return {
      groups: Array.from(this.instanceGroups.values()),
      config: { ...this.config },
      crossInstanceData: {
        projectMappings: new Map(this.crossInstanceData.projectMappings),
        instanceProjects: new Map(this.crossInstanceData.instanceProjects),
        lastSync: this.crossInstanceData.lastSync,
        syncErrors: [...this.crossInstanceData.syncErrors],
      },
    };
  }

  /**
   * Import instance configuration from backup
   */
  importConfiguration(data: {
    groups: InstanceGroup[];
    config: MultiInstanceConfig;
    crossInstanceData: CrossInstanceData;
  }): void {
    // Import groups
    this.instanceGroups.clear();
    data.groups.forEach(group => {
      this.instanceGroups.set(group.id, { ...group });
    });

    // Import configuration
    this.config = { ...data.config };

    // Import cross-instance data
    this.crossInstanceData = {
      projectMappings: new Map(data.crossInstanceData.projectMappings),
      instanceProjects: new Map(data.crossInstanceData.instanceProjects),
      lastSync: data.crossInstanceData.lastSync,
      syncErrors: [...data.crossInstanceData.syncErrors],
    };

    // Reinitialize health monitoring
    data.groups.forEach(group => {
      group.instanceIds.forEach(instanceId => {
        this.initializeInstanceHealth(instanceId);
      });
    });

    // Restart timers with new config
    this.startHealthChecks();
    if (this.config.enableCrossInstanceSync) {
      this.startSyncTimer();
    }

    logger.info('Multi-instance configuration imported', 'GitlabMultiInstanceService', {
      groupsCount: data.groups.length,
      instancesCount: data.groups.reduce((sum, group) => sum + group.instanceIds.length, 0),
    });
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;

    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    // Clear data
    this.instanceGroups.clear();
    this.instanceHealth.clear();
    this.syncStatus.clear();
    this.crossInstanceData.projectMappings.clear();
    this.crossInstanceData.instanceProjects.clear();
    this.crossInstanceData.syncErrors = [];

    logger.info('GitLab multi-instance service destroyed', 'GitlabMultiInstanceService');
  }
}

// Singleton instance
export const gitlabMultiInstanceService = new GitlabMultiInstanceService();
