import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorMessage: ''
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a more descriptive error message
    let errorMessage = 'An unexpected error occurred';
    
    if (error) {
      if (error.message) {
        errorMessage = error.message;
      } else if (error.name) {
        errorMessage = `Error type: ${error.name}`;
      } else if (Object.keys(error).length === 0) {
        errorMessage = 'Empty error object received';
      }
    }
    
    return {
      hasError: true,
      error,
      errorMessage
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console with additional details
    console.error('Error caught by ErrorBoundary:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorType: error?.constructor?.name || 'Unknown',
      errorKeys: Object.keys(error || {})
    });
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Log to monitoring service or notify user
    toast.error('An error occurred', {
      description: this.state.errorMessage || 'Application encountered an unexpected error',
      duration: 5000
    });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-lg text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-xl font-medium text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">
            {this.state.errorMessage || 'An unexpected error occurred'}
          </p>
          {this.state.errorInfo && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-red-700 hover:text-red-800 font-medium">
                View technical details
              </summary>
              <pre className="mt-2 p-4 bg-red-100 rounded text-red-900 overflow-auto text-sm whitespace-pre-wrap">
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              // Reset the error state
              this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorMessage: ''
              });
              // Refresh the page if the error was in a critical component
              if (this.state.errorInfo?.componentStack.includes('AppInitializer')) {
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center justify-center mx-auto"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
