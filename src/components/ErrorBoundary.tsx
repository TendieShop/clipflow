import { Component, ReactNode, ErrorInfo } from 'react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Error Boundary Component
 * 
 * Catches React component errors and displays a fallback UI.
 * Prevents app crashes from component failures.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    
    this.setState({
      errorInfo: errorInfo.componentStack || null
    });

    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary p-6 bg-[#1a1a1a] rounded-lg border border-[#333] max-w-md mx-auto mt-8">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="w-6 h-6 text-[#ef4444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-[#f5f5f5]">
              Something went wrong
            </h2>
          </div>

          <p className="text-sm text-[#a3a3a3] mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details className="mb-4 p-2 bg-[#262626] rounded text-xs text-[#737373] overflow-auto max-h-32">
              <summary className="cursor-pointer">Stack trace</summary>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo}</pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={this.handleRetry}>
              Retry
            </Button>
            <Button
              variant="default"
              onClick={() => window.location.reload()}
            >
              Reload App
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple error display component for dialogs
 */
export function ErrorDisplay({
  error,
  onDismiss,
  onRetry
}: {
  error: Error | string;
  onDismiss?: () => void;
  onRetry?: () => void;
}) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className="error-message p-3 bg-[#ef4444]/10 border border-[#ef4444] rounded-lg mb-4">
      <div className="flex items-start gap-2">
        <svg
          className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm text-[#ef4444]">{errorMessage}</p>
          
          <div className="flex gap-2 mt-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-2 py-1 bg-[#262626] text-[#a3a3a3] rounded hover:bg-[#333] transition-colors"
              >
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="error-dismiss text-xs px-2 py-1 bg-[#262626] text-[#a3a3a3] rounded hover:bg-[#333] transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback UI when not in Electron app
 */
export function DesktopAppRequired() {
  return (
    <div className="fallback-ui flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <svg
        className="w-16 h-16 text-[#737373] mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <h2 className="text-xl font-semibold text-[#f5f5f5] mb-2">
        Desktop App Required
      </h2>
      <p className="text-sm text-[#a3a3a3] max-w-md">
        ClipFlow requires the desktop application to access video files and
        processing features. Please download and install ClipFlow from our
        website.
      </p>
    </div>
  );
}
