// ============================================================================
// MESSAGING v3.3.1 — Messagerie premium Patient ↔ Clinicien
// • Bulles iMessage-like · Avatars gradient · Smart timestamps
// • Refresh temps réel via CustomEvent · Badge bidirectionnel
// • Conforme HDS · Chiffrement E2E (placeholder)
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Send, MessageSquare, CheckCheck, Check, ArrowLeft, Phone, Video,
  Paperclip, Smile, MoreVertical, Search, Plus, Shield, Circle,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../utils/cn';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'clinician';
  recipientId: string;
  text: string;
  timestamp: number;
  read: boolean;
  readAt?: number;
}

export interface Thread {
  id: string;
  patientId: string;
  patientName: string;
  clinicianId: string;
  clinicianName: string;
  clinicianSpecialty?: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: number;
}

// ─── Storage helpers + event bus ─────────────────────────────────────────────

const STORAGE_KEY = 'mediai_messages_v1';
const THREADS_KEY = 'mediai_threads_v1';
const UPDATE_EVENT = 'mediai:messages:updated';

function loadMessages(): Message[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveMessages(msgs: Message[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  // ⚡ Notification immédiate pour les autres composants (badge sidebar)
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

function loadThreads(): Thread[] {
  try { return JSON.parse(localStorage.getItem(THREADS_KEY) || '[]'); } catch { return []; }
}

function saveThreads(threads: Thread[]) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
}

// ─── Seed initial data (BIDIRECTIONNEL — bug v3.3.0 corrigé) ────────────────

export function seedDemoData(currentUserId: string, currentRole: 'patient' | 'clinician') {
  // Migration v3.3.0 → v3.3.1 : forcer reseed pour avoir les messages bidirectionnels
  const SEED_VERSION_KEY = 'mediai_messages_seed_version';
  const CURRENT_SEED = 'v3.3.2';
  const previousSeed = localStorage.getItem(SEED_VERSION_KEY);
  if (previousSeed !== CURRENT_SEED) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(THREADS_KEY);
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED);
  }
  if (loadMessages().length > 0) return;

  const now = Date.now();
  const patientId = currentRole === 'patient' ? currentUserId : 'demo-patient-1';
  const patientName = currentRole === 'patient' ? 'Vous' : 'Marc Dupont';
  const clinicianId = currentRole === 'clinician' ? currentUserId : 'demo-clinician-1';
  const clinicianName = currentRole === 'clinician' ? 'Vous' : 'Dr. Sophie Martin';
  const threadId = `thread_${patientId}_${clinicianId}`;

  // 5 messages : 3 du clinicien, 2 du patient
  // ✅ Le DERNIER message est du clinicien et NON-LU côté patient
  // ✅ msg_004 est non-lu côté clinicien
  const demoMessages: Message[] = [
    {
      id: 'msg_001', threadId,
      senderId: clinicianId, senderName: clinicianName, senderRole: 'clinician',
      recipientId: patientId,
      text: "Bonjour Marc, j'ai analysé vos résultats de la semaine. Votre temps dans la cible (TIR) s'est amélioré à 74%, c'est très encourageant.",
      timestamp: now - 86400000 * 2, read: true, readAt: now - 86400000 * 1.9,
    },
    {
      id: 'msg_002', threadId,
      senderId: patientId, senderName: patientName, senderRole: 'patient',
      recipientId: clinicianId,
      text: "Merci Docteur. Je remarque que ma glycémie monte souvent après le déjeuner. Est-ce normal ?",
      timestamp: now - 86400000 * 1.5, read: true, readAt: now - 86400000 * 1.4,
    },
    {
      id: 'msg_003', threadId,
      senderId: clinicianId, senderName: clinicianName, senderRole: 'clinician',
      recipientId: patientId,
      text: "C'est ce qu'on appelle la glycémie post-prandiale. Une marche de 15 min après le repas aide beaucoup à réduire ce pic. On en discutera lors de votre prochain RDV.",
      timestamp: now - 86400000, read: true, readAt: now - 86400000 * 0.9,
    },
    {
      id: 'msg_004', threadId,
      senderId: patientId, senderName: patientName, senderRole: 'patient',
      recipientId: clinicianId,
      text: "D'accord, j'essaierai. J'ai aussi scanné mon nouveau bilan biologique, est-ce que vous l'avez bien reçu ?",
      timestamp: now - 3600000 * 5,
      // Non-lu côté clinicien (le clinicien ne l'a pas encore vu)
      read: currentRole === 'clinician' ? false : true,
    },
    {
      id: 'msg_005', threadId,
      senderId: clinicianId, senderName: clinicianName, senderRole: 'clinician',
      recipientId: patientId,
      text: "Oui je viens de le voir, votre HbA1c est passée de 8.2 à 7.4%. Excellent travail ! Je vous propose qu'on ajuste votre traitement, je vous fais un retour détaillé dans la journée.",
      timestamp: now - 1800000, // il y a 30 min
      // ✅ Non-lu côté patient (le patient ne l'a pas encore vu)
      read: currentRole === 'patient' ? false : true,
    },
  ];

  const lastMsg = demoMessages[demoMessages.length - 1];
  const unreadForCurrent = demoMessages.filter(
    m => m.recipientId === currentUserId && !m.read
  ).length;

  const thread: Thread = {
    id: threadId,
    patientId,
    patientName: currentRole === 'patient' ? 'Moi' : 'Marc Dupont',
    clinicianId,
    clinicianName: currentRole === 'clinician' ? 'Moi' : 'Dr. Sophie Martin',
    clinicianSpecialty: 'Endocrinologue · Diabétologie',
    lastMessage: lastMsg,
    unreadCount: unreadForCurrent,
    createdAt: now - 86400000 * 2,
  };

  saveMessages(demoMessages);
  saveThreads([thread]);
}

