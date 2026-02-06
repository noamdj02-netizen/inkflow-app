'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useArtistProfile } from '../contexts/ArtistProfileContext';
import { supabase } from '../services/supabase';
import { normalizeSlug, validatePublicSlug } from '../utils/slug';

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
  const router = useRouter();

  // Générer le slug automatiquement depuis le nom du studio
  useEffect(() => {
    if (nomStudio && !slug) {
      setSlug(normalizeSlug(nomStudio, '-'));
    }
  }, [nomStudio, slug]);

  // Vérifier la disponibilité du slug
  const checkSlugAvailability = async (slugToCheck: string) => {
    const validationError = validatePublicSlug(slugToCheck);
    if (validationError) {
      setSlugAvailable(false);
      setSlugError(validationError);
      return;
    }

    setCheckingSlug(true);
    setSlugError(null);

    const { data, error } = await supabase
      .from('artists')
      .select('id')
      .eq('slug_profil', slugToCheck.trim().toLowerCase())
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
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
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      // Créer l'entrée dans la table artists
      const { data, error: insertError } = await supabase
        .from('artists')
        // @ts-expect-error - Supabase builder Insert type can resolve to never with some type versions
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
      router.push('/dashboard');
    } catch (err) {
      console.error('Error creating artist profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du profil';
      setError(errorMessage);
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
        router.push('/dashboard');
      }
    };

    checkExistingProfile();
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="text-center relative z-10">
          <p className="text-slate-400 mb-4">Vous devez être connecté</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg shadow-amber-400/20"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-4xl font-display font-bold tracking-tight text-white">
              INK<span className="text-amber-400">FLOW</span>
            </span>
          </div>
          <h1 className="text-[25px] font-serif font-bold text-white mb-2">Créer votre profil</h1>
          <p className="text-slate-400">Configurez votre identité sur InkFlow</p>
        </motion.div>

        {/* Formulaire */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-8 border border-white/10 backdrop-blur-md"
        >
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
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
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
                    setSlug(normalizeSlug(e.target.value, '-'));
                  }}
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                  placeholder="zonett-ink"
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
                  inkflow.app/{slug || 'votre-slug'}
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
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading || !slugAvailable || checkingSlug}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold py-4 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin" size={18} />
                  Création du profil...
                </span>
              ) : (
                'Créer mon profil'
              )}
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

