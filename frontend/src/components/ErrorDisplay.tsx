import React from 'react';
import { ApiError, ApiErrorHandler } from '../utils/apiErrorHandler';

interface ErrorDisplayProps {
  error: ApiError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'inline' | 'modal' | 'banner';
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'inline',
  className = '' 
}: ErrorDisplayProps) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const friendlyMessage = typeof error === 'string' ? error : 
    ApiErrorHandler.getInstance().getUserFriendlyMessage(error);

  const handleRetry = () => {
    if (onRetry) onRetry();
    if (onDismiss) onDismiss();
  };

  const getErrorIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  const getRetryButton = () => {
    if (!onRetry) return null;
    
    return (
      <button
        onClick={handleRetry}
        aria-label="Retry the operation"
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Try Again
      </button>
    );
  };

  const getDismissButton = () => {
    if (!onDismiss) return null;
    
    return (
      <button
        onClick={onDismiss}
        aria-label="Dismiss error message"
        className="inline-flex items-center p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    );
  };

  const getErrorContent = () => (
    <>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="text-red-400">
            {getErrorIcon()}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {friendlyMessage}
          </h3>
          {typeof error === 'object' && error.code !== 'NETWORK_ERROR' && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Error Code: {error.code || 'UNKNOWN'}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-2">
          {getRetryButton()}
          {getDismissButton()}
        </div>
      </div>
    </>
  );

  // Style variants
  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return 'fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4';
      case 'banner':
        return 'border-l-4 border-red-400 bg-red-50 p-4';
      default:
        return 'rounded-md bg-red-50 p-4 border border-red-200';
    }
  };

  const getContentStyles = () => {
    switch (variant) {
      case 'modal':
        return 'max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6';
      case 'banner':
        return 'flex';
      default:
        return 'flex';
    }
  };

  return (
    <div className={`${getVariantStyles()} ${className}`}>
      <div className={getContentStyles()}>
        {getErrorContent()}
      </div>
    </div>
  );
}

// Global error handler utility
let globalErrorHandler: any = null;

export function initializeErrorHandling() {
  // Set up global error handling
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      // You can send to error tracking service here
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You can send to error tracking service here
    });
  }
}

export function setGlobalErrorHandler(handler: any) {
  globalErrorHandler = handler;
}

// Toast notification for errors
interface ErrorToastProps {
  error: ApiError | string;
  onClose: () => void;
  duration?: number;
}

export function ErrorToast({ error, onClose, duration = 5000 }: ErrorToastProps) {
  const message = typeof error === 'string' ? error : error.message;
  const friendlyMessage = typeof error === 'string' ? error : 
    ApiErrorHandler.getInstance().getUserFriendlyMessage(error);

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg shadow-lg p-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {friendlyMessage}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close error notification"
          className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Loading state with error retry
interface LoadingStateProps {
  loading: boolean;
  error: ApiError | string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export function LoadingState({ 
  loading, 
  error, 
  onRetry, 
  children, 
  loadingComponent 
}: LoadingStateProps) {
  if (loading && !error) {
    return loadingComponent || (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        variant="inline"
        className="py-8"
      />
    );
  }

  return <>{children}</>;
}