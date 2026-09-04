import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 text-[#032038]">
          <div className="glass-card max-w-lg w-full rounded-3xl p-8 shadow-2xl border-2 border-red-300/60 bg-white/90 space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-600 grid place-items-center mx-auto shadow-inner">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="display text-2xl font-black text-[#032038]">
                Something unexpected happened
              </h2>
              <p className="text-xs font-semibold text-[#032038]/70 leading-relaxed">
                The interface encountered a rendering issue. Click reload to refresh the live session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-2xl text-[11px] font-mono text-red-900 text-left overflow-x-auto max-h-28">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary text-xs py-2.5 px-5 font-black flex items-center gap-2 shadow-md"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = '/mentor-dashboard';
                }}
                className="btn-ghost text-xs py-2.5 px-4 font-black flex items-center gap-2 rounded-2xl border border-black/10 text-[#032038]"
              >
                <Home size={14} /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
