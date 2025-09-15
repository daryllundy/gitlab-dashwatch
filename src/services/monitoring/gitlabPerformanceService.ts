// GitLab Performance Monitoring Service
// Provides comprehensive performance monitoring, optimization, and analytics

import { logger } from '@/lib/logger';

// Performance monitoring configuration
interface PerformanceConfig {
  enablePerformanceMonitoring: boolean;
  enableRealTimeMetrics: boolean;
  enablePerformanceAlerts: boolean;
  enableOptimizationRecommendations: boolean;
  enablePerformanceBenchmarking: boolean;
  enablePerformanceProfiling: boolean;
  enablePerformanceTrendAnalysis: boolean;
  enablePerformanceExport: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    responseTimeMs: number;
    errorRatePercent: number;
    throughputPerMinute: number;
    memoryUsageMB: number;
    cpuUsagePercent: number;
  };
  benchmarking: {
    baselineComparison: boolean;
    historicalComparison: boolean;
    peerComparison: boolean;
  };
  profiling: {
    enableDetailedTracing: boolean;
    enableMemoryProfiling: boolean;
    enableCPUProfiling: boolean;
    enableNetworkProfiling: boolean;
  };
}

interface PerformanceMetrics {
  instanceId: string;
  timestamp: Date;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  errorRate: {
    totalErrors: number;
    errorRatePercent: number;
    errorsByType: Record<string, number>;
  };
  resourceUsage: {
    memoryUsageMB: number;
    memoryUsagePercent: number;
    cpuUsagePercent: number;
    networkUsageMB: number;
    diskUsageMB: number;
  };
  cachePerformance: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    size: number;
  };
  rateLimitStatus: {
    currentUsage: number;
    limit: number;
    remaining: number;
    resetTime: Date;
  };
  apiMetrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    requestsByEndpoint: Record<string, number>;
    requestsByMethod: Record<string, number>;
  };
}

interface PerformanceAlert {
  id: string;
  instanceId: string;
  type: 'response_time' | 'error_rate' | 'throughput' | 'resource_usage' | 'cache_performance' | 'rate_limit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
  resolutionTime?: Date;
  recommendations: string[];
}

interface PerformanceBenchmark {
  instanceId: string;
  benchmarkType: 'baseline' | 'historical' | 'peer';
  timestamp: Date;
  metrics: PerformanceMetrics;
  comparison: {
    baseline?: PerformanceMetrics;
    historical?: PerformanceMetrics;
    peer?: PerformanceMetrics;
  };
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

interface PerformanceProfile {
  instanceId: string;
  profileType: 'memory' | 'cpu' | 'network' | 'trace';
  timestamp: Date;
  duration: number;
  data: {
    memory?: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
      allocations: number;
      deallocations: number;
    };
    cpu?: {
      usage: number;
      system: number;
      user: number;
      idle: number;
    };
    network?: {
      bytesSent: number;
      bytesReceived: number;
      connections: number;
      requests: number;
      responses: number;
    };
    trace?: Array<{
      operation: string;
      startTime: number;
      endTime: number;
      duration: number;
      metadata: Record<string, any>;
    }>;
  };
  bottlenecks: Array<{
    type: string;
    location: string;
    impact: number;
    recommendation: string;
  }>;
}

