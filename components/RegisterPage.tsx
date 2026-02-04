import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Sparkles, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { PageSEO } from './seo/PageSEO';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, getConfigErrors } from '../services/supabase';
import { validatePasswordResult } from '../utils/validation';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp, authError } = useAuth();
  const navigate = useNavigate();
  
  const isConfigured = isSupabaseConfigured();
  const passwordValidation = validatePasswordResult(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!passwordValidation.success) {
      setError('error' in passwordValidation ? passwordValidation.error : 'Mot de passe invalide.');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      let message = error.message;
      const isNetworkError = message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('Impossible de se connecter');
      if (isNetworkError) {
        toast.error('Erreur réseau', {
          description: 'Vérifiez votre connexion internet et réessayez.',
        });
      }
      setError(message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <PageSEO
        title="Inscription | InkFlow — Créer un compte tatoueur"
        description="Créez votre compte InkFlow : gestion de réservations, flashs et paiements pour tatoueurs professionnels."
        canonical="/register"
      />
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <main id="main-content" className="w-full max-w-md relative z-10" role="main">
        {/* Bouton Retour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8 group"
            aria-label="Retour à l'accueil"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Retour à l'accueil</span>
          </Link>
        </motion.div>

        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl font-display font-bold tracking-tight text-white">
              INK<span className="text-zinc-500">FLOW</span>
            </span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Créer un compte</h1>
          <p className="text-zinc-400">Rejoignez la communauté InkFlow</p>
        </motion.div>

        {/* Formulaire */}
        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          onSubmit={handleSubmit} 
          className="glass rounded-2xl p-8"
        >
          {/* Alerte si Supabase n'est pas configuré */}
          {!isConfigured && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <WifiOff className="text-amber-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-amber-400 font-semibold text-sm mb-1">Configuration requise</p>
                  <p className="text-amber-300/80 text-xs mb-2">Supabase n'est pas configuré. Créez un fichier .env.local avec :</p>
                  <div className="bg-black/30 rounded-lg p-2 text-[10px] font-mono text-zinc-400">
                    VITE_SUPABASE_URL=https://votre-projet.supabase.co<br/>
                    VITE_SUPABASE_ANON_KEY=votre-clé-anon
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Erreur */}
          {(error || authError) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-red-300 text-sm">{error || authError}</p>
                {(error || authError) && (
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-3 text-sm font-medium text-red-300 hover:text-red-200 underline focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded"
                  >
                    Réessayer
                  </button>
                )}
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="Min. 8 car., majuscule, chiffre, @$!%*?&"
                />
              </div>
              {password && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-xs mt-2 flex items-center gap-1.5 ${passwordValidation.success ? 'text-emerald-400' : 'text-amber-400'}`}
                >
                  {passwordValidation.success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {passwordValidation.success
                    ? 'Mot de passe valide'
                    : 'Votre mot de passe doit être plus complexe pour garantir la sécurité de votre compte.'}
                </motion.p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  placeholder="Répétez le mot de passe"
                />
              </div>
              {confirmPassword && password === confirmPassword && (
                <motion.p 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs mt-2 text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle size={12} /> Les mots de passe correspondent
                </motion.p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold py-4 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={18} />
                  </motion.span>
                  Création du compte...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </motion.button>
          </div>

          {/* Link to Login */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-white hover:text-zinc-300 font-semibold transition-colors">
                Se connecter
              </Link>
            </p>
          </div>
        </motion.form>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-zinc-600 text-xs mt-8"
        >
          © 2025 InkFlow. Tous droits réservés.
        </motion.p>
      </main>
    </div>
  );
};
