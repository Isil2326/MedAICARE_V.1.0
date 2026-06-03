// ============================================================================
// APP v3.3.2 — MediAI Care
// Messagerie · RBAC · Navigation unifiée · Versionnement
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import {
  Heart, LayoutDashboard, Stethoscope,
  Wifi, FileText, Menu, X, LogOut, AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LandingPage from './components/LandingPage';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import AuditLog from './components/AuditLog';
import DevicesView from './components/DevicesView';
import Messaging, { seedDemoData as seedMessagingDemo } from './components/Messaging';

import type { ViewMode } from './types/medical';

const allNavItems = [
  { key: 'patient'   as ViewMode, label: 'Mon espace',   icon: LayoutDashboard, roles: ['patient'] },
  { key: 'messages'  as ViewMode, label: 'Messages',      icon: MessageSquare,   roles: ['patient', 'clinician'] },
  { key: 'devices'   as ViewMode, label: 'Dispositifs',   icon: Wifi,            roles: ['patient'] },
  { key: 'doctor'    as ViewMode, label: 'Espace Clinique', icon: Stethoscope,   roles: ['clinician'] },
  { key: 'audit'     as ViewMode, label: 'Audit',          icon: FileText,       roles: ['clinician'] },
];

// ─── Notification badge ───────────────────────────────────────────────────────

function NavBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
      {count}
    </span>
  );
}

