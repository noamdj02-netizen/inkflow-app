import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenTool, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useArtistProfile } from '../contexts/ArtistProfileContext';
import { supabase } from '../services/supabase';

export const OnboardingPage: React.FC = () => {
  const [nomStudio, setNomStudio] = useState('');
  const [slug, setSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { refreshProfile } = useArtistProfile();
  const navigate = useNavigate();

  // Générer le slug automatiquement depuis le nom du studio
  useEffect(() => {
    if (nomStudio && !slug) {
      const generatedSlug = nomStudio
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
        .replace(/[^a-z0-9]+/g, '_') // Remplacer les caractères spéciaux par _
        .replace(/^_+|_+$/g, ''); // Supprimer les _ au début/fin
      setSlug(generatedSlug);
    }
  }, [nomStudio, slug]);

  // Vérifier la disponibilité du slug
  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugAvailable(null);
      setSlugError('Le slug doit contenir au moins 3 caractères');
      return;
    }

    // Validation du format (lettres, chiffres, underscores uniquement)
    if (!/^[a-z0-9_]+$/.test(slugToCheck)) {
      setSlugAvailable(false);
      setSlugError('Le slug ne peut contenir que des lettres minuscules, chiffres et underscores');
      return;
    }

    setCheckingSlug(true);
    setSlugError(null);

    const { data, error } = await supabase
      .from('artists')
      .select('slug_profil')
      .eq('slug_profil', slugToCheck)
      .single();

    if (error && error.code === 'PGRST116') {
      // Aucun résultat trouvé = slug disponible
      setSlugAvailable(true);
      setSlugError(null);
    } else if (data) {
      setSlugAvailable(false);
      setSlugError('Ce slug est déjà pris. Choisissez-en un autre.');
    } else {
      setSlugAvailable(false);
      setSlugError('Erreur lors de la vérification');
    }

    setCheckingSlug(false);
  };

  // Vérifier le slug quand il change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (slug) {
        checkSlugAvailability(slug);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Vérifier si Supabase est configuré
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      setError('Supabase n\'est pas configuré. Veuillez configurer les variables d\'environnement.');
      return;
    }

    if (!nomStudio || !slug) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!slugAvailable) {
      setError('Veuillez choisir un slug disponible');
      return;
    }

    if (!user) {
      setError('Vous devez être connecté pour créer un profil');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      // Créer l'entrée dans la table artists
      const { data, error: insertError } = await supabase
        .from('artists')
        .insert({
          id: user.id, // Utiliser l'ID de l'utilisateur Supabase Auth
          email: user.email!,
          nom_studio: nomStudio,
          slug_profil: slug,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Rafraîchir le profil dans le contexte
      await refreshProfile();

      // Rediriger vers le dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error creating artist profile:', err);
      setError(err.message || 'Erreur lors de la création du profil');
      setLoading(false);
    }
  };

  // Rediriger si déjà un profil
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('artists')
        .select('id')
        .eq('id', user.id)
        .single();

      if (data) {
        // L'utilisateur a déjà un profil, rediriger vers le dashboard
        navigate('/dashboard');
      }
    };

    checkExistingProfile();
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Vous devez être connecté</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-amber-400 text-black px-6 py-2 rounded-lg font-bold"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white mb-2">Créer votre profil</h1>
          <p className="text-slate-400">Configurez votre identité sur InkFlow</p>
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
            {/* Nom du Studio */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom de votre studio / Nom d'artiste <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomStudio}
                onChange={(e) => setNomStudio(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors"
                placeholder="Ex: Zonett Ink"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Identifiant URL (slug) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setSlug(newSlug);
                  }}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-4 pr-10 py-3 text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  placeholder="zonett_ink"
                />
                {checkingSlug && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-amber-400" size={18} />
                  </div>
                )}
                {!checkingSlug && slugAvailable === true && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle className="text-green-400" size={18} />
                  </div>
                )}
                {!checkingSlug && slugAvailable === false && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <AlertCircle className="text-red-400" size={18} />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Votre page publique sera accessible sur :{' '}
                <span className="text-amber-400 font-mono">
                  inkflow.app/p/{slug || 'votre_slug'}
                </span>
              </p>
              {slugError && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {slugError}
                </p>
              )}
              {slugAvailable && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <CheckCircle size={12} /> Ce slug est disponible !
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !slugAvailable || checkingSlug}
              className="w-full bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
            >
              {loading ? 'Création du profil...' : 'Créer mon profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

