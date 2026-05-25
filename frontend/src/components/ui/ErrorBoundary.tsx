import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-black text-ink dark:text-ink-dark mb-2">Something went wrong</h2>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-1 max-w-sm">
            An unexpected error occurred. Our team has been notified.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <details className="mb-4 text-left max-w-lg w-full">
              <summary className="text-xs text-ink-muted dark:text-ink-muted-dark cursor-pointer hover:text-brand-500 mt-2">
                Error details (dev only)
              </summary>
              <pre className="mt-2 p-3 rounded-xl bg-surface-card dark:bg-surface-card-dark text-xs text-red-500 overflow-auto border border-red-200 dark:border-red-800">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="btn-secondary text-sm py-2.5 px-5 flex items-center gap-2"
            >
              <RefreshCcw size={15} /> Try Again
            </button>
            <Link to="/" className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
              <Home size={15} /> Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Functional wrapper for route-level error boundary ────
export function RouteErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <AlertTriangle size={32} className="text-red-500" />
      </div>
      <h2 className="text-xl font-black text-ink dark:text-ink-dark mb-2">Page Error</h2>
      <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark mb-4 max-w-sm">{error.message}</p>
      <Link to="/" className="btn-primary text-sm py-2.5 px-5">Back to Home</Link>
    </div>
  );
}
