// API utilities and helpers
import { NetworkError, withRetry } from './error';
import { logger } from './logger';
import { API_CONSTANTS } from '@/constants';

import type { ApiRequestOptions, ApiResponse } from '@/types';

class ApiClient {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  private defaultTimeout: number = API_CONSTANTS.TIMEOUT;

  setBaseURL(url: string): void {
    this.baseURL = url.replace(/\/$/, ''); // Remove trailing slash
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }

  private async makeRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = 0,
      retryDelay = API_CONSTANTS.RETRY_DELAY,
    } = options;

    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(timeout),
    };

    if (body && method !== 'GET') {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const makeRequestAttempt = async (): Promise<ApiResponse<T>> => {
      logger.debug(`Making ${method} request to ${fullUrl}`, 'ApiClient');

      try {
        const response = await fetch(fullUrl, requestOptions);

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            fullUrl
          );
        }

        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        logger.debug(`Request successful: ${method} ${fullUrl}`, 'ApiClient');

        return {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
          throw new NetworkError(`Request timeout after ${timeout}ms`, fullUrl);
        }
        if (error instanceof NetworkError) {
          throw error;
        }
        throw new NetworkError(
          error instanceof Error ? error.message : 'Unknown network error',
          fullUrl
        );
      }
    };

    if (retries > 0) {
      return withRetry(makeRequestAttempt, retries + 1, retryDelay, `API ${method} ${fullUrl}`);
    }

    return makeRequestAttempt();
  }

  async get<T>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'GET' });
  }

  async post<T>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'POST', body });
  }

  async put<T>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PUT', body });
  }

  async patch<T>(url: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'PATCH', body });
  }

  async delete<T>(url: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: 'DELETE' });
  }
}

// Singleton API client
export const apiClient = new ApiClient();

// Utility functions for common API patterns
export const isOnline = (): boolean => {
  return navigator.onLine;
};

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
};

export const createAbortController = (timeoutMs?: number): AbortController => {
  const controller = new AbortController();
  
  if (timeoutMs) {
    setTimeout(() => controller.abort(), timeoutMs);
  }
  
  return controller;
};

// URL utilities
export const buildQueryString = (params: Record<string, string | number | boolean>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

export const buildUrl = (baseUrl: string, path: string, params?: Record<string, string | number | boolean>): string => {
  const url = new URL(path, baseUrl);
  
  if (params) {
    const queryString = buildQueryString(params);
    if (queryString) {
      url.search = queryString;
    }
  }
  
  return url.toString();
};
