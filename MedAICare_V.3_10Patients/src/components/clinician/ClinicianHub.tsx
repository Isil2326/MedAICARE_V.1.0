// ============================================================================
// ClinicianHub · Shell V3-Dark · Architecture B (Triage → Focus)
// Remplace l'ancien DoctorDashboard. Plein écran, pas de sidebar App.
// Modes: triage (landing) · focus (patient + décision) · cohort · messages · audit
// ============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { DECISION_LOG_STORAGE_KEY } from '../../engine/decisionLog';
import { getActiveAlertCount } from './alertQueue';
import TriageView from './TriageView';
import FocusView from './FocusView';
import CohortView from './CohortView';
import Messaging from '../Messaging';
import AuditLog from '../AuditLog';
import {
  BG, SURFACE, BORDER, AMBER, AMBER_DIM, RED, MUTED, MUTED_2, BRIGHT,
} from './v3DarkTheme';

type ClinicianMode = 'triage' | 'focus' | 'cohort' | 'messages' | 'audit';

const STORAGE_KEY = 'medai_clinician_mode_v1';

// ── Persist last clinician mode (so refresh keeps you where you were) ──────
function loadInitialMode(): ClinicianMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === 'triage' || raw === 'cohort' || raw === 'messages' || raw === 'audit') {
      return raw;
    }
  } catch { /* ignore */ }
  return 'triage';
}

