import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Callback when user clicks reset (e.g. clear form error state) */
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary dédié au formulaire de connexion / vérification de sécurité.
 * Fournit un bouton "Réinitialiser" pour reprendre sans recharger la page.
 */
export class LoginFormErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LoginFormErrorBoundary]', error, errorInfo);
  }

  private handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-amber-200 text-sm font-medium mb-1">Vérification de sécurité interrompue</p>
              <p className="text-amber-200/80 text-xs mb-3">
                {this.state.error?.message || 'Une erreur est survenue.'}
              </p>
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 rounded px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20"
              >
                <RefreshCw size={16} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
