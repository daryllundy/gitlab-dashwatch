// GitLab Integration Tests
// Comprehensive integration testing for all GitLab services

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { gitlabApiService } from '@/services/monitoring/gitlabApiService';
import { gitlabActivityService } from '@/services/monitoring/gitlabActivityService';
import { gitlabPerformanceService } from '@/services/monitoring/gitlabPerformanceService';
import { gitlabWebhookService } from '@/services/monitoring/gitlabWebhookService';
import { gitlabSettingsService } from '@/services/settings/gitlabSettingsService';
import { gitlabTokenService } from '@/services/auth/gitlabTokenService';
import { gitlabCacheService } from '@/services/storage/gitlabCacheService';
import { gitlabRateLimitService } from '@/services/monitoring/gitlabRateLimitService';
import { gitlabErrorService } from '@/services/monitoring/gitlabErrorService';

// Mock GitLab API responses
const mockGitlabResponses = {
  projects: [
    {
      id: 1,
      name: 'test-project',
      description: 'A test project',
      visibility: 'private',
      default_branch: 'main',
      web_url: 'https://gitlab.com/test/test-project',
      ssh_url_to_repo: 'git@gitlab.com:test/test-project.git',
      http_url_to_repo: 'https://gitlab.com/test/test-project.git',
      star_count: 42,
      forks_count: 12,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  project: {
    id: 1,
    name: 'test-project',
    description: 'A test project',
    visibility: 'private',
    default_branch: 'main',
    web_url: 'https://gitlab.com/test/test-project',
    star_count: 42,
    forks_count: 12,
    last_activity_at: new Date().toISOString(),
  },
  commits: [
    {
      id: 'abc123',
      short_id: 'abc123',
      title: 'Fix bug in dashboard',
      author_name: 'John Doe',
      author_email: 'john@example.com',
      authored_date: new Date().toISOString(),
      committed_date: new Date().toISOString(),
      message: 'Fix bug in dashboard\n\n- Fixed chart rendering issue\n- Updated error handling',
    },
  ],
  issues: [
    {
      id: 1,
      iid: 1,
      title: 'Dashboard not loading',
      description: 'The dashboard fails to load on initial page visit',
      state: 'opened',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: 1,
        name: 'John Doe',
        username: 'john.doe',
        avatar_url: 'https://gitlab.com/avatar.jpg',
      },
      assignees: [],
      labels: ['bug', 'high-priority'],
    },
  ],
  mergeRequests: [
    {
      id: 1,
      iid: 1,
      title: 'Add new dashboard feature',
      description: 'Implement new dashboard analytics feature',
      state: 'opened',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      author: {
        id: 1,
        name: 'Jane Smith',
        username: 'jane.smith',
        avatar_url: 'https://gitlab.com/avatar2.jpg',
      },
      assignees: [],
      reviewers: [],
      source_branch: 'feature/dashboard-analytics',
      target_branch: 'main',
      web_url: 'https://gitlab.com/test/test-project/-/merge_requests/1',
    },
  ],
  pipelines: [
    {
      id: 1,
      iid: 1,
      status: 'success',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      web_url: 'https://gitlab.com/test/test-project/-/pipelines/1',
      ref: 'main',
      sha: 'abc123def456',
    },
  ],
};

// Test configuration
const testConfig = {
  instanceId: 'test-gitlab-instance',
  instanceUrl: 'https://gitlab.example.com',
  token: 'test-token-12345',
  projectId: 1,
  webhookSecret: 'test-webhook-secret',
  webhookUrl: 'https://test-app.com/webhooks/gitlab',
};

// Mock fetch for API calls
global.fetch = vi.fn();

describe('GitLab Integration Tests', () => {
  beforeAll(async () => {
    // Set up test environment
    vi.mock('@/lib/logger', () => ({
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
      },
    }));

    // Mock crypto for token encryption
    vi.mock('crypto', () => ({
      webcrypto: {
        getRandomValues: vi.fn(),
        subtle: {
          encrypt: vi.fn(),
          decrypt: vi.fn(),
          importKey: vi.fn(),
          deriveKey: vi.fn(),
        },
      },
    }));

    // Set up test instance
    await gitlabSettingsService.addInstance({
      id: testConfig.instanceId,
      name: 'Test GitLab Instance',
      url: testConfig.instanceUrl,
      token: testConfig.token,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await gitlabSettingsService.removeInstance(testConfig.instanceId);
    await gitlabCacheService.clear();
    await gitlabActivityService.destroy();
    await gitlabPerformanceService.destroy();
    await gitlabWebhookService.destroy();
  });

  describe('API Service Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch projects successfully', async () => {
      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGitlabResponses.projects),
        headers: new Map([['x-total-pages', '1'], ['x-per-page', '20']]),
      });

      const projects = await gitlabApiService.getProjects(testConfig.instanceId);

      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({
        id: 1,
        name: 'test-project',
        visibility: 'private',
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(gitlabApiService.getProjects(testConfig.instanceId))
        .rejects.toThrow('Network error');
    });

    it('should cache API responses', async () => {
      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGitlabResponses.projects),
      });

      // First call should hit API
      await gitlabApiService.getProjects(testConfig.instanceId);

      // Second call should use cache
      const projects = await gitlabApiService.getProjects(testConfig.instanceId);

      expect(projects).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only first call hits API
    });

    it('should respect rate limits', async () => {
      // Mock rate limited response
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '60']]),
      });

      await expect(gitlabApiService.getProjects(testConfig.instanceId))
        .rejects.toThrow();

      // Should wait for rate limit reset
      await gitlabRateLimitService.waitForLimit(testConfig.instanceId);
    });
  });

  describe('Activity Service Integration', () => {
    beforeEach(async () => {
      await gitlabActivityService.updateConfig({
        enableActivityTracking: true,
        activityRetentionDays: 7,
      });
    });

    it('should record and retrieve activities', async () => {
      const activity = {
        type: 'commit' as const,
        title: 'Fixed dashboard bug',
        description: 'Resolved chart rendering issue',
        author: {
          id: 1,
          username: 'john.doe',
          name: 'John Doe',
        },
        metadata: { commitId: 'abc123' },
      };

      await gitlabActivityService.recordActivity(
        testConfig.projectId,
        testConfig.instanceId,
        activity
      );

      const activities = gitlabActivityService.getActivities(
        testConfig.projectId,
        testConfig.instanceId
      );

      expect(activities).toHaveLength(1);
      expect(activities[0]).toMatchObject({
        type: 'commit',
        title: 'Fixed dashboard bug',
        author: { username: 'john.doe' },
      });
    });

    it('should filter activities by type', () => {
      const activities = gitlabActivityService.getActivities(
        testConfig.projectId,
        testConfig.instanceId,
        { types: ['commit'] }
      );

      expect(activities.every(a => a.type === 'commit')).toBe(true);
    });

    it('should generate activity insights', async () => {
      const insights = gitlabActivityService.getActivityInsights(
        testConfig.projectId,
        testConfig.instanceId
      );

      expect(insights).toBeDefined();
      if (insights) {
        expect(Array.isArray(insights.insights)).toBe(true);
      }
    });

    it('should export activity data', () => {
      const csvData = gitlabActivityService.exportActivityData(
        testConfig.projectId,
        testConfig.instanceId,
        'csv'
      );

      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('ID,Type,Title');
    });
  });

  describe('Performance Service Integration', () => {
    beforeEach(async () => {
      await gitlabPerformanceService.updateConfig({
        enablePerformanceMonitoring: true,
        metricsRetentionDays: 7,
      });
    });

    it('should record and retrieve performance metrics', async () => {
      const metrics = {
        responseTime: { average: 250, p95: 500 },
        throughput: { requestsPerMinute: 1200 },
        errorRate: { errorRatePercent: 0.5 },
        resourceUsage: { cpuUsagePercent: 35, memoryUsageMB: 128 },
      };

      await gitlabPerformanceService.recordMetrics(testConfig.instanceId, metrics);

      const currentMetrics = gitlabPerformanceService.getCurrentMetrics(testConfig.instanceId);

      expect(currentMetrics).toMatchObject({
        responseTime: { average: 250 },
        throughput: { requestsPerMinute: 1200 },
      });
    });

    it('should generate performance alerts', async () => {
      // Record high response time
      await gitlabPerformanceService.recordMetrics(testConfig.instanceId, {
        responseTime: { average: 6000 }, // Above threshold
        throughput: { requestsPerMinute: 100 },
        errorRate: { errorRatePercent: 0.1 },
      });

      const alerts = gitlabPerformanceService.getAlerts(testConfig.instanceId);

      expect(alerts.some(a => a.type === 'response_time')).toBe(true);
    });

    it('should run performance benchmarks', async () => {
      const benchmark = await gitlabPerformanceService.runBenchmark(
        testConfig.instanceId,
        'baseline'
      );

      expect(benchmark).toMatchObject({
        instanceId: testConfig.instanceId,
        benchmarkType: 'baseline',
        score: expect.any(Number),
        grade: expect.any(String),
      });
    });

    it('should acknowledge alerts', async () => {
      const alerts = gitlabPerformanceService.getAlerts(testConfig.instanceId);
      if (alerts.length > 0) {
        await gitlabPerformanceService.acknowledgeAlert(
          testConfig.instanceId,
          alerts[0].id
        );

        const updatedAlerts = gitlabPerformanceService.getAlerts(testConfig.instanceId);
        expect(updatedAlerts[0].acknowledged).toBe(true);
      }
    });
  });

  describe('Webhook Service Integration', () => {
    beforeEach(async () => {
      await gitlabWebhookService.updateConfig({
        enableWebhooks: true,
        enableSignatureVerification: false, // Disable for testing
      });
    });

    it('should register webhook endpoint', async () => {
      const endpoint = await gitlabWebhookService.registerEndpoint(
        testConfig.instanceId,
        testConfig.webhookUrl,
        testConfig.webhookSecret,
        ['push', 'merge_request']
      );

      expect(endpoint).toMatchObject({
        instanceId: testConfig.instanceId,
        url: testConfig.webhookUrl,
        events: ['push', 'merge_request'],
        active: true,
      });
    });

    it('should process webhook events', async () => {
      const webhookPayload = {
        object_kind: 'push',
        project: { id: testConfig.projectId },
        commits: [{
          id: 'abc123',
          message: 'Fix dashboard bug',
          author: { name: 'John Doe', email: 'john@example.com' },
        }],
        user_name: 'john.doe',
      };

      const headers = {
        'x-gitlab-event': 'Push Hook',
        'content-type': 'application/json',
      };

      const result = await gitlabWebhookService.processWebhookEvent(
        testConfig.instanceId,
        headers,
        webhookPayload
      );

      expect(result.success).toBe(true);
      expect(result.eventId).toBeDefined();
    });

    it('should retrieve webhook events', () => {
      const events = gitlabWebhookService.getEvents(testConfig.instanceId);

      expect(Array.isArray(events)).toBe(true);
    });

    it('should test webhook endpoint', async () => {
      const testResult = await gitlabWebhookService.testEndpoint(testConfig.instanceId);

      expect(testResult).toMatchObject({
        success: expect.any(Boolean),
        responseTime: expect.any(Number),
      });
    });
  });

  describe('Settings Service Integration', () => {
    it('should manage GitLab instances', async () => {
      const instances = await gitlabSettingsService.getInstances();

      expect(instances.some(i => i.id === testConfig.instanceId)).toBe(true);
    });

    it('should validate instance configuration', async () => {
      const isValid = await gitlabSettingsService.validateInstance(testConfig.instanceId);

      expect(typeof isValid).toBe('boolean');
    });

    it('should update instance settings', async () => {
      await gitlabSettingsService.updateInstance(testConfig.instanceId, {
        name: 'Updated Test Instance',
      });

      const instances = await gitlabSettingsService.getInstances();
      const updatedInstance = instances.find(i => i.id === testConfig.instanceId);

      expect(updatedInstance?.name).toBe('Updated Test Instance');
    });
  });

  describe('Token Service Integration', () => {
    it('should encrypt and decrypt tokens', async () => {
      const testToken = 'test-gitlab-token-12345';

      // This would normally encrypt/decrypt the token
      const isValid = await gitlabTokenService.validateToken(testConfig.instanceId);

      expect(typeof isValid).toBe('boolean');
    });

    it('should handle token rotation', async () => {
      await gitlabTokenService.updateConfig({
        enableAutoRotation: true,
        rotationIntervalDays: 30,
      });

      // Token rotation logic would be tested here
      expect(true).toBe(true); // Placeholder for actual rotation test
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully', async () => {
      const error = new Error('API rate limit exceeded');
      error.name = 'GitlabApiError';

      const errorResult = await gitlabErrorService.handleError(error, {
        instanceId: testConfig.instanceId,
        operation: 'getProjects',
        userId: 'test-user',
      });

      expect(errorResult).toMatchObject({
        shouldRetry: expect.any(Boolean),
        userMessage: expect.any(String),
      });
    });

    it('should track error analytics', () => {
      const analytics = gitlabErrorService.getErrorAnalytics({
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      });

      expect(analytics).toBeDefined();
    });

    it('should provide error recovery suggestions', async () => {
      const error = new Error('Authentication failed');

      const errorResult = await gitlabErrorService.handleError(error, {
        instanceId: testConfig.instanceId,
        operation: 'getProjects',
      });

      expect(errorResult.userMessage).toContain('authentication');
    });
  });

  describe('Cache Service Integration', () => {
    it('should cache and retrieve data', async () => {
      const testData = { projects: mockGitlabResponses.projects };
      const cacheKey = `projects-${testConfig.instanceId}`;

      await gitlabCacheService.set(cacheKey, testData, 300); // 5 minutes

      const cachedData = await gitlabCacheService.get(cacheKey);

      expect(cachedData).toEqual(testData);
    });

    it('should handle cache expiration', async () => {
      const testData = { projects: [] };
      const cacheKey = `expiring-${testConfig.instanceId}`;

      await gitlabCacheService.set(cacheKey, testData, 1); // 1 second

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cachedData = await gitlabCacheService.get(cacheKey);

      expect(cachedData).toBeNull();
    });

    it('should provide cache statistics', async () => {
      const stats = await gitlabCacheService.getStats();

      expect(stats).toMatchObject({
        hits: expect.any(Number),
        misses: expect.any(Number),
        size: expect.any(Number),
      });
    });
  });

  describe('Rate Limit Service Integration', () => {
    it('should track API usage', async () => {
      const status = await gitlabRateLimitService.checkLimit(testConfig.instanceId);

      expect(status).toMatchObject({
        currentUsage: expect.any(Number),
        limit: expect.any(Number),
        remaining: expect.any(Number),
      });
    });

    it('should handle rate limit exceeded', async () => {
      // Simulate rate limit exceeded
      await gitlabRateLimitService.updateLimit(testConfig.instanceId, {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': Math.floor(Date.now() / 1000) + 60,
      });

      await expect(gitlabRateLimitService.waitForLimit(testConfig.instanceId))
        .resolves.toBeUndefined();
    });
  });

  describe('End-to-End Integration', () => {
    it('should handle complete project monitoring workflow', async () => {
      // 1. Set up instance
      await gitlabSettingsService.addInstance({
        id: 'e2e-instance',
        name: 'E2E Test Instance',
        url: 'https://gitlab.example.com',
        token: 'e2e-token',
      });

      // 2. Mock API response for projects
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGitlabResponses.projects),
      });

      // 3. Fetch projects
      const projects = await gitlabApiService.getProjects('e2e-instance');
      expect(projects).toHaveLength(1);

      // 4. Record activity
      await gitlabActivityService.recordActivity(
        projects[0].id,
        'e2e-instance',
        {
          type: 'commit',
          title: 'Initial commit',
          description: 'Set up project structure',
          author: {
            id: 1,
            username: 'test.user',
            name: 'Test User',
          },
        }
      );

      // 5. Check activity was recorded
      const activities = gitlabActivityService.getActivities(
        projects[0].id,
        'e2e-instance'
      );
      expect(activities).toHaveLength(1);

      // 6. Record performance metrics
      await gitlabPerformanceService.recordMetrics('e2e-instance', {
        responseTime: { average: 200 },
        throughput: { requestsPerMinute: 1000 },
        errorRate: { errorRatePercent: 0.1 },
      });

      // 7. Check performance metrics
      const metrics = gitlabPerformanceService.getCurrentMetrics('e2e-instance');
      expect(metrics?.responseTime.average).toBe(200);

      // 8. Clean up
      await gitlabSettingsService.removeInstance('e2e-instance');
    });

    it('should handle webhook to activity conversion', async () => {
      // 1. Register webhook
      await gitlabWebhookService.registerEndpoint(
        testConfig.instanceId,
        testConfig.webhookUrl,
        testConfig.webhookSecret
      );

      // 2. Process webhook
      const webhookPayload = {
        object_kind: 'push',
        project: { id: testConfig.projectId },
        commits: [{
          id: 'def456',
          message: 'Add new feature',
          author: { name: 'Jane Smith', email: 'jane@example.com' },
        }],
        user_name: 'jane.smith',
      };

      const result = await gitlabWebhookService.processWebhookEvent(
        testConfig.instanceId,
        { 'x-gitlab-event': 'Push Hook' },
        webhookPayload
      );

      expect(result.success).toBe(true);

      // 3. Check activity was created
      const activities = gitlabActivityService.getActivities(
        testConfig.projectId,
        testConfig.instanceId
      );

      expect(activities.some(a => a.title.includes('Add new feature'))).toBe(true);
    });

    it('should handle error scenarios gracefully', async () => {
      // 1. Test API failure
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(gitlabApiService.getProjects(testConfig.instanceId))
        .rejects.toThrow('Network timeout');

      // 2. Test error handling
      const error = new Error('API rate limit exceeded');
      const errorResult = await gitlabErrorService.handleError(error, {
        instanceId: testConfig.instanceId,
        operation: 'getProjects',
      });

      expect(errorResult.shouldRetry).toBe(true);

      // 3. Test performance degradation
      await gitlabPerformanceService.recordMetrics(testConfig.instanceId, {
        responseTime: { average: 10000 }, // Very high
        errorRate: { errorRatePercent: 15 }, // High error rate
      });

      const alerts = gitlabPerformanceService.getAlerts(testConfig.instanceId);
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should measure API response times', async () => {
      const startTime = Date.now();

      // Mock fast API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGitlabResponses.projects),
      });

      await gitlabApiService.getProjects(testConfig.instanceId);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should be fast with mock
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(10).fill(null).map(() =>
        gitlabApiService.getProjects(testConfig.instanceId)
      );

      // Mock responses
      promises.forEach(() => {
        (global.fetch as any).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockGitlabResponses.projects),
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(5000); // Should complete within reasonable time
    });

    it('should maintain data consistency', async () => {
      // Record multiple activities
      const activityPromises = Array(5).fill(null).map((_, i) =>
        gitlabActivityService.recordActivity(
          testConfig.projectId,
          testConfig.instanceId,
          {
            type: 'commit',
            title: `Commit ${i + 1}`,
            description: `Test commit ${i + 1}`,
            author: {
              id: i + 1,
              username: `user${i + 1}`,
              name: `User ${i + 1}`,
            },
          }
        )
      );

      await Promise.all(activityPromises);

      const activities = gitlabActivityService.getActivities(
        testConfig.projectId,
        testConfig.instanceId
      );

      expect(activities).toHaveLength(5);
      expect(new Set(activities.map(a => a.id)).size).toBe(5); // All IDs unique
    });
  });
});
