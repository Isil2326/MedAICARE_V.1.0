// ============================================================================
// APP v6.0 — MediAI Care · Architecture B (Triage → Focus pour cliniciens)
// Patient: sidebar + dashboards (inchangé). Clinicien: ClinicianHub plein écran.
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard, Wifi, LogOut, AlertTriangle,
  MessageSquare, Bell, ChevronRight, Lock,
} from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import ClinicianHub from './components/clinician/ClinicianHub';
import DevicesView from './components/DevicesView';
import Messaging, { seedDemoData as seedMessagingDemo } from './components/Messaging';
import { PrototypeBanner } from './components/PrototypeBanner';
import { APP_VERSION, APP_STATUS_LABEL, TECH_FACTS } from './utils/prototypeNotice';
import { cn } from './utils/cn';
import type { ViewMode } from './types/medical';

// Patient-only navigation. Clinician navigation lives entirely inside ClinicianHub.
const patientNavItems = [
  { key: 'patient'  as ViewMode, label: 'Tableau de bord', short: 'Accueil',  icon: LayoutDashboard },
  { key: 'messages' as ViewMode, label: 'Messages',         short: 'Messages', icon: MessageSquare },
  { key: 'devices'  as ViewMode, label: 'Mes appareils',    short: 'Appareils', icon: Wifi },
];

