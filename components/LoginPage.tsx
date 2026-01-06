import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PenTool, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      // Messages d'erreur plus clairs
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
      // Rediriger vers le dashboard après connexion réussie
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-amber-400 rounded-xl flex items-center justify-center transform rotate-3 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <PenTool className="text-black" size={24} />
            </div>
            <span className="text-3xl font-black tracking-tighter text-white">
              INK<span className="text-amber-400">FLOW</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connexion</h1>
          <p className="text-slate-400">Accédez à votre espace tatoueur</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-red-400 shrink-0" size={20} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          {/* Link to Register */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-bold">
                S'inscrire
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

