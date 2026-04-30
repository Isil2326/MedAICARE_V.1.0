// ============================================================================
// APP v5.0 — MediAI Care · Premium Healthtech
// Sidebar épurée · Navigation fluide · Mobile premium
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard, Stethoscope, Wifi, FileText,
  LogOut, AlertTriangle, MessageSquare, Activity,
  Bell, ChevronRight, Lock,
} from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AuditLog from './components/AuditLog';
import DevicesView from './components/DevicesView';
import Messaging, { seedDemoData as seedMessagingDemo } from './components/Messaging';
import { cn } from './utils/cn';
import type { ViewMode } from './types/medical';

const allNavItems = [
  { key: 'patient'  as ViewMode, label: 'Tableau de bord', icon: LayoutDashboard, roles: ['patient'] },
  { key: 'messages' as ViewMode, label: 'Messages',         icon: MessageSquare,   roles: ['patient', 'clinician'] },
  { key: 'devices'  as ViewMode, label: 'Mes appareils',    icon: Wifi,            roles: ['patient'] },
  { key: 'doctor'   as ViewMode, label: 'Espace clinique',  icon: Stethoscope,     roles: ['clinician'] },
  { key: 'audit'    as ViewMode, label: 'Audit & logs',     icon: FileText,        roles: ['clinician'] },
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

  const navItems = user ? allNavItems.filter(item => item.roles.includes(user.role)) : [];

  const canAccess = useCallback((view: ViewMode): boolean => {
    if (!user) return false;
    const item = allNavItems.find(i => i.key === view);
    if (!item) return true;
    return item.roles.includes(user.role);
  }, [user]);

  const navigate = useCallback((view: ViewMode) => {
    if (view !== 'landing' && user && !canAccess(view)) {
      setAccessDenied(`Accès réservé ${user.role === 'patient' ? 'aux cliniciens' : 'aux patients'}.`);
      setTimeout(() => setAccessDenied(null), 3500);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, canAccess]);

  useEffect(() => {
    if (user && activeView === 'landing') setActiveView(user.role === 'patient' ? 'patient' : 'doctor');
  }, [user, activeView]);

  useEffect(() => {
    if (!loading && !user && activeView !== 'landing') setActiveView('landing');
  }, [user, loading, activeView]);

  const handleLogout = () => { logout(); setActiveView('landing'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-[0_8px_24px_rgba(58,110,40,0.3)]">
            <Activity className="w-7 h-7 text-white animate-pulse" />
          </div>
          <div className="text-[13px] text-slate-500 font-medium tracking-tight">Connexion sécurisée en cours…</div>
        </div>
      </div>
    );
  }

  if (activeView === 'landing' || !user) {
    return <LandingPage onNavigate={(v) => navigate(v as ViewMode)} />;
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const firstName = user.name.split(' ')[0];
  const isPatient = user.role === 'patient';
  const currentNav = allNavItems.find(n => n.key === activeView);

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Toast accès refusé ── */}
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

      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex w-[248px] shrink-0 flex-col bg-white border-r border-slate-200/80 min-h-screen sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <button onClick={() => navigate(isPatient ? 'patient' : 'doctor')} className="flex items-center gap-3 w-full group">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(58,110,40,0.3)]">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[16px] font-bold text-slate-900 tracking-tight leading-none">
                MediAI<span className="text-brand-600">Care</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                {isPatient ? 'Espace patient' : 'Console clinique'}
              </div>
            </div>
          </button>
        </div>

        {/* User profile */}
        <div className="px-3 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0',
              isPatient ? 'bg-brand-100 text-brand-700' : 'bg-blue-100 text-blue-700'
            )}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-900 truncate leading-tight">{user.name}</div>
              <div className="text-[10.5px] text-slate-400 truncate font-medium">{user.email}</div>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" title="En ligne" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold px-3 mb-3">Navigation</p>
          {navItems.map(({ key, label, icon: Icon }) => {
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
                    ? 'bg-brand-50 text-brand-700 shadow-[inset_0_0_0_1px_rgba(74,138,53,0.2)]'
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

        {/* Sidebar footer */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-100 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <Lock className="w-3 h-3 text-brand-600 shrink-0" />
            <span className="text-[10.5px] text-slate-500 font-semibold">Session sécurisée · AES-256</span>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium">
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_0_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between px-5 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              {/* Mobile logo */}
              <div className="lg:hidden w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
                <Activity className="w-3.5 h-3.5 text-white" />
              </div>
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

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-5 lg:p-7">
          <div className="max-w-[1360px] mx-auto">
            {activeView === 'patient'  && user.role === 'patient'   && <PatientDashboard />}
            {activeView === 'doctor'   && user.role === 'clinician' && <DoctorDashboard />}
            {activeView === 'devices'  && user.role === 'patient'   && <DevicesView />}
            {activeView === 'messages'                              && <Messaging />}
            {activeView === 'audit'    && user.role === 'clinician' && <AuditLog />}

            {activeView === 'patient'  && user.role !== 'patient'   && <AccessDeniedBlock message="Réservé aux patients." />}
            {activeView === 'doctor'   && user.role !== 'clinician' && <AccessDeniedBlock message="Réservé aux cliniciens." />}
            {activeView === 'audit'    && user.role !== 'clinician' && <AccessDeniedBlock message="Journal d'audit réservé aux cliniciens." />}
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around px-2 py-1 z-40 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button key={key} onClick={() => navigate(key)} className={cn(
                'relative flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all',
                isActive ? 'text-brand-600' : 'text-slate-400'
              )}>
                <Icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                {badge > 0 && (
                  <span className="absolute top-1 right-2 w-3.5 h-3.5 rounded-full bg-coral-500 text-white text-[7px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {isActive && <div className="w-1 h-1 rounded-full bg-brand-600" />}
              </button>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center gap-0.5 py-2 px-4 text-slate-400 hover:text-red-500 transition">
            <LogOut className="w-5 h-5" />
          </button>
        </nav>

        {/* Footer desktop */}
        <footer className="hidden lg:block border-t border-slate-100 bg-white/60 px-6 py-3">
          <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3" />
              MediAI Care · {user.name}
            </span>
            <span>IEC 62304 · ISO 13485 · RGPD · HDS · v5.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Access Denied ────────────────────────────────────────────────────────────

function AccessDeniedBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>
      <div className="text-center">
        <div className="text-[16px] font-bold text-slate-900 mb-1.5">Accès restreint</div>
        <div className="text-[13px] text-slate-500 font-medium">{message}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
