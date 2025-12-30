import React from "react";
import { reportError } from "../utils/error";

type Props = { children: React.ReactNode };

export default class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report centrally and keep console fallback
    try {
      reportError(error, { errorInfo });
    } catch (_e) {
      console.error("App Error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-900 text-zinc-200">
          <div className="max-w-lg p-8 bg-zinc-800 border border-zinc-700 rounded">
            <h1 className="text-xl font-bold mb-2">Application Error</h1>
            <p className="mb-4">The application encountered an error. Refresh to try again.</p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 bg-blue-600 rounded"
                onClick={() => window.location.reload()}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }
    // Cast to any to avoid rare typing conflicts in different TS configs
    // props should normally exist on React.Component, but some toolchains treat this differently.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this as any).props.children;
  }
}
