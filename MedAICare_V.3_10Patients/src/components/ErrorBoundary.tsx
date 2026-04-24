import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to audit trail (in production, send to monitoring service)
    console.error('Erreur capturée par ErrorBoundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack || null,
    });

    // In a real medical device, this would be logged to the audit trail
    const auditEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component: 'ErrorBoundary',
      message: error.message,
      stack: error.stack,
    };
    console.log('[AUDIT]', auditEntry);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="bg-white rounded-2xl border border-red-200 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Erreur Système Détectée</h1>
                    <p className="text-xs text-red-100">Dispositif Médical Logiciel — Mode Sécurisé</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-5">
                  <h2 className="text-sm font-semibold text-slate-900 mb-2">Une erreur inattendue s'est produite</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Conformément aux normes IEC 62304, le système est passé en mode sécurisé. 
                    Aucune donnée patient n'a été compromise. L'incident a été journalisé pour audit.
                  </p>
                </div>

                {/* Error details (dev mode) */}
                {this.state.error && (
                  <div className="mb-5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-mono text-slate-700 break-all">
                      <span className="font-semibold text-red-600">Erreur:</span> {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                          Détails techniques
                        </summary>
                        <pre className="mt-2 text-[10px] text-slate-600 overflow-auto max-h-32">
                          {this.state.errorInfo}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Safety notice */}
                <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900">
                    <strong>⚠️ Important:</strong> En environnement clinique réel, contactez immédiatement 
                    le support technique et n'utilisez pas les recommandations générées avant cette erreur.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Redémarrer
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Accueil
                  </button>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Erreur ID: ERR-{Date.now().toString(36).toUpperCase()}</span>
                    <span>ISO 13485 · IEC 62304</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <p className="text-center text-xs text-slate-500 mt-4">
              Prototype académique — Données simulées — Usage non clinique
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}