interface PerformanceTrend {
  instanceId: string;
  metric: string;
  period: '1h' | '24h' | '7d' | '30d';
  timestamp: Date;
  data: Array<{
    timestamp: Date;
    value: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  analysis: {
    trend: 'improving' | 'degrading' | 'stable';
    changePercent: number;
    forecast: number;
    confidence: number;
  };
}

interface PerformanceOptimization {
  id: string;
  instanceId: string;
  type: 'caching' | 'rate_limiting' | 'connection_pooling' | 'query_optimization' | 'resource_management';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  completedAt?: Date;
  metrics: {
    before: PerformanceMetrics;
    after?: PerformanceMetrics;
    improvement: number;
  };
  implementation: {
    steps: string[];
    codeChanges: string[];
    configurationChanges: Record<string, any>;
  };
}

class GitlabPerformanceService {
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetrics[]> = new Map(); // instanceId -> metrics history
  private alerts: Map<string, PerformanceAlert[]> = new Map(); // instanceId -> alerts
  private benchmarks: Map<string, PerformanceBenchmark[]> = new Map(); // instanceId -> benchmarks
  private profiles: Map<string, PerformanceProfile[]> = new Map(); // instanceId -> profiles
  private trends: Map<string, PerformanceTrend[]> = new Map(); // instanceId -> trends
  private optimizations: Map<string, PerformanceOptimization[]> = new Map(); // instanceId -> optimizations
  private isDestroyed = false;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enablePerformanceMonitoring: true,
      enableRealTimeMetrics: true,
      enablePerformanceAlerts: true,
      enableOptimizationRecommendations: true,
      enablePerformanceBenchmarking: true,
      enablePerformanceProfiling: true,
      enablePerformanceTrendAnalysis: true,
      enablePerformanceExport: true,
      metricsRetentionDays: 30,
      alertThresholds: {
        responseTimeMs: 5000,
        errorRatePercent: 5,
        throughputPerMinute: 1000,
        memoryUsageMB: 512,
        cpuUsagePercent: 80,
      },
      benchmarking: {
        baselineComparison: true,
        historicalComparison: true,
        peerComparison: false,
      },
      profiling: {
        enableDetailedTracing: true,
        enableMemoryProfiling: true,
        enableCPUProfiling: true,
        enableNetworkProfiling: true,
      },
      ...config,
    };

