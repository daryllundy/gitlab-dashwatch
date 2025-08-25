// Error handling utilities
import { API_CONSTANTS } from '@/constants';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Predefined error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(
      field ? `Validation failed for ${field}: ${message}` : `Validation failed: ${message}`,
      'VALIDATION_ERROR',
      400
    );
  }
}

export class NetworkError extends AppError {
  constructor(message: string, url?: string) {
    super(
      url ? `Network error for ${url}: ${message}` : `Network error: ${message}`,
      'NETWORK_ERROR',
      503
    );
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(`Configuration error: ${message}`, 'CONFIGURATION_ERROR', 500);
  }
}

// Error handling utilities
export const isAppError = (error: unknown): error is AppError => {
  return error instanceof AppError;
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

export const getErrorCode = (error: unknown): string => {
  if (isAppError(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
};

export const logError = (error: unknown, context?: string): void => {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  const timestamp = new Date().toISOString();
  
  console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}${code}: ${message}`);
  
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
};

// Async error wrapper
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return null;
  }
};

// Retry utility with exponential backoff
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = API_CONSTANTS.RETRY_ATTEMPTS,
  baseDelay: number = API_CONSTANTS.BASE_DELAY,
  context?: string
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logError(error, `${context} (final attempt ${attempt}/${maxAttempts})`);
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      logError(error, `${context} (attempt ${attempt}/${maxAttempts}, retrying in ${delay}ms)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
