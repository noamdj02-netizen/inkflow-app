import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowLeft, Sparkles, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, getConfigErrors } from '../services/supabase';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, authError } = useAuth();
  const navigate = useNavigate();
  
  // Vérification de la configuration Supabase
  const isConfigured = isSupabaseConfigured();
  const configErrors = getConfigErrors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. Si vous n\'avez pas encore de compte, cliquez sur "S\'inscrire" ci-dessous.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.';
      } else if (error.message.includes('User not found')) {
        errorMessage = 'Aucun compte trouvé avec cet email. Créez un compte en cliquant sur "S\'inscrire".';
      }
      
      setError(errorMessage);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Bouton Retour */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8 group"
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
          <h1 className="text-2xl font-display font-bold text-white mb-2">Connexion</h1>
          <p className="text-zinc-500">Accédez à votre espace tatoueur</p>
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

          {/* Erreur d'authentification */}
          {(error || authError) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <p className="text-red-300 text-sm">{error || authError}</p>
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={18} />
                  </motion.span>
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </motion.button>
          </div>

          {/* Link to Register */}
          <div className="mt-8 text-center">
            <p className="text-zinc-500 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-white hover:text-zinc-300 font-semibold transition-colors">
                S'inscrire
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
      </div>
    </div>
  );
};
