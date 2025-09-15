# Configuration Guide

This guide provides comprehensive information about configuring GitLab DashWatch for different environments and use cases.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Service Configuration](#service-configuration)
- [GitLab Integration](#gitlab-integration)
- [Security Configuration](#security-configuration)
- [Performance Tuning](#performance-tuning)
- [Monitoring Setup](#monitoring-setup)
- [Advanced Configuration](#advanced-configuration)
- [Environment-Specific Setup](#environment-specific-setup)

## Environment Variables

### Application Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_APP_TITLE` | Application title | `GitLab DashWatch` | No |
| `VITE_APP_VERSION` | Application version | `1.0.0` | No |
| `VITE_APP_ENV` | Environment (development/production) | `development` | No |
| `VITE_DEBUG_MODE` | Enable debug logging | `false` | No |
| `VITE_LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` | No |

### GitLab Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_GITLAB_DEFAULT_URL` | Default GitLab instance URL | `https://gitlab.com` | No |
| `VITE_GITLAB_API_VERSION` | GitLab API version | `v4` | No |
| `VITE_GITLAB_REQUEST_TIMEOUT` | Request timeout (ms) | `30000` | No |
| `VITE_GITLAB_MAX_RETRIES` | Maximum API retries | `3` | No |
| `VITE_GITLAB_RETRY_DELAY` | Retry delay (ms) | `1000` | No |

### Security Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENCRYPTION_KEY` | 32-character encryption key | - | Yes |
| `VITE_TOKEN_ROTATION_DAYS` | Token rotation interval | `90` | No |
| `VITE_ENABLE_SIGNATURE_VERIFICATION` | Verify webhook signatures | `true` | No |
| `VITE_WEBHOOK_SECRET` | Webhook secret | - | Conditional |
| `VITE_SESSION_TIMEOUT` | Session timeout (minutes) | `480` | No |

### Performance Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_CACHE_TTL_MINUTES` | Cache TTL in minutes | `60` | No |
| `VITE_CACHE_MAX_SIZE` | Maximum cache entries | `1000` | No |
| `VITE_RATE_LIMIT_REQUESTS_PER_HOUR` | Rate limit per hour | `1000` | No |
| `VITE_MAX_CONCURRENT_REQUESTS` | Max concurrent requests | `10` | No |
| `VITE_ENABLE_COMPRESSION` | Enable response compression | `true` | No |

### Monitoring Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_ENABLE_REAL_TIME_UPDATES` | Enable real-time updates | `true` | No |
| `VITE_POLLING_INTERVAL_SECONDS` | Polling interval | `300` | No |
| `VITE_ENABLE_WEBHOOKS` | Enable webhook support | `true` | No |
| `VITE_ACTIVITY_RETENTION_DAYS` | Activity data retention | `90` | No |
| `VITE_METRICS_RETENTION_DAYS` | Metrics retention | `30` | No |

### UI Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_DEFAULT_THEME` | Default theme (light/dark/system) | `system` | No |
| `VITE_ENABLE_ANIMATIONS` | Enable UI animations | `true` | No |
| `VITE_ITEMS_PER_PAGE` | Items per page in lists | `25` | No |
| `VITE_MAX_UPLOAD_SIZE` | Maximum upload size (MB) | `10` | No |
| `VITE_ENABLE_NOTIFICATIONS` | Enable browser notifications | `true` | No |

## Service Configuration

### GitlabApiService Configuration

```typescript
import { GitlabApiService } from '@/services/monitoring/gitlabApiService';

const apiService = new GitlabApiService({
  baseUrl: 'https://gitlab.example.com',
  apiVersion: 'v4',
  timeout: 45000,
  retries: 5,
  retryDelay: 2000,
  enableCache: true,
  enableRateLimit: true,
  enableCompression: true,
  enableRequestLogging: false,
  enableNetworkLogging: false,
  userAgent: 'GitLab-DashWatch/1.0.0'
});
```

### GitlabActivityService Configuration

```typescript
import { GitlabActivityService } from '@/services/monitoring/gitlabActivityService';

const activityService = new GitlabActivityService({
  enableActivityTracking: true,
  enableRealTimeUpdates: true,
  activityRetentionDays: 90,
  enableAnalytics: true,
  enableNotifications: true,
  enableTrendAnalysis: true,
  maxActivitiesPerProject: 10000,
  activityBatchSize: 100,
  enableActivityExport: true,
  enableActivityInsights: true
});
```

### GitlabPerformanceService Configuration

```typescript
import { GitlabPerformanceService } from '@/services/monitoring/gitlabPerformanceService';

const performanceService = new GitlabPerformanceService({
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
  }
});
```

### GitlabWebhookService Configuration

```typescript
import { GitlabWebhookService } from '@/services/monitoring/gitlabWebhookService';

const webhookService = new GitlabWebhookService({
  enableWebhooks: true,
  enableSignatureVerification: true,
  enableEventFiltering: true,
  enableRetryLogic: true,
  maxRetries: 3,
  retryDelay: 60,
  enableRateLimiting: true,
  rateLimitPerMinute: 1000,
  enableEventLogging: true,
  enableEventAnalytics: true,
  webhookTimeout: 30,
  enableWebhookHealthChecks: true,
  healthCheckInterval: 5
});
```

## GitLab Integration

### Personal Access Token Setup

1. **Create Token in GitLab**
   - Go to User Settings → Access Tokens
   - Create new token with name "GitLab DashWatch"
   - Set expiration date (recommended: 1 year)
   - Select scopes: `api`, `read_user`, `read_repository`

2. **Configure Token in Application**
   ```typescript
   // Add instance with token
   await gitlabSettingsService.addInstance({
     id: 'gitlab-com',
     name: 'GitLab.com',
     url: 'https://gitlab.com',
     token: 'your-personal-access-token'
   });
   ```

### Webhook Configuration

1. **Set Up Webhook Endpoint**
   ```typescript
   // Register webhook endpoint
   await gitlabWebhookService.registerEndpoint(
     'gitlab-com',
     'https://your-domain.com/api/webhooks/gitlab',
     'your-webhook-secret',
     ['push', 'merge_request', 'issue', 'pipeline']
   );
   ```

2. **Configure Webhook in GitLab**
   - Go to Project Settings → Webhooks
   - URL: `https://your-domain.com/api/webhooks/gitlab/gitlab-com`
   - Secret: `your-webhook-secret`
   - Events: Select desired events
   - Enable SSL verification

### Multi-Instance Setup

```typescript
// Configure multiple GitLab instances
const instances = [
  {
    id: 'gitlab-com',
    name: 'GitLab.com',
    url: 'https://gitlab.com',
    token: 'token1'
  },
  {
    id: 'self-hosted',
    name: 'Self-Hosted GitLab',
    url: 'https://gitlab.example.com',
    token: 'token2'
  }
];

for (const instance of instances) {
  await gitlabSettingsService.addInstance(instance);
  await gitlabWebhookService.registerEndpoint(
    instance.id,
    `https://your-domain.com/api/webhooks/gitlab/${instance.id}`,
    `webhook-secret-${instance.id}`
  );
}
```

## Security Configuration

### Encryption Setup

1. **Generate Encryption Key**
   ```bash
   # Generate 32-character encryption key
   openssl rand -hex 32
   ```

2. **Configure Encryption**
   ```env
   VITE_ENCRYPTION_KEY=your-generated-32-character-key
   ```

3. **Token Rotation**
   ```typescript
   // Configure automatic token rotation
   gitlabTokenService.updateConfig({
     rotationIntervalDays: 90,
     enableAutoRotation: true,
     rotationNotificationDays: 7
   });
   ```

### SSL/TLS Configuration

```typescript
// Configure SSL for API calls
gitlabApiService.updateConfig({
  enableSSL: true,
  rejectUnauthorized: true,
  caBundlePath: '/path/to/ca-bundle.crt'
});
```

### CORS Configuration

```typescript
// Configure CORS for webhook endpoints
const corsOptions = {
  origin: ['https://your-domain.com', 'https://app.your-domain.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Gitlab-Event'],
  credentials: true
};
```

## Performance Tuning

### Cache Optimization

```typescript
// Optimize cache settings
gitlabCacheService.updateConfig({
  defaultTtl: 1800000, // 30 minutes
  maxSize: 500,
  enableCompression: true,
  evictionPolicy: 'lru'
});
```

### Rate Limiting Configuration

```typescript
// Configure rate limiting
gitlabRateLimitService.updateConfig({
  requestsPerHour: 500,
  burstLimit: 50,
  enableQueueing: true,
  queueTimeout: 30000
});
```

### Database Optimization

```typescript
// Configure data retention
gitlabActivityService.updateConfig({
  activityRetentionDays: 60,
  maxActivitiesPerProject: 5000,
  enableDataCompression: true
});
```

### Memory Management

```typescript
// Configure memory limits
gitlabPerformanceService.updateConfig({
  memoryLimitMB: 256,
  enableGarbageCollection: true,
  gcIntervalMinutes: 30
});
```

## Monitoring Setup

### Health Checks

```typescript
// Configure health monitoring
gitlabPerformanceService.updateConfig({
  enableHealthChecks: true,
  healthCheckInterval: 5,
  healthCheckTimeout: 30,
  enableDetailedHealthMetrics: true
});
```

### Alert Configuration

```typescript
// Configure performance alerts
gitlabPerformanceService.updateConfig({
  alertThresholds: {
    responseTimeMs: 3000,
    errorRatePercent: 3,
    throughputPerMinute: 800,
    memoryUsageMB: 400,
    cpuUsagePercent: 70,
  },
  enableEmailAlerts: true,
  alertCooldownMinutes: 15
});
```

### Logging Configuration

```typescript
// Configure logging
logger.updateConfig({
  level: 'info',
  enableFileLogging: true,
  logDirectory: '/var/log/gitlab-dashwatch',
  maxFileSize: '10m',
  maxFiles: 5,
  enableConsoleLogging: true
});
```

## Advanced Configuration

### Custom Middleware

```typescript
// Add custom request middleware
gitlabApiService.addMiddleware({
  name: 'custom-auth',
  type: 'request',
  handler: (request) => {
    request.headers.set('X-Custom-Auth', 'custom-token');
    return request;
  }
});
```

### Custom Error Handlers

```typescript
// Add custom error handling
gitlabErrorService.addErrorHandler({
  name: 'custom-handler',
  priority: 10,
  canHandle: (error) => error.code === 'CUSTOM_ERROR',
  handle: async (error, context) => {
    // Custom error handling logic
    await sendCustomNotification(error, context);
    return { shouldRetry: false, userMessage: 'Custom error occurred' };
  }
});
```

### Plugin System

```typescript
// Register custom plugins
gitlabApiService.registerPlugin({
  name: 'custom-plugin',
  version: '1.0.0',
  hooks: {
    beforeRequest: (request) => {
      // Modify request before sending
      return request;
    },
    afterResponse: (response) => {
      // Process response after receiving
      return response;
    },
    onError: (error) => {
      // Handle errors
      return error;
    }
  }
});
```

## Environment-Specific Setup

### Development Environment

```env
# .env.development
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
VITE_GITLAB_REQUEST_TIMEOUT=60000
VITE_CACHE_TTL_MINUTES=5
VITE_ENABLE_REAL_TIME_UPDATES=false
VITE_POLLING_INTERVAL_SECONDS=60
```

### Staging Environment

```env
# .env.staging
VITE_APP_ENV=staging
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=warn
VITE_GITLAB_REQUEST_TIMEOUT=45000
VITE_CACHE_TTL_MINUTES=30
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_POLLING_INTERVAL_SECONDS=300
```

### Production Environment

```env
# .env.production
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
VITE_GITLAB_REQUEST_TIMEOUT=30000
VITE_CACHE_TTL_MINUTES=60
VITE_ENABLE_REAL_TIME_UPDATES=true
VITE_POLLING_INTERVAL_SECONDS=300
VITE_ENABLE_WEBHOOKS=true
VITE_ENABLE_SIGNATURE_VERIFICATION=true
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

# Set environment variables
ENV NODE_ENV=production
ENV VITE_APP_ENV=production

# Copy application
COPY . /app
WORKDIR /app

# Install dependencies
RUN npm ci --only=production

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
```

### Docker Compose Configuration

```yaml
# docker-compose.yml
version: '3.8'

services:
  gitlab-dashwatch:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_APP_ENV=production
      - VITE_GITLAB_DEFAULT_URL=https://gitlab.com
      - VITE_ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - gitlab-dashwatch
    restart: unless-stopped
```

### Kubernetes Configuration

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitlab-dashwatch
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gitlab-dashwatch
  template:
    metadata:
      labels:
        app: gitlab-dashwatch
    spec:
      containers:
      - name: gitlab-dashwatch
        image: your-registry/gitlab-dashwatch:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_APP_ENV
          value: "production"
        - name: VITE_GITLAB_DEFAULT_URL
          value: "https://gitlab.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Load Balancer Configuration

```nginx
# nginx.conf
upstream gitlab_dashwatch {
    server gitlab-dashwatch-1:3000;
    server gitlab-dashwatch-2:3000;
    server gitlab-dashwatch-3:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://gitlab_dashwatch;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for real-time updates
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/webhooks {
        proxy_pass http://gitlab_dashwatch;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
    }
}
```

This configuration guide provides comprehensive setup instructions for different environments and use cases. For additional configuration options or specific deployment scenarios, refer to the main README or create an issue on GitHub.
