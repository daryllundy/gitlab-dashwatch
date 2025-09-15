# Troubleshooting Guide

This guide provides solutions to common issues and problems you might encounter when using GitLab DashWatch.

## Table of Contents

- [Connection Issues](#connection-issues)
- [Authentication Problems](#authentication-problems)
- [Performance Issues](#performance-issues)
- [Webhook Problems](#webhook-problems)
- [Data Synchronization Issues](#data-synchronization-issues)
- [UI/UX Problems](#uiux-problems)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Debugging Tools](#debugging-tools)
- [Getting Help](#getting-help)

## Connection Issues

### Unable to Connect to GitLab Instance

**Symptoms:**
- "Failed to fetch" errors
- Connection timeout errors
- Network error messages

**Solutions:**

1. **Check GitLab Instance URL**
   ```bash
   # Test connectivity to GitLab instance
   curl -I https://your-gitlab-instance.com/api/v4/projects
   ```

2. **Verify Network Connectivity**
   - Check firewall settings
   - Ensure DNS resolution works
   - Test VPN/proxy configuration
   - Verify SSL certificate validity

3. **Check GitLab Instance Status**
   - Visit GitLab instance status page
   - Check for maintenance windows
   - Verify API availability

4. **Update Configuration**
   ```env
   VITE_GITLAB_REQUEST_TIMEOUT=60000
   VITE_GITLAB_API_VERSION=v4
   ```

### SSL/TLS Certificate Issues

**Symptoms:**
- "CERT_HAS_EXPIRED" errors
- "SSL certificate problem" messages
- Connection refused errors

**Solutions:**

1. **Update SSL Certificates**
   ```bash
   # Update system certificates
   sudo apt-get update && sudo apt-get install ca-certificates
   ```

2. **Disable SSL Verification (Development Only)**
   ```env
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

3. **Add Custom Certificate Authority**
   ```bash
   # Add CA certificate to system trust store
   sudo cp custom-ca.crt /usr/local/share/ca-certificates/
   sudo update-ca-certificates
   ```

## Authentication Problems

### Invalid Token Errors

**Symptoms:**
- 401 Unauthorized responses
- "Authentication failed" messages
- Token-related error messages

**Solutions:**

1. **Verify Personal Access Token**
   ```bash
   # Test token with curl
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-gitlab-instance.com/api/v4/user
   ```

2. **Check Token Permissions**
   - Ensure token has `api` scope
   - Verify token hasn't expired
   - Check token creation date

3. **Regenerate Token**
   - Go to GitLab → User Settings → Access Tokens
   - Create new token with required scopes
   - Update application configuration

4. **Token Storage Issues**
   ```typescript
   // Check token encryption
   import { gitlabTokenService } from '@/services/auth/gitlabTokenService';
   const isValid = await gitlabTokenService.validateToken('instance-id');
   ```

### Permission Denied Errors

**Symptoms:**
- 403 Forbidden responses
- "Insufficient permissions" messages
- Access denied to specific resources

**Solutions:**

1. **Check Token Scopes**
   Required scopes for full functionality:
   - `api` - Full API access
   - `read_user` - Read user information
   - `read_repository` - Read repository information

2. **Verify Project Access**
   - Ensure user has access to target projects
   - Check project visibility settings
   - Verify group membership permissions

3. **Update Token Permissions**
   ```bash
   # List current token permissions
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://your-gitlab-instance.com/api/v4/personal_access_tokens
   ```

## Performance Issues

### High Memory Usage

**Symptoms:**
- Application becomes slow or unresponsive
- Browser crashes or freezes
- Memory usage exceeds available RAM

**Solutions:**

1. **Optimize Cache Settings**
   ```env
   VITE_CACHE_TTL_MINUTES=30
   VITE_MAX_CONCURRENT_REQUESTS=5
   ```

2. **Reduce Data Retention**
   ```typescript
   // Update activity service configuration
   gitlabActivityService.updateConfig({
     activityRetentionDays: 30,
     maxActivitiesPerProject: 5000
   });
   ```

3. **Enable Garbage Collection**
   ```typescript
   // Force cache cleanup
   import { gitlabCacheService } from '@/services/storage/gitlabCacheService';
   await gitlabCacheService.clear();
   ```

4. **Monitor Memory Usage**
   ```typescript
   // Check current memory usage
   const metrics = await gitlabPerformanceService.getCurrentMetrics('instance-id');
   console.log('Memory Usage:', metrics.resourceUsage.memoryUsageMB, 'MB');
   ```

### Slow Response Times

**Symptoms:**
- API calls take longer than expected
- UI becomes unresponsive
- Loading indicators show for extended periods

**Solutions:**

1. **Enable Caching**
   ```typescript
   // Enable aggressive caching
   gitlabCacheService.updateConfig({
     defaultTtl: 1800000, // 30 minutes
     maxSize: 100
   });
   ```

2. **Optimize API Calls**
   ```typescript
   // Use batch requests
   const projects = await gitlabApiService.getProjects('instance-id', {
     perPage: 50,
     pagination: 'keyset'
   });
   ```

3. **Reduce Polling Frequency**
   ```env
   VITE_POLLING_INTERVAL_SECONDS=600
   ```

4. **Enable Compression**
   ```typescript
   // Enable response compression
   const response = await fetch('/api/projects', {
     headers: {
       'Accept-Encoding': 'gzip, deflate'
     }
   });
   ```

### Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests errors
- Requests being throttled
- Service becomes unavailable

**Solutions:**

1. **Adjust Rate Limits**
   ```env
   VITE_RATE_LIMIT_REQUESTS_PER_HOUR=500
   VITE_MAX_CONCURRENT_REQUESTS=3
   ```

2. **Implement Request Queuing**
   ```typescript
   // Use rate limit service
   import { gitlabRateLimitService } from '@/services/monitoring/gitlabRateLimitService';
   await gitlabRateLimitService.waitForLimit('instance-id');
   ```

3. **Enable Exponential Backoff**
   ```typescript
   // Configure retry logic
   gitlabApiService.updateConfig({
     retries: 5,
     retryDelay: 1000,
     enableExponentialBackoff: true
   });
   ```

## Webhook Problems

### Webhook Delivery Failures

**Symptoms:**
- Webhooks not triggering
- Events not being processed
- Delivery failure notifications

**Solutions:**

1. **Verify Webhook URL**
   ```bash
   # Test webhook endpoint
   curl -X POST https://your-domain.com/api/webhooks/gitlab \
        -H "Content-Type: application/json" \
        -H "X-Gitlab-Event: Push Hook" \
        -d '{"test": "data"}'
   ```

2. **Check Webhook Secret**
   ```typescript
   // Verify webhook configuration
   const endpoint = await gitlabWebhookService.getEndpoint('instance-id');
   console.log('Webhook URL:', endpoint.url);
   console.log('Secret configured:', !!endpoint.secret);
   ```

3. **Test Webhook Manually**
   ```typescript
   // Test webhook endpoint
   const testResult = await gitlabWebhookService.testEndpoint('instance-id');
   console.log('Test result:', testResult);
   ```

4. **Check GitLab Webhook Logs**
   - Go to Project Settings → Webhooks
   - Click "Edit" on your webhook
   - Check "Recent Deliveries" section

### Signature Verification Issues

**Symptoms:**
- Webhook signature verification fails
- Events rejected due to invalid signatures
- Security warnings in logs

**Solutions:**

1. **Verify Secret Configuration**
   ```typescript
   // Check webhook secret
   const endpoint = await gitlabWebhookService.getEndpoint('instance-id');
   const isValidLength = endpoint.secret.length >= 32;
   console.log('Secret length valid:', isValidLength);
   ```

2. **Update Webhook Secret**
   ```typescript
   // Update webhook configuration
   await gitlabWebhookService.updateEndpoint('instance-id', {
     secret: 'new-webhook-secret'
   });
   ```

3. **Check GitLab Configuration**
   - Ensure webhook secret matches in GitLab
   - Verify webhook uses correct secret field
   - Check for special characters in secret

## Data Synchronization Issues

### Outdated Project Data

**Symptoms:**
- Project information doesn't match GitLab
- Activity data is stale
- Real-time updates not working

**Solutions:**

1. **Force Data Refresh**
   ```typescript
   // Clear cache and refresh
   await gitlabCacheService.clear();
   await gitlabApiService.refreshProjects('instance-id');
   ```

2. **Check Polling Configuration**
   ```env
   VITE_ENABLE_REAL_TIME_UPDATES=true
   VITE_POLLING_INTERVAL_SECONDS=300
   ```

3. **Verify Webhook Setup**
   ```typescript
   // Check webhook health
   const health = await gitlabWebhookService.getHealth('instance-id');
   console.log('Webhook status:', health.status);
   ```

4. **Manual Synchronization**
   ```typescript
   // Trigger manual sync
   import { gitlabRealtimeService } from '@/services/monitoring/gitlabRealtimeService';
   await gitlabRealtimeService.forceSync('instance-id');
   ```

### Activity Data Inconsistencies

**Symptoms:**
- Activity counts don't match
- Missing activity records
- Duplicate activities

**Solutions:**

1. **Validate Activity Data**
   ```typescript
   // Check activity integrity
   const activities = gitlabActivityService.getActivities(projectId, 'instance-id');
   const uniqueActivities = new Set(activities.map(a => a.id));
   console.log('Duplicate activities:', activities.length - uniqueActivities.size);
   ```

2. **Rebuild Activity Index**
   ```typescript
   // Clear and rebuild activity data
   await gitlabActivityService.clearActivities(projectId, 'instance-id');
   await gitlabActivityService.rebuildActivities(projectId, 'instance-id');
   ```

3. **Check Activity Filters**
   ```typescript
   // Verify activity filtering
   const filteredActivities = gitlabActivityService.getActivities(projectId, 'instance-id', {
     dateRange: {
       from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
       to: new Date()
     }
   });
   ```

## UI/UX Problems

### Dashboard Loading Issues

**Symptoms:**
- Dashboard fails to load
- Components don't render properly
- JavaScript errors in console

**Solutions:**

1. **Check Browser Compatibility**
   - Ensure modern browser (Chrome 90+, Firefox 88+, Safari 14+)
   - Enable JavaScript
   - Clear browser cache

2. **Verify Build Integrity**
   ```bash
   # Rebuild application
   npm run build
   npm run preview
   ```

3. **Check Console Errors**
   ```javascript
   // Open browser developer tools
   // Check Console tab for errors
   // Check Network tab for failed requests
   ```

4. **Environment Configuration**
   ```bash
   # Verify environment variables
   echo $VITE_APP_ENV
   echo $VITE_GITLAB_DEFAULT_URL
   ```

### Theme and Styling Issues

**Symptoms:**
- Incorrect theme application
- Styling inconsistencies
- Layout problems

**Solutions:**

1. **Reset Theme Settings**
   ```typescript
   // Clear theme preferences
   localStorage.removeItem('theme');
   window.location.reload();
   ```

2. **Check CSS Loading**
   ```html
   <!-- Verify CSS links in index.html -->
   <link rel="stylesheet" href="/src/index.css">
   ```

3. **Browser Dev Tools**
   - Open Elements tab
   - Check computed styles
   - Verify CSS variables

## Build and Deployment Issues

### Build Failures

**Symptoms:**
- Build process fails
- TypeScript compilation errors
- Missing dependencies

**Solutions:**

1. **Clear Build Cache**
   ```bash
   # Clear node modules and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check TypeScript Errors**
   ```bash
   # Run type checking
   npm run type-check
   ```

3. **Verify Dependencies**
   ```bash
   # Check for missing dependencies
   npm ls --depth=0
   ```

4. **Update Build Tools**
   ```bash
   # Update to latest versions
   npm update
   npm audit fix
   ```

### Deployment Issues

**Symptoms:**
- Application fails to start
- Environment variables not loaded
- Static assets not loading

**Solutions:**

1. **Environment Variables**
   ```bash
   # Check environment file
   cat .env.production
   # Verify variables are prefixed with VITE_
   ```

2. **Build Configuration**
   ```typescript
   // Check vite.config.ts
   export default defineConfig({
     build: {
       outDir: 'dist',
       sourcemap: false
     }
   });
   ```

3. **Server Configuration**
   ```nginx
   # Nginx configuration example
   server {
     listen 80;
     server_name your-domain.com;
     root /path/to/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }

     location /api {
       proxy_pass http://localhost:3001;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
     }
   }
   ```

## Debugging Tools

### Enable Debug Mode

```env
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Console Logging

```typescript
// Enable detailed logging
import { logger } from '@/lib/logger';
logger.setLevel('debug');

// Log API requests
gitlabApiService.updateConfig({
  enableRequestLogging: true
});
```

### Performance Profiling

```typescript
// Start performance profiling
const profiler = await gitlabPerformanceService.startProfiling('instance-id');

// Run operations to profile
await gitlabApiService.getProjects('instance-id');

// Stop profiling and get results
const profile = await profiler.stop();
console.log('Performance profile:', profile);
```

### Network Debugging

```typescript
// Enable network request logging
import { gitlabApiService } from '@/services/monitoring/gitlabApiService';
gitlabApiService.updateConfig({
  enableNetworkLogging: true
});
```

### Cache Debugging

```typescript
// Check cache status
const cacheStats = await gitlabCacheService.getStats();
console.log('Cache stats:', cacheStats);

// Clear cache for debugging
await gitlabCacheService.clear();
```

## Getting Help

### Community Support

- **GitHub Issues**: [Report bugs and request features](https://github.com/yourusername/gitlab-dashwatch/issues)
- **GitHub Discussions**: [Ask questions and get community help](https://github.com/yourusername/gitlab-dashwatch/discussions)
- **Stack Overflow**: Tag questions with `gitlab-dashwatch`

### Professional Support

- **Enterprise Support**: Contact our enterprise support team
- **Consulting Services**: Hire our team for custom implementations
- **Training**: Schedule training sessions for your team

### Diagnostic Information

When reporting issues, please include:

```bash
# System information
node --version
npm --version
git --version

# Application logs
tail -n 100 logs/application.log

# Browser information
# Open browser console and run:
console.log(navigator.userAgent);

# Network information
curl -I https://your-gitlab-instance.com/api/v4/projects

# Configuration check
cat .env | grep -v SECRET
```

### Emergency Contacts

- **Security Issues**: security@yourcompany.com
- **Critical Bugs**: bugs@yourcompany.com
- **General Support**: support@yourcompany.com

---

This troubleshooting guide covers the most common issues. If you encounter a problem not listed here, please check the [GitHub Issues](https://github.com/yourusername/gitlab-dashwatch/issues) or create a new issue with detailed information about your problem.
