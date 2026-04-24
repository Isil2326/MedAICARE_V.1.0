import { useState, useEffect } from 'react';
import { X, Shield, User, Stethoscope, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../auth/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'patient' | 'doctor';
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'patient' | 'doctor';
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, type, defaultMode = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(defaultMode === 'login');

  // Ajuster le mode si defaultMode change
  useEffect(() => {
    setIsLogin(defaultMode === 'login');
  }, [defaultMode, isOpen]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setSuccess('Connexion réussie');
          setTimeout(() => {
            onClose();
            setEmail('');
            setPassword('');
          }, 800);
        } else {
          setError(result.error || 'Identifiants invalides');
        }
      } else {
        const role: UserRole = type === 'doctor' ? 'clinician' : 'patient';
        const result = await register(email, password, name, role, specialty);
        
        if (result.success) {
          setSuccess('Compte créé avec succès');
          setTimeout(() => {
            onClose();
            setEmail('');
            setPassword('');
            setName('');
            setSpecialty('');
          }, 800);
        } else {
          setError(result.error || 'Erreur lors de la création');
        }
      }
    } catch (err) {
      setError('Erreur technique. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    if (type === 'patient') {
      setEmail('patient@demo.fr');
      setPassword('Demo1234!');
    } else {
      setEmail('clinicien@demo.fr');
      setPassword('Demo1234!');
    }
    setIsLogin(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#04060b]/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0B1220] border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="flex flex-col items-center text-center mb-6 mt-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-3 border border-cyan-500/30">
            {type === 'patient' ? (
              <User className="w-6 h-6 text-cyan-400" />
            ) : (
              <Stethoscope className="w-6 h-6 text-indigo-400" />
            )}
          </div>
          <h2 className="text-[20px] font-bold text-white tracking-tight">
            {type === 'patient'
              ? isLogin ? 'Mon Espace Patient' : 'Créer mon espace Patient'
              : isLogin ? 'Espace Professionnel' : 'Demande d’accès Clinique'}
          </h2>
          <p className="text-[13px] text-slate-400 mt-1 max-w-[280px]">
            {type === 'patient' 
              ? 'Accès sécurisé à vos données de santé'
              : 'Accès réservé aux professionnels de santé'}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[12px] text-red-200">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span className="text-[12px] text-emerald-200">{success}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-[12px] font-medium text-slate-300 mb-1.5">Nom complet</label>
              <input 
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'patient' ? 'Alexandre Petit' : 'Dr. Sarah Martin'}
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition" 
              />
            </div>
          )}

          {type === 'doctor' && !isLogin && (
            <div>
              <label className="block text-[12px] font-medium text-slate-300 mb-1.5">Spécialité & RPPS</label>
              <input 
                type="text" 
                required 
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex. Endocrinologie / 10100567890"
                className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition" 
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1.5">Adresse email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition" 
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-slate-300 mb-1.5">Mot de passe</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={8}
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-[14px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition" 
            />
            {!isLogin && (
              <p className="text-[11px] text-slate-500 mt-1.5">8 caractères minimum, avec majuscule, minuscule et chiffre</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 transition group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Se connecter' : 'Créer le compte'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </>
            )}
          </button>
        </form>

        {/* Démo */}
        <div className="mt-4">
          <button
            onClick={fillDemo}
            className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[12px] text-white/70 hover:text-white transition"
          >
            Utiliser le compte démo
          </button>
        </div>

        {/* Pied du modal */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-3">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} 
            className="text-[12px] text-slate-400 hover:text-cyan-400 transition"
          >
            {isLogin 
              ? type === 'patient' ? "Pas de compte ? Créer mon espace" : "Pas d'accès ? Demander un compte pro"
              : "Déjà un compte ? Se connecter"}
          </button>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Authentification chiffrée PBKDF2 · Conforme HDS
          </div>
        </div>
      </div>
    </div>
  );
}