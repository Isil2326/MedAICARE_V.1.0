import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, CheckCircle2, Shield, ChevronRight,
  Smartphone, Award, Star, Zap, TrendingUp, Users
} from 'lucide-react';
import type { ViewMode } from '../types/medical';
import AuthModal from './AuthModal';

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' as const },
  }),
};

interface LandingPageProps {
  onNavigate: (view: ViewMode) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [authType, setAuthType] = useState<'patient' | 'doctor' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  const openAuth = (type: 'patient' | 'doctor', mode: 'login' | 'register') => {
    setAuthType(type);
    setAuthMode(mode);
  };

  return (
    <div className="min-h-screen bg-[#f4f6ef] text-sage-900 selection:bg-brand-200 selection:text-brand-900">

      {/* ── 1. NAVIGATION ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-sage-100 shadow-[0_1px_4px_rgba(30,46,26,0.06)]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 shadow-[0_4px_14px_rgba(58,110,40,0.3)] flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-white fill-white/25" />
            </div>
            <span className="text-[19px] font-bold tracking-tight text-sage-900">
              MediAI<span className="text-brand-600">Care</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[14px] text-sage-500 font-medium">
            <a href="#plateforme" className="hover:text-sage-900 transition-colors">La Plateforme</a>
            <a href="#utilisateurs" className="hover:text-sage-900 transition-colors">Pour qui ?</a>
            <a href="#temoignage" className="hover:text-sage-900 transition-colors">Témoignages</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => openAuth('patient', 'login')}
              className="px-3.5 py-2 rounded-xl text-[13px] text-sage-600 font-semibold hover:text-sage-900 hover:bg-sage-50 transition"
            >
              Se connecter
            </button>
            <button
              onClick={() => openAuth('doctor', 'register')}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-sage-200 text-[13px] text-sage-700 font-semibold hover:bg-sage-50 transition shadow-sm"
            >
              Accès Pro
            </button>
            <button
              onClick={() => openAuth('patient', 'register')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition shadow-[0_2px_10px_rgba(58,110,40,0.3)]"
            >
              Créer mon espace
            </button>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO SPLIT ── */}
      <section className="relative pt-[100px] pb-0 overflow-hidden min-h-screen flex items-center">

        {/* Background blobs */}
        <div className="absolute top-20 right-0 w-[640px] h-[640px] blob bg-brand-100/60 blur-3xl -z-0 animate-float" />
        <div className="absolute bottom-10 left-20 w-[380px] h-[380px] blob bg-amber-100/50 blur-3xl -z-0" />

        <div className="relative z-10 mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — Text */}
            <div>
              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-700 text-[12px] font-bold uppercase tracking-wide mb-6"
              >
                <Zap className="w-3.5 h-3.5" />
                Simplifiez votre vie avec le diabète
              </motion.div>

              <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}
                className="text-[46px] sm:text-[58px] leading-[1.1] font-black tracking-tight text-sage-900"
              >
                Votre santé.<br />
                <span className="gradient-text">Vos règles.</span>
              </motion.h1>

              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2}
                className="mt-5 text-[18px] leading-relaxed text-sage-500 max-w-[520px]"
              >
                MediAI Care réunit vos données CGM, pompe à insuline et wearables dans un tableau de bord unique — avec une IA qui vous comprend vraiment.
              </motion.p>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}
                className="mt-8 flex flex-wrap gap-3"
              >
                <button
                  onClick={() => openAuth('patient', 'register')}
                  className="px-7 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[15px] shadow-[0_4px_20px_rgba(58,110,40,0.35)] hover:shadow-[0_6px_28px_rgba(58,110,40,0.45)] transition-all duration-200"
                >
                  Commencer gratuitement
                </button>
                <button
                  onClick={() => openAuth('doctor', 'register')}
                  className="px-7 py-3.5 rounded-2xl bg-white border border-sage-200 text-sage-700 font-bold text-[15px] hover:bg-sage-50 transition-all duration-200 shadow-sm"
                >
                  Je suis médecin
                </button>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}
                className="mt-8 flex items-center gap-4 text-[13px] text-sage-500"
              >
                {[
                  'Données sécurisées HDS',
                  'Certifié IEC 62304',
                  'RGPD conforme',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — Hero Card (visual) */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="relative hidden lg:flex justify-center items-center"
            >
              {/* Main card */}
              <div className="w-full max-w-[400px] bg-white rounded-3xl card-shadow-md p-6 relative z-10">

                {/* Greeting */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[12px] font-semibold text-sage-400 uppercase tracking-wide">Bonjour Alex 👋</div>
                    <div className="text-[15px] font-bold text-sage-900 mt-0.5">Votre glycémie en temps réel</div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-white/25" />
                  </div>
                </div>

                {/* Glucose hero */}
                <div className="bg-brand-50 rounded-2xl p-4 mb-4 flex items-end justify-between">
                  <div>
                    <div className="text-[48px] font-black text-brand-700 leading-none tabular-nums">117</div>
                    <div className="text-[13px] text-brand-500 font-semibold mt-1">mg/dL · Dans votre cible ✓</div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <div className="text-[11px] text-sage-400">Cible 80–160</div>
                    <div className="flex items-center gap-1 text-[11px] text-brand-600 font-semibold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Stable →
                    </div>
                  </div>
                </div>

                {/* Mini sparkline bars */}
                <div className="flex items-end gap-1 h-10 mb-4">
                  {[65, 75, 85, 72, 88, 82, 90, 78, 82, 88, 92, 87].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm transition-all"
                      style={{
                        height: `${(v / 100) * 100}%`,
                        background: i === 11 ? '#4a8a35' : i >= 9 ? '#8cbf78' : '#dcecd4',
                      }}
                    />
                  ))}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { emoji: '🍽️', label: 'Repas',    bg: 'bg-brand-50',  text: 'text-brand-700' },
                    { emoji: '💉', label: 'Insuline', bg: 'bg-coral-50',   text: 'text-coral-600' },
                    { emoji: '🏃', label: 'Sport',    bg: 'bg-amber-50',   text: 'text-amber-700' },
                    { emoji: '📝', label: 'Note',     bg: 'bg-blue-50',    text: 'text-blue-700' },
                  ].map(({ emoji, label, bg, text }) => (
                    <div key={label} className={`${bg} rounded-xl p-2.5 flex flex-col items-center gap-1`}>
                      <span className="text-[18px]">{emoji}</span>
                      <span className={`text-[10px] font-semibold ${text}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* AI message */}
                <div className="mt-4 flex items-start gap-2.5 p-3 bg-sage-50 rounded-xl border border-sage-100">
                  <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px]">🤖</span>
                  </div>
                  <div className="text-[11.5px] text-sage-600 leading-snug">
                    <span className="font-semibold text-sage-800">IA MediAI ·</span> Votre glycémie est stable depuis 3h. Continuez comme ça !
                  </div>
                </div>
              </div>

              {/* Floating badge — TIR */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl card-shadow px-4 py-3 z-20">
                <div className="text-[10px] text-sage-400 font-semibold uppercase tracking-wide mb-0.5">TIR 14 jours</div>
                <div className="text-[22px] font-black text-brand-600">78%</div>
                <div className="text-[10px] text-brand-500 font-semibold">▲ Excellent !</div>
              </div>

              {/* Floating badge — streak */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl card-shadow px-4 py-3 z-20 flex items-center gap-2">
                <div className="text-[22px]">🔥</div>
                <div>
                  <div className="text-[13px] font-black text-sage-900">7 jours</div>
                  <div className="text-[10px] text-sage-400 font-semibold">de suivi parfait</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. STATS BAND ── */}
      <section className="bg-brand-600 py-10">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {[
              { val: '10 000+', label: 'Patients suivis', icon: Users },
              { val: '95%',     label: 'Satisfaction',    icon: Star },
              { val: '6+',      label: 'Marques CGM',     icon: Smartphone },
              { val: '< 2min',  label: "Délai d'alerte",  icon: Zap },
            ].map(({ val, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="w-6 h-6 text-brand-200" />
                <div className="text-[28px] font-black text-white">{val}</div>
                <div className="text-[13px] text-brand-200 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. AUDIENCES ── */}
      <section id="utilisateurs" className="py-24 bg-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-700 text-[12px] font-bold uppercase tracking-wide mb-4">
              Pour tout le monde
            </div>
            <h2 className="text-[38px] font-black text-sage-900">Conçu pour vous, pas pour les ingénieurs</h2>
            <p className="text-[16px] text-sage-500 mt-3 max-w-[560px] mx-auto">
              Que vous viviez avec le diabète ou que vous accompagniez vos patients, MediAI Care s'adapte à votre quotidien.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Patients */}
            <div className="bg-brand-50 rounded-3xl p-8 border border-brand-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-[12px] font-bold mb-5">
                <Smartphone className="w-3.5 h-3.5" />
                Pour les Patients
              </div>
              <h3 className="text-[26px] font-black text-sage-900 leading-tight mb-3">
                Reprenez le contrôle de votre santé
              </h3>
              <p className="text-[15px] text-sage-500 leading-relaxed mb-6">
                Fini les 5 applications différentes. Toutes vos données CGM, pompe et montre dans un journal unique — clair, lisible, actionnnable.
              </p>
              <ul className="space-y-3 mb-7">
                {[
                  'Alertes intelligentes avant les crises',
                  'Conseils personnalisés au quotidien',
                  'Partage transparent avec vos soignants',
                  'Journal repas, insuline & activité',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-sage-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-brand-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-700" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openAuth('patient', 'register')}
                className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-[14px] transition shadow-[0_2px_10px_rgba(58,110,40,0.3)] group"
              >
                Créer mon espace
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Cliniciens */}
            <div className="bg-blue-50 rounded-3xl p-8 border border-blue-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[12px] font-bold mb-5">
                <Award className="w-3.5 h-3.5" />
                Pour les Cliniciens
              </div>
              <h3 className="text-[26px] font-black text-sage-900 leading-tight mb-3">
                Décidez plus vite, mieux informé
              </h3>
              <p className="text-[15px] text-sage-500 leading-relaxed mb-6">
                Une vue consolidée de toute votre cohorte. Identifiez en secondes les patients prioritaires et validez les recommandations IA avec les explications SHAP.
              </p>
              <ul className="space-y-3 mb-7">
                {[
                  'Triage intelligent de la cohorte',
                  'Recommandations posologiques IA explicables',
                  'Rapports cliniques en un clic',
                  'Messagerie sécurisée HDS',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[14px] text-sage-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openAuth('doctor', 'register')}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-[14px] transition shadow-[0_2px_10px_rgba(37,99,235,0.25)] group"
              >
                Accès professionnel
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. TÉMOIGNAGE ── */}
      <section id="temoignage" className="py-20 bg-[#f4f6ef]">
        <div className="mx-auto max-w-[900px] px-4">
          <div className="bg-white rounded-3xl card-shadow-md p-10 md:p-14 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 blob bg-brand-100/40 -translate-y-8 translate-x-8" />
            <div className="flex gap-1 mb-6 relative z-10">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <blockquote className="text-[21px] md:text-[25px] leading-relaxed font-semibold text-sage-800 tracking-tight max-w-[720px] mb-8 relative z-10">
              "MediAI Care a transformé notre approche thérapeutique. Les explications IA nous permettent de valider immédiatement les recommandations et d'instaurer une vraie confiance avec nos patients."
            </blockquote>
            <div className="flex flex-col items-center relative z-10">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-[16px] mb-2">MR</div>
              <div className="text-[15px] font-bold text-sage-900">Dr. M. Renaud</div>
              <div className="text-[13px] text-sage-400 mt-0.5 font-medium">Diabétologue référent hospitalier</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. APPAREILS COMPATIBLES ── */}
      <section id="plateforme" className="py-20 bg-white">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[34px] font-black text-sage-900">Compatible avec vos appareils</h2>
            <p className="text-[16px] text-sage-500 mt-3">Liberté de choix garantie. Aucun lock-in propriétaire.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { name: 'Dexcom G7',       cat: 'CGM',              emoji: '📡' },
              { name: 'FreeStyle Libre', cat: 'CGM Flash',        emoji: '🔵' },
              { name: 'Omnipod 5',       cat: 'Micro-pompe',      emoji: '💊' },
              { name: 'Omron',           cat: 'Tension',          emoji: '❤️' },
              { name: 'Apple Watch',     cat: 'Wearable',         emoji: '⌚' },
              { name: 'Contour Next',    cat: 'Glucomètre',       emoji: '🩸' },
            ].map(({ name, cat, emoji }) => (
              <div key={name} className="flex flex-col items-center justify-center p-5 bg-sage-50 rounded-2xl hover:bg-brand-50 hover:ring-1 hover:ring-brand-200 transition group cursor-default">
                <div className="text-[28px] mb-2 group-hover:scale-110 transition">{emoji}</div>
                <span className="text-[13px] font-bold text-sage-800 text-center">{name}</span>
                <span className="text-[11px] text-sage-400 mt-0.5">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. SECURITÉ ── */}
      <section className="py-16 bg-[#f4f6ef]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="bg-sage-900 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-[620px]">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-[12px] font-bold uppercase tracking-wide mb-4">
                <Shield className="w-4 h-4" />
                Sécurité médicale niveau bancaire
              </div>
              <h3 className="text-[28px] font-black text-white leading-snug mb-3">
                Vos données de santé vous appartiennent
              </h3>
              <p className="text-[15px] text-sage-300 leading-relaxed mb-4">
                Chiffrement AES-256 de bout en bout, authentification PBKDF2, conformité RGPD & HDS. Votre vie privée est notre priorité absolue.
              </p>
              <div className="flex flex-wrap gap-2">
                {['RGPD · HDS', 'HL7 FHIR', 'Audit IEC 62304', 'ISO 13485', 'PBKDF2 Auth'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-lg bg-white/10 text-[12px] text-sage-200 font-semibold">{tag}</span>
                ))}
              </div>
            </div>
            <button
              onClick={() => { onNavigate('audit'); }}
              className="px-6 py-3 rounded-2xl bg-white text-sage-900 font-bold text-[14px] hover:bg-sage-50 transition shadow-lg shrink-0"
            >
              Voir les logs d'audit →
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. CTA FINAL ── */}
      <section className="py-24 bg-brand-600 text-white text-center">
        <div className="mx-auto max-w-[700px] px-4">
          <div className="text-[36px] sm:text-[44px] font-black leading-tight mb-4">
            Prêt à simplifier<br />votre vie avec le diabète ?
          </div>
          <p className="text-[17px] text-brand-200 mb-8 max-w-[480px] mx-auto">
            Rejoignez des milliers de patients et de soignants qui font confiance à MediAI Care.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => openAuth('patient', 'register')}
              className="px-8 py-4 rounded-2xl bg-white text-brand-700 font-black text-[15px] hover:bg-brand-50 transition shadow-lg"
            >
              Commencer gratuitement
            </button>
            <button
              onClick={() => openAuth('doctor', 'register')}
              className="px-8 py-4 rounded-2xl bg-brand-500/40 text-white font-bold text-[15px] hover:bg-brand-500/60 transition border border-white/20"
            >
              Accès professionnel
            </button>
          </div>
        </div>
      </section>

      {/* ── 9. FOOTER ── */}
      <footer className="bg-sage-900 py-10">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-sage-400">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white/25" />
            </div>
            <span>© 2026 MediAI Care — Tous droits réservés.</span>
          </div>
          <div className="flex items-center gap-2 text-brand-400 font-semibold">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Système opérationnel
          </div>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={authType !== null}
        onClose={() => setAuthType(null)}
        type={authType || 'patient'}
        defaultMode={authMode}
      />
    </div>
  );
}
