import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabase';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = useQuery();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Connexion en cours…');

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const error = query.get('error') || query.get('error_code');
        const errorDescription = query.get('error_description');
        if (error) {
          setStatus('error');
          setMessage(decodeURIComponent(errorDescription || error));
          return;
        }

        // Supabase peut renvoyer un code PKCE dans l'URL (ex: ?code=...)
        const code = query.get('code');

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        // Fallback: certains liens recovery utilisent un hash (detectSessionInUrl=true)
        // On vérifie qu'on a bien une session.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!data.session) {
          // Si c'est un callback OAuth (pas de code dans l'URL), on redirige vers le dashboard
          // Si c'est un callback password reset (avec code), on redirige vers update-password
          if (code) {
            throw new Error(
              "Session introuvable. Le lien a peut-être expiré. Veuillez recommencer la procédure de réinitialisation."
            );
          } else {
            // OAuth callback - rediriger vers dashboard
            if (cancelled) return;
            setStatus('success');
            setMessage('Connexion réussie. Redirection…');
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1000);
            return;
          }
        }

        if (cancelled) return;
        setStatus('success');
        
        // Déterminer la redirection selon le type d'authentification
        // Si l'utilisateur vient d'un OAuth, aller au dashboard
        // Si c'est un password reset, aller à update-password
        const isPasswordReset = code && location.pathname.includes('update-password');
        
        if (isPasswordReset) {
          setMessage('Session validée. Redirection…');
          navigate('/auth/update-password', { replace: true });
        } else {
          setMessage('Connexion réussie. Redirection…');
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
        }
      } catch (e: any) {
        if (cancelled) return;
        setStatus('error');
        setMessage(e?.message || 'Erreur lors de la connexion');
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 border border-white/10">
        <div className="text-center">
          {status === 'loading' && <Loader2 className="animate-spin text-white mx-auto mb-4" size={40} />}
          {status === 'success' && <CheckCircle className="text-brand-mint mx-auto mb-4" size={44} />}
          {status === 'error' && <AlertCircle className="text-brand-pink mx-auto mb-4" size={44} />}

          <h1 className="text-2xl font-display font-bold text-white mb-2">
            {status === 'loading' ? 'Connexion' : status === 'success' ? 'Succès' : 'Erreur'}
          </h1>
          <p className="text-zinc-400">{message}</p>

          {status === 'error' && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

