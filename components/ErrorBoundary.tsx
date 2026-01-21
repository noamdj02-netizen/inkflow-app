import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
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

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
          {/* Animated Background */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="text-center max-w-md relative z-10">
            <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
            <h1 className="text-3xl font-serif font-bold text-white mb-2">Une erreur s'est produite</h1>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'Erreur inconnue'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg shadow-amber-400/20"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

