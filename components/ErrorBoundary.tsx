import { Component, ReactNode, ErrorInfo } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  declare props: ErrorBoundaryProps;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Yazi Quest Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
          <div className="max-w-2xl p-8 border border-red-500 rounded bg-black/80">
            <h1 className="text-3xl font-bold text-red-500 mb-4 font-mono">
              SYSTEM FAILURE
            </h1>
            <p className="text-zinc-300 mb-4 font-mono">
              The game encountered a critical error. Your progress may have been lost.
            </p>
            {this.state.error && (
              <pre className="bg-zinc-900 p-4 rounded text-xs text-red-400 mb-4 overflow-auto">
                {this.state.error.toString()}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded font-mono transition-colors"
            >
              RESTART GAME
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