export default function ClinicianHub() {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<ClinicianMode>(() => loadInitialMode());
  const [focusedPatientId, setFocusedPatientId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logVersion, setLogVersion] = useState(0);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);

  // Persist mode (but not 'focus' — focus is transient, not a navigation target)
  useEffect(() => {
    if (mode !== 'focus') {
      try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
    }
  }, [mode]);

  // Re-compute live alert count whenever the decision log changes
  useEffect(() => {
    const onChange = (e: Event) => {
      if (e instanceof StorageEvent && e.key && e.key !== DECISION_LOG_STORAGE_KEY) return;
      setLogVersion(v => v + 1);
    };
    window.addEventListener('storage', onChange);
    window.addEventListener('mediai:decisionlog', onChange as EventListener);
    return () => {
      window.removeEventListener('storage', onChange);
      window.removeEventListener('mediai:decisionlog', onChange as EventListener);
    };
  }, []);

  // Live count of active alerts (re-evaluated whenever a decision is logged)
  const alertCount = useMemo(() => getActiveAlertCount(), [logVersion]);

  // Close profile dropdown on Escape and restore focus to trigger
  useEffect(() => {
    if (!profileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        profileBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileOpen]);

  const handleSelectPatient = useCallback((patientId: string) => {
    setFocusedPatientId(patientId);
    setMode('focus');
  }, []);

  const handleBackToTriage = useCallback(() => {
    setMode('triage');
    setFocusedPatientId(null);
  }, []);

  const handleSwitchMode = useCallback((next: ClinicianMode) => {
    setMode(next);
    if (next !== 'focus') setFocusedPatientId(null);
    setProfileOpen(false);
  }, []);

  const navTabs: { key: Exclude<ClinicianMode, 'focus'>; label: string }[] = [
    { key: 'triage',   label: 'Triage' },
    { key: 'cohort',   label: 'Cohorte' },
    { key: 'messages', label: 'Messages' },
    { key: 'audit',    label: 'Audit' },
  ];

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: BG, color: BRIGHT, overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ════ TOP BAR V3-DARK ════════════════════════════════════════ */}
      <nav style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 20px',
        background: SURFACE, borderBottom: `1px solid ${BORDER}`,
      }}>
        {/* Logo + brand */}
        <button
          onClick={() => handleSwitchMode('triage')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 0,
          }}
        >
          <img
            src="/logo-mark.png" alt="MediAI Care"
            style={{ width: 26, height: 'auto', filter: 'brightness(0) invert(1) opacity(0.9)' }}
          />
          <span style={{ fontWeight: 900, fontSize: 14, letterSpacing: '-0.04em', color: BRIGHT }}>
            Medi<span style={{ color: AMBER }}>AI</span> Care
          </span>
        </button>

        <span style={{
          fontSize: 9, fontWeight: 700, color: AMBER, background: AMBER_DIM,
          border: '1px solid rgba(255,171,0,0.25)', borderRadius: 4,
          padding: '3px 8px', letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          Clinicien Pro
        </span>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 18 }}>
          {navTabs.map(tab => {
            const active = mode === tab.key || (tab.key === 'triage' && mode === 'focus');
            return (
              <button
                key={tab.key}
                onClick={() => handleSwitchMode(tab.key)}
                style={{
                  padding: '7px 14px', borderRadius: 7,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: `1px solid ${active ? BORDER : 'transparent'}`,
                  color: active ? BRIGHT : MUTED_2,
                  letterSpacing: '-0.01em',
                  transition: 'background 0.15s',
                }}
              >
                {tab.label}
                {tab.key === 'triage' && alertCount > 0 && (
                  <span style={{
                    marginLeft: 6,
                    fontSize: 10, fontWeight: 800, color: AMBER,
                    background: AMBER_DIM, borderRadius: 3,
                    padding: '1px 5px',
                  }}>
                    {alertCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Pulse alert indicator */}
        {alertCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 6, padding: '5px 12px',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: RED,
              boxShadow: '0 0 0 4px rgba(239,68,68,0.15)',
            }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>
              {alertCount} alerte{alertCount > 1 ? 's' : ''} active{alertCount > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Profile + logout */}
        <div style={{ position: 'relative' }}>
          <button
            ref={profileBtnRef}
            onClick={() => setProfileOpen(o => !o)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: MUTED_2, fontSize: 11, fontWeight: 800, cursor: 'pointer',
              marginLeft: 8,
            }}
            aria-label="Profil et déconnexion"
            aria-haspopup="menu"
            aria-expanded={profileOpen}
          >
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'DR'}
          </button>
          {profileOpen && (
            <>
              <div
                onClick={() => setProfileOpen(false)}
                style={{
                  position: 'fixed', inset: 0, zIndex: 10,
                }}
              />
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10,
                minWidth: 220, padding: 6, zIndex: 11,
                boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
              }}>
                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: BRIGHT }}>
                    {user?.name ?? 'Utilisateur'}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                    {user?.email}
                  </div>
                  {user?.specialty && (
                    <div style={{ fontSize: 10, color: AMBER, marginTop: 4, fontWeight: 600 }}>
                      {user.specialty}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setProfileOpen(false); logout(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '9px 12px', borderRadius: 6,
                    background: 'transparent', border: 'none',
                    color: BRIGHT, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <LogOut size={14} />
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </nav>

      {/* ════ MAIN CONTENT ═══════════════════════════════════════════ */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {mode === 'triage' && (
          <TriageView onSelectPatient={handleSelectPatient} />
        )}

        {mode === 'focus' && focusedPatientId && (
          <FocusView
            patientId={focusedPatientId}
            onBack={handleBackToTriage}
            onSelectPatient={(id) => setFocusedPatientId(id)}
          />
        )}

        {mode === 'focus' && !focusedPatientId && (
          // Defensive: should never render — fall back to triage if state is inconsistent
          <TriageView onSelectPatient={handleSelectPatient} />
        )}

        {mode === 'cohort' && (
          <CohortView onSelectPatient={handleSelectPatient} />
        )}

        {/* Messages and Audit keep their original light theme — reviewing zones,
            not action zones. The dark top bar provides consistent navigation. */}
        {mode === 'messages' && (
          <div style={{
            flex: 1, overflow: 'auto', background: '#F8FAFC',
            color: '#0F172A', padding: '20px 28px',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <Messaging />
            </div>
          </div>
        )}

        {mode === 'audit' && (
          <div style={{
            flex: 1, overflow: 'auto', background: '#F8FAFC',
            color: '#0F172A', padding: '20px 28px',
          }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
              <AuditLog />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
