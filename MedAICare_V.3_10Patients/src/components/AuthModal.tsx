// ============================================================================
// AUTH MODAL v5.0 — MediAI Care · Premium Healthtech
// Formulaire clair, hiérarchie forte, accessible, rassurant
// ============================================================================

import { useState, useEffect } from 'react';
import { X, Shield, User, Stethoscope, ArrowRight, Loader2, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../auth/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'patient' | 'doctor';
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, type, defaultMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');

  useEffect(() => { setIsLogin(defaultMode === 'login'); }, [defaultMode, isOpen]);

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [name,      setName]      = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.success) {
          setSuccess('Connexion réussie !');
          setTimeout(() => { onClose(); setEmail(''); setPassword(''); }, 800);
        } else {
          setError(result.error || 'Identifiants invalides');
        }
      } else {
        const role: UserRole = type === 'doctor' ? 'clinician' : 'patient';
        const result = await register(email, password, name, role, specialty);
        if (result.success) {
          setSuccess('Compte créé avec succès !');
          setTimeout(() => { onClose(); setEmail(''); setPassword(''); setName(''); setSpecialty(''); }, 800);
        } else {
          setError(result.error || 'Erreur lors de la création');
        }
      }
    } catch {
      setError('Erreur technique. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(type === 'patient' ? 'patient@demo.fr' : 'clinicien@demo.fr');
    setPassword('Demo1234!');
    setIsLogin(true);
  };

  const isPatient = type === 'patient';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[420px] bg-white rounded-2xl card-shadow-lg overflow-hidden animate-fade-in-up">

        {/* Color strip top */}
        <div className={`h-1 ${isPatient ? 'bg-brand-600' : 'bg-blue-600'}`} />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
          <X className="w-4.5 h-4.5" />
        </button>

        <div className="p-7">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
              isPatient ? 'bg-brand-100' : 'bg-blue-100'
            }`}>
              {isPatient
                ? <User className="w-5.5 h-5.5 text-brand-700" />
                : <Stethoscope className="w-5.5 h-5.5 text-blue-700" />
              }
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">
              {isPatient
                ? isLogin ? 'Connexion patient'     : 'Créer mon espace'
                : isLogin ? 'Accès professionnel'   : 'Compte clinicien'}
            </h2>
            <p className="text-[12.5px] text-slate-400 mt-1 font-medium">
              {isPatient ? 'Accès sécurisé à vos données de santé' : 'Réservé aux professionnels de santé habilités'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-red-700 font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-brand-700 font-semibold">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Nom complet</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder={isPatient ? 'Alexandre Martin' : 'Dr. Sarah Dupont'}
                  className="input-premium"
                />
              </div>
            )}

            {type === 'doctor' && !isLogin && (
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Spécialité & RPPS</label>
                <input
                  type="text" required value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="Ex. Endocrinologie / 10100567890"
                  className="input-premium"
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Adresse email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Mot de passe</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={8}
                className="input-premium"
              />
              {!isLogin && (
                <p className="text-[11px] text-slate-400 mt-1.5 font-medium">8 caractères min. — majuscule, minuscule et chiffre requis</p>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full mt-1 py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition-all ${
                isPatient
                  ? 'bg-brand-600 hover:bg-brand-700 shadow-[0_2px_12px_rgba(16,185,129,0.3)]'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-[0_2px_12px_rgba(37,99,235,0.25)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isLogin ? 'Se connecter' : 'Créer mon compte'}<ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>

          {/* Demo access */}
          <div className="mt-3">
            <button
              onClick={fillDemo}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[12.5px] text-slate-600 hover:text-slate-900 font-semibold transition flex items-center justify-center gap-2"
            >
              <span className="text-brand-600">→</span>
              Utiliser le compte démonstration
            </button>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className={`text-[12.5px] font-semibold ${isPatient ? 'text-brand-700 hover:text-brand-800' : 'text-blue-700 hover:text-blue-800'} hover:underline transition`}
            >
              {isLogin
                ? isPatient ? "Pas de compte ? Créer mon espace" : "Demander un accès professionnel"
                : "Déjà un compte ? Se connecter"}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <Lock className="w-3 h-3 text-brand-500" />
              Authentification PBKDF2 · Hébergement HDS France
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
