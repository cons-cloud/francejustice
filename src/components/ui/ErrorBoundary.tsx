import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldCheck } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 select-none relative">
          <div className="max-w-md w-full bg-white border-2 border-slate-200 rounded-3xl p-8 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider mb-2">
                Incident Technique Isolé
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Une interruption temporaire est survenue
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {"Le module de protection de France Justice a sécurisé vos données. Vous pouvez recharger la page ou revenir à l'accueil de la plateforme."}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full justify-center rounded-xl py-3 bg-linear-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser la page
              </Button>

              <Button
                variant="outline"
                onClick={() => { window.location.href = '/'; }}
                className="w-full justify-center rounded-xl py-3 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold cursor-pointer"
              >
                <Home className="w-4 h-4 mr-2" />
                {"Retourner à l'accueil"}
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Vos sessions et documents demeurent chiffrés et protégés</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
