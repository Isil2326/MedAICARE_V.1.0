// ============================================================================
// PORTAL PAGE — MediAI Care · Portail institutionnel (présentation)
// ----------------------------------------------------------------------------
// Le WEB est désormais un PORTAIL de présentation / soutenance, PAS l'espace
// principal patient/clinicien. L'application réelle patient/clinicien est l'app
// MOBILE (Expo). Aucune revendication clinique / de certification ici.
// ============================================================================

import { motion } from 'framer-motion';
import {
  ArrowRight, Smartphone, ShieldCheck, BrainCircuit, Activity,
  Database, GitBranch, ScrollText, FlaskConical, Stethoscope,
  Lock, FileText, AlertTriangle, ServerCog, ChevronRight, History,
} from 'lucide-react';
import type { ViewMode } from '../types/medical';
import {
  APP_VERSION, APP_STATUS_LABEL, APP_DISCLAIMER_LONG, TECH_FACTS,
} from '../utils/prototypeNotice';

const EASE = [0.22, 1, 0.36, 1] as const;
const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: EASE } },
});

interface PortalPageProps {
  onNavigate: (view: ViewMode) => void;
}

// URL de l'app mobile Expo Web (preview Replit, port 5173). Construite à partir
// de l'hôte courant pour rester valable quel que soit le domaine de preview.
function mobileUrl(): string {
  if (typeof window === 'undefined') return '#';
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5173`;
}

const BADGES = [
  { label: 'Données synthétiques', icon: FlaskConical },
  { label: 'Open-loop', icon: ShieldCheck },
  { label: 'Non certifié', icon: AlertTriangle },
] as const;

const DEMONSTRATES = [
  { icon: ServerCog, title: 'Backend sécurisé', desc: 'FastAPI · JWT (access court + refresh opaque, rotation & détection de réutilisation) · RBAC serveur · audit chaîné SHA-256.' },
  { icon: Activity, title: 'Pipeline temporel', desc: 'Ingestion et fenêtrage de séries glycémiques synthétiques, features temporelles reproductibles.' },
  { icon: BrainCircuit, title: 'ML synthétique', desc: 'Modèles de risque (LogReg / RF / XGBoost / EBM) entraînés sur données simulées uniquement.' },
  { icon: BarChartIcon, title: 'XAI (support d\u2019affichage)', desc: 'SHAP / LIME / EBM natif — aide à l\u2019audit et à la lecture, jamais une justification clinique.' },
  { icon: GitBranch, title: 'Recommandations open-loop', desc: 'Suggestions de suivi sans dose ni action automatique ; validation humaine systématique.' },
  { icon: Smartphone, title: 'Mobile sécurisé', desc: 'App Expo patient/clinicien ; jetons en stockage sécurisé natif, jamais persistés en clair.' },
] as const;

const LIMITS = [
  'Pas destiné à un usage clinique réel.',
  'Aucune donnée réelle — patients 100 % simulés.',
  'Pas un dispositif médical (aucune certification MDR, IEC 62304, ISO 13485, HDS).',
  'Pas de validation clinique.',
  'Scores ML élevés = benchmark synthétique séparable, non transférables au clinique.',
] as const;

const ARCHITECTURE = [
  { icon: ServerCog, title: 'API = source de vérité', desc: 'Tout calcul de risque / recommandation est côté backend. Aucun calcul métier côté client ou mobile.' },
  { icon: Lock, title: 'Sécurité', desc: 'Auth JWT + refresh opaque, RBAC serveur, hachage argon2, rate-limiting, en-têtes durcis.' },
  { icon: ScrollText, title: 'Audit', desc: 'Journal d\u2019audit chaîné (SHA-256) côté backend pour la traçabilité des actions.' },
] as const;

const DOCS = [
  { label: 'Limites & posture (LIMITATIONS.md)', hint: 'Périmètre, non-certification, données synthétiques' },
  { label: 'Architecture finale (docs/architecture)', hint: 'Schéma global backend / web / mobile' },
  { label: 'Contrats API v1 (docs/api)', hint: 'Endpoints, erreurs, conventions' },
  { label: 'Sécurité & RBAC (docs/security)', hint: 'Matrice RBAC, audit, stockage des jetons mobile' },
  { label: 'Scénario de soutenance (docs/demo)', hint: 'Parcours de démonstration end-to-end' },
] as const;

export default function PortalPage({ onNavigate }: PortalPageProps) {
  const url = mobileUrl();

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-brand-100">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100/80">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-mark.png" alt="MediAI Care" className="w-10 h-10 shrink-0" />
            <div className="flex flex-col gap-0">
              <div className="flex items-baseline leading-none">
                <span className="text-[18px] font-black text-slate-900 tracking-[-0.03em]">Medi</span>
                <span className="text-[18px] font-black text-[#1565C0] tracking-[-0.03em]">AI</span>
                <span className="text-[12px] font-bold text-slate-400 tracking-wide ml-1.5 self-center">CARE</span>
              </div>
              <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.22em] mt-[3px] leading-none">
                Portail du prototype
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-7 text-[13.5px] text-slate-500 font-medium">
            <a href="#mobile" className="hover:text-slate-900 transition-colors">Application mobile</a>
            <a href="#demontre" className="hover:text-slate-900 transition-colors">Ce qu&apos;il démontre</a>
            <a href="#limites" className="hover:text-slate-900 transition-colors">Limites</a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">Architecture</a>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition shadow-[0_2px_12px_rgba(21,101,192,0.25)]"
          >
            <Smartphone className="w-4 h-4" />
            Ouvrir l&apos;app mobile
          </a>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-gradient-to-br from-brand-200/40 to-brand-300/10 blur-[140px] -translate-y-40 translate-x-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-brand-100/30 to-brand-200/10 blur-[110px] translate-y-24 -translate-x-24 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8 py-20 lg:py-28">
          <motion.span
            variants={fade(0)} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2 text-[12px] font-bold text-brand-700 uppercase tracking-widest mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
            {APP_STATUS_LABEL} · IoMT + IA explicable
          </motion.span>

          <motion.h1
            variants={fade(0.06)} initial="hidden" animate="visible"
            className="text-[44px] sm:text-[58px] leading-[1.05] font-black tracking-[-1.5px] text-slate-900 mb-6 max-w-[760px]"
          >
            MediAI Care
            <span className="block text-slate-500 text-[22px] sm:text-[26px] font-bold tracking-[-0.5px] mt-3">
              Prototype académique IoMT + IA explicable pour le suivi du diabète
            </span>
          </motion.h1>

          <motion.p
            variants={fade(0.12)} initial="hidden" animate="visible"
            className="text-[16px] sm:text-[17px] leading-relaxed text-slate-600 max-w-[640px] mb-8"
          >
            Mémoire de Master en Informatique Biomédicale. Cette plateforme web présente
            le projet : son objectif, son architecture, sa sécurité et ses limites.
            L&apos;application réelle pour les espaces patient et clinicien est l&apos;application
            mobile.
          </motion.p>

          {/* Badges posture */}
          <motion.div
            variants={fade(0.18)} initial="hidden" animate="visible"
            className="flex flex-wrap items-center gap-2.5 mb-9"
          >
            {BADGES.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 border border-slate-200 text-[12.5px] font-bold text-slate-700"
              >
                <Icon className="w-3.5 h-3.5 text-brand-600" />
                {label}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            variants={fade(0.24)} initial="hidden" animate="visible"
            className="flex flex-wrap items-center gap-3"
          >
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-[15px] transition shadow-[0_4px_20px_rgba(21,101,192,0.3)]"
            >
              <Smartphone className="w-5 h-5" />
              Ouvrir l&apos;app mobile
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#mobile"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-[15px] transition"
            >
              Comment y accéder ?
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── APPLICATION MOBILE ──────────────────────────────────────────────── */}
      <section id="mobile" className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Application mobile"
            title="L'app patient & clinicien"
            subtitle="Les vraies interfaces, séparées par rôle, vivent dans l'application mobile (Expo). Le web est un portail de présentation."
          />

          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <RoleCard
              icon={Activity}
              title="Espace patient"
              points={[
                'Suivi glycémique synthétique (CGM lecture seule)',
                'Niveau de risque calculé côté backend',
                'Lecture XAI à titre d\u2019affichage',
                'Aucune dose, aucune décision automatique',
              ]}
            />
            <RoleCard
              icon={Stethoscope}
              title="Espace clinicien"
              points={[
                'Liste de patients (données simulées)',
                'Détail patient, risque & explications',
                'Recommandations open-loop à valider',
                'XAI = support d\u2019audit, jamais une justification',
              ]}
            />
          </div>

          {/* Accès */}
          <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 lg:p-7">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-brand-600" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[16px] font-bold text-slate-900">Accéder à l&apos;application mobile</h3>
                <p className="text-[14px] text-slate-600 mt-1.5 leading-relaxed">
                  Dans cet environnement Replit, l&apos;app mobile s&apos;exécute en <strong>Expo Web</strong>
                  {' '}sur le <strong>port 5173</strong> (workflow « Mobile App »). Sur un appareil réel,
                  elle se lance via Expo (build de développement / EAS) ; QR, builds natifs et capture
                  d&apos;écran automatisée ne sont pas disponibles dans la preview Replit.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13.5px] transition"
                  >
                    <Smartphone className="w-4 h-4" />
                    Ouvrir l&apos;app mobile (port 5173)
                  </a>
                  <code className="text-[12.5px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-mono break-all">
                    {url}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CE QU'IL DÉMONTRE ───────────────────────────────────────────────── */}
      <section id="demontre" className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Ce que démontre le prototype"
            title="Une chaîne complète, de bout en bout"
            subtitle="Backend, ML, XAI et mobile sont intégrés et sécurisés — sur des données strictement synthétiques."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
            {DEMONSTRATES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-white border border-slate-200 p-6 hover:border-brand-200 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-[15.5px] font-bold text-slate-900">{title}</h3>
                <p className="text-[13.5px] text-slate-600 mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIMITES ─────────────────────────────────────────────────────────── */}
      <section id="limites" className="border-t border-slate-100 bg-amber-50/40">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Limites"
            title="Ce que ce prototype n'est pas"
            subtitle="Transparence sur le périmètre : aucun usage clinique, aucune donnée réelle, aucune certification."
          />
          <div className="mt-10 grid md:grid-cols-2 gap-x-8 gap-y-3">
            {LIMITS.map((l) => (
              <div key={l} className="flex items-start gap-3 rounded-xl bg-white border border-amber-200/70 p-4">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[14px] text-slate-700 font-medium leading-snug">{l}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-slate-500 leading-relaxed max-w-[760px]">
            {APP_DISCLAIMER_LONG}
          </p>
        </div>
      </section>

      {/* ── ARCHITECTURE & SÉCURITÉ ─────────────────────────────────────────── */}
      <section id="architecture" className="border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Architecture & sécurité"
            title="Le backend est la source de vérité"
            subtitle="Web (portail) et mobile (app) consomment une API unique. Aucun calcul de risque ou de recommandation hors backend."
          />
          <div className="grid md:grid-cols-3 gap-5 mt-10">
            {ARCHITECTURE.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-slate-50 border border-slate-200 p-6">
                <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <h3 className="text-[15.5px] font-bold text-slate-900">{title}</h3>
                <p className="text-[13.5px] text-slate-600 mt-2 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Flux simple */}
          <div className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 lg:p-7">
            <div className="flex flex-wrap items-center justify-center gap-3 text-[13.5px] font-bold">
              <FlowNode icon={Smartphone} label="App mobile" />
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <FlowNode icon={ServerCog} label="API FastAPI" highlight />
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <FlowNode icon={BrainCircuit} label="ML + XAI" />
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <FlowNode icon={Database} label="PostgreSQL (synthétique)" />
            </div>
            <p className="text-center text-[12.5px] text-slate-500 mt-4">
              Le portail web présente ; l&apos;API décide ; le mobile affiche. Open-loop strict.
            </p>
          </div>
        </div>
      </section>

      {/* ── DOCUMENTATION / SOUTENANCE ──────────────────────────────────────── */}
      <section id="docs" className="border-t border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-16 lg:py-20">
          <SectionHeading
            eyebrow="Documentation / Soutenance"
            title="Dossier du projet"
            subtitle="Rapports et références techniques disponibles dans le dépôt (dossier docs/)."
          />
          <div className="grid sm:grid-cols-2 gap-4 mt-10">
            {DOCS.map(({ label, hint }) => (
              <div key={label} className="flex items-start gap-3 rounded-xl bg-white border border-slate-200 p-5">
                <FileText className="w-4.5 h-4.5 text-brand-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-slate-900">{label}</div>
                  <div className="text-[12.5px] text-slate-500 mt-0.5">{hint}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-3">
              <img src="/logo-mark.png" alt="MediAI Care" className="w-8 h-8" />
              <div className="text-[13px] text-slate-500 font-medium leading-snug">
                <div className="text-slate-800 font-bold">MediAI Care · Portail du prototype</div>
                {APP_STATUS_LABEL} · Données simulées · v{APP_VERSION}
              </div>
            </div>

            {/* Démo web legacy — secondaire, clairement marquée */}
            <button
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center gap-2 text-[12.5px] text-slate-400 hover:text-slate-700 font-semibold transition self-start sm:self-auto"
              title="Ancienne interface web de démonstration (login). L'app réelle est sur mobile."
            >
              <History className="w-3.5 h-3.5" />
              Démo web (legacy)
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11.5px] text-slate-400">
            <span>Hachage : {TECH_FACTS.passwordHashing}</span>
            <span>Backend : FastAPI · API source de vérité</span>
            <span>Données : 100 % synthétiques</span>
            <span>Posture : open-loop · non certifié</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-[680px]">
      <span className="text-[12px] font-bold text-brand-700 uppercase tracking-widest">{eyebrow}</span>
      <h2 className="text-[28px] sm:text-[34px] font-black tracking-[-1px] text-slate-900 mt-3 leading-tight">{title}</h2>
      <p className="text-[15px] text-slate-600 mt-3 leading-relaxed">{subtitle}</p>
    </div>
  );
}

function RoleCard({ icon: Icon, title, points }: { icon: typeof Activity; title: string; points: string[] }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-7">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="text-[17px] font-bold text-slate-900">{title}</h3>
      </div>
      <ul className="space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[13.5px] text-slate-600">
            <ChevronRight className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <span className="leading-snug">{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlowNode({ icon: Icon, label, highlight = false }: { icon: typeof Activity; label: string; highlight?: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ' +
        (highlight
          ? 'bg-brand-50 border-brand-200 text-brand-700'
          : 'bg-slate-50 border-slate-200 text-slate-700')
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

// Icône barres (évite un import de plus tout en gardant la cohérence visuelle).
function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="7" />
      <rect x="13" y="6" width="3" height="11" />
      <rect x="18" y="13" width="2.5" height="4" />
    </svg>
  );
}
