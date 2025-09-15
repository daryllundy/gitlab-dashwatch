// GitLab Project Activity Monitoring Service
// Provides comprehensive project activity tracking, analytics, and insights

import { logger } from '@/lib/logger';

// Activity monitoring configuration
interface ActivityConfig {
  enableActivityTracking: boolean;
  enableRealTimeUpdates: boolean;
  activityRetentionDays: number;
  enableAnalytics: boolean;
  enableNotifications: boolean;
  enableTrendAnalysis: boolean;
  maxActivitiesPerProject: number;
  activityBatchSize: number;
  enableActivityExport: boolean;
  enableActivityInsights: boolean;
}

interface ProjectActivity {
  id: string;
  projectId: number;
  instanceId: string;
  type: ActivityType;
  title: string;
  description: string;
  author: {
    id: number;
    username: string;
    name: string;
    avatarUrl?: string;
  };
  metadata: Record<string, any>;
  timestamp: Date;
  url?: string;
  labels?: string[];
  assignees?: string[];
  reviewers?: string[];
  relatedIssues?: number[];
  relatedMergeRequests?: number[];
}

enum ActivityType {
  COMMIT = 'commit',
  ISSUE_CREATED = 'issue_created',
  ISSUE_UPDATED = 'issue_updated',
  ISSUE_CLOSED = 'issue_closed',
  MERGE_REQUEST_CREATED = 'merge_request_created',
  MERGE_REQUEST_UPDATED = 'merge_request_updated',
  MERGE_REQUEST_MERGED = 'merge_request_merged',
  MERGE_REQUEST_CLOSED = 'merge_request_closed',
  PIPELINE_STARTED = 'pipeline_started',
  PIPELINE_SUCCEEDED = 'pipeline_succeeded',
  PIPELINE_FAILED = 'pipeline_failed',
  PIPELINE_CANCELED = 'pipeline_canceled',
  RELEASE_CREATED = 'release_created',
  RELEASE_TAGGED = 'release_tagged',
  WIKI_PAGE_CREATED = 'wiki_page_created',
  WIKI_PAGE_UPDATED = 'wiki_page_updated',
  PROJECT_UPDATED = 'project_updated',
  MEMBER_ADDED = 'member_added',
  MEMBER_REMOVED = 'member_removed',
  BRANCH_CREATED = 'branch_created',
  BRANCH_DELETED = 'branch_deleted',
  TAG_CREATED = 'tag_created',
  TAG_DELETED = 'tag_deleted',
}

interface ActivityMetrics {
  projectId: number;
  instanceId: string;
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activitiesByAuthor: Record<string, number>;
  activitiesByDay: Record<string, number>;
  averageActivitiesPerDay: number;
  peakActivityDay: string;
  mostActiveAuthor: string;
  activityTrends: Array<{
    date: string;
    count: number;
    types: Record<ActivityType, number>;
  }>;
  lastUpdated: Date;
}

interface ActivityInsights {
  projectId: number;
  instanceId: string;
  insights: Array<{
    type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    timestamp: Date;
  }>;
  lastAnalyzed: Date;
}

interface ActivityFilter {
  types?: ActivityType[];
  authors?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  labels?: string[];
  assignees?: string[];
  reviewers?: string[];
  relatedIssues?: number[];
  relatedMergeRequests?: number[];
  searchQuery?: string;
}

interface ActivitySummary {
  projectId: number;
  instanceId: string;
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalActivities: number;
    uniqueAuthors: number;
    mostActiveType: ActivityType;
    activityBreakdown: Record<ActivityType, number>;
    topContributors: Array<{
      author: string;
      count: number;
      types: Record<ActivityType, number>;
    }>;
    activityTimeline: Array<{
      date: string;
      count: number;
    }>;
    velocityMetrics: {
      commitsPerDay: number;
      issuesResolvedPerDay: number;
      mergeRequestsMergedPerDay: number;
      pipelineSuccessRate: number;
    };
  };
}

class GitlabActivityService {
  private config: ActivityConfig;
  private activities: Map<string, ProjectActivity[]> = new Map(); // projectId -> activities
  private metrics: Map<string, ActivityMetrics> = new Map(); // projectId -> metrics
  private insights: Map<string, ActivityInsights> = new Map(); // projectId -> insights
  private isDestroyed = false;