// ─── Inner App ────────────────────────────────────────────────────────────────

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [activeView, setActiveView]   = useState<ViewMode>('landing');
  const [accessDenied, setAccessDenied] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'patient' || user.role === 'clinician') {
      try { seedMessagingDemo(user.id, user.role); } catch (e) { console.warn('Seed messaging failed', e); }
    }
    // Only the patient shell displays the unread badge — skip the polling for
    // clinicians (whose ClinicianHub doesn't show it) to avoid wasted ticks.
    if (user.role !== 'patient') return;
    const updateUnread = () => {
      try {
        const msgs: any[] = JSON.parse(localStorage.getItem('mediai_messages_v1') || '[]');
        setUnreadMessages(msgs.filter(m => m.recipientId === user.id && !m.read).length);
      } catch { setUnreadMessages(0); }
    };
    updateUnread();
    window.addEventListener('mediai:messages:updated', updateUnread);
    const interval = setInterval(updateUnread, 3000);
    return () => { window.removeEventListener('mediai:messages:updated', updateUnread); clearInterval(interval); };
  }, [user]);

  const navigate = useCallback((view: ViewMode) => {
    // Patients must never reach 'doctor' (clinician shell). Block explicitly.
    if (user?.role === 'patient' && view === 'doctor') {
      setAccessDenied("Cet onglet n'est pas disponible pour ce rôle.");
      setTimeout(() => setAccessDenied(null), 3500);
      return;
    }
    // For clinicians, App's navigate is mostly unused (ClinicianHub handles its own
    // navigation). Only landing and 'doctor' (the post-login route) are valid.
    if (user?.role === 'clinician' && view !== 'landing' && view !== 'doctor') {
      setAccessDenied("Cet onglet n'est pas disponible pour ce rôle.");
      setTimeout(() => setAccessDenied(null), 3500);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user]);

  // After login, route to the right shell based on role
  useEffect(() => {
    if (user && activeView === 'landing') {
      setActiveView(user.role === 'patient' ? 'patient' : 'doctor');
    }
  }, [user, activeView]);

  useEffect(() => {
    if (!loading && !user && activeView !== 'landing') setActiveView('landing');
  }, [user, loading, activeView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <img src="/logo-mark.png" alt="MediAI Care" className="w-16 h-16 animate-float" />
          <div className="text-[13px] text-slate-500 font-medium tracking-tight">Connexion sécurisée en cours…</div>
        </div>
      </div>
    );
  }

  if (activeView === 'landing' || !user) {
    return <LandingPage onNavigate={(v) => navigate(v as ViewMode)} />;
  }

  // ── Clinician: full-bleed V3-Dark hub. No App sidebar. ──────────────────
  if (user.role === 'clinician') {
    return <ClinicianHub />;
  }

  // ── Patient: classic sidebar shell ───────────────────────────────────────
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstName = user.name.split(' ')[0];
  const currentNav = patientNavItems.find(n => n.key === activeView);
  const handleLogout = () => { logout(); setActiveView('landing'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {accessDenied && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm animate-fade-in-up">
          <div className="bg-white border border-amber-200 rounded-2xl p-4 card-shadow-md flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Accès restreint</div>
              <div className="text-[12px] text-slate-500 mt-0.5 font-medium">{accessDenied}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar desktop (patient seulement) ── */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-white border-r border-slate-200/80 min-h-screen sticky top-0 h-screen">

        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate('patient')} className="flex items-center gap-3 w-full group">
            <img src="/logo-mark.png" alt="MediAI Care" className="w-9 h-9 shrink-0" />
            <div className="text-left">
              <div className="flex items-baseline leading-none">
                <span className="text-[15px] font-black text-slate-900 tracking-[-0.02em]">Medi</span>
                <span className="text-[15px] font-black text-[#1565C0] tracking-[-0.02em]">AI</span>
                <span className="text-[10px] font-bold text-slate-400 tracking-wide ml-1.5 self-center">CARE</span>
              </div>
              <div className="text-[7.5px] text-slate-300 font-bold mt-[3px] uppercase tracking-[0.18em]">
                Espace patient
              </div>
            </div>
          </button>
        </div>

        <div className="px-3 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user.name}</div>
              <div className="text-[10.5px] text-slate-400 truncate font-medium">{user.email}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" title="En ligne" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold px-3 mb-3">Navigation</p>
          {patientNavItems.map(({ key, label, icon: Icon }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                  isActive ? 'bg-brand-100' : 'bg-slate-100'
                )}>
                  <Icon className={cn('w-3.5 h-3.5', isActive ? 'text-brand-700' : 'text-slate-500')} />
                </div>
                <span className="flex-1 text-left font-semibold">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-coral-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {isActive && <div className="w-1 h-4 rounded-full bg-brand-600 ml-auto shrink-0" />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <Lock className="w-3 h-3 text-brand-600 shrink-0" />
            <span className="text-[10.5px] text-slate-500 font-semibold" title={TECH_FACTS.passwordHashing}>Session locale · {APP_STATUS_LABEL}</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between px-5 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="MediAI Care" className="lg:hidden w-7 h-7 shrink-0" />
              <div>
                <h1 className="text-[14px] font-bold text-slate-900 tracking-tight">
                  {currentNav?.label || `Bonjour, ${firstName}`}
                </h1>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block capitalize">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => navigate('messages')} className="relative p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-700">
                <Bell className="w-4.5 h-4.5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadMessages}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] text-brand-700 bg-brand-50 border border-brand-200/60 px-2.5 py-1.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                En ligne
              </div>
              <button onClick={handleLogout} className="hidden lg:block p-2 rounded-xl hover:bg-red-50 transition text-slate-300 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-5 lg:p-7">
          <div className="max-w-[1360px] mx-auto">
            {activeView === 'patient'  && <PatientDashboard />}
            {activeView === 'devices'  && <DevicesView />}
            {activeView === 'messages' && <Messaging />}
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around px-1 pt-1 pb-safe z-40 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]" style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom, 4px))' }}>
          {patientNavItems.map(({ key, icon: Icon, short }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button key={key} onClick={() => navigate(key)} className={cn(
                'relative flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-0',
                isActive ? 'text-brand-600' : 'text-slate-400'
              )}>
                <div className={cn('p-1 rounded-lg transition-all', isActive && 'bg-brand-50')}>
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                </div>
                <span className={cn('text-[10px] font-semibold truncate', isActive ? 'text-brand-600' : 'text-slate-400')}>{short}</span>
                {badge > 0 && (
                  <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-coral-500 text-white text-[7px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-slate-400 hover:text-red-500 transition rounded-xl">
            <div className="p-1 rounded-lg">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold">Quitter</span>
          </button>
        </nav>

        <footer className="hidden lg:block border-t border-slate-100 bg-white/60 px-6 py-3">
          <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" />
              MediAI Care · {user.name}
            </span>
            <span>{APP_STATUS_LABEL} · Données simulées · Stockage local · v{APP_VERSION}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PrototypeBanner />
      <AppContent />
    </AuthProvider>
  );
}
