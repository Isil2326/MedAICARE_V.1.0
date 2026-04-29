import { useState, useEffect } from 'react';
import { X, Shield, User, Stethoscope, ArrowRight, Loader2, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
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

  useEffect(() => {
    setIsLogin(defaultMode === 'login');
  }, [defaultMode, isOpen]);

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
  const accentBg = isPatient ? 'bg-brand-600' : 'bg-blue-600';
  const accentText = isPatient ? 'text-brand-700' : 'text-blue-700';
  const accentBorder = isPatient ? 'border-brand-200 focus:ring-brand-400/30' : 'border-blue-200 focus:ring-blue-400/30';
  const accentBtn = isPatient
    ? 'bg-brand-600 hover:bg-brand-700 shadow-[0_2px_10px_rgba(58,110,40,0.3)]'
    : 'bg-blue-600 hover:bg-blue-700 shadow-[0_2px_10px_rgba(37,99,235,0.25)]';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-sage-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_20px_80px_rgba(30,46,26,0.2)] overflow-hidden">

        {/* Top accent bar */}
        <div className={`h-1.5 ${accentBg}`} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sage-400 hover:text-sage-700 transition p-1 rounded-lg hover:bg-sage-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-12 h-12 rounded-2xl ${isPatient ? 'bg-brand-100' : 'bg-blue-100'} flex items-center justify-center mb-3`}>
              {isPatient
                ? <User className={`w-6 h-6 ${accentText}`} />
                : <Stethoscope className={`w-6 h-6 ${accentText}`} />
              }
            </div>
            <h2 className="text-[21px] font-black text-sage-900 tracking-tight">
              {isPatient
                ? isLogin ? 'Mon Espace Patient'       : 'Créer mon espace'
                : isLogin ? 'Espace Professionnel'      : 'Accès clinique'}
            </h2>
            <p className="text-[13px] text-sage-500 mt-1 max-w-[260px]">
              {isPatient
                ? 'Accès sécurisé à vos données de santé'
                : 'Réservé aux professionnels de santé'}
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-coral-50 border border-coral-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-coral-500 flex-shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-coral-700 font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-brand-50 border border-brand-200 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span className="text-[12.5px] text-brand-700 font-semibold">{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-[12px] font-bold text-sage-700 mb-1.5">Nom complet</label>
                <input
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  placeholder={isPatient ? 'Alexandre Petit' : 'Dr. Sarah Martin'}
                  className={`w-full px-4 py-2.5 bg-sage-50 border rounded-xl text-[14px] text-sage-900 placeholder-sage-400 transition ${accentBorder}`}
                />
              </div>
            )}

            {type === 'doctor' && !isLogin && (
              <div>
                <label className="block text-[12px] font-bold text-sage-700 mb-1.5">Spécialité & RPPS</label>
                <input
                  type="text" required value={specialty} onChange={e => setSpecialty(e.target.value)}
                  placeholder="Ex. Endocrinologie / 10100567890"
                  className={`w-full px-4 py-2.5 bg-sage-50 border rounded-xl text-[14px] text-sage-900 placeholder-sage-400 transition ${accentBorder}`}
                />
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold text-sage-700 mb-1.5">Adresse email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className={`w-full px-4 py-2.5 bg-sage-50 border rounded-xl text-[14px] text-sage-900 placeholder-sage-400 transition ${accentBorder}`}
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-sage-700 mb-1.5">Mot de passe</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" minLength={8}
                className={`w-full px-4 py-2.5 bg-sage-50 border rounded-xl text-[14px] text-sage-900 placeholder-sage-400 transition ${accentBorder}`}
              />
              {!isLogin && (
                <p className="text-[11px] text-sage-400 mt-1.5">8 caractères minimum avec majuscule, minuscule et chiffre</p>
              )}
            </div>

            <button
              type="submit" disabled={loading}
              className={`w-full mt-2 py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2 transition ${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Se connecter' : 'Créer mon compte'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo */}
          <div className="mt-3">
            <button
              onClick={fillDemo}
              className="w-full py-2.5 rounded-xl bg-sage-50 hover:bg-sage-100 border border-sage-200 text-[12.5px] text-sage-600 hover:text-sage-900 font-semibold transition"
            >
              🚀 Utiliser le compte démo
            </button>
          </div>

          {/* Footer */}
          <div className="mt-5 pt-4 border-t border-sage-100 flex flex-col items-center gap-3">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
              className={`text-[12.5px] font-semibold ${accentText} hover:underline transition`}
            >
              {isLogin
                ? isPatient ? "Pas de compte ? Créer mon espace →" : "Pas d'accès ? Demander un compte pro →"
                : "Déjà un compte ? Se connecter →"}
            </button>
            <div className="flex items-center gap-1.5 text-[11px] text-sage-400">
              <Shield className="w-3.5 h-3.5 text-brand-500" />
              Authentification PBKDF2 · Conforme HDS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