  constructor(config: Partial<ActivityConfig> = {}) {
    this.config = {
      enableActivityTracking: true,
      enableRealTimeUpdates: true,
      activityRetentionDays: 90,
      enableAnalytics: true,
      enableNotifications: true,
      enableTrendAnalysis: true,
      maxActivitiesPerProject: 10000,
      activityBatchSize: 100,
      enableActivityExport: true,
      enableActivityInsights: true,
      ...config,
    };

    this.startActivityCleanup();
  }

  /**
   * Record a new project activity
   */
  async recordActivity(
    projectId: number,
    instanceId: string,
    activity: Omit<ProjectActivity, 'id' | 'projectId' | 'instanceId' | 'timestamp'>
  ): Promise<void> {
    if (!this.config.enableActivityTracking) return;

    const activityKey = `${instanceId}-${projectId}`;
    const projectActivities = this.activities.get(activityKey) || [];

    const newActivity: ProjectActivity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      instanceId,
      timestamp: new Date(),
    };

    // Add to activities list
    projectActivities.unshift(newActivity);

    // Limit activities per project
    if (projectActivities.length > this.config.maxActivitiesPerProject) {
      projectActivities.splice(this.config.maxActivitiesPerProject);
    }

    this.activities.set(activityKey, projectActivities);

    // Update metrics
    if (this.config.enableAnalytics) {
      await this.updateActivityMetrics(projectId, instanceId);
    }

    // Generate insights
    if (this.config.enableActivityInsights) {
      await this.generateActivityInsights(projectId, instanceId);
    }

    // Send notifications if enabled
    if (this.config.enableNotifications) {
      await this.sendActivityNotifications(newActivity);
    }

