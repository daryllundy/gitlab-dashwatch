# GitLab DashWatch API Reference

This document provides comprehensive API documentation for all services and components in GitLab DashWatch.

## Table of Contents

- [Core Services](#core-services)
  - [GitlabApiService](#gitlabapiservice)
  - [GitlabActivityService](#gitlabactivityservice)
  - [GitlabPerformanceService](#gitlabperformanceservice)
  - [GitlabWebhookService](#gitlabwebhookservice)
- [Supporting Services](#supporting-services)
  - [GitlabCacheService](#gitlabcacheservice)
  - [GitlabRateLimitService](#gitlabratelimitservice)
  - [GitlabErrorService](#gitlaberrorservice)
- [Configuration](#configuration)
- [Types](#types)
- [Examples](#examples)

## Core Services

### GitlabApiService

The main service for interacting with GitLab APIs.

#### Constructor

```typescript
constructor(config?: Partial<GitlabApiConfig>)
```

#### Methods

##### `getProjects(instanceId: string, options?: ProjectOptions): Promise<GitlabProject[]>`

Retrieves projects from a GitLab instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `options`: Optional filtering and pagination options

**Returns:** Promise resolving to array of GitlabProject objects

**Example:**
```typescript
const projects = await gitlabApiService.getProjects('gitlab-com', {
  search: 'react',
  visibility: 'public',
  sort: 'updated_desc',
  perPage: 20
});
```

##### `getProject(instanceId: string, projectId: number): Promise<GitlabProject>`

Retrieves detailed information about a specific project.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `projectId`: The ID of the project

**Returns:** Promise resolving to GitlabProject object

##### `searchProjects(instanceId: string, query: string, filters?: SearchFilters): Promise<SearchResult[]>`

Searches for projects matching the query.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `query`: Search query string
- `filters`: Optional search filters

**Returns:** Promise resolving to array of SearchResult objects

##### `getProjectActivities(instanceId: string, projectId: number, options?: ActivityOptions): Promise<ProjectActivity[]>`

Retrieves activity data for a project.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `projectId`: The ID of the project
- `options`: Optional activity filtering options

**Returns:** Promise resolving to array of ProjectActivity objects

### GitlabActivityService

Service for monitoring and analyzing project activities.

#### Constructor

```typescript
constructor(config?: Partial<ActivityConfig>)
```

#### Methods

##### `recordActivity(projectId: number, instanceId: string, activity: ProjectActivity): Promise<void>`

Records a new project activity.

**Parameters:**
- `projectId`: The ID of the project
- `instanceId`: The ID of the GitLab instance
- `activity`: The activity data to record

##### `getActivities(projectId: number, instanceId: string, filter?: ActivityFilter, options?: ActivityOptions): ProjectActivity[]`

Retrieves activities for a project with optional filtering.

**Parameters:**
- `projectId`: The ID of the project
- `instanceId`: The ID of the GitLab instance
- `filter`: Optional activity filters
- `options`: Optional pagination and sorting options

**Returns:** Array of ProjectActivity objects

##### `getActivitySummary(projectId: number, instanceId: string, period: DateRange): ActivitySummary | null`

Gets activity summary for a project over a time period.

**Parameters:**
- `projectId`: The ID of the project
- `instanceId`: The ID of the GitLab instance
- `period`: Date range for the summary

**Returns:** ActivitySummary object or null if no data available

##### `getActivityInsights(projectId: number, instanceId: string): ActivityInsights | null`

Gets activity insights and recommendations for a project.

**Parameters:**
- `projectId`: The ID of the project
- `instanceId`: The ID of the GitLab instance

**Returns:** ActivityInsights object or null if no insights available

### GitlabPerformanceService

Service for monitoring and optimizing performance.

#### Constructor

```typescript
constructor(config?: Partial<PerformanceConfig>)
```

#### Methods

##### `recordMetrics(instanceId: string, metrics: Partial<PerformanceMetrics>): Promise<void>`

Records performance metrics for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `metrics`: The metrics data to record

##### `getCurrentMetrics(instanceId: string): PerformanceMetrics | null`

Gets current performance metrics for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance

**Returns:** PerformanceMetrics object or null if no data available

##### `getMetricsHistory(instanceId: string, period: DateRange, options?: MetricsOptions): PerformanceMetrics[]`

Gets historical performance metrics for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `period`: Date range for the metrics
- `options`: Optional filtering and pagination options

**Returns:** Array of PerformanceMetrics objects

##### `runBenchmark(instanceId: string, type: BenchmarkType): Promise<PerformanceBenchmark>`

Runs a performance benchmark for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `type`: Type of benchmark ('baseline', 'historical', 'peer')

**Returns:** Promise resolving to PerformanceBenchmark object

##### `getAlerts(instanceId: string, filter?: AlertFilter, options?: AlertOptions): PerformanceAlert[]`

Gets performance alerts for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `filter`: Optional alert filters
- `options`: Optional pagination options

**Returns:** Array of PerformanceAlert objects

### GitlabWebhookService

Service for handling GitLab webhooks.

#### Constructor

```typescript
constructor(config?: Partial<WebhookConfig>)
```

#### Methods

##### `registerEndpoint(instanceId: string, url: string, secret: string, events?: WebhookEventType[]): Promise<WebhookEndpoint>`

Registers a webhook endpoint for a GitLab instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `url`: The webhook endpoint URL
- `secret`: The webhook secret for signature verification
- `events`: Optional array of event types to listen for

**Returns:** Promise resolving to WebhookEndpoint object

##### `processWebhookEvent(instanceId: string, headers: Record<string, string>, payload: any): Promise<WebhookResult>`

Processes an incoming webhook event.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `headers`: HTTP headers from the webhook request
- `payload`: The webhook payload data

**Returns:** Promise resolving to WebhookResult object

##### `getEvents(instanceId: string, filter?: WebhookFilter, options?: WebhookOptions): WebhookEvent[]`

Gets webhook events for an instance.

**Parameters:**
- `instanceId`: The ID of the GitLab instance
- `filter`: Optional event filters
- `options`: Optional pagination options

**Returns:** Array of WebhookEvent objects

##### `testEndpoint(instanceId: string): Promise<WebhookTestResult>`

Tests a webhook endpoint.

**Parameters:**
- `instanceId`: The ID of the GitLab instance

**Returns:** Promise resolving to WebhookTestResult object

## Supporting Services

### GitlabCacheService

Service for caching GitLab API responses.

#### Methods

##### `get<T>(key: string): Promise<T | null>`

Retrieves cached data by key.

##### `set<T>(key: string, data: T, ttl?: number): Promise<void>`

Stores data in cache with optional TTL.

##### `delete(key: string): Promise<void>`

Removes data from cache.

##### `clear(): Promise<void>`

Clears all cached data.

##### `getStats(): CacheStats`

Gets cache statistics.

### GitlabRateLimitService

Service for managing API rate limits.

#### Methods

##### `checkLimit(instanceId: string): Promise<RateLimitStatus>`

Checks current rate limit status.

##### `waitForLimit(instanceId: string): Promise<void>`

Waits for rate limit to reset if necessary.

##### `updateLimit(instanceId: string, headers: Record<string, string>): void`

Updates rate limit information from API response headers.

### GitlabErrorService

Service for error handling and recovery.

#### Methods

##### `handleError(error: Error, context: ErrorContext): Promise<ErrorResult>`

Handles and processes errors with recovery strategies.

##### `getErrorHistory(instanceId?: string): ErrorRecord[]`

Gets error history with optional instance filtering.

##### `getErrorAnalytics(period: DateRange): ErrorAnalytics`

Gets error analytics for a time period.

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_GITLAB_DEFAULT_URL` | Default GitLab instance URL | `https://gitlab.com` | No |
| `VITE_GITLAB_API_VERSION` | GitLab API version | `v4` | No |
| `VITE_GITLAB_REQUEST_TIMEOUT` | Request timeout in milliseconds | `30000` | No |
| `VITE_ENCRYPTION_KEY` | 32-character encryption key | - | Yes |
| `VITE_CACHE_TTL_MINUTES` | Cache TTL in minutes | `60` | No |
| `VITE_RATE_LIMIT_REQUESTS_PER_HOUR` | Rate limit per hour | `1000` | No |
| `VITE_MAX_CONCURRENT_REQUESTS` | Max concurrent requests | `10` | No |
| `VITE_ENABLE_REAL_TIME_UPDATES` | Enable real-time updates | `true` | No |
| `VITE_POLLING_INTERVAL_SECONDS` | Polling interval | `300` | No |
| `VITE_ENABLE_WEBHOOKS` | Enable webhook support | `true` | No |
| `VITE_WEBHOOK_SECRET` | Webhook secret | - | Conditional |

### Service Configuration

#### GitlabApiConfig

```typescript
interface GitlabApiConfig {
  baseUrl: string;
  apiVersion: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  enableCache: boolean;
  enableRateLimit: boolean;
}
```

#### ActivityConfig

```typescript
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
```

#### PerformanceConfig

```typescript
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
}
```

## Types

### Core Types

```typescript
interface GitlabInstance {
  id: string;
  name: string;
  url: string;
  token: string;
  isActive?: boolean;
  apiVersion?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'error';
  selectedProjects?: number[];
  fetchOptions?: FetchOptions;
}

interface GitlabProject {
  id: number;
  name: string;
  description?: string;
  status?: string;
  openIssues?: number;
  branches?: number;
  pullRequests?: number;
  lastCommit?: string;
  instanceUrl: string;
  instanceId: string;
  visibility: 'public' | 'private' | 'internal';
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  webUrl: string;
  sshUrl: string;
  httpUrl: string;
  starCount?: number;
  forkCount?: number;
  lastActivityAt: string;
  openMergeRequestsCount?: number;
  permissions?: ProjectPermissions;
  pipelineStatus?: string;
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
```

### Performance Types

```typescript
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
```

## Examples

### Basic Usage

```typescript
import {
  gitlabApiService,
  gitlabActivityService,
  gitlabPerformanceService
} from '@/services';

// Initialize services
const apiService = gitlabApiService;
const activityService = gitlabActivityService;
const performanceService = gitlabPerformanceService;

// Get projects
const projects = await apiService.getProjects('gitlab-com', {
  search: 'dashboard',
  visibility: 'public'
});

// Record activity
await activityService.recordActivity(123, 'gitlab-com', {
  type: ActivityType.COMMIT,
  title: 'Fixed dashboard bug',
  description: 'Resolved issue with chart rendering',
  author: {
    id: 456,
    username: 'john.doe',
    name: 'John Doe'
  }
});

// Monitor performance
await performanceService.recordMetrics('gitlab-com', {
  responseTime: { average: 250 },
  throughput: { requestsPerMinute: 1200 },
  errorRate: { errorRatePercent: 0.5 }
});
```

### Advanced Configuration

```typescript
import { GitlabApiService } from '@/services/monitoring/gitlabApiService';

// Custom configuration
const customApiService = new GitlabApiService({
  baseUrl: 'https://gitlab.example.com',
  timeout: 45000,
  retries: 5,
  enableCache: true,
  enableRateLimit: true
});

// Use custom service
const projects = await customApiService.getProjects('custom-instance');
```

### Error Handling

```typescript
import { gitlabErrorService } from '@/services/monitoring/gitlabErrorService';

try {
  const projects = await gitlabApiService.getProjects('gitlab-com');
} catch (error) {
  const errorResult = await gitlabErrorService.handleError(error, {
    instanceId: 'gitlab-com',
    operation: 'getProjects',
    userId: 'user123'
  });

  if (errorResult.shouldRetry) {
    // Implement retry logic
    setTimeout(() => {
      // Retry the operation
    }, errorResult.retryDelay);
  }

  // Show user-friendly message
  console.error(errorResult.userMessage);
}
```

### Webhook Integration

```typescript
import { gitlabWebhookService } from '@/services/monitoring/gitlabWebhookService';

// Register webhook endpoint
const endpoint = await gitlabWebhookService.registerEndpoint(
  'gitlab-com',
  'https://myapp.com/webhooks/gitlab',
  'my-webhook-secret',
  ['push', 'merge_request', 'issue']
);

// Handle webhook (in your webhook endpoint)
app.post('/webhooks/gitlab/:instanceId', async (req, res) => {
  const result = await gitlabWebhookService.processWebhookEvent(
    req.params.instanceId,
    req.headers,
    req.body
  );

  if (result.success) {
    res.status(200).json({ status: 'ok', eventId: result.eventId });
  } else {
    res.status(400).json({ error: result.error });
  }
});
```

### Performance Monitoring

```typescript
import { gitlabPerformanceService } from '@/services/monitoring/gitlabPerformanceService';

// Set up performance monitoring
await gitlabPerformanceService.recordMetrics('gitlab-com', {
  responseTime: { average: 245, p95: 500 },
  throughput: { requestsPerMinute: 1500 },
  errorRate: { errorRatePercent: 0.3 },
  resourceUsage: { cpuUsagePercent: 35, memoryUsageMB: 128 }
});

// Run performance benchmark
const benchmark = await gitlabPerformanceService.runBenchmark('gitlab-com', 'baseline');
console.log(`Performance Score: ${benchmark.score}/100 (${benchmark.grade})`);

// Get performance alerts
const alerts = gitlabPerformanceService.getAlerts('gitlab-com', {
  severity: 'high',
  acknowledged: false
});

// Acknowledge alert
if (alerts.length > 0) {
  await gitlabPerformanceService.acknowledgeAlert('gitlab-com', alerts[0].id);
}
```

This API reference provides comprehensive documentation for all services and types in GitLab DashWatch. For more detailed examples and advanced usage patterns, refer to the main README and individual service documentation.
