// GitLab API monitoring service
// This service handles GitLab instance monitoring, project tracking, and API interactions

import { apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';
import type {
  GitlabInstance,
  GitlabProject,
  ApiResponse,
  ApiRequestOptions
} from '@/types';

// GitLab API specific types
interface GitlabApiConfig {
  baseUrl: string;
  token: string;
  version: 'v4'; // GitLab API version
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

enum GitlabErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

class GitlabApiError extends Error {
  public type: GitlabErrorType;
  public statusCode?: number;
  public rateLimitInfo?: RateLimitInfo;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    type: GitlabErrorType,
    statusCode?: number,
    rateLimitInfo?: RateLimitInfo,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GitlabApiError';
    this.type = type;
    if (statusCode !== undefined) this.statusCode = statusCode;
    if (rateLimitInfo !== undefined) this.rateLimitInfo = rateLimitInfo;
    if (details !== undefined) this.details = details;
  }
}

class GitlabApiClient {
  private config: GitlabApiConfig;
  private rateLimitInfo: RateLimitInfo | null = null;

  constructor(config: GitlabApiConfig) {
    this.config = config;
  }

  /**
   * Update the API configuration
   */
  updateConfig(config: Partial<GitlabApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.config.token = token;
  }

  /**
   * Get current rate limit information
   */
  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Check if we're currently rate limited
   */
  isRateLimited(): boolean {
    if (!this.rateLimitInfo) return false;
    return this.rateLimitInfo.remaining <= 0 && new Date() < this.rateLimitInfo.resetTime;
  }

  /**
   * Wait for rate limit reset if needed
   */
  async waitForRateLimit(): Promise<void> {
    if (!this.isRateLimited()) return;

    const waitTime = this.rateLimitInfo!.resetTime.getTime() - Date.now();
    if (waitTime > 0) {
      logger.info(`Rate limited, waiting ${waitTime}ms until reset`, 'GitlabApiClient');
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Make an authenticated request to GitLab API
   */
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    // Wait for rate limit if necessary
    await this.waitForRateLimit();

    const url = `${this.config.baseUrl}/api/${this.config.version}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config.token}`,
      'User-Agent': 'GitLab-DashWatch/1.0.0',
      ...options.headers,
    };

    try {
      const response = await apiClient.get<T>(url, {
        ...options,
        headers,
        timeout: this.config.timeout,
        retries: this.config.retryAttempts,
        retryDelay: this.config.retryDelay,
      });

      // Update rate limit info from response headers
      this.updateRateLimitInfo(response.headers);

      return response;
    } catch (error) {
      // Handle rate limiting
      if (error instanceof Error && 'status' in error && (error as any).status === 429) {
        const retryAfter = (error as any).headers?.get('Retry-After');
        if (retryAfter) {
          this.rateLimitInfo = {
            limit: this.rateLimitInfo?.limit || 0,
            remaining: 0,
            resetTime: new Date(Date.now() + parseInt(retryAfter) * 1000),
            retryAfter: parseInt(retryAfter),
          };
        }
        throw new GitlabApiError(
          'Rate limit exceeded',
          GitlabErrorType.RATE_LIMIT_EXCEEDED,
          429,
          this.rateLimitInfo || undefined
        );
      }

      // Handle authentication errors
      if (error instanceof Error && 'status' in error && (error as any).status === 401) {
        throw new GitlabApiError(
          'Authentication failed',
          GitlabErrorType.AUTHENTICATION_ERROR,
          401
        );
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitInfo(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const resetTime = headers.get('X-RateLimit-Reset');

    if (limit && remaining && resetTime) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        resetTime: new Date(parseInt(resetTime) * 1000), // GitLab returns Unix timestamp
      };
    }
  }

  /**
   * GET request to GitLab API
   */
  async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request to GitLab API
   */
  async post<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  /**
   * PUT request to GitLab API
   */
  async put<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  /**
   * DELETE request to GitLab API
   */
  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.makeAuthenticatedRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Validate the current token
   */
  async validateToken(): Promise<boolean> {
    try {
      await this.get('/user');
      return true;
    } catch (error) {
      if (error instanceof GitlabApiError && error.type === GitlabErrorType.AUTHENTICATION_ERROR) {
        return false;
      }
      // For other errors (network, etc.), we can't definitively say the token is invalid
      throw error;
    }
  }

  /**
   * Test API connectivity
   */
  async testConnection(): Promise<{ success: boolean; version?: string; error?: string }> {
    try {
      const response = await this.get('/version');
      const data = response.data as any;
      return {
        success: true,
        version: data?.version,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class GitlabApiService {
  private clients: Map<string, GitlabApiClient> = new Map();

  /**
   * Get or create a GitLab API client for an instance
   */
  private getClient(instance: GitlabInstance): GitlabApiClient {
    const key = instance.id;

    if (!this.clients.has(key)) {
      const config: GitlabApiConfig = {
        baseUrl: instance.url,
        token: instance.token,
        version: 'v4',
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
      };

      this.clients.set(key, new GitlabApiClient(config));
    }

    return this.clients.get(key)!;
  }

  /**
   * Remove a client (useful when instance is deleted or token changes)
   */
  removeClient(instanceId: string): void {
    this.clients.delete(instanceId);
  }

  /**
   * Update client configuration
   */
  updateClientConfig(instance: GitlabInstance): void {
    const client = this.clients.get(instance.id);
    if (client) {
      client.updateConfig({
        baseUrl: instance.url,
        token: instance.token,
      });
    }
  }

  async checkInstanceHealth(instance: GitlabInstance): Promise<{ status: string; version?: string }> {
    const client = this.getClient(instance);

    try {
      const result = await client.testConnection();

      if (result.success) {
        return {
          status: 'healthy',
          ...(result.version && { version: result.version }),
        };
      } else {
        return {
          status: 'error',
        };
      }
    } catch (error) {
      logger.error(`Failed to check instance health for ${instance.url}`, 'GitlabApiService', error);
      return {
        status: 'error',
      };
    }
  }

  async getProjects(instance: GitlabInstance): Promise<GitlabProject[]> {
    const client = this.getClient(instance);

    try {
      const response = await client.get('/projects', {
        headers: {
          // Request additional fields
          'X-GitLab-Feature-Flags': 'statistics',
        },
      });

      // Transform GitLab API response to our internal format
      const projects = response.data as any[];
      return projects.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: 'healthy' as const, // Will be determined by activity
        openIssues: project.open_issues_count || 0,
        branches: project.branches?.length || 0,
        pullRequests: project.merge_requests_count || 0,
        lastCommit: project.last_activity_at || '',
        instanceUrl: instance.url,
        instanceId: instance.id,
        visibility: project.visibility,
        defaultBranch: project.default_branch || 'main',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        // Enhanced fields from GitLab API
        webUrl: project.web_url || '',
        sshUrl: project.ssh_url_to_repo || '',
        httpUrl: project.http_url_to_repo || '',
        starCount: project.star_count || 0,
        forkCount: project.forks_count || 0,
        commitCount: 0, // Will be fetched separately if needed
        lastActivityAt: new Date(project.last_activity_at || project.updated_at),
        openMergeRequestsCount: project.merge_requests_count || 0,
        branchCount: project.branches?.length || 0,
        permissions: {
          projectAccess: project.permissions?.project_access?.access_level,
          groupAccess: project.permissions?.group_access?.access_level,
        },
        pipelineStatus: project.pipeline?.status,
        // Latest commit info will be populated separately
      }));
    } catch (error) {
      logger.error(`Failed to fetch projects from ${instance.url}`, 'GitlabApiService', error);
      throw error;
    }
  }

  async getProjectDetails(instance: GitlabInstance, projectId: number): Promise<GitlabProject | null> {
    const client = this.getClient(instance);

    try {
      const response = await client.get(`/projects/${projectId}`);

      const project = response.data as any;
      return {
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: 'healthy' as const,
        openIssues: project.open_issues_count || 0,
        branches: project.branches?.length || 0,
        pullRequests: project.merge_requests_count || 0,
        lastCommit: project.last_activity_at || '',
        instanceUrl: instance.url,
        instanceId: instance.id,
        visibility: project.visibility,
        defaultBranch: project.default_branch || 'main',
        createdAt: new Date(project.created_at),
        updatedAt: new Date(project.updated_at),
        // Enhanced fields from GitLab API
        webUrl: project.web_url || '',
        sshUrl: project.ssh_url_to_repo || '',
        httpUrl: project.http_url_to_repo || '',
        starCount: project.star_count || 0,
        forkCount: project.forks_count || 0,
        commitCount: 0, // Will be fetched separately if needed
        lastActivityAt: new Date(project.last_activity_at || project.updated_at),
        openMergeRequestsCount: project.merge_requests_count || 0,
        branchCount: project.branches?.length || 0,
        permissions: {
          projectAccess: project.permissions?.project_access?.access_level,
          groupAccess: project.permissions?.group_access?.access_level,
        },
        pipelineStatus: project.pipeline?.status,
        // Latest commit info will be populated separately
      };
    } catch (error) {
      if (error instanceof GitlabApiError && error.statusCode === 404) {
        return null;
      }
      logger.error(`Failed to fetch project details for ${projectId}`, 'GitlabApiService', error);
      throw error;
    }
  }

  async validateConnection(instance: GitlabInstance): Promise<boolean> {
    const client = this.getClient(instance);

    try {
      await client.validateToken();
      return true;
    } catch {
      return false;
    }
  }
}

export const gitlabApiService = new GitlabApiService();
export { GitlabApiClient, GitlabApiError, GitlabErrorType };
export type { GitlabApiConfig, RateLimitInfo };