// ─── Inner App ────────────────────────────────────────────────────────────────

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [activeView, setActiveView] = useState<ViewMode>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessDenied, setAccessDenied] = useState<string | null>(null);

  // Compter les messages non lus
  const [unreadMessages, setUnreadMessages] = useState(0);
  useEffect(() => {
    if (!user) return;
    // ⚡ FIX v3.3.2 — Seed AU DÉMARRAGE (avant ouverture de la messagerie)
    // Sans cela, le badge ne s'affiche jamais tant que l'utilisateur n'a pas
    // ouvert manuellement la page Messages au moins une fois.
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
    // ⚡ Refresh instantané déclenché par le service messagerie
    window.addEventListener('mediai:messages:updated', updateUnread);
    const interval = setInterval(updateUnread, 3000);
    return () => {
      window.removeEventListener('mediai:messages:updated', updateUnread);
      clearInterval(interval);
    };
  }, [user]);

  // Navigation filtrée selon le rôle
  const navItems = user
    ? allNavItems.filter(item => item.roles.includes(user.role))
    : [];

  const canAccess = useCallback((view: ViewMode): boolean => {
    if (!user) return false;
    const item = allNavItems.find(i => i.key === view);
    if (!item) return true;
    return item.roles.includes(user.role);
  }, [user]);

  const navigate = useCallback((view: ViewMode) => {
    if (view !== 'landing' && user && !canAccess(view)) {
      setAccessDenied(
        `Accès refusé — cette section est réservée ${user.role === 'patient' ? 'aux cliniciens' : 'aux patients'}.`
      );
      setTimeout(() => setAccessDenied(null), 4000);
      return;
    }
    setActiveView(view);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [user, canAccess]);

  // Redirection auto après login
  useEffect(() => {
    if (user && activeView === 'landing') {
      setActiveView(user.role === 'patient' ? 'patient' : 'doctor');
    }
  }, [user, activeView]);

  // Déconnexion → landing
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
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="flex items-center gap-3 text-white/60 text-[13px]">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Initialisation sécurisée…
        </div>
      </div>
    );
  }

  if (activeView === 'landing' || !user) {
    return <LandingPage onNavigate={(v) => navigate(v as ViewMode)} />;
  }

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    patient:  { title: 'Mon Espace Patient',    subtitle: 'Suivi glycémique, recommandations IA et alertes en temps réel' },
    doctor:   { title: 'Espace Clinique',        subtitle: 'Cohorte patients, fiches cliniques et performance des modèles IA' },
    devices:  { title: 'Dispositifs Connectés',  subtitle: 'Capteurs CGM, pompes à insuline et wearables IoMT' },
    audit:    { title: 'Audit & Traçabilité',    subtitle: 'Journal décisionnel conforme IEC 62304 · ISO 13485' },
    messages: { title: 'Messagerie Sécurisée',   subtitle: 'Échanges chiffrés Patient ↔ Clinicien · Conforme HDS' },
  };

  const { title, subtitle } = pageMeta[activeView] ?? { title: '', subtitle: '' };

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex">

      {/* ── Notification accès refusé ── */}
      {accessDenied && (
        <div className="fixed top-4 right-4 z-[100] max-w-md animate-in slide-in-from-top-2">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[13px] font-semibold text-amber-200">Accès restreint</div>
                <div className="text-[12px] text-amber-200/80 mt-1">{accessDenied}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-[260px] bg-[#0A1020]/95 backdrop-blur-xl
        border-r border-white/[0.07]
        flex flex-col
        transform transition-transform duration-200
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <button
            onClick={() => navigate(user.role === 'patient' ? 'patient' : 'doctor')}
            className="flex items-center gap-3 group w-full"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 shadow-[0_0_24px_rgba(20,184,166,0.25)] flex items-center justify-center shrink-0">
              <Heart className="w-4.5 h-4.5 text-white fill-white/20" />
            </div>
            <div className="text-left">
              <div className="text-[16px] font-bold text-white tracking-tight group-hover:text-teal-300 transition-colors">
                MediAI<span className="text-teal-400">Care</span>
              </div>
              <div className="text-[10px] text-white/35 mt-0.5 font-medium tracking-wide">
                v3.3.2 · {user.role === 'patient' ? 'Patient' : 'Clinicien'}
              </div>
            </div>
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/[0.03]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-teal-500/20 ring-1 ring-white/10 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-white truncate">{user.name}</div>
              <div className="text-[10.5px] text-white/40 truncate">{user.email}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="En ligne" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          <div className="text-[10px] text-white/25 uppercase tracking-widest font-semibold px-3 mb-2 mt-1">Navigation</div>
          {navItems.map(({ key, label, icon: Icon }) => {
            const isActive = activeView === key;
            const badge = key === 'messages' ? unreadMessages : 0;
            return (
              <button
                key={key}
                onClick={() => navigate(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-[13px] font-medium transition-all
                  ${isActive
                    ? 'bg-white/[0.09] text-white ring-1 ring-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/[0.04]'
                  }
                `}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-300' : 'text-white/40'}`} />
                {label}
                {badge > 0 && <NavBadge count={badge} />}
              </button>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/[0.15]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-[11px] text-emerald-300/80 font-medium">Session active · AES-256</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] text-white/45 hover:text-rose-400 hover:bg-rose-500/[0.06] transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-[#0A1020]/85 backdrop-blur-xl border-b border-white/[0.07]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-[58px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/[0.06] transition text-white/70"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div>
                <h1 className="text-[15px] font-semibold text-white tracking-tight">{title}</h1>
                <p className="text-[10.5px] text-white/40 hidden sm:block mt-0.5">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Messages rapide */}
              <button
                onClick={() => navigate('messages')}
                className="relative p-2 rounded-lg hover:bg-white/[0.06] transition text-white/55 hover:text-white/90"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-[#070B14]">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {/* Statut système */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-300 bg-emerald-500/[0.08] border border-emerald-500/[0.18] px-2.5 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Opérationnel
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.06),_transparent_55%)]">
          <div className="max-w-[1300px] mx-auto">

            {/* Patient */}
            {activeView === 'patient' && user.role === 'patient' && <PatientDashboard />}

            {/* Clinicien */}
            {activeView === 'doctor' && user.role === 'clinician' && <DoctorDashboard />}

            {/* Dispositifs — patient uniquement */}
            {activeView === 'devices' && user.role === 'patient' && <DevicesView />}

            {/* Messagerie — tous rôles */}
            {activeView === 'messages' && <Messaging />}

            {/* Audit — clinicien uniquement */}
            {activeView === 'audit' && user.role === 'clinician' && <AuditLog />}

            {/* Garde-fous RBAC */}
            {activeView === 'patient' && user.role !== 'patient' && (
              <AccessDeniedBlock message="Cette section est réservée aux patients." />
            )}
            {activeView === 'doctor' && user.role !== 'clinician' && (
              <AccessDeniedBlock message="Cette section est réservée aux cliniciens." />
            )}
            {activeView === 'audit' && user.role !== 'clinician' && (
              <AccessDeniedBlock message="Le journal d'audit est réservé aux cliniciens." />
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.06] bg-[#0A1020]/60 px-6 py-3">
          <div className="max-w-[1300px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-white/30">
            <span>© 2026 MediAI Care · {user.name}</span>
            <span className="hidden sm:inline">IEC 62304 · ISO 13485 · RGPD · HDS · v3.3.2</span>
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
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-400" />
      </div>
      <div className="text-center">
        <div className="text-[16px] font-semibold text-white/80 mb-1">Accès restreint</div>
        <div className="text-[13px] text-white/45">{message}</div>
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