    this.startMetricsCollection();
    this.startAlertMonitoring();
  }

  /**
   * Record performance metrics for an instance
   */
  async recordMetrics(instanceId: string, metrics: Partial<PerformanceMetrics>): Promise<void> {
    if (!this.config.enablePerformanceMonitoring) return;

    const instanceMetrics = this.metrics.get(instanceId) || [];
    const newMetrics: PerformanceMetrics = {
      instanceId,
      timestamp: new Date(),
      responseTime: { average: 0, p50: 0, p95: 0, p99: 0, min: 0, max: 0 },
      throughput: { requestsPerSecond: 0, requestsPerMinute: 0, requestsPerHour: 0 },
      errorRate: { totalErrors: 0, errorRatePercent: 0, errorsByType: {} },
      resourceUsage: { memoryUsageMB: 0, memoryUsagePercent: 0, cpuUsagePercent: 0, networkUsageMB: 0, diskUsageMB: 0 },
      cachePerformance: { hitRate: 0, missRate: 0, evictionRate: 0, size: 0 },
      rateLimitStatus: { currentUsage: 0, limit: 0, remaining: 0, resetTime: new Date() },
      apiMetrics: { totalRequests: 0, successfulRequests: 0, failedRequests: 0, requestsByEndpoint: {}, requestsByMethod: {} },
      ...metrics,
    };

    instanceMetrics.unshift(newMetrics);

    // Limit metrics history
    if (instanceMetrics.length > 10000) {
      instanceMetrics.splice(10000);
    }

    this.metrics.set(instanceId, instanceMetrics);

    // Check for alerts
    if (this.config.enablePerformanceAlerts) {
      await this.checkAlerts(instanceId, newMetrics);
    }

    // Update trends
    if (this.config.enablePerformanceTrendAnalysis) {
      await this.updateTrends(instanceId, newMetrics);
    }

    logger.debug(`Performance metrics recorded for instance ${instanceId}`, 'GitlabPerformanceService', {
      responseTime: newMetrics.responseTime.average,
      throughput: newMetrics.throughput.requestsPerMinute,
      errorRate: newMetrics.errorRate.errorRatePercent,
    });
  }

  /**
   * Get current performance metrics for an instance
   */
  getCurrentMetrics(instanceId: string): PerformanceMetrics | null {
    const instanceMetrics = this.metrics.get(instanceId);
    return instanceMetrics?.[0] || null;
  }

  /**
   * Get performance metrics history for an instance
   */
  getMetricsHistory(
    instanceId: string,
    period: { from: Date; to: Date },
    options: {
      limit?: number;
      metrics?: string[];
    } = {}
  ): PerformanceMetrics[] {
    const instanceMetrics = this.metrics.get(instanceId) || [];

    let filteredMetrics = instanceMetrics.filter(metric =>
      metric.timestamp >= period.from && metric.timestamp <= period.to
    );

    // Apply metric filtering
    if (options.metrics) {
      filteredMetrics = filteredMetrics.map(metric => {
        const filtered: any = { instanceId: metric.instanceId, timestamp: metric.timestamp };
        options.metrics!.forEach(metricName => {
          if (metric[metricName as keyof PerformanceMetrics]) {
            filtered[metricName] = metric[metricName as keyof PerformanceMetrics];
          }
        });
        return filtered as PerformanceMetrics;
      });
    }

    // Apply limit
    if (options.limit) {
      filteredMetrics = filteredMetrics.slice(0, options.limit);
    }

    return filteredMetrics;
  }

  /**
   * Check for performance alerts
   */
  private async checkAlerts(instanceId: string, metrics: PerformanceMetrics): Promise<void> {
    const alerts: PerformanceAlert[] = [];

    // Response time alert
    if (metrics.responseTime.average > this.config.alertThresholds.responseTimeMs) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instanceId,
        type: 'response_time',
        severity: metrics.responseTime.average > this.config.alertThresholds.responseTimeMs * 2 ? 'critical' : 'high',
        title: 'High Response Time',
        description: `Average response time (${metrics.responseTime.average}ms) exceeds threshold`,
        threshold: this.config.alertThresholds.responseTimeMs,
        currentValue: metrics.responseTime.average,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
        recommendations: [
          'Check API rate limits',
          'Optimize database queries',
          'Implement caching',
          'Scale infrastructure',
        ],
      });
    }

    // Error rate alert
    if (metrics.errorRate.errorRatePercent > this.config.alertThresholds.errorRatePercent) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instanceId,
        type: 'error_rate',
        severity: metrics.errorRate.errorRatePercent > this.config.alertThresholds.errorRatePercent * 2 ? 'critical' : 'high',
        title: 'High Error Rate',
        description: `Error rate (${metrics.errorRate.errorRatePercent}%) exceeds threshold`,
        threshold: this.config.alertThresholds.errorRatePercent,
        currentValue: metrics.errorRate.errorRatePercent,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
        recommendations: [
          'Check error logs',
          'Review API endpoints',
          'Implement retry logic',
          'Update error handling',
        ],
      });
    }

    // Resource usage alerts
    if (metrics.resourceUsage.memoryUsageMB > this.config.alertThresholds.memoryUsageMB) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instanceId,
        type: 'resource_usage',
        severity: 'medium',
        title: 'High Memory Usage',
        description: `Memory usage (${metrics.resourceUsage.memoryUsageMB}MB) exceeds threshold`,
        threshold: this.config.alertThresholds.memoryUsageMB,
        currentValue: metrics.resourceUsage.memoryUsageMB,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
        recommendations: [
          'Optimize memory usage',
          'Implement garbage collection',
          'Scale memory resources',
          'Review memory leaks',
        ],
      });
    }

    if (metrics.resourceUsage.cpuUsagePercent > this.config.alertThresholds.cpuUsagePercent) {
      alerts.push({
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instanceId,
        type: 'resource_usage',
        severity: 'high',
        title: 'High CPU Usage',
        description: `CPU usage (${metrics.resourceUsage.cpuUsagePercent}%) exceeds threshold`,
        threshold: this.config.alertThresholds.cpuUsagePercent,
        currentValue: metrics.resourceUsage.cpuUsagePercent,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
        recommendations: [
          'Optimize CPU-intensive operations',
          'Implement load balancing',
          'Scale CPU resources',
          'Profile performance bottlenecks',
        ],
      });
    }

    // Store alerts
    if (alerts.length > 0) {
      const instanceAlerts = this.alerts.get(instanceId) || [];
      instanceAlerts.unshift(...alerts);
      this.alerts.set(instanceId, instanceAlerts);

      // Log alerts
      alerts.forEach(alert => {
        logger.warn(`Performance alert: ${alert.title}`, 'GitlabPerformanceService', {
          instanceId,
          type: alert.type,
          severity: alert.severity,
          currentValue: alert.currentValue,
          threshold: alert.threshold,
        });
      });
    }
  }

  /**
   * Get performance alerts for an instance
   */
  getAlerts(
    instanceId: string,
    filter?: {
      type?: PerformanceAlert['type'];
      severity?: PerformanceAlert['severity'];
      acknowledged?: boolean;
      resolved?: boolean;
      dateRange?: { from: Date; to: Date };
    },
    options: {
      limit?: number;
    } = {}
  ): PerformanceAlert[] {
    let instanceAlerts = this.alerts.get(instanceId) || [];

    // Apply filters
    if (filter) {
      instanceAlerts = instanceAlerts.filter(alert => {
        if (filter.type && alert.type !== filter.type) return false;
        if (filter.severity && alert.severity !== filter.severity) return false;
        if (filter.acknowledged !== undefined && alert.acknowledged !== filter.acknowledged) return false;
        if (filter.resolved !== undefined && alert.resolved !== filter.resolved) return false;
        if (filter.dateRange) {
          if (alert.timestamp < filter.dateRange.from || alert.timestamp > filter.dateRange.to) return false;
        }
        return true;
      });
    }

    // Apply limit
    if (options.limit) {
      instanceAlerts = instanceAlerts.slice(0, options.limit);
    }

    return instanceAlerts;
  }

  /**
   * Acknowledge performance alert
   */
  async acknowledgeAlert(instanceId: string, alertId: string): Promise<void> {
    const instanceAlerts = this.alerts.get(instanceId) || [];
    const alert = instanceAlerts.find(a => a.id === alertId);

    if (alert) {
      alert.acknowledged = true;
      logger.info(`Performance alert acknowledged: ${alert.title}`, 'GitlabPerformanceService', {
        instanceId,
        alertId,
      });
    }
  }

  /**
   * Resolve performance alert
   */
  async resolveAlert(instanceId: string, alertId: string): Promise<void> {
    const instanceAlerts = this.alerts.get(instanceId) || [];
    const alert = instanceAlerts.find(a => a.id === alertId);

    if (alert) {
      alert.resolved = true;
      alert.resolutionTime = new Date();
      logger.info(`Performance alert resolved: ${alert.title}`, 'GitlabPerformanceService', {
        instanceId,
        alertId,
        resolutionTime: alert.resolutionTime,
      });
    }
  }

  /**
   * Run performance benchmark
   */
  async runBenchmark(instanceId: string, type: 'baseline' | 'historical' | 'peer'): Promise<PerformanceBenchmark> {
    if (!this.config.enablePerformanceBenchmarking) {
      throw new Error('Performance benchmarking is disabled');
    }

    const currentMetrics = this.getCurrentMetrics(instanceId);
    if (!currentMetrics) {
      throw new Error('No current metrics available for benchmarking');
    }

    const benchmark: PerformanceBenchmark = {
      instanceId,
      benchmarkType: type,
      timestamp: new Date(),
      metrics: currentMetrics,
      comparison: {},
      score: 0,
      grade: 'C',
      recommendations: [],
    };

    // Get comparison data
    if (type === 'baseline' && this.config.benchmarking.baselineComparison) {
      benchmark.comparison.baseline = await this.getBaselineMetrics(instanceId);
    }

    if (type === 'historical' && this.config.benchmarking.historicalComparison) {
      benchmark.comparison.historical = await this.getHistoricalMetrics(instanceId);
    }

    if (type === 'peer' && this.config.benchmarking.peerComparison) {
      benchmark.comparison.peer = await this.getPeerMetrics(instanceId);
    }

    // Calculate score and grade
    const score = this.calculateBenchmarkScore(currentMetrics, benchmark.comparison);
    benchmark.score = score;
    benchmark.grade = this.calculateGrade(score);

    // Generate recommendations
    benchmark.recommendations = this.generateBenchmarkRecommendations(benchmark);

    // Store benchmark
    const instanceBenchmarks = this.benchmarks.get(instanceId) || [];
    instanceBenchmarks.unshift(benchmark);
    this.benchmarks.set(instanceId, instanceBenchmarks);

    logger.info(`Performance benchmark completed for instance ${instanceId}`, 'GitlabPerformanceService', {
      type,
      score,
      grade: benchmark.grade,
    });

    return benchmark;
  }

  /**
   * Calculate benchmark score
   */
  private calculateBenchmarkScore(
    current: PerformanceMetrics,
    comparison: PerformanceBenchmark['comparison']
  ): number {
    let score = 50; // Base score

    // Response time scoring (lower is better)
    if (current.responseTime.average < 1000) score += 20;
    else if (current.responseTime.average < 2000) score += 10;
    else if (current.responseTime.average > 5000) score -= 20;

    // Error rate scoring (lower is better)
    if (current.errorRate.errorRatePercent < 1) score += 15;
    else if (current.errorRate.errorRatePercent < 5) score += 5;
    else if (current.errorRate.errorRatePercent > 10) score -= 15;

    // Throughput scoring (higher is better)
    if (current.throughput.requestsPerMinute > 1000) score += 15;
    else if (current.throughput.requestsPerMinute > 500) score += 10;
    else if (current.throughput.requestsPerMinute < 100) score -= 10;

    // Resource usage scoring
    if (current.resourceUsage.cpuUsagePercent < 50) score += 10;
    if (current.resourceUsage.memoryUsagePercent < 70) score += 10;
    if (current.cachePerformance.hitRate > 0.8) score += 10;

    // Comparison adjustments
    if (comparison.baseline) {
      const baseline = comparison.baseline;
      if (current.responseTime.average < baseline.responseTime.average) score += 5;
      if (current.errorRate.errorRatePercent < baseline.errorRate.errorRatePercent) score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate grade from score
   */
  private calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate benchmark recommendations
   */
  private generateBenchmarkRecommendations(benchmark: PerformanceBenchmark): string[] {
    const recommendations: string[] = [];

    const metrics = benchmark.metrics;

    if (metrics.responseTime.average > 3000) {
      recommendations.push('Optimize API response times through caching and query optimization');
    }

    if (metrics.errorRate.errorRatePercent > 5) {
      recommendations.push('Implement better error handling and retry mechanisms');
    }

    if (metrics.throughput.requestsPerMinute < 500) {
      recommendations.push('Consider scaling infrastructure or optimizing concurrent operations');
    }

    if (metrics.cachePerformance.hitRate < 0.7) {
      recommendations.push('Improve cache hit rate through better cache strategies');
    }

    if (metrics.resourceUsage.cpuUsagePercent > 70) {
      recommendations.push('Optimize CPU usage through profiling and code optimization');
    }

    return recommendations;
  }

  /**
   * Get baseline metrics (simulated)
   */
  private async getBaselineMetrics(instanceId: string): Promise<PerformanceMetrics> {
    // This would typically load from a baseline database
    return {
      instanceId,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      responseTime: { average: 2500, p50: 2000, p95: 4000, p99: 6000, min: 500, max: 8000 },
      throughput: { requestsPerSecond: 50, requestsPerMinute: 3000, requestsPerHour: 180000 },
      errorRate: { totalErrors: 150, errorRatePercent: 5, errorsByType: { timeout: 100, server_error: 50 } },
      resourceUsage: { memoryUsageMB: 256, memoryUsagePercent: 50, cpuUsagePercent: 45, networkUsageMB: 100, diskUsageMB: 1024 },
      cachePerformance: { hitRate: 0.75, missRate: 0.25, evictionRate: 0.1, size: 100 },
      rateLimitStatus: { currentUsage: 500, limit: 1000, remaining: 500, resetTime: new Date(Date.now() + 60 * 1000) },
      apiMetrics: { totalRequests: 3000, successfulRequests: 2850, failedRequests: 150, requestsByEndpoint: {}, requestsByMethod: {} },
    };
  }

  /**
   * Get historical metrics
   */
  private async getHistoricalMetrics(instanceId: string): Promise<PerformanceMetrics> {
    const instanceMetrics = this.metrics.get(instanceId) || [];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const historicalMetrics = instanceMetrics.filter(m => m.timestamp >= weekAgo);
    if (historicalMetrics.length === 0) return this.getBaselineMetrics(instanceId);

    // Calculate average of historical metrics
    const avgMetrics = historicalMetrics.reduce((acc, metric) => ({
      responseTime: {
        average: acc.responseTime.average + metric.responseTime.average,
        p50: acc.responseTime.p50 + metric.responseTime.p50,
        p95: acc.responseTime.p95 + metric.responseTime.p95,
        p99: acc.responseTime.p99 + metric.responseTime.p99,
        min: Math.min(acc.responseTime.min, metric.responseTime.min),
        max: Math.max(acc.responseTime.max, metric.responseTime.max),
      },
      throughput: {
        requestsPerSecond: acc.throughput.requestsPerSecond + metric.throughput.requestsPerSecond,
        requestsPerMinute: acc.throughput.requestsPerMinute + metric.throughput.requestsPerMinute,
        requestsPerHour: acc.throughput.requestsPerHour + metric.throughput.requestsPerHour,
      },
      errorRate: {
        totalErrors: acc.errorRate.totalErrors + metric.errorRate.totalErrors,
        errorRatePercent: acc.errorRate.errorRatePercent + metric.errorRate.errorRatePercent,
        errorsByType: {}, // Would need to merge these properly
      },
      resourceUsage: {
        memoryUsageMB: acc.resourceUsage.memoryUsageMB + metric.resourceUsage.memoryUsageMB,
        memoryUsagePercent: acc.resourceUsage.memoryUsagePercent + metric.resourceUsage.memoryUsagePercent,
        cpuUsagePercent: acc.resourceUsage.cpuUsagePercent + metric.resourceUsage.cpuUsagePercent,
        networkUsageMB: acc.resourceUsage.networkUsageMB + metric.resourceUsage.networkUsageMB,
        diskUsageMB: acc.resourceUsage.diskUsageMB + metric.resourceUsage.diskUsageMB,
      },
      cachePerformance: {
        hitRate: acc.cachePerformance.hitRate + metric.cachePerformance.hitRate,
        missRate: acc.cachePerformance.missRate + metric.cachePerformance.missRate,
        evictionRate: acc.cachePerformance.evictionRate + metric.cachePerformance.evictionRate,
        size: acc.cachePerformance.size + metric.cachePerformance.size,
      },
      rateLimitStatus: metric.rateLimitStatus, // Use latest
      apiMetrics: {
        totalRequests: acc.apiMetrics.totalRequests + metric.apiMetrics.totalRequests,
        successfulRequests: acc.apiMetrics.successfulRequests + metric.apiMetrics.successfulRequests,
        failedRequests: acc.apiMetrics.failedRequests + metric.apiMetrics.failedRequests,
        requestsByEndpoint: {}, // Would need to merge these properly
        requestsByMethod: {}, // Would need to merge these properly
      },
    }));

    const count = historicalMetrics.length;
    const result: PerformanceMetrics = {
      instanceId,
      timestamp: new Date(),
      responseTime: {
        average: avgMetrics.responseTime.average / count,
        p50: avgMetrics.responseTime.p50 / count,
        p95: avgMetrics.responseTime.p95 / count,
        p99: avgMetrics.responseTime.p99 / count,
        min: avgMetrics.responseTime.min,
        max: avgMetrics.responseTime.max,
      },
      throughput: {
        requestsPerSecond: avgMetrics.throughput.requestsPerSecond / count,
        requestsPerMinute: avgMetrics.throughput.requestsPerMinute / count,
        requestsPerHour: avgMetrics.throughput.requestsPerHour / count,
      },
      errorRate: {
        totalErrors: avgMetrics.errorRate.totalErrors,
        errorRatePercent: avgMetrics.errorRate.errorRatePercent / count,
        errorsByType: avgMetrics.errorRate.errorsByType,
      },
      resourceUsage: {
        memoryUsageMB: avgMetrics.resourceUsage.memoryUsageMB / count,
        memoryUsagePercent: avgMetrics.resourceUsage.memoryUsagePercent / count,
        cpuUsagePercent: avgMetrics.resourceUsage.cpuUsagePercent / count,
        networkUsageMB: avgMetrics.resourceUsage.networkUsageMB / count,
        diskUsageMB: avgMetrics.resourceUsage.diskUsageMB / count,
      },
      cachePerformance: {
        hitRate: avgMetrics.cachePerformance.hitRate / count,
        missRate: avgMetrics.cachePerformance.missRate / count,
        evictionRate: avgMetrics.cachePerformance.evictionRate / count,
        size: avgMetrics.cachePerformance.size / count,
      },
      rateLimitStatus: avgMetrics.rateLimitStatus,
      apiMetrics: {
        totalRequests: avgMetrics.apiMetrics.totalRequests,
        successfulRequests: avgMetrics.apiMetrics.successfulRequests,
        failedRequests: avgMetrics.apiMetrics.failedRequests,
        requestsByEndpoint: avgMetrics.apiMetrics.requestsByEndpoint,
        requestsByMethod: avgMetrics.apiMetrics.requestsByMethod,
      },
    };

    return result;
  }

  /**
   * Get peer metrics (simulated)
   */
  private async getPeerMetrics(instanceId: string): Promise<PerformanceMetrics> {
    // This would typically load from peer comparison data
    return this.getBaselineMetrics(instanceId);
  }

  /**
   * Update performance trends
   */
  private async updateTrends(instanceId: string, metrics: PerformanceMetrics): Promise<void> {
    const metricsToTrack = [
      'responseTime.average',
      'errorRate.errorRatePercent',
      'throughput.requestsPerMinute',
      'resourceUsage.cpuUsagePercent',
      'resourceUsage.memoryUsagePercent',
      'cachePerformance.hitRate',
    ];

    for (const metricPath of metricsToTrack) {
      await this.updateMetricTrend(instanceId, metricPath, metrics);
    }
  }

  /**
   * Update trend for a specific metric
   */
  private async updateMetricTrend(instanceId: string, metricPath: string, metrics: PerformanceMetrics): Promise<void> {
    const instanceTrends = this.trends.get(instanceId) || [];
    const metricName = metricPath.split('.').pop()!;

    let trend = instanceTrends.find(t => t.metric === metricName);
    if (!trend) {
      trend = {
        instanceId,
        metric: metricName,
        period: '24h',
        timestamp: new Date(),
        data: [],
        analysis: {
          trend: 'stable',
          changePercent: 0,
          forecast: 0,
          confidence: 0,
        },
      };
      instanceTrends.push(trend);
    }

    // Get metric value
    const value = this.getMetricValue(metrics, metricPath);
    if (value === undefined) return;

    // Add data point
    trend.data.push({
      timestamp: new Date(),
      value,
      trend: 'stable', // Would calculate based on previous values
    });

    // Limit data points
    if (trend.data.length > 100) {
      trend.data = trend.data.slice(-100);
    }

    // Update analysis
    this.updateTrendAnalysis(trend);

    this.trends.set(instanceId, instanceTrends);
  }

  /**
   * Get metric value from nested object
   */
  private getMetricValue(obj: any, path: string): number | undefined {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Update trend analysis
   */
  private updateTrendAnalysis(trend: PerformanceTrend): void {
    if (trend.data.length < 2) return;

    const values = trend.data.map(d => d.value);
    const recent = values.slice(-10);
    const previous = values.slice(-20, -10);

    if (recent.length === 0 || previous.length === 0) return;

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const previousAvg = previous.reduce((sum, val) => sum + val, 0) / previous.length;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (Math.abs(changePercent) < 5) {
      trend.analysis.trend = 'stable';
    } else if (changePercent > 0) {
      trend.analysis.trend = 'degrading';
    } else {
      trend.analysis.trend = 'improving';
    }

    trend.analysis.changePercent = changePercent;
    trend.analysis.forecast = recentAvg + (recentAvg - previousAvg);
    trend.analysis.confidence = Math.max(0, 100 - Math.abs(changePercent));
  }

  /**
   * Get performance trends for an instance
   */
  getTrends(instanceId: string, metric?: string): PerformanceTrend[] {
    const instanceTrends = this.trends.get(instanceId) || [];
    return metric ? instanceTrends.filter(t => t.metric === metric) : instanceTrends;
  }

  /**
   * Create performance optimization
   */
  async createOptimization(
    instanceId: string,
    optimization: Omit<PerformanceOptimization, 'id' | 'instanceId' | 'createdAt' | 'status'>
  ): Promise<PerformanceOptimization> {
    if (!this.config.enableOptimizationRecommendations) {
      throw new Error('Optimization recommendations are disabled');
    }

    const newOptimization: PerformanceOptimization = {
      id: `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      instanceId,
      ...optimization,
      status: 'pending',
      createdAt: new Date(),
    };

    const instanceOptimizations = this.optimizations.get(instanceId) || [];
    instanceOptimizations.unshift(newOptimization);
    this.optimizations.set(instanceId, instanceOptimizations);

    logger.info(`Performance optimization created: ${optimization.title}`, 'GitlabPerformanceService', {
      instanceId,
      type: optimization.type,
      impact: optimization.impact,
      effort: optimization.effort,
    });

    return newOptimization;
  }

  /**
   * Get performance optimizations for an instance
   */
  getOptimizations(
    instanceId: string,
    filter?: {
      type?: PerformanceOptimization['type'];
      status?: PerformanceOptimization['status'];
      impact?: PerformanceOptimization['impact'];
    }
  ): PerformanceOptimization[] {
    let instanceOptimizations = this.optimizations.get(instanceId) || [];

    if (filter) {
      instanceOptimizations = instanceOptimizations.filter(opt => {
        if (filter.type && opt.type !== filter.type) return false;
        if (filter.status && opt.status !== filter.status) return false;
        if (filter.impact && opt.impact !== filter.impact) return false;
        return true;
      });
    }

    return instanceOptimizations;
  }

  /**
   * Update optimization status
   */
  async updateOptimizationStatus(
    instanceId: string,
    optimizationId: string,
    status: PerformanceOptimization['status'],
    metrics?: PerformanceMetrics
  ): Promise<void> {
    const instanceOptimizations = this.optimizations.get(instanceId) || [];
    const optimization = instanceOptimizations.find(opt => opt.id === optimizationId);

    if (!optimization) {
      throw new Error(`Optimization not found: ${optimizationId}`);
    }

    optimization.status = status;

    if (status === 'completed') {
      optimization.completedAt = new Date();
      if (metrics) {
        optimization.metrics.after = metrics;
        optimization.metrics.improvement = this.calculateImprovement(
          optimization.metrics.before,
          metrics
        );
      }
    }

    logger.info(`Optimization status updated: ${optimization.title}`, 'GitlabPerformanceService', {
      instanceId,
      optimizationId,
      status,
      improvement: optimization.metrics.improvement,
    });
  }

  /**
   * Calculate improvement percentage
   */
  private calculateImprovement(before: PerformanceMetrics, after: PerformanceMetrics): number {
    const responseTimeImprovement = ((before.responseTime.average - after.responseTime.average) / before.responseTime.average) * 100;
    const errorRateImprovement = ((before.errorRate.errorRatePercent - after.errorRate.errorRatePercent) / before.errorRate.errorRatePercent) * 100;
    const throughputImprovement = ((after.throughput.requestsPerMinute - before.throughput.requestsPerMinute) / before.throughput.requestsPerMinute) * 100;

    return (responseTimeImprovement + errorRateImprovement + throughputImprovement) / 3;
  }

  /**
   * Export performance data
   */
  exportPerformanceData(
    instanceId: string,
    format: 'json' | 'csv' = 'json',
    dataTypes: ('metrics' | 'alerts' | 'benchmarks' | 'trends' | 'optimizations')[] = ['metrics']
  ): string {
    if (!this.config.enablePerformanceExport) {
      throw new Error('Performance export is disabled');
    }

    const exportData: any = {
      instanceId,
      exportedAt: new Date(),
      data: {},
    };

    if (dataTypes.includes('metrics')) {
      exportData.data.metrics = this.getMetricsHistory(instanceId, {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      });
    }

    if (dataTypes.includes('alerts')) {
      exportData.data.alerts = this.getAlerts(instanceId);
    }

    if (dataTypes.includes('benchmarks')) {
      exportData.data.benchmarks = this.benchmarks.get(instanceId) || [];
    }

    if (dataTypes.includes('trends')) {
      exportData.data.trends = this.getTrends(instanceId);
    }

    if (dataTypes.includes('optimizations')) {
      exportData.data.optimizations = this.getOptimizations(instanceId);
    }

    if (format === 'csv') {
      return this.convertPerformanceDataToCSV(exportData);
    }

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Convert performance data to CSV
   */
  private convertPerformanceDataToCSV(data: any): string {
    // This would implement CSV conversion for different data types
    return JSON.stringify(data, null, 2); // Placeholder
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    if (!this.config.enableRealTimeMetrics) return;

    // Collect metrics every minute
    setInterval(async () => {
      if (this.isDestroyed) return;

      // This would collect real metrics from the system
      // For now, we'll simulate metric collection
      logger.debug('Collecting performance metrics', 'GitlabPerformanceService');
    }, 60 * 1000);
  }

  /**
   * Start alert monitoring
   */
  private startAlertMonitoring(): void {
    if (!this.config.enablePerformanceAlerts) return;

    // Check for alerts every 5 minutes
    setInterval(async () => {
      if (this.isDestroyed) return;

      // This would check for alerts based on current metrics
      logger.debug('Monitoring performance alerts', 'GitlabPerformanceService');
    }, 5 * 60 * 1000);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Performance service configuration updated', 'GitlabPerformanceService', newConfig);
  }

  /**
   * Destroy service and clean up resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.metrics.clear();
    this.alerts.clear();
    this.benchmarks.clear();
    this.profiles.clear();
    this.trends.clear();
    this.optimizations.clear();

    logger.info('GitLab performance service destroyed', 'GitlabPerformanceService');
  }
}

// Singleton instance
export const gitlabPerformanceService = new GitlabPerformanceService();
