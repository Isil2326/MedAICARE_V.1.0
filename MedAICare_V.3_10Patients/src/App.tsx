// ============================================================================
// APP v4.0.0 — MediAI Care · Thème Naturel mySugr-inspired
// Navigation chaleureuse · RBAC · Messagerie
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  Heart, LayoutDashboard, Stethoscope,
  Wifi, FileText, LogOut, AlertTriangle,
  MessageSquare, ChevronRight, Activity
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
  { key: 'patient'  as ViewMode, label: 'Mon tableau de bord', icon: LayoutDashboard, roles: ['patient'] },
  { key: 'messages' as ViewMode, label: 'Messages',            icon: MessageSquare,   roles: ['patient', 'clinician'] },
  { key: 'devices'  as ViewMode, label: 'Mes appareils',       icon: Wifi,            roles: ['patient'] },
  { key: 'doctor'   as ViewMode, label: 'Espace clinique',     icon: Stethoscope,     roles: ['clinician'] },
  { key: 'audit'    as ViewMode, label: 'Audit & traçabilité', icon: FileText,        roles: ['clinician'] },
];

// ─── Inner App ────────────────────────────────────────────────────────────────

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('landing');
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
        const count = msgs.filter(m => m.recipientId === user.id && !m.read).length;
        setUnreadMessages(count);
      } catch { setUnreadMessages(0); }
    };
    updateUnread();
    window.addEventListener('mediai:messages:updated', updateUnread);
    const interval = setInterval(updateUnread, 3000);
    return () => {
      window.removeEventListener('mediai:messages:updated', updateUnread);
      clearInterval(interval);
    };
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
      setAccessDenied(
        `Accès réservé ${user.role === 'patient' ? 'aux cliniciens' : 'aux patients'}.`
      );
      setTimeout(() => setAccessDenied(null), 4000);
      return;
    }
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, canAccess]);

  useEffect(() => {
    if (user && activeView === 'landing') {
      setActiveView(user.role === 'patient' ? 'patient' : 'doctor');
    }
  }, [user, activeView]);

  useEffect(() => {
    if (!loading && !user && activeView !== 'landing') {
      setActiveView('landing');
    }
  }, [user, loading, activeView]);

  const handleLogout = () => {
    logout();
    setActiveView('landing');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6ef] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center animate-pulse">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div className="text-[13px] text-sage-500 font-medium">Chargement sécurisé…</div>
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

  return (
    <div className="min-h-screen bg-[#f4f6ef] flex">

      {/* ── Toast accès refusé ── */}
      {accessDenied && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-[13px] font-semibold text-amber-800">Accès restreint</div>
              <div className="text-[12px] text-amber-700 mt-0.5">{accessDenied}</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-white border-r border-sage-100 min-h-screen sticky top-0 h-screen">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-sage-100">
          <button
            onClick={() => navigate(isPatient ? 'patient' : 'doctor')}
            className="flex items-center gap-3 group w-full"
          >
            <div className="w-9 h-9 rounded-xl bg-brand-600 shadow-[0_4px_14px_rgba(58,110,40,0.3)] flex items-center justify-center shrink-0">
              <Heart className="w-4.5 h-4.5 text-white fill-white/30" />
            </div>
            <div className="text-left">
              <div className="text-[17px] font-bold text-sage-900 tracking-tight">
                MediAI<span className="text-brand-600">Care</span>
              </div>
              <div className="text-[10px] text-sage-400 font-medium mt-0.5">
                {isPatient ? 'Espace patient' : 'Console clinique'}
              </div>
            </div>
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="px-4 py-4 border-b border-sage-50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-sage-50">
            <div className="w-9 h-9 rounded-xl bg-brand-100 ring-2 ring-brand-200 flex items-center justify-center text-[12px] font-bold text-brand-700 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-sage-900 truncate">{user.name}</div>
              <div className="text-[11px] text-sage-400 truncate">{user.email}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" title="En ligne" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] text-sage-400 uppercase tracking-widest font-bold px-3 mb-3">Navigation</div>
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all',
                  isActive
                    ? 'bg-brand-600 text-white shadow-[0_2px_10px_rgba(58,110,40,0.28)]'
                    : 'text-sage-600 hover:text-sage-900 hover:bg-sage-50'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-sage-400')} />
                <span className="flex-1 text-left">{label}</span>
                {badge > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-coral-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {!isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-sage-300 opacity-0 group-hover:opacity-100 transition" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-4 border-t border-sage-100 space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-100">
            <Activity className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <div className="text-[11px] text-brand-700 font-semibold">Session active · AES-256</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] text-sage-500 hover:text-coral-600 hover:bg-coral-50 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar mobile + greeting */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sage-100 shadow-[0_1px_4px_rgba(30,46,26,0.05)]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-[56px]">
            <div className="flex items-center gap-3">
              {/* Mobile logo */}
              <div className="lg:hidden w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white/30" />
              </div>
              <div>
                <h1 className="text-[14px] font-bold text-sage-900">
                  Bonjour, {firstName} 👋
                </h1>
                <p className="text-[11px] text-sage-400 hidden sm:block">
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('messages')}
                className="relative p-2 rounded-xl hover:bg-sage-50 transition text-sage-500 hover:text-sage-900"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadMessages}
                  </span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-brand-600 bg-brand-50 border border-brand-100 px-2.5 py-1.5 rounded-full font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                Opérationnel
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1340px] mx-auto">
            {activeView === 'patient'  && user.role === 'patient'    && <PatientDashboard />}
            {activeView === 'doctor'   && user.role === 'clinician'  && <DoctorDashboard />}
            {activeView === 'devices'  && user.role === 'patient'    && <DevicesView />}
            {activeView === 'messages'                               && <Messaging />}
            {activeView === 'audit'    && user.role === 'clinician'  && <AuditLog />}

            {activeView === 'patient'  && user.role !== 'patient'    && <AccessDeniedBlock message="Réservé aux patients." />}
            {activeView === 'doctor'   && user.role !== 'clinician'  && <AccessDeniedBlock message="Réservé aux cliniciens." />}
            {activeView === 'audit'    && user.role !== 'clinician'  && <AccessDeniedBlock message="Journal d'audit réservé aux cliniciens." />}
          </div>
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-sage-100 flex items-center justify-around px-2 py-2 z-40 shadow-[0_-4px_16px_rgba(30,46,26,0.06)]">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all',
                  isActive ? 'text-brand-600' : 'text-sage-400'
                )}
              >
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-coral-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
                {isActive && <div className="w-1 h-1 rounded-full bg-brand-600" />}
              </button>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 py-1 px-3 text-sage-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>

        {/* Footer desktop */}
        <footer className="hidden lg:block border-t border-sage-100 bg-white/50 px-6 py-3">
          <div className="max-w-[1340px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-sage-400">
            <span>© 2026 MediAI Care · {user.name}</span>
            <span>IEC 62304 · ISO 13485 · RGPD · HDS · v4.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ─── Access Denied Block ───────────────────────────────────────────────────────

function AccessDeniedBlock({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <div className="text-center">
        <div className="text-[17px] font-bold text-sage-800 mb-1">Accès restreint</div>
        <div className="text-[13px] text-sage-500">{message}</div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
