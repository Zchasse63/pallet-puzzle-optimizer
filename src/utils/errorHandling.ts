/**
 * Error handling utilities for consistent error management across the application
 */

import { toast } from 'sonner';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public code: string;
  public details?: Record<string, any>;
  public isOperational: boolean;

  constructor(
    message: string, 
    code: string = 'UNKNOWN_ERROR', 
    details?: Record<string, any>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.isOperational = isOperational; // Indicates if this is an expected error
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for categorizing errors
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_RATE_LIMITED: 'AUTH_RATE_LIMITED',
  AUTH_USER_NOT_FOUND: 'AUTH_USER_NOT_FOUND',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_IN_USE: 'AUTH_EMAIL_IN_USE',
  
  // Data errors
  DATA_NOT_FOUND: 'DATA_NOT_FOUND',
  DATA_VALIDATION_FAILED: 'DATA_VALIDATION_FAILED',
  DATA_CONFLICT: 'DATA_CONFLICT',
  
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR: 'NETWORK_SERVER_ERROR',
  
  // API errors
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_FORBIDDEN: 'API_FORBIDDEN',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_SERVER_ERROR: 'API_SERVER_ERROR',
  
  // Application errors
  APP_INITIALIZATION_FAILED: 'APP_INITIALIZATION_FAILED',
  APP_UNSUPPORTED_OPERATION: 'APP_UNSUPPORTED_OPERATION',
  APP_FEATURE_DISABLED: 'APP_FEATURE_DISABLED',
  
  // Unknown error
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Maps Supabase error messages to our application error codes
 * @param error - Error from Supabase
 * @returns Appropriate error code
 */
export const mapSupabaseErrorToCode = (error: any): string => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('invalid login credentials')) {
    return ErrorCodes.AUTH_INVALID_CREDENTIALS;
  } else if (message.includes('email not confirmed')) {
    return ErrorCodes.AUTH_EMAIL_NOT_VERIFIED;
  } else if (message.includes('rate limit')) {
    return ErrorCodes.AUTH_RATE_LIMITED;
  } else if (message.includes('user not found')) {
    return ErrorCodes.AUTH_USER_NOT_FOUND;
  } else if (message.includes('password')) {
    return ErrorCodes.AUTH_WEAK_PASSWORD;
  } else if (message.includes('already registered') || message.includes('already in use')) {
    return ErrorCodes.AUTH_EMAIL_IN_USE;
  } else if (error?.status === 404 || message.includes('not found')) {
    return ErrorCodes.DATA_NOT_FOUND;
  } else if (error?.status === 401 || message.includes('unauthorized')) {
    return ErrorCodes.API_UNAUTHORIZED;
  } else if (error?.status === 403 || message.includes('forbidden')) {
    return ErrorCodes.API_FORBIDDEN;
  } else if (error?.status === 429 || message.includes('too many requests')) {
    return ErrorCodes.API_RATE_LIMITED;
  } else if (error?.status >= 500 || message.includes('server error')) {
    return ErrorCodes.API_SERVER_ERROR;
  }
  
  return ErrorCodes.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message based on error code
 * @param code - Error code
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (code: string): string => {
  switch (code) {
    case ErrorCodes.AUTH_INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case ErrorCodes.AUTH_EMAIL_NOT_VERIFIED:
      return 'Please verify your email before signing in.';
    case ErrorCodes.AUTH_RATE_LIMITED:
      return 'Too many attempts. Please try again later.';
    case ErrorCodes.AUTH_USER_NOT_FOUND:
      return 'User not found. Please check your email or sign up.';
    case ErrorCodes.AUTH_WEAK_PASSWORD:
      return 'Password does not meet the requirements. Please use a stronger password.';
    case ErrorCodes.AUTH_EMAIL_IN_USE:
      return 'This email is already registered. Please sign in or reset your password.';
    case ErrorCodes.DATA_NOT_FOUND:
      return 'The requested information could not be found.';
    case ErrorCodes.DATA_VALIDATION_FAILED:
      return 'Please check your input and try again.';
    case ErrorCodes.DATA_CONFLICT:
      return 'A conflict occurred with the existing data. Please refresh and try again.';
    case ErrorCodes.NETWORK_OFFLINE:
      return 'You appear to be offline. Please check your internet connection.';
    case ErrorCodes.NETWORK_TIMEOUT:
      return 'The request timed out. Please try again.';
    case ErrorCodes.NETWORK_SERVER_ERROR:
      return 'A server error occurred. Please try again later.';
    case ErrorCodes.API_RATE_LIMITED:
      return 'Too many requests. Please try again later.';
    case ErrorCodes.API_UNAUTHORIZED:
      return 'You are not authorized to perform this action. Please sign in.';
    case ErrorCodes.API_FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case ErrorCodes.API_NOT_FOUND:
      return 'The requested resource could not be found.';
    case ErrorCodes.API_SERVER_ERROR:
      return 'A server error occurred. Our team has been notified.';
    case ErrorCodes.APP_INITIALIZATION_FAILED:
      return 'The application failed to initialize. Please refresh the page.';
    case ErrorCodes.APP_UNSUPPORTED_OPERATION:
      return 'This operation is not supported in your current context.';
    case ErrorCodes.APP_FEATURE_DISABLED:
      return 'This feature is currently disabled.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Handle errors in a consistent way across the application
 * @param error - Error to handle
 * @param options - Configuration options
 * @returns Processed error with user-friendly message
 */
export const handleError = (
  error: any,
  options: {
    showToast?: boolean;
    logToConsole?: boolean;
    logToServer?: boolean;
    defaultMessage?: string;
  } = {}
): { code: string; message: string; details?: Record<string, any> } => {
  const { 
    showToast = true, 
    logToConsole = true, 
    logToServer = false,
    defaultMessage = 'An unexpected error occurred. Please try again.'
  } = options;
  
  // Process the error to get a consistent format
  let processedError: { code: string; message: string; details?: Record<string, any> };
  
  if (error instanceof AppError) {
    processedError = {
      code: error.code,
      message: error.message,
      details: error.details
    };
  } else if (error?.code && error?.message) {
    // Handle errors with code and message properties
    processedError = {
      code: error.code,
      message: error.message,
      details: error.details || error.data
    };
  } else if (error instanceof Error) {
    // Handle standard JS errors
    const code = mapSupabaseErrorToCode(error);
    processedError = {
      code,
      message: getUserFriendlyErrorMessage(code),
      details: { originalMessage: error.message }
    };
  } else if (typeof error === 'string') {
    // Handle string errors
    processedError = {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: error || defaultMessage
    };
  } else {
    // Handle unknown error types
    processedError = {
      code: ErrorCodes.UNKNOWN_ERROR,
      message: defaultMessage,
      details: error ? { originalError: error } : undefined
    };
  }
  
  // Log the error to console if enabled
  if (logToConsole) {
    console.error('Error:', processedError.code, processedError);
  }
  
  // Show toast notification if enabled
  if (showToast) {
    toast.error(processedError.message);
  }
  
  // Log to server if enabled (implement actual server logging here)
  if (logToServer) {
    // Example implementation:
    // sendErrorToLoggingService(processedError);
    console.info('Error would be logged to server:', processedError);
  }
  
  return processedError;
};

/**
 * Check if the browser is online
 * @returns Whether the browser is online
 */
export const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
};

/**
 * Creates an error boundary component for React
 * @param fallback - Fallback UI to show when an error occurs
 * @returns Error boundary component
 */
export const createErrorBoundary = (fallback: React.ReactNode) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      handleError(error, {
        showToast: false,
        logToConsole: true,
        logToServer: true,
        defaultMessage: 'An unexpected error occurred in the application.'
      });
      console.error('Error boundary caught error:', errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return fallback;
      }

      return this.props.children;
    }
  };
};

export default {
  AppError,
  ErrorCodes,
  mapSupabaseErrorToCode,
  getUserFriendlyErrorMessage,
  handleError,
  isOnline,
  createErrorBoundary
};
