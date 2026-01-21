import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Si l'utilisateur arrive directement ici sans session, on le signale.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus('error');
        setMessage(
          "Session introuvable. Ouvrez d'abord le lien de réinitialisation reçu par email (ou recommencez la procédure)."
        );
      }
    };
    check();
  }, []);

  const validate = (): string | null => {
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
    if (password !== confirm) return 'Les mots de passe ne correspondent pas.';
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setStatus('idle');

    const err = validate();
    if (err) {
      setStatus('error');
      setMessage(err);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setStatus('success');
      setMessage('Mot de passe mis à jour. Redirection…');
      setTimeout(() => navigate('/dashboard', { replace: true }), 800);
    } catch (e: any) {
      setStatus('error');
      setMessage(e?.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="text-white" size={22} />
          </div>
          <h1 className="text-2xl font-display font-bold text-white">Nouveau mot de passe</h1>
          <p className="text-zinc-500 mt-2">Choisissez un mot de passe sécurisé pour votre compte InkFlow.</p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${
              status === 'success'
                ? 'bg-brand-mint/10 border-brand-mint/20 text-brand-mint'
                : status === 'error'
                  ? 'bg-brand-pink/10 border-brand-pink/20 text-brand-pink'
                  : 'bg-white/5 border-white/10 text-zinc-300'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle className="shrink-0 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
            )}
            <div className="text-sm">{message}</div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmer</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || status === 'success'}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Mise à jour…
              </>
            ) : (
              'Mettre à jour'
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-zinc-400 hover:text-white transition-colors text-sm"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    </div>
  );
};

