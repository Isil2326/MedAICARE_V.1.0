import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import { APP_DISCLAIMER_SHORT, APP_VERSION } from '@/utils/prototypeNotice';

const DISMISS_KEY = 'mediai_proto_banner_dismissed_v1';

export function PrototypeBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-500 text-slate-900 border-b border-amber-600 shadow-sm"
    >
      <div className="max-w-screen-2xl mx-auto px-4 py-2 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 text-[12px] sm:text-[13px] font-semibold leading-tight">
          <span className="uppercase tracking-wide mr-2">Prototype académique</span>
          <span className="font-medium hidden sm:inline">— {APP_DISCLAIMER_SHORT} · Données simulées · Stockage local navigateur</span>
          <span className="font-medium sm:hidden">— {APP_DISCLAIMER_SHORT}</span>
        </div>
        <span className="hidden md:inline text-[11px] font-bold opacity-70">v{APP_VERSION}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Masquer la bannière prototype"
          className="p-1 rounded hover:bg-amber-600/40 transition-colors"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