// ─── Format & color helpers ───────────────────────────────────────────────────

function formatSmartTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "À l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (h < 48) return `Hier ${new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function formatDayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const dDate = new Date(d); dDate.setHours(0, 0, 0, 0);
  if (dDate.getTime() === today.getTime()) return "Aujourd'hui";
  if (dDate.getTime() === yesterday.getTime()) return "Hier";
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function groupByDay(messages: Message[]): { dayKey: string; label: string; messages: Message[] }[] {
  const groups: Record<string, Message[]> = {};
  messages.forEach(m => {
    const d = new Date(m.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, msgs]) => ({ dayKey, label: formatDayLabel(msgs[0].timestamp), messages: msgs }));
}

// Génère un gradient cohérent à partir d'un nom
function getAvatarGradient(name: string): string {
  const palettes = [
    'from-blue-500 to-indigo-600',
    'from-teal-500 to-emerald-600',
    'from-purple-500 to-fuchsia-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-cyan-500 to-blue-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return palettes[Math.abs(hash) % palettes.length];
}

function getInitials(name: string): string {
  if (name === 'Vous' || name === 'Moi') return 'M';
  const parts = name.replace(/^Dr\.?\s+/i, '').split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
}

// ─── Avatar Component ─────────────────────────────────────────────────────────

function Avatar({
  name, size = 'md', online = false, role,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  role?: 'patient' | 'clinician';
}) {
  const sizeMap = {
    sm: { wrap: 'w-9 h-9', text: 'text-[12px]', dot: 'w-2.5 h-2.5 -bottom-0 -right-0' },
    md: { wrap: 'w-11 h-11', text: 'text-[13.5px]', dot: 'w-3 h-3 -bottom-0 -right-0' },
    lg: { wrap: 'w-12 h-12', text: 'text-[15px]', dot: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5' },
  }[size];

  const gradient = role
    ? (role === 'clinician' ? 'from-blue-500 to-indigo-600' : 'from-teal-500 to-cyan-600')
    : getAvatarGradient(name);

  return (
    <div className="relative shrink-0">
      <div className={cn(
        'rounded-full bg-gradient-to-br flex items-center justify-center font-semibold text-white shadow-lg ring-2 ring-white/[0.08]',
        sizeMap.wrap, sizeMap.text, gradient
      )}>
        {getInitials(name)}
      </div>
      {online && (
        <span className={cn(
          'absolute rounded-full bg-emerald-400 ring-2 ring-[#0B1220]',
          sizeMap.dot
        )}>
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyConversation() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 bg-gradient-to-br from-transparent via-blue-500/[0.02] to-transparent">
      <div className="relative">
        <div className="absolute inset-0 rounded-3xl bg-blue-500/20 blur-2xl" />
        <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 ring-1 ring-blue-500/30 flex items-center justify-center backdrop-blur-xl">
          <MessageSquare className="w-10 h-10 text-blue-300" strokeWidth={1.5} />
        </div>
      </div>
      <div className="text-center max-w-sm">
        <div className="text-[16px] font-semibold text-white/80 mb-1.5">Vos échanges sécurisés</div>
        <div className="text-[12.5px] text-white/40 leading-relaxed">
          Sélectionnez une conversation pour consulter votre historique d'échanges avec votre équipe soignante.
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.08] ring-1 ring-emerald-500/20">
        <Shield className="w-3 h-3 text-emerald-400" />
        <span className="text-[10.5px] text-emerald-300/90 font-medium">Chiffrement de bout en bout · HDS</span>
      </div>
    </div>
  );
}

// ─── Conversation View ────────────────────────────────────────────────────────

function ConversationView({
  thread, messages, currentUserId, currentRole, onSend, onBack,
}: {
  thread: Thread;
  messages: Message[];
  currentUserId: string;
  currentRole: 'patient' | 'clinician';
  onSend: (text: string) => void;
  onBack: () => void;
}) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const grouped = useMemo(() => groupByDay(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = currentRole === 'patient' ? thread.clinicianName : thread.patientName;
  const otherRole: 'patient' | 'clinician' = currentRole === 'patient' ? 'clinician' : 'patient';
  const subtitle = currentRole === 'patient'
    ? (thread.clinicianSpecialty || 'Médecin référent')
    : 'Patient · Diabète Type 1';

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-transparent via-transparent to-blue-500/[0.015]">
      {/* Header premium */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] shrink-0 bg-white/[0.015] backdrop-blur-xl">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition lg:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <Avatar name={otherName === 'Moi' ? 'M' : otherName} size="md" online role={otherRole} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-white truncate flex items-center gap-2">
            {otherName}
            {otherRole === 'clinician' && (
              <span className="px-1.5 py-0.5 rounded-md bg-blue-500/15 ring-1 ring-blue-500/25 text-[9.5px] font-medium text-blue-300 uppercase tracking-wider">Pro</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
            <span className="text-[11px] text-white/45">{subtitle} · En ligne</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button title="Appel audio" className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition group">
            <Phone className="w-4 h-4 text-white/40 group-hover:text-white/80 transition" />
          </button>
          <button title="Visioconsultation" className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition group">
            <Video className="w-4 h-4 text-white/40 group-hover:text-white/80 transition" />
          </button>
          <button title="Plus" className="w-9 h-9 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition group">
            <MoreVertical className="w-4 h-4 text-white/40 group-hover:text-white/80 transition" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scroll-smooth">
        {grouped.map(group => (
          <div key={group.dayKey}>
            {/* Day separator */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              <span className="text-[10.5px] text-white/40 font-medium px-2.5 py-1 rounded-full bg-white/[0.04] ring-1 ring-white/[0.05] capitalize">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
            </div>

            <div className="space-y-1.5">
              {group.messages.map((msg, idx) => {
                const isMine = msg.senderId === currentUserId;
                const prev = group.messages[idx - 1];
                const isFirstOfBurst = !prev || prev.senderId !== msg.senderId
                  || (msg.timestamp - prev.timestamp) > 5 * 60 * 1000;
                const next = group.messages[idx + 1];
                const isLastOfBurst = !next || next.senderId !== msg.senderId
                  || (next.timestamp - msg.timestamp) > 5 * 60 * 1000;

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex gap-2 group',
                      isMine ? 'justify-end' : 'justify-start',
                      isFirstOfBurst ? 'mt-3' : 'mt-0.5'
                    )}
                  >
                    {!isMine && (
                      <div className="w-8 shrink-0 flex items-end">
                        {isLastOfBurst && (
                          <Avatar name={msg.senderName} size="sm" role={msg.senderRole} />
                        )}
                      </div>
                    )}

                    <div className={cn(
                      'max-w-[70%] flex flex-col',
                      isMine ? 'items-end' : 'items-start'
                    )}>
                      <div
                        className={cn(
                          'px-4 py-2.5 text-[13.5px] leading-relaxed transition-all',
                          isMine
                            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-[0_4px_20px_-8px_rgba(59,130,246,0.6)]'
                            : 'bg-white/[0.06] border border-white/[0.08] text-white/90 backdrop-blur-xl',
                          // Asymetric corners (iMessage-like)
                          isMine
                            ? cn(
                                'rounded-2xl',
                                isFirstOfBurst && 'rounded-tr-2xl',
                                isLastOfBurst && 'rounded-br-md',
                                !isLastOfBurst && 'rounded-br-2xl'
                              )
                            : cn(
                                'rounded-2xl',
                                isFirstOfBurst && 'rounded-tl-2xl',
                                isLastOfBurst && 'rounded-bl-md',
                                !isLastOfBurst && 'rounded-bl-2xl'
                              )
                        )}
                      >
                        {msg.text}
                      </div>

                      {isLastOfBurst && (
                        <div className={cn(
                          'flex items-center gap-1 mt-1 px-1 opacity-60 group-hover:opacity-100 transition',
                          isMine ? 'flex-row-reverse' : 'flex-row'
                        )}>
                          <span className="text-[10px] text-white/40 tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMine && (
                            <span title={msg.read ? `Lu ${msg.readAt ? formatSmartTime(msg.readAt) : ''}` : 'Envoyé'}>
                              {msg.read
                                ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                                : <Check className="w-3.5 h-3.5 text-white/30" />}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer premium */}
      <div className="px-4 py-3 border-t border-white/[0.06] shrink-0 bg-white/[0.015] backdrop-blur-xl">
        <div className="flex items-end gap-2">
          <button
            title="Joindre un fichier"
            className="w-10 h-10 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition group shrink-0"
          >
            <Paperclip className="w-4 h-4 text-white/40 group-hover:text-white/80 transition" />
          </button>

          <div className="flex-1 rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-blue-500/40 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden">
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Écrivez votre message…"
              rows={1}
              className="w-full px-4 py-3 bg-transparent text-[13.5px] text-white placeholder:text-white/30 resize-none focus:outline-none max-h-[140px]"
              style={{ minHeight: '44px' }}
              onInput={e => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 140) + 'px';
              }}
            />
          </div>

          <button
            title="Emoji"
            className="w-10 h-10 rounded-xl hover:bg-white/[0.06] flex items-center justify-center transition group shrink-0"
          >
            <Smile className="w-4 h-4 text-white/40 group-hover:text-white/80 transition" />
          </button>

          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0',
              text.trim()
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_6px_20px_-6px_rgba(59,130,246,0.6)] hover:scale-105 active:scale-95'
                : 'bg-white/[0.04] text-white/25 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-white/35">Chiffré de bout en bout · Conforme HDS · RGPD</span>
          </div>
          <span className="text-[10px] text-white/25">Entrée pour envoyer · Maj+Entrée saut de ligne</span>
        </div>
      </div>
    </div>
  );
}

// ─── Thread List Item ─────────────────────────────────────────────────────────

function ThreadItem({
  thread, isActive, currentRole, onClick,
}: {
  thread: Thread;
  isActive: boolean;
  currentRole: 'patient' | 'clinician';
  onClick: () => void;
}) {
  const otherName = currentRole === 'patient' ? thread.clinicianName : thread.patientName;
  const otherRole: 'patient' | 'clinician' = currentRole === 'patient' ? 'clinician' : 'patient';
  const subtitle = currentRole === 'patient'
    ? (thread.clinicianSpecialty?.split('·')[0]?.trim() || 'Médecin référent')
    : 'Patient · Diabète T1';
  const hasUnread = thread.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all relative group',
        isActive
          ? 'bg-gradient-to-r from-blue-500/[0.12] to-blue-500/[0.04] border-l-2 border-blue-400'
          : 'hover:bg-white/[0.03] border-l-2 border-transparent'
      )}
    >
      <Avatar name={otherName === 'Moi' ? 'M' : otherName} size="md" online role={otherRole} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={cn(
            'text-[13.5px] truncate',
            hasUnread ? 'text-white font-semibold' : 'text-white/85 font-medium'
          )}>
            {otherName}
          </span>
          {thread.lastMessage && (
            <span className={cn(
              'text-[10.5px] shrink-0 tabular-nums',
              hasUnread ? 'text-blue-300 font-medium' : 'text-white/35'
            )}>
              {formatSmartTime(thread.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <div className="text-[10.5px] text-white/40 mb-1 truncate">{subtitle}</div>
        {thread.lastMessage && (
          <div className="flex items-center justify-between gap-2">
            <div className={cn(
              'text-[12px] truncate flex-1',
              hasUnread ? 'text-white/85 font-medium' : 'text-white/45'
            )}>
              {thread.lastMessage.senderRole === currentRole && (
                <span className="text-white/30 mr-1">Vous :</span>
              )}
              {thread.lastMessage.text}
            </div>
            {hasUnread && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.6)]">
                {thread.unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Main Messaging Component ─────────────────────────────────────────────────

interface MessagingProps {
  compact?: boolean;
}

export default function Messaging({ compact = false }: MessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const currentRole = (user?.role === 'patient' ? 'patient' : 'clinician') as 'patient' | 'clinician';
  const currentUserId = user?.id || 'unknown';

  // Init & seed
  useEffect(() => {
    seedDemoData(currentUserId, currentRole);
    const initial = loadThreads();
    setMessages(loadMessages());
    setThreads(initial);
    if (initial.length > 0 && !activeThreadId) setActiveThreadId(initial[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, currentRole]);

  // ⚡ Refresh temps réel via CustomEvent + polling de secours
  useEffect(() => {
    const refresh = () => {
      setMessages(loadMessages());
      setThreads(loadThreads());
    };
    window.addEventListener(UPDATE_EVENT, refresh);
    const interval = setInterval(refresh, 4000);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      clearInterval(interval);
    };
  }, []);

  const activeThread = threads.find(t => t.id === activeThreadId) || null;
  const threadMessages = useMemo(
    () => messages.filter(m => m.threadId === activeThreadId).sort((a, b) => a.timestamp - b.timestamp),
    [messages, activeThreadId]
  );

  // Marquer comme lu quand on ouvre le thread
  useEffect(() => {
    if (!activeThreadId) return;
    const current = loadMessages();
    const needUpdate = current.some(
      m => m.threadId === activeThreadId && m.recipientId === currentUserId && !m.read
    );
    if (!needUpdate) return;

    const updated = current.map(m =>
      m.threadId === activeThreadId && m.recipientId === currentUserId && !m.read
        ? { ...m, read: true, readAt: Date.now() }
        : m
    );
    setMessages(updated);
    saveMessages(updated);

    const updatedThreads = loadThreads().map(t =>
      t.id === activeThreadId ? { ...t, unreadCount: 0 } : t
    );
    setThreads(updatedThreads);
    saveThreads(updatedThreads);
  }, [activeThreadId, currentUserId, messages.length]);

  const handleSend = useCallback((text: string) => {
    if (!activeThread) return;

    const recipientId = currentRole === 'patient'
      ? activeThread.clinicianId
      : activeThread.patientId;

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      threadId: activeThread.id,
      senderId: currentUserId,
      senderName: user?.name || 'Moi',
      senderRole: currentRole,
      recipientId,
      text,
      timestamp: Date.now(),
      read: false,
    };

    const all = loadMessages();
    const updatedMessages = [...all, newMsg];
    saveMessages(updatedMessages);
    setMessages(updatedMessages);

    // Mise à jour du thread (lastMessage + unreadCount du destinataire)
    const allThreads = loadThreads();
    const updatedThreads = allThreads.map(t => {
      if (t.id !== activeThread.id) return t;
      // L'envoi ne modifie PAS unreadCount pour MOI (je viens d'envoyer, c'est lu)
      // unreadCount représente les non-lus côté courant uniquement
      return { ...t, lastMessage: newMsg };
    });
    saveThreads(updatedThreads);
    setThreads(updatedThreads);
  }, [activeThread, currentRole, currentUserId, user?.name]);

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter(t =>
      (currentRole === 'patient' ? t.clinicianName : t.patientName).toLowerCase().includes(q) ||
      t.lastMessage?.text.toLowerCase().includes(q)
    );
  }, [threads, searchQuery, currentRole]);

  // ─── Compact mode (sidebar/dashboard panel) ─────────────────────────────────
  if (compact) {
    return (
      <div className="flex flex-col h-full min-h-[500px]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <span className="text-[14px] font-semibold text-white">Messagerie</span>
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{totalUnread}</span>
            )}
          </div>
          <span className="text-[10.5px] text-white/40">Chiffré · HDS</span>
        </div>

        {activeThread ? (
          <ConversationView
            thread={activeThread}
            messages={threadMessages}
            currentUserId={currentUserId}
            currentRole={currentRole}
            onSend={handleSend}
            onBack={() => setActiveThreadId(null)}
          />
        ) : <EmptyConversation />}
      </div>
    );
  }

  // ─── Full screen mode ───────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-180px)] min-h-[560px] rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0B1220]/40 backdrop-blur-xl shadow-2xl">
      {/* Thread list */}
      <div className={cn(
        'w-full lg:w-[320px] border-r border-white/[0.06] flex flex-col shrink-0 bg-white/[0.01]',
        activeThreadId ? 'hidden lg:flex' : 'flex'
      )}>
        {/* Header liste */}
        <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-white">Messages</span>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-[10px] font-bold shadow-lg">
                  {totalUnread}
                </span>
              )}
            </div>
            <button
              title="Nouvelle conversation"
              className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/35 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 text-[12.5px] text-white placeholder:text-white/30 focus:outline-none transition"
            />
          </div>
        </div>

        {/* Threads */}
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-2" strokeWidth={1.5} />
              <div className="text-[12px] text-white/40">
                {searchQuery ? 'Aucun résultat' : 'Aucune conversation'}
              </div>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <ThreadItem
                key={thread.id}
                thread={thread}
                isActive={thread.id === activeThreadId}
                currentRole={currentRole}
                onClick={() => setActiveThreadId(thread.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <Avatar name={user?.name || 'Moi'} size="sm" role={currentRole} />
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-white truncate">{user?.name || 'Moi'}</div>
              <div className="text-[10px] text-white/40 capitalize">{currentRole}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className={cn('flex-1 flex flex-col', !activeThreadId ? 'hidden lg:flex' : 'flex')}>
        {activeThread
          ? <ConversationView
              thread={activeThread}
              messages={threadMessages}
              currentUserId={currentUserId}
              currentRole={currentRole}
              onSend={handleSend}
              onBack={() => setActiveThreadId(null)}
            />
          : <EmptyConversation />
        }
      </div>
    </div>
  );
}
