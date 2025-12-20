import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="h-screen w-screen flex flex-col items-center justify-center p-8">
            <div className="max-w-2xl w-full bg-red-50 border border-red-200 rounded-lg p-6">
              <h1 className="text-2xl font-bold text-red-900 mb-4">
                Something went wrong
              </h1>
              <div className="bg-white rounded p-4 mb-4">
                <p className="text-sm font-mono text-red-800 whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </p>
              </div>
              {this.state.errorInfo && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-red-700 font-medium mb-2">
                    Component Stack
                  </summary>
                  <pre className="bg-white rounded p-4 overflow-auto text-xs text-gray-700">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
