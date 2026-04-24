import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Activity, CheckCircle2, Shield,
  ChevronRight, Sparkles, Smartphone, Award, Star
} from 'lucide-react';
import type { ViewMode } from '../types/medical';
import AuthModal from './AuthModal';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' as const },
  }),
};

interface LandingPageProps {
  onNavigate: (view: ViewMode) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [authType, setAuthType] = useState<'patient' | 'doctor' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 selection:bg-cyan-500/30 selection:text-white">
      {/* 1. NAVIGATION */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl bg-[#070A13]/80 border-b border-white/[0.04]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white/10" />
            </div>
            <span className="text-[20px] font-bold tracking-tight text-white">MediAI<span className="text-cyan-400">Care</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[14px] text-slate-400 font-medium">
            <a href="#plateforme" className="hover:text-white transition-colors">La Plateforme</a>
            <a href="#utilisateurs" className="hover:text-white transition-colors">Pour qui ?</a>
            <a href="#citation" className="hover:text-white transition-colors">Avis Médical</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { setAuthType('patient'); setAuthMode('login'); }}
              className="px-3.5 py-2 rounded-xl text-[13px] text-slate-400 font-medium hover:text-white transition"
            >
              Se connecter
            </button>
            <button
              onClick={() => { setAuthType('doctor'); setAuthMode('register'); }}
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[13px] text-slate-300 font-medium transition"
            >
              Demande d'accès Pro
            </button>
            <button
              onClick={() => { setAuthType('patient'); setAuthMode('register'); }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070A13] font-bold text-[13px] transition shadow-[0_4px_16px_rgba(6,182,212,0.2)]"
            >
              Créer mon espace
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-[160px] pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(6,182,212,0.12),_transparent_65%)]" />

        <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[12px] text-slate-300 font-semibold tracking-wide uppercase">Solution Intégrée de Santé Métabolique</span>
          </motion.div>

          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="mt-8 text-[44px] sm:text-[68px] leading-[1.1] font-black tracking-tight text-white max-w-[900px]">
            Unifiez vos données de santé.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500">Transformez le suivi clinique.</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="mt-6 text-[18px] leading-relaxed text-slate-400 max-w-[680px]">
            MediAICare synchronise l'ensemble de vos appareils médicaux connectés pour offrir une lecture claire, prédictive et sécurisée de votre parcours de soins.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="mt-10 flex items-center gap-4">
            <button onClick={() => { setAuthType('patient'); setAuthMode('register'); }} className="px-7 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070A13] font-bold text-[15px] shadow-lg hover:shadow-cyan-500/20 transition duration-200">
              Créer mon espace
            </button>
            <button onClick={() => { setAuthType('doctor'); setAuthMode('register'); }} className="px-7 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[15px] font-semibold text-white transition duration-200">
              Demande d'accès Pro
            </button>
          </motion.div>

          {/* Product Floating Badges */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4} className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4 border border-white/[0.05] bg-white/[0.01] backdrop-blur-sm rounded-[24px] p-6 max-w-[800px] w-full">
            {[
              { label: "Interopérabilité certifiée", val: "HL7 / FHIR", desc: "Données unifiées" },
              { label: "Prise en charge universelle", val: "6+ Marques IoMT", desc: "CGM, Pompes, Tracker" },
              { label: "Fiabilité et Explicabilité", val: "Certifié MLOps", desc: "Algorithmes vérifiables" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center text-center p-3">
                <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider mb-1">{item.label}</span>
                <span className="text-[22px] font-bold text-white mb-1">{item.val}</span>
                <span className="text-[13px] text-slate-400">{item.desc}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. AUDIENCES (PATIENT vs CLINICIAN) */}
      <section id="utilisateurs" className="relative py-24 border-t border-white/[0.03] bg-[#090D1A]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Patients side */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-[12px]">
                <Smartphone className="w-4 h-4" /> Pour les Patients
              </div>
              <h2 className="text-[32px] font-black leading-tight text-white">Reprenez le contrôle de votre santé métabolique</h2>
              <p className="text-[16px] text-slate-400 leading-relaxed">
                Plus besoin d'ouvrir 5 applications différentes. MediAI Care rassemble les relevés de votre capteur de glucose (CGM), de votre pompe et de votre montre connectée dans un journal unique.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Alertes proactives intelligentes",
                  "Conseils hygiéno-diététiques sur mesure",
                  "Partage direct et transparent avec vos proches ou soignants"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[14px] text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setAuthType('patient'); setAuthMode('login'); }} className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold text-[14px] transition mt-4 group">
                Consulter mon dashboard <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Clinicians side */}
            <div className="space-y-6 md:border-l md:border-white/[0.04] md:pl-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-[12px]">
                <Award className="w-4 h-4" /> Pour les Cliniciens
              </div>
              <h2 className="text-[32px] font-black leading-tight text-white">Simplifiez l'accompagnement thérapeutique</h2>
              <p className="text-[16px] text-slate-400 leading-relaxed">
                Accédez à une vue consolidée de vos patients. Réduisez le temps d'analyse des rapports et identifiez rapidement les patients nécessitant un ajustement thérapeutique immédiat.
              </p>
              <ul className="space-y-3 pt-2">
                {[
                  "Triage intelligent de cohorte (patients prioritaires)",
                  "Recommandations posologiques assistées par IA explicable",
                  "Génération rapide de rapports cliniques et analytiques"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[14px] text-slate-300">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => { setAuthType('doctor'); setAuthMode('login'); }} className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-[14px] transition mt-4 group">
                Ouvrir la console médicale <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: TESTIMONIAL CITATION */}
      <section id="citation" className="relative py-20 border-t border-white/[0.03] bg-[#070A13]">
        <div className="mx-auto max-w-[1000px] px-4">
          <div className="relative p-10 md:p-14 bg-white/[0.02] border border-white/[0.05] rounded-[28px] overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 p-12 text-white/[0.01] pointer-events-none">
              <Star className="w-[140px] h-[140px]" />
            </div>

            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              ))}
            </div>

            <blockquote className="text-[20px] md:text-[24px] leading-relaxed font-medium text-slate-200 tracking-tight max-w-[780px]">
              "MediAI Care a transformé notre approche thérapeutique. Les explications XAI nous permettent de valider immédiatement les prédictions et d'instaurer une confiance mutuelle."
            </blockquote>

            <div className="mt-8 flex flex-col items-center">
              <div className="text-[15px] font-bold text-white">Dr. M. Renaud</div>
              <div className="text-[13px] text-slate-400 mt-1 font-medium">Diabétologue référent hospitalier</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONNECTIVITY / IOMT ECOSYSTEM */}
      <section id="technologie" className="relative py-24 border-y border-white/[0.02] bg-[#070A13]">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-[700px] mx-auto mb-16">
            <h2 className="text-[34px] font-black text-white leading-snug">Connectivité Universelle</h2>
            <p className="text-[16px] text-slate-400 mt-4">
              Nous soutenons la liberté de choix. MediAI Care s'interface de manière transparente avec les équipements leaders du marché médical.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
            {[
              { name: 'Dexcom', type: 'CGM' },
              { name: 'FreeStyle Libre', type: 'Capteurs Flash' },
              { name: 'Omnipod', type: 'Micro-pompes' },
              { name: 'Omron', type: 'Tension artérielle' },
              { name: 'Apple Watch', type: ' Wearables' },
              { name: 'Contour Next', type: 'Glucomètres' },
            ].map((brand, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center p-6 border border-white/[0.03] bg-white/[0.01] rounded-2xl hover:border-white/[0.08] transition group">
                <div className="w-12 h-12 rounded-xl bg-slate-800/40 flex items-center justify-center mb-4 border border-white/[0.04]">
                  <Activity className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition duration-200" />
                </div>
                <span className="text-[15px] font-bold text-slate-200 text-center">{brand.name}</span>
                <span className="text-[12px] text-slate-500 mt-1">{brand.type}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TRUST & SECURITY */}
      <section className="py-24 bg-[#080D1D]/40">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent p-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-[650px] space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Sécurité des données de niveau bancaire
              </div>
              <h3 className="text-[28px] font-black leading-tight text-white">Conçu pour garantir la totale confidentialité médicale</h3>
              <p className="text-[15px] text-slate-400 leading-relaxed">
                Tous les flux de données sont chiffrés de bout en bout (AES-256). Nous respectons strictement les cadres de protection des données de santé (RGPD & Hébergement de Données de Santé - HDS).
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                {['RGPD / HDS compliant', 'Norme HL7 FHIR', 'Logs immuables', 'Consentement éclairé'].map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[12px] text-slate-300 font-medium">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-4 shrink-0">
              <button onClick={() => onNavigate('audit')} className="px-5 py-3 rounded-xl border border-white/[0.08] hover:bg-white/[0.03] text-white text-[14px] font-semibold transition">
                Accéder aux logs de traçabilité
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA */}
      <section className="relative py-28 border-t border-white/[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(6,182,212,0.1),_transparent_60%)]" />
        <div className="relative mx-auto max-w-[800px] px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <h2 className="text-[38px] font-black tracking-tight text-white leading-snug">Prêt à centraliser votre suivi ?</h2>
          <p className="text-[17px] text-slate-400 mt-4 max-w-[500px]">Prenez des décisions éclairées, jour après jour, en collaboration avec vos soignants.</p>
          
          <div className="mt-8 flex gap-4">
            <button onClick={() => { setAuthType('patient'); setAuthMode('register'); }} className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#070A13] font-bold text-[15px] shadow-lg transition">
              Créer mon espace
            </button>
            <button onClick={() => { setAuthType('doctor'); setAuthMode('register'); }} className="px-8 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-[15px] font-semibold text-slate-200 transition">
              Demande d'accès Pro
            </button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="border-t border-white/[0.04] bg-[#050811] py-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-[13px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white/10" />
            </div>
            <span>© 2026 MediAI Care. Tous droits réservés.</span>
          </div>
          <div className="flex gap-6">
            <span className="text-slate-400">Système opérationnel</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 self-center animate-pulse" />
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