    logger.debug(`Recorded activity: ${activity.type} for project ${projectId}`, 'GitlabActivityService', {
      activityId: newActivity.id,
      author: activity.author.username,
    });
  }

  /**
   * Get activities for a project with filtering
   */
  getActivities(
    projectId: number,
    instanceId: string,
    filter?: ActivityFilter,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'timestamp' | 'type' | 'author';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): ProjectActivity[] {
    const activityKey = `${instanceId}-${projectId}`;
    let projectActivities = this.activities.get(activityKey) || [];

    // Apply filters
    if (filter) {
      projectActivities = this.applyActivityFilters(projectActivities, filter);
    }

    // Apply sorting
    const { sortBy = 'timestamp', sortOrder = 'desc' } = options;
    projectActivities = this.sortActivities(projectActivities, sortBy, sortOrder);

    // Apply pagination
    const { limit, offset = 0 } = options;
    if (limit) {
      projectActivities = projectActivities.slice(offset, offset + limit);
    }

    return projectActivities;
  }

  /**
   * Apply filters to activities
   */
  private applyActivityFilters(activities: ProjectActivity[], filter: ActivityFilter): ProjectActivity[] {
    return activities.filter(activity => {
      // Type filter
      if (filter.types && !filter.types.includes(activity.type)) {
        return false;
      }

      // Author filter
      if (filter.authors && !filter.authors.includes(activity.author.username)) {
        return false;
      }

      // Date range filter
      if (filter.dateRange) {
        const activityDate = new Date(activity.timestamp);
        if (activityDate < filter.dateRange.from || activityDate > filter.dateRange.to) {
          return false;
        }
      }

      // Labels filter
      if (filter.labels && activity.labels) {
        const hasMatchingLabel = filter.labels.some(label =>
          activity.labels!.includes(label)
        );
        if (!hasMatchingLabel) return false;
      }

      // Assignees filter
      if (filter.assignees && activity.assignees) {
        const hasMatchingAssignee = filter.assignees.some(assignee =>
          activity.assignees!.includes(assignee)
        );
        if (!hasMatchingAssignee) return false;
      }

      // Reviewers filter
      if (filter.reviewers && activity.reviewers) {
        const hasMatchingReviewer = filter.reviewers.some(reviewer =>
          activity.reviewers!.includes(reviewer)
        );
        if (!hasMatchingReviewer) return false;
      }

      // Related issues filter
      if (filter.relatedIssues && activity.relatedIssues) {
        const hasMatchingIssue = filter.relatedIssues.some(issueId =>
          activity.relatedIssues!.includes(issueId)
        );
        if (!hasMatchingIssue) return false;
      }

      // Related merge requests filter
      if (filter.relatedMergeRequests && activity.relatedMergeRequests) {
        const hasMatchingMR = filter.relatedMergeRequests.some(mrId =>
          activity.relatedMergeRequests!.includes(mrId)
        );
        if (!hasMatchingMR) return false;
      }

      // Search query filter
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        const searchableText = [
          activity.title,
          activity.description,
          activity.author.name,
          activity.author.username,
          ...(activity.labels || []),
        ].join(' ').toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort activities
   */
  private sortActivities(
    activities: ProjectActivity[],
    sortBy: 'timestamp' | 'type' | 'author',
    sortOrder: 'asc' | 'desc'
  ): ProjectActivity[] {
    return activities.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'author':
          aValue = a.author.username.toLowerCase();
          bValue = b.author.username.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Update activity metrics for a project
   */
  private async updateActivityMetrics(projectId: number, instanceId: string): Promise<void> {
    const activityKey = `${instanceId}-${projectId}`;
    const projectActivities = this.activities.get(activityKey) || [];

    const metrics: ActivityMetrics = {
      projectId,
      instanceId,
      totalActivities: projectActivities.length,
      activitiesByType: {} as Record<ActivityType, number>,
      activitiesByAuthor: {},
      activitiesByDay: {},
      averageActivitiesPerDay: 0,
      peakActivityDay: '',
      mostActiveAuthor: '',
      activityTrends: [],
      lastUpdated: new Date(),
    };

    // Calculate metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    projectActivities.forEach(activity => {
      // Activities by type
      metrics.activitiesByType[activity.type] = (metrics.activitiesByType[activity.type] || 0) + 1;

      // Activities by author
      metrics.activitiesByAuthor[activity.author.username] =
        (metrics.activitiesByAuthor[activity.author.username] || 0) + 1;

      // Activities by day (last 30 days)
      if (activity.timestamp >= thirtyDaysAgo) {
        const dayKey = activity.timestamp.toISOString().split('T')[0];
        metrics.activitiesByDay[dayKey] = (metrics.activitiesByDay[dayKey] || 0) + 1;
      }
    });

    // Calculate derived metrics
    const dayKeys = Object.keys(metrics.activitiesByDay);
    if (dayKeys.length > 0) {
      const totalRecentActivities = Object.values(metrics.activitiesByDay).reduce((sum, count) => sum + count, 0);
      metrics.averageActivitiesPerDay = totalRecentActivities / Math.max(dayKeys.length, 1);

      // Find peak activity day
      let maxCount = 0;
      dayKeys.forEach(day => {
        if (metrics.activitiesByDay[day] > maxCount) {
          maxCount = metrics.activitiesByDay[day];
          metrics.peakActivityDay = day;
        }
      });
    }

    // Find most active author
    let maxAuthorCount = 0;
    Object.entries(metrics.activitiesByAuthor).forEach(([author, count]) => {
      if (count > maxAuthorCount) {
        maxAuthorCount = count;
        metrics.mostActiveAuthor = author;
      }
    });

    // Calculate activity trends (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    metrics.activityTrends = this.calculateActivityTrends(projectActivities, sevenDaysAgo);

    this.metrics.set(activityKey, metrics);
  }

  /**
   * Calculate activity trends
   */
  private calculateActivityTrends(activities: ProjectActivity[], since: Date): Array<{
    date: string;
    count: number;
    types: Record<ActivityType, number>;
  }> {
    const trends: Record<string, { count: number; types: Record<ActivityType, number> }> = {};

    activities
      .filter(activity => activity.timestamp >= since)
      .forEach(activity => {
        const dateKey = activity.timestamp.toISOString().split('T')[0];

        if (!trends[dateKey]) {
          trends[dateKey] = { count: 0, types: {} as Record<ActivityType, number> };
        }

        trends[dateKey].count++;
        trends[dateKey].types[activity.type] = (trends[dateKey].types[activity.type] || 0) + 1;
      });

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        count: data.count,
        types: data.types,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate activity insights
   */
  private async generateActivityInsights(projectId: number, instanceId: string): Promise<void> {
    const activityKey = `${instanceId}-${projectId}`;
    const metrics = this.metrics.get(activityKey);

    if (!metrics) return;

    const insights: ActivityInsights = {
      projectId,
      instanceId,
      insights: [],
      lastAnalyzed: new Date(),
    };

    // Analyze activity trends
    if (this.config.enableTrendAnalysis) {
      const trendInsights = this.analyzeActivityTrends(metrics);
      insights.insights.push(...(trendInsights as any));
    }

    // Analyze author contributions
    const authorInsights = this.analyzeAuthorContributions(metrics);
    insights.insights.push(...(authorInsights as any));

    // Analyze activity patterns
    const patternInsights = this.analyzeActivityPatterns(metrics);
    insights.insights.push(...(patternInsights as any));

    // Generate recommendations
    const recommendations = this.generateActivityRecommendations(metrics);
    insights.insights.push(...(recommendations as any));

    this.insights.set(activityKey, insights);
  }

  /**
   * Analyze activity trends
   */
  private analyzeActivityTrends(metrics: ActivityMetrics): Array<{
    type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    timestamp: Date;
  }> {
    const insights = [];

    // Check for declining activity
    const recentTrends = metrics.activityTrends.slice(-7);
    if (recentTrends.length >= 7) {
      const recentAvg = recentTrends.slice(-3).reduce((sum, t) => sum + t.count, 0) / 3;
      const previousAvg = recentTrends.slice(0, 4).reduce((sum, t) => sum + t.count, 0) / 4;

      if (recentAvg < previousAvg * 0.5) {
        insights.push({
          type: 'alert',
          title: 'Declining Activity',
          description: 'Project activity has decreased significantly in the last few days.',
          severity: 'high',
          data: { recentAvg, previousAvg, trend: recentTrends },
          timestamp: new Date(),
        });
      }
    }

    // Check for high activity periods
    const maxActivity = Math.max(...recentTrends.map(t => t.count));
    if (maxActivity > metrics.averageActivitiesPerDay * 3) {
      insights.push({
        type: 'trend',
        title: 'High Activity Period',
        description: 'Project experienced unusually high activity recently.',
        severity: 'low',
        data: { maxActivity, average: metrics.averageActivitiesPerDay },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Analyze author contributions
   */
  private analyzeAuthorContributions(metrics: ActivityMetrics): Array<{
    type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    timestamp: Date;
  }> {
    const insights = [];

    // Check for single author dominance
    const totalActivities = Object.values(metrics.activitiesByAuthor).reduce((sum, count) => sum + count, 0);
    const topAuthorCount = Math.max(...Object.values(metrics.activitiesByAuthor));
    const topAuthorPercentage = (topAuthorCount / totalActivities) * 100;

    if (topAuthorPercentage > 70) {
      insights.push({
        type: 'recommendation',
        title: 'Author Concentration',
        description: `One author (${metrics.mostActiveAuthor}) contributes ${topAuthorPercentage.toFixed(1)}% of all activity.`,
        severity: 'medium',
        data: { topAuthor: metrics.mostActiveAuthor, percentage: topAuthorPercentage },
        timestamp: new Date(),
      });
    }

    // Check for new contributors
    // This would need actual activity data to track new authors

    return insights;
  }

  /**
   * Analyze activity patterns
   */
  private analyzeActivityPatterns(metrics: ActivityMetrics): Array<{
    type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    timestamp: Date;
  }> {
    const insights = [];

    // Check for weekend activity patterns
    const weekendActivity = Object.entries(metrics.activitiesByDay)
      .filter(([date]) => {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
      })
      .reduce((sum, [, count]) => sum + count, 0);

    const weekdayActivity = Object.entries(metrics.activitiesByDay)
      .filter(([date]) => {
        const dayOfWeek = new Date(date).getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday
      })
      .reduce((sum, [, count]) => sum + count, 0);

    if (weekendActivity > weekdayActivity * 0.3) {
      insights.push({
        type: 'trend',
        title: 'Weekend Activity',
        description: 'Project shows significant activity during weekends.',
        severity: 'low',
        data: { weekendActivity, weekdayActivity },
        timestamp: new Date(),
      });
    }

    return insights;
  }

  /**
   * Generate activity recommendations
   */
  private generateActivityRecommendations(metrics: ActivityMetrics): Array<{
    type: 'trend' | 'anomaly' | 'recommendation' | 'alert';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data: any;
    timestamp: Date;
  }> {
    const recommendations = [];

    // Low activity recommendation
    if (metrics.averageActivitiesPerDay < 1) {
      recommendations.push({
        type: 'recommendation',
        title: 'Increase Activity',
        description: 'Consider increasing project activity through more frequent commits or issue updates.',
        severity: 'low',
        data: { averageActivitiesPerDay: metrics.averageActivitiesPerDay },
        timestamp: new Date(),
      });
    }

    // High error rate in pipelines
    const pipelineActivities = metrics.activitiesByType[ActivityType.PIPELINE_FAILED] || 0;
    const totalPipelineActivities = (metrics.activitiesByType[ActivityType.PIPELINE_STARTED] || 0) +
                                   (metrics.activitiesByType[ActivityType.PIPELINE_SUCCEEDED] || 0) +
                                   pipelineActivities;

    if (totalPipelineActivities > 10 && pipelineActivities / totalPipelineActivities > 0.3) {
      recommendations.push({
        type: 'alert',
        title: 'High Pipeline Failure Rate',
        description: 'Pipeline failure rate is above 30%. Consider reviewing CI/CD configuration.',
        severity: 'high',
        data: { failureRate: (pipelineActivities / totalPipelineActivities) * 100 },
        timestamp: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Send activity notifications
   */
  private async sendActivityNotifications(activity: ProjectActivity): Promise<void> {
    // This would integrate with the notification system
    logger.info(`Activity notification: ${activity.type}`, 'GitlabActivityService', {
      projectId: activity.projectId,
      author: activity.author.username,
      title: activity.title,
    });
  }

  /**
   * Get activity summary for a project
   */
  getActivitySummary(
    projectId: number,
    instanceId: string,
    period: { from: Date; to: Date }
  ): ActivitySummary | null {
    const activityKey = `${instanceId}-${projectId}`;
    const activities = this.activities.get(activityKey) || [];
    const metrics = this.metrics.get(activityKey);

    if (!metrics) return null;

    // Filter activities by period
    const periodActivities = activities.filter(activity =>
      activity.timestamp >= period.from && activity.timestamp <= period.to
    );

    // Calculate summary metrics
    const uniqueAuthors = new Set(periodActivities.map(a => a.author.username)).size;
    const activityBreakdown = periodActivities.reduce((breakdown, activity) => {
      breakdown[activity.type] = (breakdown[activity.type] || 0) + 1;
      return breakdown;
    }, {} as Record<ActivityType, number>);

    const mostActiveType = Object.entries(activityBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as ActivityType || ActivityType.COMMIT;

    // Calculate top contributors
    const authorStats = periodActivities.reduce((stats, activity) => {
      const author = activity.author.username;
      if (!stats[author]) {
        stats[author] = { count: 0, types: {} as Record<ActivityType, number> };
      }
      stats[author].count++;
      stats[author].types[activity.type] = (stats[author].types[activity.type] || 0) + 1;
      return stats;
    }, {} as Record<string, { count: number; types: Record<ActivityType, number> }>);

    const topContributors = Object.entries(authorStats)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([author, stats]) => ({
        author,
        count: stats.count,
        types: stats.types,
      }));

    // Calculate activity timeline
    const activityTimeline = this.calculateActivityTimeline(periodActivities, period);

    // Calculate velocity metrics
    const daysDiff = Math.max(1, (period.to.getTime() - period.from.getTime()) / (1000 * 60 * 60 * 24));
    const velocityMetrics = {
      commitsPerDay: (activityBreakdown[ActivityType.COMMIT] || 0) / daysDiff,
      issuesResolvedPerDay: (activityBreakdown[ActivityType.ISSUE_CLOSED] || 0) / daysDiff,
      mergeRequestsMergedPerDay: (activityBreakdown[ActivityType.MERGE_REQUEST_MERGED] || 0) / daysDiff,
      pipelineSuccessRate: this.calculatePipelineSuccessRate(periodActivities),
    };

    return {
      projectId,
      instanceId,
      period,
      summary: {
        totalActivities: periodActivities.length,
        uniqueAuthors,
        mostActiveType,
        activityBreakdown,
        topContributors,
        activityTimeline,
        velocityMetrics,
      },
    };
  }

  /**
   * Calculate activity timeline
   */
  private calculateActivityTimeline(activities: ProjectActivity[], period: { from: Date; to: Date }): Array<{
    date: string;
    count: number;
  }> {
    const timeline: Record<string, number> = {};

    activities.forEach(activity => {
      const dateKey = activity.timestamp.toISOString().split('T')[0];
      timeline[dateKey] = (timeline[dateKey] || 0) + 1;
    });

    // Fill in missing dates
    const current = new Date(period.from);
    const end = new Date(period.to);

    while (current <= end) {
      const dateKey = current.toISOString().split('T')[0];
      if (!(dateKey in timeline)) {
        timeline[dateKey] = 0;
      }
      current.setDate(current.getDate() + 1);
    }

    return Object.entries(timeline)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  /**
   * Calculate pipeline success rate
   */
  private calculatePipelineSuccessRate(activities: ProjectActivity[]): number {
    const pipelineStarted = activities.filter(a => a.type === ActivityType.PIPELINE_STARTED).length;
    const pipelineSucceeded = activities.filter(a => a.type === ActivityType.PIPELINE_SUCCEEDED).length;

    if (pipelineStarted === 0) return 0;
    return (pipelineSucceeded / pipelineStarted) * 100;
  }

  /**
   * Get activity metrics for a project
   */
  getActivityMetrics(projectId: number, instanceId: string): ActivityMetrics | null {
    const activityKey = `${instanceId}-${projectId}`;
    return this.metrics.get(activityKey) || null;
  }

  /**
   * Get activity insights for a project
   */
  getActivityInsights(projectId: number, instanceId: string): ActivityInsights | null {
    const activityKey = `${instanceId}-${projectId}`;
    return this.insights.get(activityKey) || null;
  }

  /**
   * Export activity data
   */
  exportActivityData(
    projectId: number,
    instanceId: string,
    format: 'json' | 'csv' = 'json',
    filter?: ActivityFilter
  ): string {
    if (!this.config.enableActivityExport) {
      throw new Error('Activity export is disabled');
    }

    const activities = this.getActivities(projectId, instanceId, filter);

    if (format === 'csv') {
      return this.convertActivitiesToCSV(activities);
    }

    return JSON.stringify(activities, null, 2);
  }

  /**
   * Convert activities to CSV format
   */
  private convertActivitiesToCSV(activities: ProjectActivity[]): string {
    const headers = [
      'ID',
      'Type',
      'Title',
      'Description',
      'Author ID',
      'Author Username',
      'Author Name',
      'Timestamp',
      'URL',
      'Labels',
      'Assignees',
      'Reviewers',
    ];

    const rows = activities.map(activity => [
      activity.id,
      activity.type,
      `"${activity.title.replace(/"/g, '""')}"`,
      `"${(activity.description || '').replace(/"/g, '""')}"`,
      activity.author.id,
      activity.author.username,
      `"${activity.author.name}"`,
      activity.timestamp.toISOString(),
      activity.url || '',
      (activity.labels || []).join(';'),
      (activity.assignees || []).join(';'),
      (activity.reviewers || []).join(';'),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Start activity cleanup timer
   */
  private startActivityCleanup(): void {
    // Clean up old activities based on retention policy
    setInterval(() => {
      if (this.isDestroyed) return;

      const cutoffDate = new Date(Date.now() - this.config.activityRetentionDays * 24 * 60 * 60 * 1000);

      for (const [activityKey, activities] of this.activities) {
        const filteredActivities = activities.filter(activity => activity.timestamp >= cutoffDate);

        if (filteredActivities.length !== activities.length) {
          this.activities.set(activityKey, filteredActivities);
          logger.debug(`Cleaned up activities for ${activityKey}`, 'GitlabActivityService', {
            removed: activities.length - filteredActivities.length,
            remaining: filteredActivities.length,
          });
        }
      }
    }, this.config.activityRetentionDays * 60 * 60 * 1000); // Run daily
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ActivityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Activity service configuration updated', 'GitlabActivityService', newConfig);
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.activities.clear();
    this.metrics.clear();
    this.insights.clear();

    logger.info('GitLab activity service destroyed', 'GitlabActivityService');
  }
}

// Singleton instance
export const gitlabActivityService = new GitlabActivityService();
