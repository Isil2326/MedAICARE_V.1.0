// ============================================================================
// LANDING PAGE v5.0 — MediAI Care · Startup SaaS · Inspired by mySugr
// ============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Shield, Activity, BrainCircuit, BarChart3,
  Sparkles, ChevronDown, Check, Star,
} from 'lucide-react';
import type { ViewMode } from '../types/medical';
import AuthModal from './AuthModal';

// ── Animation variants ────────────────────────────────────────────────────────
const fade  = (delay = 0) => ({ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] } } });
const fadeX = (dir: 1 | -1, delay = 0) => ({ hidden: { opacity: 0, x: dir * 40 }, visible: { opacity: 1, x: 0, transition: { delay, duration: 0.65, ease: [0.22, 1, 0.36, 1] } } });

interface LandingPageProps { onNavigate: (view: ViewMode) => void; }

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [authType, setAuthType] = useState<'patient' | 'doctor' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const openAuth = (type: 'patient' | 'doctor', mode: 'login' | 'register') => { setAuthType(type); setAuthMode(mode); };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-brand-100">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-100/80">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-3">
            {/* Water drop + stethoscope mark */}
            <img src="/logo-mark.svg" alt="MediAI Care" className="w-10 h-10 shrink-0" />
            {/* Wordmark */}
            <div className="flex flex-col gap-0">
              <div className="flex items-baseline leading-none">
                <span className="text-[18px] font-black text-slate-900 tracking-[-0.03em]">Medi</span>
                <span className="text-[18px] font-black gradient-text-brand tracking-[-0.03em]">AI</span>
                <span className="text-[12px] font-bold text-slate-400 tracking-wide ml-1.5 self-center">CARE</span>
              </div>
              <div className="text-[7.5px] font-bold text-slate-400 uppercase tracking-[0.13em] mt-[3px] leading-none">
                Reprenez le contrôle
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-7 text-[13.5px] text-slate-500 font-medium">
            <a href="#fonctionnalites" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#pour-qui" className="hover:text-slate-900 transition-colors">Pour qui ?</a>
            <a href="#securite" className="hover:text-slate-900 transition-colors">Sécurité</a>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <button onClick={() => openAuth('patient', 'login')} className="hidden sm:block px-4 py-2 text-[13px] text-slate-600 font-semibold hover:text-slate-900 transition">
              Connexion
            </button>
            <button onClick={() => openAuth('patient', 'register')} className="px-4 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-[13px] transition shadow-[0_2px_12px_rgba(16,185,129,0.3)]">
              Essayer gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-brand-200/40 to-teal-200/20 blur-[140px] -translate-y-40 translate-x-40 pointer-events-none animate-glow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-cyan-200/25 to-brand-100/30 blur-[100px] translate-y-28 -translate-x-28 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-emerald-100/20 to-teal-100/15 blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8 w-full py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Text column */}
            <div className="max-w-[540px]">
              <motion.div variants={fade(0)} initial="hidden" animate="visible">
                <span className="inline-flex items-center gap-2 text-[12px] font-bold text-brand-700 uppercase tracking-widest mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Plateforme IA médicale · Diabète
                </span>
              </motion.div>

              <motion.h1 variants={fade(0.08)} initial="hidden" animate="visible"
                className="text-[52px] sm:text-[64px] leading-[1.04] font-black tracking-[-2px] text-slate-900 mb-6"
              >
                L'IA qui<br />
                <span className="text-brand-600">simplifie</span><br />
                votre diabète.
              </motion.h1>

              <motion.div variants={fade(0.13)} initial="hidden" animate="visible"
                className="flex items-center gap-3 mb-4"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <div className="w-6 h-px bg-gradient-to-r from-brand-400 to-brand-200" />
                </div>
                <span className="text-[11.5px] font-black uppercase tracking-[0.2em] gradient-text-vivid">
                  Intelligence médicale · Clarté humaine
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-px bg-gradient-to-l from-brand-400 to-brand-200" />
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                </div>
              </motion.div>

              <motion.p variants={fade(0.18)} initial="hidden" animate="visible"
                className="text-[16px] leading-[1.75] text-slate-500 mb-8 font-medium"
              >
                Des prédictions glycémiques en langage clair, une analyse de vos données en temps réel, et une équipe médicale connectée — tout dans une seule application.
              </motion.p>

              <motion.div variants={fade(0.22)} initial="hidden" animate="visible" className="flex flex-col sm:flex-row gap-3 mb-10">
                <button
                  onClick={() => openAuth('patient', 'register')}
                  className="group inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-400 hover:to-brand-600 text-white font-bold text-[15px] transition-all duration-200 shadow-[0_4px_24px_rgba(16,185,129,0.45)] hover:shadow-[0_8px_36px_rgba(16,185,129,0.58)] hover:-translate-y-1"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => openAuth('doctor', 'register')}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white border border-slate-200 text-slate-800 font-bold text-[15px] hover:bg-slate-50 transition-all hover:border-slate-300 hover:-translate-y-0.5"
                >
                  Accès médecin
                </button>
              </motion.div>

              {/* App store badges */}
              <motion.div variants={fade(0.28)} initial="hidden" animate="visible" className="flex items-center gap-3">
                <span className="text-[12px] text-slate-400 font-medium">Application mobile :</span>
                <AppStoreBadge store="apple" />
                <AppStoreBadge store="google" />
              </motion.div>
            </div>

            {/* Phone mockup column */}
            <motion.div variants={fadeX(-1, 0.1)} initial="hidden" animate="visible"
              className="hidden lg:flex justify-center items-center"
            >
              <PhoneMockup onNavigate={onNavigate} />
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.div variants={fade(0.5)} initial="hidden" animate="visible" className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-300">
            <span className="text-[11px] font-medium uppercase tracking-widest">Découvrir</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* ── TRUST BAND ──────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: '10 000+', label: 'Patients accompagnés' },
              { val: '95%',     label: 'Satisfaction patients' },
              { val: '< 2 min', label: "Délai d'alerte" },
              { val: '6+',      label: 'Appareils CGM compatibles' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-[32px] font-black text-brand-600 leading-none mb-1">{val}</div>
                <div className="text-[13px] text-slate-400 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES 3-PILIERS ──────────────────────────────────────────────── */}
      <section id="fonctionnalites" className="py-28 bg-white">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="text-center mb-16">
            <motion.p variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-[13px] font-bold text-brand-600 uppercase tracking-widest mb-3"
            >
              Ce qu'on fait
            </motion.p>
            <motion.h2 variants={fade(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-[42px] font-black tracking-tight text-slate-900 leading-[1.1]"
            >
              Une IA médicale,<br />enfin compréhensible.
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                Icon: BrainCircuit,
                color: 'brand',
                title: 'Prédictions en langage clair',
                desc: "Notre IA prédit vos glycémies 2h à l'avance et vous explique pourquoi — en mots simples, pas en chiffres abstraits.",
                tag: 'IA Explicable (XAI)',
              },
              {
                Icon: BarChart3,
                color: 'blue',
                title: 'Analyse de données massives',
                desc: "Des milliers de points de données CGM, repas, insuline et activité analysés en temps réel pour vous donner la vraie image de votre équilibre.",
                tag: 'IoMT · Temps réel',
              },
              {
                Icon: Sparkles,
                color: 'coral',
                title: 'Recommandations actionnables',
                desc: 'Pas des listes de règles impossibles. Des suggestions précises, validées cliniquement, adaptées à votre vie du moment.',
                tag: 'Personnalisé · Validé MD',
              },
            ].map(({ Icon, color, title, desc, tag }) => (
              <motion.div key={title} variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group p-8 rounded-3xl border border-slate-100/80 hover:border-transparent hover:shadow-[0_16px_56px_rgba(16,185,129,0.15)] bg-white hover:bg-gradient-to-br hover:from-white hover:to-brand-50/40 transition-all duration-500 cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${
                  color === 'brand' ? 'icon-vivid-emerald' : color === 'blue' ? 'icon-vivid-sky' : 'icon-vivid-coral'
                }`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{tag}</div>
                <h3 className="text-[20px] font-black text-slate-900 leading-tight mb-3">{title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed font-medium">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP DIVE 1 — AI Predictions ───────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeX(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="text-[12px] font-bold text-brand-600 uppercase tracking-widest block mb-4">Prédictions IA</span>
              <h2 className="text-[38px] font-black tracking-tight leading-[1.1] text-slate-900 mb-5">
                "Votre glycémie va monter dans 90 min."<br />
                <span className="text-slate-400">On vous dit pourquoi.</span>
              </h2>
              <p className="text-[16px] text-slate-500 leading-relaxed mb-7 font-medium">
                Notre moteur XGBoost analyse vos patterns CGM et génère des prédictions expliquées en français, avec le facteur déclencheur principal mis en avant. Fini les alertes sans contexte.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  '2h de prévisibilité glycémique',
                  'Facteur principal identifié (repas / stress / activité)',
                  'Confiance IA affichée clairement',
                  'Validé par un comité clinique',
                ].map(it => (
                  <li key={it} className="flex items-center gap-3 text-[14px] text-slate-700 font-semibold">
                    <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {it}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth('patient', 'register')} className="group inline-flex items-center gap-2 text-brand-600 font-bold text-[15px] hover:gap-3 transition-all">
                Essayer maintenant <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div variants={fadeX(-1, 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex justify-center"
            >
              <AIFeatureCard />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURE DEEP DIVE 2 — Data Analysis ────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeX(1, 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="order-2 lg:order-1 flex justify-center"
            >
              <DataFeatureCard />
            </motion.div>

            <motion.div variants={fadeX(-1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="order-1 lg:order-2">
              <span className="text-[12px] font-bold text-blue-600 uppercase tracking-widest block mb-4">Analyse données IoMT</span>
              <h2 className="text-[38px] font-black tracking-tight leading-[1.1] text-slate-900 mb-5">
                Toutes vos données,<br />
                <span className="text-slate-400">enfin réunies.</span>
              </h2>
              <p className="text-[16px] text-slate-500 leading-relaxed mb-7 font-medium">
                CGM, pompe à insuline, glucomètre, montre connectée — toutes vos sources synchronisées automatiquement. Notre algorithme détecte les tendances invisibles à l'œil nu.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  '6+ appareils CGM compatibles',
                  'Analyse TIR, GMI, variabilité',
                  'Rapports cliniques automatiques',
                  'Partage sécurisé avec votre équipe',
                ].map(it => (
                  <li key={it} className="flex items-center gap-3 text-[14px] text-slate-700 font-semibold">
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                    {it}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth('doctor', 'register')} className="group inline-flex items-center gap-2 text-blue-600 font-bold text-[15px] hover:gap-3 transition-all">
                Accès clinicien <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── POUR QUI ────────────────────────────────────────────────────────── */}
      <section id="pour-qui" className="py-24 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="text-center mb-14">
            <motion.h2 variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-[40px] font-black tracking-tight text-slate-900"
            >
              Conçu pour deux réalités.
            </motion.h2>
            <p className="text-[16px] text-slate-400 mt-3 font-medium">Patients et soignants, enfin sur la même longueur d'onde.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Patient */}
            <motion.div variants={fadeX(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white rounded-3xl p-9 shadow-[0_8px_40px_rgba(16,185,129,0.12)] border border-brand-100/60 hover:shadow-[0_16px_56px_rgba(16,185,129,0.18)] transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl icon-vivid-emerald flex items-center justify-center mb-5 animate-float-slow">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="text-[12px] font-bold text-brand-600 uppercase tracking-widest mb-2">Patients</div>
              <h3 className="text-[26px] font-black text-slate-900 leading-tight mb-3">Reprenez le contrôle.</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed mb-6 font-medium">
                Fini les 5 apps différentes. Toutes vos données dans un seul endroit, avec une IA qui vous parle vraiment.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Alertes avant les crises', 'Conseils quotidiens personnalisés', 'Journal repas & insuline', 'Communication directe avec votre médecin'].map(it => (
                  <li key={it} className="flex items-center gap-2.5 text-[13.5px] text-slate-700 font-medium">
                    <div className="w-4 h-4 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-brand-700" strokeWidth={3} />
                    </div>
                    {it}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth('patient', 'register')} className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-[14px] transition-all shadow-[0_2px_12px_rgba(16,185,129,0.25)]">
                Créer mon espace
              </button>
            </motion.div>

            {/* Clinicien */}
            <motion.div variants={fadeX(-1, 0.05)} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 rounded-3xl p-9 text-white shadow-[0_16px_56px_rgba(15,23,42,0.25)] relative overflow-hidden"
            >
              {/* ambient glow */}
              <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-brand-500/10 blur-[60px] pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl icon-vivid-teal flex items-center justify-center mb-5 animate-float-slow">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              <div className="text-[12px] font-bold text-brand-300 uppercase tracking-widest mb-2">Cliniciens</div>
              <h3 className="text-[26px] font-black text-white leading-tight mb-3">Décidez mieux, plus vite.</h3>
              <p className="text-[14px] text-white/60 leading-relaxed mb-6 font-medium">
                Vue unifiée sur votre cohorte, recommandations IA validées cliniquement, et messagerie sécurisée HDS.
              </p>
              <ul className="space-y-2.5 mb-8">
                {['Triage intelligent de la cohorte', 'Recommandations IA explicables SHAP', 'Prescriptions avec audit trail', 'Messagerie sécurisée HDS'].map(it => (
                  <li key={it} className="flex items-center gap-2.5 text-[13.5px] text-white/80 font-medium">
                    <div className="w-4 h-4 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    {it}
                  </li>
                ))}
              </ul>
              <button onClick={() => openAuth('doctor', 'register')} className="w-full py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-bold text-[14px] transition-all">
                Accès professionnel
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-[800px] px-5">
          <motion.div variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex justify-center gap-1 mb-8">
              {[0,1,2,3,4].map(i => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <blockquote className="text-[26px] md:text-[30px] font-bold text-slate-900 leading-[1.4] tracking-tight mb-10">
              "MediAI Care a changé notre pratique. Les explications IA nous permettent de valider les recommandations en secondes et d'instaurer une vraie confiance avec nos patients."
            </blockquote>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center font-black text-brand-700 text-[15px] mb-2">MR</div>
              <div className="font-bold text-slate-900 text-[15px]">Dr. M. Renaud</div>
              <div className="text-[13px] text-slate-400 font-medium">Diabétologue référent · CHU Bordeaux</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SÉCURITÉ ────────────────────────────────────────────────────────── */}
      <section id="securite" className="py-16 bg-slate-50">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <motion.div variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_2px_24px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-slate-900 mb-1">Vos données vous appartiennent.</h3>
                <p className="text-[14px] text-slate-500 font-medium">Chiffrement AES-256 · Hébergement HDS France · Conforme RGPD & IEC 62304</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['HDS', 'RGPD', 'HL7 FHIR', 'IEC 62304', 'ISO 13485'].map(t => (
                    <span key={t} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => onNavigate('audit')} className="shrink-0 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-[13px] transition whitespace-nowrap">
              Voir les logs d'audit →
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── APP DOWNLOAD CTA ────────────────────────────────────────────────── */}
      <section className="py-28 bg-brand-600 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-brand-500/50 blur-[80px]" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-brand-700/50 blur-[60px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-5 text-center">
          <motion.div variants={fade(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <p className="text-[13px] font-bold text-brand-200 uppercase tracking-widest mb-4">Téléchargez l'application</p>
            <h2 className="text-[44px] sm:text-[52px] font-black text-white leading-[1.05] tracking-tight mb-5">
              Commencez aujourd'hui.<br />Gratuitement.
            </h2>
            <p className="text-[17px] text-brand-200 mb-10 font-medium">
              Rejoignez des milliers de patients qui simplifient leur vie avec le diabète.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <AppStoreBadge store="apple" dark />
              <AppStoreBadge store="google" dark />
            </div>
            <p className="text-[13px] text-brand-200/70">ou</p>
            <button onClick={() => openAuth('patient', 'register')} className="mt-4 inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-brand-700 font-black text-[15px] hover:bg-brand-50 transition-all shadow-lg">
              Accéder à la plateforme web
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-12">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src="/logo-mark.svg" alt="MediAI Care" className="w-8 h-8 shrink-0 brightness-[1.05]" />
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="text-[15px] font-black text-white tracking-tight">Medi</span>
                  <span className="text-[15px] font-black text-brand-400 tracking-tight">AI</span>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wide ml-1 self-center">CARE</span>
                </div>
                <div className="text-[6.5px] font-bold text-slate-500 uppercase tracking-[0.14em] mt-[2px]">Reprenez le contrôle</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-[12.5px] text-slate-400 font-medium">
              <a href="#" className="hover:text-white transition">Confidentialité</a>
              <a href="#" className="hover:text-white transition">CGU</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>

            <p className="text-[12px] text-slate-500 font-medium">© 2026 MediAI Care · Thèse Bioinfo</p>
          </div>
        </div>
      </footer>

      {/* Auth modal */}
      <AuthModal
        isOpen={!!authType}
        type={authType ?? 'patient'}
        defaultMode={authMode}
        onClose={() => setAuthType(null)}
      />
    </div>
  );
}

// ── App Store Badge SVG ───────────────────────────────────────────────────────

function AppStoreBadge({ store, dark }: { store: 'apple' | 'google'; dark?: boolean }) {
  const base = dark
    ? 'flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition cursor-pointer'
    : 'flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 transition cursor-pointer';
  const textPrimary   = 'text-[15px] font-black text-white';
  const textSecondary = 'text-[10px] text-white/60 font-medium';

  if (store === 'apple') {
    return (
      <div className={base}>
        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white shrink-0"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        <div>
          <div className={textSecondary}>Télécharger sur</div>
          <div className={textPrimary}>App Store</div>
        </div>
      </div>
    );
  }
  return (
    <div className={base}>
      <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0"><path fill="#4285F4" d="M3.18 23.76c.31.17.66.24 1.02.21l13.04-7.53-2.9-2.91L3.18 23.76z"/><path fill="#EA4335" d="M20.32 9.58 17.24 7.8 14.1 10.94l3.14 3.14 3.09-1.79c.88-.51.88-1.2-.01-1.71z"/><path fill="#FBBC05" d="M4.2.03C3.85-.04 3.49.03 3.18.2L14.1 10.94l3.14-3.14L4.2.03z"/><path fill="#34A853" d="M3.18.2C2.3.71 1.75 1.7 1.75 2.98v18.04c0 1.28.55 2.28 1.43 2.74L14.1 12.94 3.18.2z"/></svg>
      <div>
        <div className={textSecondary}>Disponible sur</div>
        <div className={textPrimary}>Google Play</div>
      </div>
    </div>
  );
}

// ── Phone Mockup (Hero) ───────────────────────────────────────────────────────

function PhoneMockup({ onNavigate: _ }: { onNavigate: (v: ViewMode) => void }) {
  return (
    <div className="relative">
      {/* Glow */}
      <div className="absolute inset-0 rounded-[48px] bg-brand-200/30 blur-[60px] scale-110" />

      {/* Phone frame */}
      <div className="relative w-[300px] h-[620px] rounded-[44px] bg-slate-900 shadow-[0_32px_80px_rgba(0,0,0,0.35)] overflow-hidden border-4 border-slate-800">
        {/* Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-950 rounded-full z-20" />

        {/* Screen */}
        <div className="absolute inset-1 rounded-[40px] bg-slate-50 overflow-hidden">
          {/* Status bar */}
          <div className="h-10" />

          {/* App header */}
          <div className="px-5 pb-3">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bonjour, Alexandre 👋</div>
            <div className="text-[16px] font-black text-slate-900 mt-0.5">Aujourd'hui</div>
          </div>

          {/* Glucose card */}
          <div className="mx-4 mb-3 bg-white rounded-3xl p-4 shadow-sm">
            <div className="flex items-start justify-between mb-1">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Glycémie actuelle</div>
                <div className="text-[44px] font-black text-brand-600 leading-none tabular-nums mt-1">117</div>
                <div className="text-[11px] text-brand-500 font-bold mt-1">mg/dL · Dans la cible ✓</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-300 mb-1">TIR 14j</div>
                <div className="text-[22px] font-black text-brand-600">78%</div>
                <div className="text-[9px] text-brand-400 font-bold">▲ Excellent</div>
              </div>
            </div>
            {/* Mini chart */}
            <div className="flex items-end gap-0.5 h-8 mt-3">
              {[55,70,80,68,85,78,88,75,80,86,90,84].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{ height: `${(v/100)*100}%`, background: i===11 ? '#10B981' : i>=9 ? '#34D399' : '#D1FAE5' }} />
              ))}
            </div>
          </div>

          {/* AI insight */}
          <div className="mx-4 mb-3 bg-brand-600 rounded-2xl p-3.5">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                <BrainCircuit className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-[9px] font-bold text-brand-200 uppercase tracking-wider mb-0.5">IA · Prédiction 2h</div>
                <div className="text-[11px] text-white font-medium leading-snug">Légère hausse prévue après votre repas. Envisagez une marche de 10 min.</div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mx-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Repas', bg: 'bg-brand-50', ico: '🍽️' },
              { label: 'Insuline', bg: 'bg-red-50', ico: '💉' },
              { label: 'Sport', bg: 'bg-amber-50', ico: '🏃' },
              { label: 'Note', bg: 'bg-blue-50', ico: '📝' },
            ].map(({ label, bg, ico }) => (
              <div key={label} className={`${bg} rounded-2xl p-2 flex flex-col items-center gap-1`}>
                <span className="text-[16px]">{ico}</span>
                <span className="text-[8px] font-bold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -right-6 top-20 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] px-4 py-3 z-20 border border-slate-100">
        <div className="text-[9px] text-slate-400 font-bold uppercase">Streak</div>
        <div className="text-[16px] font-black text-slate-900 flex items-center gap-1">🔥 7 jours</div>
      </div>
    </div>
  );
}

// ── AI Feature Card ───────────────────────────────────────────────────────────

function AIFeatureCard() {
  return (
    <div className="w-full max-w-[380px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(16,185,129,0.12)] border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-2xl bg-brand-100 flex items-center justify-center">
          <BrainCircuit className="w-5 h-5 text-brand-600" />
        </div>
        <div>
          <div className="text-[13px] font-black text-slate-900">Prédiction glycémique</div>
          <div className="text-[10px] text-slate-400 font-medium">Dans 2 heures</div>
        </div>
      </div>

      {/* Prediction bar */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-slate-500 font-medium">Valeur prédite</span>
          <span className="text-[20px] font-black text-brand-600">142 mg/dL</span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: '62%' }} />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-slate-400 font-medium">
          <span>70</span><span className="text-brand-500 font-bold">Cible 80–160</span><span>300</span>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Pourquoi ? (IA explicable)</div>
        {[
          { label: 'Repas récent (pizza)', pct: 72, color: 'bg-amber-400' },
          { label: 'Stress détecté',       pct: 18, color: 'bg-coral-400' },
          { label: 'Activité réduite',     pct: 10, color: 'bg-slate-300' },
        ].map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-2 mb-2">
            <div className="w-24 text-[10px] text-slate-600 font-medium shrink-0">{label}</div>
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] font-bold text-slate-500 w-8 text-right">{pct}%</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        <span className="text-[11px] text-slate-500 font-medium">Confiance IA : <span className="text-brand-600 font-bold">89%</span></span>
      </div>
    </div>
  );
}

// ── Data Feature Card ─────────────────────────────────────────────────────────

function DataFeatureCard() {
  const metrics = [
    { label: 'TIR',  val: '78%',   sub: 'Temps dans la cible', color: 'text-brand-600', bg: 'bg-brand-50',  bar: 78  },
    { label: 'GMI',  val: '7.1%',  sub: 'HbA1c estimée',       color: 'text-blue-600',  bg: 'bg-blue-50',   bar: 55  },
    { label: 'CV',   val: '24%',   sub: 'Variabilité',         color: 'text-amber-600', bg: 'bg-amber-50',  bar: 35  },
    { label: 'TAR',  val: '15%',   sub: 'Temps au-dessus',     color: 'text-coral-500', bg: 'bg-coral-50',  bar: 15  },
  ];

  return (
    <div className="w-full max-w-[380px] bg-white rounded-3xl shadow-[0_8px_40px_rgba(37,99,235,0.10)] border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="text-[13px] font-black text-slate-900">Analyse · 30 derniers jours</div>
          <div className="text-[10px] text-slate-400 font-medium">Source : Dexcom G7 · FreeStyle Libre</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map(({ label, val, sub, color, bg, bar }) => (
          <div key={label} className={`${bg} rounded-2xl p-3.5`}>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-[22px] font-black ${color} leading-none mb-0.5`}>{val}</div>
            <div className="text-[9px] text-slate-400 font-medium mb-2">{sub}</div>
            <div className="w-full h-1 bg-white/70 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-current opacity-40" style={{ width: `${bar}%`, color: 'currentColor' }} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
        <p className="text-[11px] text-slate-600 font-medium leading-snug">
          <span className="font-bold text-slate-900">TIR en hausse de +8%</span> vs mois précédent — continuez vos efforts post-repas !
        </p>
      </div>
    </div>
  );
}
