// Error boundary component for catching React errors
import { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError('react.error_boundary', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
          <style>{`
            .error-boundary {
              padding: 2rem;
              text-align: center;
              background: var(--bg-secondary);
              border-radius: 8px;
              margin: 1rem;
            }
            .error-boundary h2 {
              color: var(--destructive);
              margin-bottom: 0.5rem;
            }
            .error-boundary button {
              margin-top: 1rem;
              padding: 0.5rem 1rem;
              background: var(--primary);
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}
