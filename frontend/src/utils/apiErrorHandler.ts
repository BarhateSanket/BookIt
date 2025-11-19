// API Error handling utilities

export class ApiError extends Error {
  public status?: number;
  public code?: string;
  public details?: any;

  constructor(message: string, status?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ApiErrorData {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export class ApiErrorHandler {
  private static instance: ApiErrorHandler;
  private maxRetries = 3;

  static getInstance(): ApiErrorHandler {
    if (!ApiErrorHandler.instance) {
      ApiErrorHandler.instance = new ApiErrorHandler();
    }
    return ApiErrorHandler.instance;
  }

  // Main API request wrapper with error handling
  async request<T>(
    url: string, 
    options: RequestInit = {}, 
    retryCount = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'UNKNOWN_ERROR',
          errorData.details
        );
      }

      return await response.json();
    } catch (error) {
      // If it's already an ApiError, re-throw it
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(
          'Network error: Please check your internet connection',
          0,
          'NETWORK_ERROR'
        );
      }

      // Handle other errors
      throw new ApiError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR'
      );
    }
  }

  // Retry mechanism for failed requests
  async requestWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      return await this.request<T>(url, options, retryCount);
    } catch (error) {
      if (error instanceof ApiError && this.shouldRetry(error, retryCount)) {
        console.log(`Retrying request to ${url}, attempt ${retryCount + 1}`);
        
        // Wait before retrying (exponential backoff)
        await this.delay(Math.pow(2, retryCount) * 1000);
        
        return this.requestWithRetry<T>(url, options, retryCount + 1);
      }
      
      throw error;
    }
  }

  private shouldRetry(error: ApiError, retryCount: number): boolean {
    // Retry on network errors or server errors (5xx)
    return retryCount < this.maxRetries && 
           (error.status === 0 || (error.status !== undefined && error.status >= 500));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async parseErrorResponse(response: Response) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        return {
          message: errorData.message || errorData.error || 'An error occurred',
          code: errorData.code || errorData.status,
          details: errorData.details || errorData
        };
      } else {
        return {
          message: await response.text() || 'An error occurred',
          code: 'HTTP_ERROR'
        };
      }
    } catch {
      return {
        message: 'Unable to parse error response',
        code: 'PARSE_ERROR'
      };
    }
  }

  // User-friendly error messages
  getUserFriendlyMessage(error: ApiError): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      
      case 'UNAUTHORIZED':
        return 'You are not authorized to perform this action. Please log in and try again.';
      
      case 'FORBIDDEN':
        return 'You do not have permission to access this resource.';
      
      case 'NOT_FOUND':
        return 'The requested resource was not found.';
      
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      
      case 'SERVER_ERROR':
        return 'Our server is experiencing issues. Please try again later.';
      
      case 'TIMEOUT':
        return 'The request timed out. Please try again.';
      
      default:
        if (error.status === 0) {
          return 'Connection failed. Please check your internet connection.';
        } else if (error.status !== undefined && error.status >= 500) {
          return 'Server error. Please try again later.';
        } else if (error.status !== undefined && error.status >= 400) {
          return 'Request failed. Please check your input and try again.';
        }
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Log error for debugging
  logError(error: ApiError, context: string = '') {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : 'anonymous'
    };

    console.error('API Error:', errorLog);
    
    // Store in localStorage for offline debugging
    const existingErrors = JSON.parse(localStorage.getItem('apiErrorLog') || '[]');
    existingErrors.push(errorLog);
    localStorage.setItem('apiErrorLog', JSON.stringify(existingErrors.slice(-20)));
  }
}

// React hook for API calls with error handling
import { useState, useCallback } from 'react';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const apiErrorHandler = ApiErrorHandler.getInstance();

  const execute = useCallback(async <T>(
    requestFn: () => Promise<T>,
    onError?: (error: ApiError) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      setLoading(false);
      return result;
    } catch (err) {
      const apiError = err instanceof ApiError ? err : 
        new ApiError('An unexpected error occurred', 0, 'UNKNOWN_ERROR');
      
      setError(apiError);
      apiErrorHandler.logError(apiError);
      
      if (onError) {
        onError(apiError);
      }
      
      setLoading(false);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    clearError,
    getUserFriendlyMessage: (error: ApiError) => apiErrorHandler.getUserFriendlyMessage(error)
  };
}