// Validation utilities and helpers
import type {
  GitlabInstance,
  GitlabProject,
  GitlabValidationResult,
  FetchOptions,
  GitlabSettings
} from '@/types';

/**
 * Validate GitLab instance configuration
 */
export function validateGitlabInstance(instance: Partial<GitlabInstance>): GitlabValidationResult {
  const errors: Array<{ field: string; type: string; message: string }> = [];

  // Required fields validation
  if (!instance.id || typeof instance.id !== 'string' || instance.id.trim() === '') {
    errors.push({
      field: 'id',
      type: 'required',
      message: 'Instance ID is required and must be a non-empty string'
    });
  }

  if (!instance.name || typeof instance.name !== 'string' || instance.name.trim() === '') {
    errors.push({
      field: 'name',
      type: 'required',
      message: 'Instance name is required and must be a non-empty string'
    });
  }

  if (!instance.url || typeof instance.url !== 'string') {
    errors.push({
      field: 'url',
      type: 'required',
      message: 'Instance URL is required'
    });
  } else {
    // URL format validation
    try {
      const url = new URL(instance.url);
      if (!url.protocol.startsWith('http')) {
        errors.push({
          field: 'url',
          type: 'format',
          message: 'URL must use HTTP or HTTPS protocol'
        });
      }
      // Remove trailing slash for consistency
      if (instance.url.endsWith('/')) {
        instance.url = instance.url.slice(0, -1);
      }
    } catch {
      errors.push({
        field: 'url',
        type: 'format',
        message: 'Invalid URL format'
      });
    }
  }

  if (!instance.token || typeof instance.token !== 'string' || instance.token.trim() === '') {
    errors.push({
      field: 'token',
      type: 'required',
      message: 'Access token is required and must be a non-empty string'
    });
  } else {
    // Basic token format validation (GitLab tokens are typically long alphanumeric strings)
    if (instance.token.length < 20) {
      errors.push({
        field: 'token',
        type: 'format',
        message: 'Access token appears to be too short'
      });
    }
  }

  // Optional fields validation
  if (instance.description && typeof instance.description !== 'string') {
    errors.push({
      field: 'description',
      type: 'type',
      message: 'Description must be a string'
    });
  }

  if (instance.isActive !== undefined && typeof instance.isActive !== 'boolean') {
    errors.push({
      field: 'isActive',
      type: 'type',
      message: 'isActive must be a boolean'
    });
  }

  if (instance.apiVersion && !['v4'].includes(instance.apiVersion)) {
    errors.push({
      field: 'apiVersion',
      type: 'enum',
      message: 'API version must be v4'
    });
  }

  if (instance.connectionStatus && !['connected', 'disconnected', 'error', 'checking'].includes(instance.connectionStatus)) {
    errors.push({
      field: 'connectionStatus',
      type: 'enum',
      message: 'Connection status must be one of: connected, disconnected, error, checking'
    });
  }

  if (instance.selectedProjects && !Array.isArray(instance.selectedProjects)) {
    errors.push({
      field: 'selectedProjects',
      type: 'type',
      message: 'selectedProjects must be an array of numbers'
    });
  } else if (instance.selectedProjects) {
    const invalidProjects = instance.selectedProjects.filter(id => typeof id !== 'number' || id <= 0);
    if (invalidProjects.length > 0) {
      errors.push({
        field: 'selectedProjects',
        type: 'format',
        message: 'All project IDs must be positive numbers'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate GitLab project data
 */
export function validateGitlabProject(project: Partial<GitlabProject>): GitlabValidationResult {
  const errors: Array<{ field: string; type: string; message: string }> = [];

  // Required fields validation
  if (!project.id || typeof project.id !== 'number' || project.id <= 0) {
    errors.push({
      field: 'id',
      type: 'required',
      message: 'Project ID is required and must be a positive number'
    });
  }

  if (!project.name || typeof project.name !== 'string' || project.name.trim() === '') {
    errors.push({
      field: 'name',
      type: 'required',
      message: 'Project name is required and must be a non-empty string'
    });
  }

  if (!project.instanceUrl || typeof project.instanceUrl !== 'string') {
    errors.push({
      field: 'instanceUrl',
      type: 'required',
      message: 'Instance URL is required'
    });
  }

  if (!project.instanceId || typeof project.instanceId !== 'string' || project.instanceId.trim() === '') {
    errors.push({
      field: 'instanceId',
      type: 'required',
      message: 'Instance ID is required and must be a non-empty string'
    });
  }

  // Optional fields validation
  if (project.description && typeof project.description !== 'string') {
    errors.push({
      field: 'description',
      type: 'type',
      message: 'Description must be a string'
    });
  }

  if (project.status && !['healthy', 'warning', 'error', 'inactive'].includes(project.status)) {
    errors.push({
      field: 'status',
      type: 'enum',
      message: 'Status must be one of: healthy, warning, error, inactive'
    });
  }

  if (project.visibility && !['private', 'internal', 'public'].includes(project.visibility)) {
    errors.push({
      field: 'visibility',
      type: 'enum',
      message: 'Visibility must be one of: private, internal, public'
    });
  }

  if (project.openIssues !== undefined && (typeof project.openIssues !== 'number' || project.openIssues < 0)) {
    errors.push({
      field: 'openIssues',
      type: 'range',
      message: 'Open issues count must be a non-negative number'
    });
  }

  if (project.branches !== undefined && (typeof project.branches !== 'number' || project.branches < 0)) {
    errors.push({
      field: 'branches',
      type: 'range',
      message: 'Branches count must be a non-negative number'
    });
  }

  if (project.pullRequests !== undefined && (typeof project.pullRequests !== 'number' || project.pullRequests < 0)) {
    errors.push({
      field: 'pullRequests',
      type: 'range',
      message: 'Pull requests count must be a non-negative number'
    });
  }

  if (project.starCount !== undefined && (typeof project.starCount !== 'number' || project.starCount < 0)) {
    errors.push({
      field: 'starCount',
      type: 'range',
      message: 'Star count must be a non-negative number'
    });
  }

  if (project.forkCount !== undefined && (typeof project.forkCount !== 'number' || project.forkCount < 0)) {
    errors.push({
      field: 'forkCount',
      type: 'range',
      message: 'Fork count must be a non-negative number'
    });
  }

  if (project.pipelineStatus && !['success', 'failed', 'running', 'pending', 'canceled', 'skipped'].includes(project.pipelineStatus)) {
    errors.push({
      field: 'pipelineStatus',
      type: 'enum',
      message: 'Pipeline status must be one of: success, failed, running, pending, canceled, skipped'
    });
  }

  // Date validation
  if (project.createdAt && !(project.createdAt instanceof Date) && isNaN(Date.parse(project.createdAt as string))) {
    errors.push({
      field: 'createdAt',
      type: 'format',
      message: 'Created date must be a valid date'
    });
  }

  if (project.updatedAt && !(project.updatedAt instanceof Date) && isNaN(Date.parse(project.updatedAt as string))) {
    errors.push({
      field: 'updatedAt',
      type: 'format',
      message: 'Updated date must be a valid date'
    });
  }

  if (project.lastActivityAt && !(project.lastActivityAt instanceof Date) && isNaN(Date.parse(project.lastActivityAt as string))) {
    errors.push({
      field: 'lastActivityAt',
      type: 'format',
      message: 'Last activity date must be a valid date'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate fetch options for GitLab API
 */
export function validateFetchOptions(options: Partial<FetchOptions>): GitlabValidationResult {
  const errors: Array<{ field: string; type: string; message: string }> = [];

  if (options.page !== undefined && (typeof options.page !== 'number' || options.page < 1)) {
    errors.push({
      field: 'page',
      type: 'range',
      message: 'Page must be a positive number'
    });
  }

  if (options.perPage !== undefined && (typeof options.perPage !== 'number' || options.perPage < 1 || options.perPage > 100)) {
    errors.push({
      field: 'perPage',
      type: 'range',
      message: 'Per page must be between 1 and 100'
    });
  }

  if (options.orderBy && !['id', 'name', 'path', 'created_at', 'updated_at', 'last_activity_at'].includes(options.orderBy)) {
    errors.push({
      field: 'orderBy',
      type: 'enum',
      message: 'Order by must be one of: id, name, path, created_at, updated_at, last_activity_at'
    });
  }

  if (options.sort && !['asc', 'desc'].includes(options.sort)) {
    errors.push({
      field: 'sort',
      type: 'enum',
      message: 'Sort must be asc or desc'
    });
  }

  if (options.visibility && !['private', 'internal', 'public'].includes(options.visibility)) {
    errors.push({
      field: 'visibility',
      type: 'enum',
      message: 'Visibility must be one of: private, internal, public'
    });
  }

  if (options.search && typeof options.search !== 'string') {
    errors.push({
      field: 'search',
      type: 'type',
      message: 'Search must be a string'
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate GitLab settings configuration
 */
export function validateGitlabSettings(settings: Partial<GitlabSettings>): GitlabValidationResult {
  const errors: Array<{ field: string; type: string; message: string }> = [];

  if (settings.refreshInterval !== undefined && (typeof settings.refreshInterval !== 'number' || settings.refreshInterval < 1)) {
    errors.push({
      field: 'refreshInterval',
      type: 'range',
      message: 'Refresh interval must be a positive number (minutes)'
    });
  }

  if (settings.maxProjects !== undefined && (typeof settings.maxProjects !== 'number' || settings.maxProjects < 1)) {
    errors.push({
      field: 'maxProjects',
      type: 'range',
      message: 'Max projects must be a positive number'
    });
  }

  if (settings.cacheTimeout !== undefined && (typeof settings.cacheTimeout !== 'number' || settings.cacheTimeout < 1)) {
    errors.push({
      field: 'cacheTimeout',
      type: 'range',
      message: 'Cache timeout must be a positive number (minutes)'
    });
  }

  if (settings.enableRealTimeUpdates !== undefined && typeof settings.enableRealTimeUpdates !== 'boolean') {
    errors.push({
      field: 'enableRealTimeUpdates',
      type: 'type',
      message: 'Enable real-time updates must be a boolean'
    });
  }

  if (settings.rateLimitBuffer !== undefined && (typeof settings.rateLimitBuffer !== 'number' || settings.rateLimitBuffer < 0 || settings.rateLimitBuffer > 100)) {
    errors.push({
      field: 'rateLimitBuffer',
      type: 'range',
      message: 'Rate limit buffer must be between 0 and 100 (percentage)'
    });
  }

  if (settings.instances) {
    if (!Array.isArray(settings.instances)) {
      errors.push({
        field: 'instances',
        type: 'type',
        message: 'Instances must be an array'
      });
    } else {
      settings.instances.forEach((instance, index) => {
        const instanceValidation = validateGitlabInstance(instance);
        if (!instanceValidation.isValid) {
          errors.push({
            field: `instances[${index}]`,
            type: 'nested',
            message: `Instance ${index} validation failed: ${instanceValidation.errors.map(e => e.message).join(', ')}`
          });
        }
      });
    }
  }

  if (settings.defaultFetchOptions) {
    const fetchOptionsValidation = validateFetchOptions(settings.defaultFetchOptions);
    if (!fetchOptionsValidation.isValid) {
      errors.push({
        field: 'defaultFetchOptions',
        type: 'nested',
        message: `Default fetch options validation failed: ${fetchOptionsValidation.errors.map(e => e.message).join(', ')}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and normalize GitLab instance data
 */
export function sanitizeGitlabInstance(instance: GitlabInstance): GitlabInstance {
  const sanitized = {
    ...instance,
    url: instance.url.replace(/\/$/, ''), // Remove trailing slash
    name: instance.name.trim(),
    token: instance.token.trim(),
    apiVersion: instance.apiVersion || 'v4',
    connectionStatus: instance.connectionStatus || 'disconnected',
    selectedProjects: instance.selectedProjects || [],
    fetchOptions: instance.fetchOptions || {},
  };

  // Handle description separately to avoid undefined assignment
  if (instance.description !== undefined) {
    sanitized.description = instance.description.trim();
  }

  return sanitized;
}

/**
 * Sanitize and normalize GitLab project data
 */
export function sanitizeGitlabProject(project: GitlabProject): GitlabProject {
  return {
    ...project,
    name: project.name.trim(),
    description: project.description?.trim() || '',
    webUrl: project.webUrl?.trim() || '',
    sshUrl: project.sshUrl?.trim() || '',
    httpUrl: project.httpUrl?.trim() || '',
    defaultBranch: project.defaultBranch?.trim() || 'main',
    lastCommit: project.lastCommit?.trim() || '',
    // Ensure dates are Date objects
    createdAt: project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt),
    updatedAt: project.updatedAt instanceof Date ? project.updatedAt : new Date(project.updatedAt),
    lastActivityAt: project.lastActivityAt instanceof Date ? project.lastActivityAt : new Date(project.lastActivityAt),
  };
}

/**
 * Create default fetch options
 */
export function createDefaultFetchOptions(): FetchOptions {
  return {
    page: 1,
    perPage: 20,
    orderBy: 'last_activity_at',
    sort: 'desc',
    statistics: true,
    withIssuesEnabled: true,
    withMergeRequestsEnabled: true,
  };
}

/**
 * Create default GitLab settings
 */
export function createDefaultGitlabSettings(): GitlabSettings {
  return {
    instances: [],
    refreshInterval: 15, // 15 minutes
    maxProjects: 100,
    cacheTimeout: 30, // 30 minutes
    enableRealTimeUpdates: true,
    defaultFetchOptions: createDefaultFetchOptions(),
    rateLimitBuffer: 10, // 10% buffer
  };
}
