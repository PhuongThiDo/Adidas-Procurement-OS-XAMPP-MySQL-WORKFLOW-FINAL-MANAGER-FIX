import React from "react";

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  declare readonly props: Props;

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("UI rendering error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-100 p-8 font-mono">
        <div className="max-w-4xl mx-auto bg-white border-2 border-red-600 p-6 shadow-sm">
          <h1 className="text-xl font-black text-red-700 uppercase">Page rendering error</h1>
          <p className="mt-3 text-sm text-gray-800">The page could not render. The application was prevented from becoming a blank screen.</p>
          <pre className="mt-4 whitespace-pre-wrap bg-gray-50 border p-4 text-xs text-red-800 overflow-auto">{this.state.error.message}{"\n\n"}{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} className="mt-4 bg-black text-white px-5 py-2 font-bold uppercase text-xs">Reload page</button>
        </div>
      </div>
    );
  }
}
