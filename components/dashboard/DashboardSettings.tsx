import React from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, X, Loader2, AlertCircle, CheckCircle, Palette, Mail, User, Image as ImageIcon, Settings, Shield, Link2, Copy, CreditCard, ExternalLink, Calendar, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { normalizeSlug, validatePublicSlug } from '../../utils/slug';
import { SITE_URL } from '../../constants/seo';
import { safeParseJson } from '../../lib/fetchJson';
import { getPlanDisplayName } from '../../lib/subscription-utils';

export const DashboardSettings: React.FC = () => {
  const { profile, loading: profileLoading, updateProfile, refreshProfile, error: profileError } = useArtistProfile();
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingHeroBackground, setUploadingHeroBackground] = useState(false);
  const [generatingCalendarToken, setGeneratingCalendarToken] = useState(false);

  const [formData, setFormData] = useState({
    nom_studio: '',
    slug_profil: '',
    bio_instagram: '',
    pre_tattoo_instructions: '',
    theme_color: 'amber',
    theme_accent_hex: '',
    theme_secondary_hex: '',
    deposit_percentage: 30,
    avatarFile: null as File | null,
    avatarUrl: '',
    ville: '',
    rating: '' as string | number,
    nb_avis: '' as string | number,
    years_experience: '' as string | number,
    vitrine_show_glow: true,
    vitrine_hero_background_url: '',
    heroBackgroundFile: null as File | null,
    instagram_url: '',
    tiktok_url: '',
    facebook_url: '',
    calcom_username: '',
  });
  const [slugError, setSlugError] = useState<string | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Check URL params for Stripe callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe_success') === 'true') {
      toast.success('Compte Stripe connecté avec succès !', {
        description: 'Vous pouvez maintenant recevoir des paiements.',
      });
      // Refresh profile to get updated Stripe status
      if (profile) {
        updateProfile({}).then(() => {
          window.location.search = '';
        });
      } else {
        window.location.search = '';
      }
    } else if (params.get('stripe_incomplete') === 'true') {
      toast.warning('Configuration Stripe incomplète', {
        description: 'Veuillez compléter toutes les étapes de configuration.',
      });
      window.location.search = '';
    } else if (params.get('stripe_refresh') === 'true') {
      toast.info('Configuration Stripe requise', {
        description: 'Veuillez compléter la configuration de votre compte bancaire.',
      });
      window.location.search = '';
    }
  }, [profile]);

  const handleStripeConnect = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setStripeConnecting(true);
    setError(null);

    try {
      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session invalide');
      }

      // Check if we're in development mode
      const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      
      // Call the API route to create Stripe Connect account and get onboarding link
      const apiUrl = isDevelopment 
        ? `${window.location.origin}/api/stripe`
        : '/api/stripe';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'connect-onboard',
          userId: user.id,
        }),
      });

      // Check if response is ok and has content
      if (!response.ok) {
        let errorMessage = 'Erreur lors de la création du lien Stripe';
        let errorData: any = null;
        
        // Handle 404 specifically (route not found)
        if (response.status === 404) {
          const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
          if (isDevelopment) {
            errorMessage = 'Les routes API ne fonctionnent qu\'en production sur Vercel. Déployez votre projet sur Vercel pour tester Stripe Connect.';
            console.error('API routes are only available in production on Vercel. Deploy your project to test Stripe Connect.');
          } else {
            errorMessage = 'Route API non trouvée. Vérifiez que les fonctions serverless sont déployées sur Vercel.';
            console.error('API route not found. Make sure the serverless function is deployed on Vercel.');
          }
        } else {
          try {
            const text = await response.text();
            if (text && text.trim()) {
              errorData = JSON.parse(text);
              errorMessage = errorData.error || errorData.message || errorMessage;
            }
          } catch {
            // If JSON parsing fails, use status text
            const statusText = response.statusText || `Erreur ${response.status}`;
            errorMessage = statusText === 'Not Found' 
              ? 'Route API non trouvée. Vérifiez que les fonctions serverless sont déployées sur Vercel.'
              : statusText;
          }
        }
        
        // Create error with data for specific handling
        const error = new Error(errorMessage);
        (error as any).data = errorData;
        throw error;
      }

      // Parse JSON response
      let data;
      try {
        const text = await response.text();
        if (!text || text.trim() === '') {
          throw new Error('Réponse vide du serveur');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Réponse invalide du serveur. Vérifiez les variables d\'environnement dans Vercel.');
      }
      
      // Check for Stripe Connect configuration errors in response
      if (data?.code === 'STRIPE_CONNECT_CONFIG_REQUIRED') {
        const error = new Error(data.message || data.error);
        (error as any).data = data;
        throw error;
      }

      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        throw new Error('URL de redirection Stripe manquante dans la réponse');
      }
    } catch (err: any) {
      console.error('Stripe Connect error:', err);
      
      let errorMessage = err.message || 'Erreur lors de la connexion à Stripe';
      let helpUrl: string | undefined;
      
      // Handle specific Stripe Connect configuration errors
      const errorData = err.data;
      if (err.message?.includes('losses') || err.message?.includes('platform-profile') || 
          err.message?.includes('Configuration Stripe Connect requise') ||
          errorData?.code === 'STRIPE_CONNECT_CONFIG_REQUIRED') {
        errorMessage = 'Configuration Stripe Connect requise. Veuillez configurer les responsabilités de gestion des pertes dans votre compte Stripe Dashboard.';
        helpUrl = errorData?.helpUrl || 'https://dashboard.stripe.com/settings/connect/platform-profile';
      }
      
      setError(errorMessage);
      
      // Show more helpful error message
      const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      const displayMessage = isDevelopment && errorMessage.includes('non trouvée')
        ? 'Les routes API ne fonctionnent qu\'en production. Déployez sur Vercel pour tester.'
        : errorMessage;
      
      toast.error('Erreur Stripe Connect', {
        description: displayMessage + (helpUrl ? '\n\nCliquez sur "Ouvrir Stripe Dashboard" pour configurer.' : ''),
        duration: 10000, // Show longer for important errors
        action: helpUrl ? {
          label: 'Ouvrir Stripe Dashboard',
          onClick: () => window.open(helpUrl, '_blank'),
        } : undefined,
      });
      setStripeConnecting(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error('Vous devez être connecté');
      return;
    }

    setLoadingPortal(true);
    setError(null);

    try {
      const isDevelopment = process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      const apiUrl = isDevelopment 
        ? `${window.location.origin}/api/stripe`
        : '/api/stripe';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'customer-portal',
          userId: user.id,
        }),
      });

      const data = await safeParseJson<{ url?: string; error?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || `Erreur serveur (${response.status}). Réessayez.`);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL du portail non reçue');
      }
    } catch (err: any) {
      console.error('Error creating customer portal session:', err);
      const errorMessage = err.message || 'Une erreur est survenue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingPortal(false);
    }
  };

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setFormData({
        nom_studio: p.nom_studio || '',
        slug_profil: p.slug_profil || '',
        bio_instagram: p.bio_instagram || '',
        pre_tattoo_instructions: p.pre_tattoo_instructions || '',
        theme_color: p.theme_color || p.accent_color || 'amber',
        theme_accent_hex: p.theme_accent_hex || '',
        theme_secondary_hex: p.theme_secondary_hex || '',
        deposit_percentage: p.deposit_percentage || 30,
        avatarFile: null,
        avatarUrl: p.avatar_url || '',
        ville: (p.ville as string) || '',
        rating: (p.rating as number) ?? '',
        nb_avis: (p.nb_avis as number) ?? '',
        years_experience: (p.years_experience as number) ?? '',
        vitrine_show_glow: p.vitrine_show_glow !== undefined ? (p.vitrine_show_glow as boolean) !== false : true,
        vitrine_hero_background_url: (p.vitrine_hero_background_url as string) || '',
        heroBackgroundFile: null,
        instagram_url: (p.instagram_url as string) || '',
        tiktok_url: (p.tiktok_url as string) || '',
        facebook_url: (p.facebook_url as string) || '',
        calcom_username: (p.calcom_username as string) || '',
      });
      setSlugError(null);
      setSlugAvailable(true);
    }
  }, [profile]);

  const checkSlugAvailability = async (slugToCheck: string): Promise<{ available: boolean; message?: string }> => {
    if (!user) return { available: false, message: 'User not authenticated' };

    const normalized = slugToCheck.trim().toLowerCase();
    const validationError = validatePublicSlug(normalized);
    if (validationError) {
      setSlugAvailable(false);
      setSlugError(validationError);
      return { available: false, message: validationError };
    }

    // Si c'est le slug actuel, c'est OK.
    if (profile?.slug_profil && normalized === profile.slug_profil) {
      setSlugAvailable(true);
      setSlugError(null);
      return { available: true };
    }

    setCheckingSlug(true);
    setSlugError(null);

    const { data, error: checkError } = await supabase
      .from('artists')
      .select('id')
      .eq('slug_profil', normalized)
      .neq('id', user.id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Aucun résultat = disponible
      setSlugAvailable(true);
      setSlugError(null);
      setCheckingSlug(false);
      return { available: true };
    } else if (data) {
      setSlugAvailable(false);
      const msg = 'Ce slug est déjà pris. Choisissez-en un autre.';
      setSlugError(msg);
      setCheckingSlug(false);
      return { available: false, message: msg };
    } else {
      setSlugAvailable(false);
      const msg = 'Erreur lors de la vérification du slug.';
      setSlugError(msg);
      setCheckingSlug(false);
      return { available: false, message: msg };
    }
  };

  // Vérifier le slug quand il change (debounce) - uniquement si différent du slug actuel
  useEffect(() => {
    if (!user) return;
    if (!formData.slug_profil) return;
    if (profile?.slug_profil && formData.slug_profil === profile.slug_profil) {
      setSlugAvailable(true);
      setSlugError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkSlugAvailability(formData.slug_profil);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.slug_profil, user?.id, profile?.slug_profil]);

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploadingAvatar(true);

    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(`${user.id}/`, {
          search: `${user.id}-`,
        });

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
          .slice(3)
          .map(f => `${user.id}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('avatars')
            .remove(filesToDelete);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      return publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setFormData({ ...formData, avatarFile: file });
    }
  };

  const uploadHeroBackground = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    setUploadingHeroBackground(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');
      return `${urlData.publicUrl}?t=${Date.now()}`;
    } finally {
      setUploadingHeroBackground(false);
    }
  };

  const handleHeroBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError('L\'image de fond ne doit pas dépasser 3MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setFormData({ ...formData, heroBackgroundFile: file });
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      // 1) Validation slug + disponibilité
      const normalizedSlug = formData.slug_profil.trim().toLowerCase();
      const validationError = validatePublicSlug(normalizedSlug);
      if (validationError) throw new Error(validationError);

      // On attend le résultat du check asynchrone si l'utilisateur vient de modifier
      if (profile?.slug_profil && normalizedSlug !== profile.slug_profil) {
        const check = await checkSlugAvailability(normalizedSlug);
        if (check && check.available === false) throw new Error(check.message || 'Ce slug est déjà pris. Choisissez-en un autre.');
      }

      let avatarUrl = formData.avatarUrl;

      if (formData.avatarFile) {
        avatarUrl = await uploadAvatar(formData.avatarFile);
        setFormData(prev => ({ ...prev, avatarUrl, avatarFile: null }));
      }

      let heroBackgroundUrl = formData.vitrine_hero_background_url?.trim() || null;
      if (formData.heroBackgroundFile) {
        heroBackgroundUrl = await uploadHeroBackground(formData.heroBackgroundFile);
        setFormData(prev => ({ ...prev, vitrine_hero_background_url: heroBackgroundUrl || '', heroBackgroundFile: null }));
      }

      const updates: Record<string, unknown> = {
        nom_studio: formData.nom_studio,
        slug_profil: normalizedSlug,
        bio_instagram: formData.bio_instagram,
        pre_tattoo_instructions: formData.pre_tattoo_instructions || null,
        theme_color: formData.theme_color,
        theme_accent_hex: formData.theme_accent_hex?.trim() ? formData.theme_accent_hex.trim() : null,
        theme_secondary_hex: formData.theme_secondary_hex?.trim() ? formData.theme_secondary_hex.trim() : null,
        vitrine_hero_background_url: heroBackgroundUrl,
        avatar_url: avatarUrl,
        deposit_percentage: formData.deposit_percentage,
        calcom_username: formData.calcom_username?.trim() || null,
      };
      if (formData.ville !== undefined) updates.ville = formData.ville.trim() || null;
      if (formData.rating !== '' && formData.rating !== undefined) updates.rating = Number(formData.rating) || null;
      if (formData.nb_avis !== '' && formData.nb_avis !== undefined) updates.nb_avis = Number(formData.nb_avis) ?? null;
      if (formData.years_experience !== '' && formData.years_experience !== undefined) updates.years_experience = Number(formData.years_experience) ?? null;
      // vitrine_show_glow : n'envoyer que si la colonne existe (migration vitrine appliquée)
      const profileWithGlow = profile as Record<string, unknown> | undefined;
      if (profileWithGlow && 'vitrine_show_glow' in profileWithGlow) {
        (updates as Record<string, unknown>).vitrine_show_glow = formData.vitrine_show_glow;
      }
      if (profileWithGlow && 'instagram_url' in profileWithGlow) {
        (updates as Record<string, unknown>).instagram_url = formData.instagram_url?.trim() || null;
        (updates as Record<string, unknown>).tiktok_url = formData.tiktok_url?.trim() || null;
        (updates as Record<string, unknown>).facebook_url = formData.facebook_url?.trim() || null;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateProfile(updates as any);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const themeOptions = [
    { name: 'Gold', value: 'amber', hex: '#fbbf24', tailwind: 'amber' },
    { name: 'Blood', value: 'red', hex: '#ef4444', tailwind: 'red' },
    { name: 'Ocean', value: 'blue', hex: '#3b82f6', tailwind: 'blue' },
    { name: 'Nature', value: 'emerald', hex: '#10b981', tailwind: 'emerald' },
    { name: 'Lavender', value: 'violet', hex: '#8b5cf6', tailwind: 'violet' },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={40} />
          <p className="text-zinc-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <p className="text-zinc-400 mb-4">Vous devez être connecté</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-white mb-2">Erreur</h2>
          <p className="text-zinc-400 mb-6">{profileError}</p>
          <button
            onClick={() => router.push('/dashboard/overview')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-brand-yellow mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-white mb-2">Profil non trouvé</h2>
          <p className="text-zinc-400 mb-6">
            Vous devez d'abord compléter votre profil dans l'onboarding.
          </p>
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Créer mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0 overflow-x-hidden">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 md:py-5 flex-shrink-0">
        <div className="max-w-4xl mx-auto w-full">
          <h1 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 glass rounded-xl flex items-center justify-center shrink-0">
              <Settings className="text-brand-purple" size={18} />
            </div>
            <span className="truncate">Paramètres du Compte</span>
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">Gérez vos informations personnelles et préférences</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-2 md:pt-3 pb-4 md:pb-6">
        <div className="max-w-4xl mx-auto w-full">
          {/* Quick tools */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 glass rounded-2xl p-4 md:p-5 border border-white/5"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-white font-semibold text-sm md:text-base">Outils</div>
                <div className="text-zinc-500 text-xs md:text-sm">Care Sheets, liens rapides, etc.</div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => router.push('/dashboard/settings/care-sheets')}
                  className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-zinc-100 text-sm whitespace-nowrap"
                >
                  Gérer mes Care Sheets
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={async () => {
                    try {
                      const url = `${window.location.origin}/${profile.slug_profil}`;
                      await navigator.clipboard.writeText(url);
                      toast.success('Lien copié', { description: url });
                    } catch {
                      toast.error('Impossible de copier le lien');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 text-sm whitespace-nowrap"
                  title="Copier le lien public"
                >
                  Copier lien public
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 md:p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-brand-pink shrink-0 mt-0.5" size={18} />
              <p className="text-brand-pink text-xs md:text-sm flex-1 break-words">{error}</p>
              <button onClick={() => setError(null)} className="text-brand-pink/60 hover:text-brand-pink shrink-0">
                <X size={16} />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 md:p-4 bg-brand-mint/10 border border-brand-mint/20 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="text-brand-mint shrink-0" size={18} />
              <p className="text-brand-mint text-xs md:text-sm">Profil mis à jour avec succès !</p>
            </motion.div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Section: Informations de Base */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                  <User className="text-brand-cyan" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Informations de Base</h3>
                  <p className="text-sm text-zinc-500">Vos informations publiques</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nom du Studio <span className="text-brand-pink">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom_studio}
                  onChange={(e) => setFormData({ ...formData, nom_studio: e.target.value })}
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Ex: Zonett Ink"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  URL publique (slug) <span className="text-brand-pink">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.slug_profil}
                    onChange={(e) =>
                      setFormData({ ...formData, slug_profil: normalizeSlug(e.target.value, '-') })
                    }
                    required
                    className="w-full bg-[#050505] border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors font-mono"
                    placeholder="nom-du-studio"
                  />
                  {checkingSlug && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-white/70" size={18} />
                    </div>
                  )}
                  {!checkingSlug && slugAvailable === true && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle className="text-brand-mint" size={18} />
                    </div>
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AlertCircle className="text-brand-pink" size={18} />
                    </div>
                  )}
                </div>
                <div className="text-xs text-zinc-600 mt-2 flex flex-wrap items-center gap-2">
                  <span className="break-all">
                    Votre vitrine:{' '}
                    <span className="text-white font-mono break-all">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/${formData.slug_profil || 'votre-slug'}`
                        : `inkflow.app/${formData.slug_profil || 'votre-slug'}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const url = `${window.location.origin}/${formData.slug_profil || ''}`;
                        await navigator.clipboard.writeText(url);
                        toast.success('Copié !', { description: url });
                      } catch {
                        toast.error('Impossible de copier');
                      }
                    }}
                    className="w-8 h-8 rounded-lg glass hover:bg-white/10 transition-colors flex items-center justify-center shrink-0"
                    title="Copier le lien"
                    aria-label="Copier le lien"
                  >
                    <Copy size={14} className="text-zinc-300" />
                  </button>
                  <span className="text-zinc-600 hidden sm:inline"> (l'ancien format </span>
                  <span className="text-zinc-500 font-mono hidden sm:inline">/p/{formData.slug_profil || 'votre-slug'}</span>
                  <span className="text-zinc-600 hidden sm:inline"> reste compatible)</span>
                </div>
                {slugError && (
                  <p className="text-xs text-brand-pink mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {slugError}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Bio Instagram
                </label>
                <textarea
                  rows={3}
                  value={formData.bio_instagram}
                  onChange={(e) => setFormData({ ...formData, bio_instagram: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  placeholder="Tatoueur Lyon • Fineline & Blackwork • Agenda Ouvert 👇"
                  maxLength={150}
                />
                <p className="text-xs text-zinc-600 mt-1">
                  {formData.bio_instagram.length}/150 caractères
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Consignes avant tatouage (email J-2)
                </label>
                <textarea
                  rows={4}
                  value={formData.pre_tattoo_instructions}
                  onChange={(e) => setFormData({ ...formData, pre_tattoo_instructions: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  placeholder={"Ex:\n- Pas d'alcool 24h avant\n- Bien manger avant le RDV\n- Hydratez votre peau\n- Dormez bien la veille"}
                  maxLength={800}
                />
                <p className="text-xs text-zinc-600 mt-1">
                  {formData.pre_tattoo_instructions.length}/800 caractères — ces consignes seront incluses dans le mail automatique envoyé 48h avant le RDV.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Photo de Profil (Avatar)
                </label>
                <div className="flex items-center gap-4">
                  {formData.avatarFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.avatarFile)}
                        alt="Aperçu de l'avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarFile: null })}
                        className="absolute -top-2 -right-2 bg-brand-pink text-white rounded-full p-1 hover:bg-brand-pink/80 shadow-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar actuel"
                      loading="lazy"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full glass border-2 border-dashed border-white/20 flex items-center justify-center">
                      <ImageIcon className="text-zinc-600" size={24} />
                    </div>
                  )}
                  <label className="flex-1">
                    <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload size={18} className="text-zinc-400" />
                      <span className="text-sm text-zinc-300">
                        {uploadingAvatar ? 'Upload...' : formData.avatarFile ? 'Changer' : 'Choisir une image'}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-600 mt-2">PNG, JPG jusqu'à 2MB. Image carrée recommandée.</p>
              </div>
            </div>

            {/* Section: Préférences */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                  <Palette className="text-brand-purple" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">Préférences</h3>
                  <p className="text-sm text-zinc-500">Personnalisez votre vitrine comme vous le souhaitez</p>
                </div>
                {profile?.slug_profil && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.open(`${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.slug_profil}`, '_blank')}
                    className="shrink-0 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink size={16} />
                    Voir l&apos;aperçu
                  </motion.button>
                )}
              </div>
              <p className="text-zinc-400 text-sm mb-6">
                Thème, couleurs et infos affichées sur votre page publique. Les visiteurs voient ces réglages en direct.
              </p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Thème de couleur (Page publique)
                </label>
                <div className="flex gap-3 flex-wrap">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme_color: theme.value })}
                      className={`w-12 h-12 rounded-full border-2 transition-all relative ${
                        formData.theme_color === theme.value
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: theme.hex }}
                      title={theme.name}
                    >
                      {formData.theme_color === theme.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="text-white drop-shadow" size={18} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Sélectionné: <span className="font-medium text-white">{themeOptions.find(t => t.value === formData.theme_color)?.name || 'Gold'}</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Couleurs personnalisées (optionnel)
                </label>
                <p className="text-xs text-zinc-600 mb-3">
                  Si renseignées, elles sont utilisées pour le glow/gradient de votre vitrine (style Landing).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#050505] border border-white/10 rounded-xl md:rounded-2xl p-4 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-xs md:text-sm text-white font-medium">Accent</span>
                      <input
                        type="color"
                        value={formData.theme_accent_hex || '#fbbf24'}
                        onChange={(e) => setFormData({ ...formData, theme_accent_hex: e.target.value })}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-transparent border border-white/10 shrink-0"
                        aria-label="Couleur accent"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.theme_accent_hex}
                      onChange={(e) => setFormData({ ...formData, theme_accent_hex: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs md:text-sm focus:outline-none focus:border-white/30"
                      placeholder="#FEE440"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme_accent_hex: '' })}
                      className="mt-2 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  <div className="bg-[#050505] border border-white/10 rounded-xl md:rounded-2xl p-4 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-xs md:text-sm text-white font-medium">Secondaire</span>
                      <input
                        type="color"
                        value={formData.theme_secondary_hex || '#9b5de5'}
                        onChange={(e) => setFormData({ ...formData, theme_secondary_hex: e.target.value })}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-transparent border border-white/10 shrink-0"
                        aria-label="Couleur secondaire"
                      />
                    </div>
                    <input
                      type="text"
                      value={formData.theme_secondary_hex}
                      onChange={(e) => setFormData({ ...formData, theme_secondary_hex: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs md:text-sm focus:outline-none focus:border-white/30"
                      placeholder="#9B5DE5"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, theme_secondary_hex: '' })}
                      className="mt-2 text-xs text-zinc-500 hover:text-white transition-colors"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Image de fond du hero (vitrine)
                </label>
                <p className="text-xs text-zinc-600 mb-3">
                  Image affichée derrière votre nom et sous-titre sur la page publique. Choisissez un fichier ou collez une URL. Laissez vide pour un fond uni.
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  {(formData.heroBackgroundFile || formData.vitrine_hero_background_url) ? (
                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#050505] w-full sm:w-48 aspect-video shrink-0">
                      {formData.heroBackgroundFile ? (
                        <img
                          src={URL.createObjectURL(formData.heroBackgroundFile)}
                          alt="Aperçu fond hero"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={formData.vitrine_hero_background_url}
                          alt="Fond hero actuel"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, heroBackgroundFile: null, vitrine_hero_background_url: '' })}
                        className="absolute top-2 right-2 bg-red-500/90 text-white rounded-full p-1.5 hover:bg-red-500 shadow-sm"
                        aria-label="Supprimer l'image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full sm:w-48 aspect-video rounded-xl glass border-2 border-dashed border-white/20 flex items-center justify-center shrink-0">
                      <ImageIcon className="text-zinc-600" size={32} />
                    </div>
                  )}
                  <label className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors w-full sm:w-auto">
                      <Upload size={18} className="text-zinc-400 shrink-0" />
                      <span className="text-sm text-zinc-300">
                        {uploadingHeroBackground ? 'Upload...' : formData.heroBackgroundFile ? 'Changer' : 'Choisir une image'}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleHeroBackgroundChange}
                      disabled={uploadingHeroBackground}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  value={formData.vitrine_hero_background_url}
                  onChange={(e) => setFormData({ ...formData, vitrine_hero_background_url: e.target.value, heroBackgroundFile: null })}
                  className="mt-3 w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                  placeholder="Ou coller une URL d'image"
                />
                <p className="text-xs text-zinc-600 mt-1">PNG, JPG jusqu'à 3MB. Format paysage recommandé.</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Vitrine — infos et apparence
                </label>
                <p className="text-xs text-zinc-600 mb-3">
                  Ville, note, avis et années d&apos;expérience s&apos;affichent sur votre page publique. Tous les champs sont optionnels.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Ville / localisation</label>
                    <input
                      type="text"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="Ex: Lyon"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Note (ex: 4.9)</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={formData.rating === '' ? '' : formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value === '' ? '' : e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="4.9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Nombre d&apos;avis</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.nb_avis === '' ? '' : formData.nb_avis}
                      onChange={(e) => setFormData({ ...formData, nb_avis: e.target.value === '' ? '' : e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="42"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Années d&apos;expérience</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.years_experience === '' ? '' : formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value === '' ? '' : e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="5"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#050505]/50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Effets de lumière (ambiance)</p>
                    <p className="text-xs text-zinc-500">Halos colorés discrets sur la vitrine, selon votre thème</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.vitrine_show_glow}
                    onClick={() => setFormData({ ...formData, vitrine_show_glow: !formData.vitrine_show_glow })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                      formData.vitrine_show_glow ? 'bg-amber-500/80' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        formData.vitrine_show_glow ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                      style={{ marginTop: 2 }}
                    />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Réseaux sociaux (vitrine)</h3>
                <p className="text-xs text-zinc-500 mb-3">
                  Liens affichés sous &quot;Réserver maintenant&quot; sur votre vitrine. Laissez vide pour masquer.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Instagram (URL complète)</label>
                    <input
                      type="url"
                      value={formData.instagram_url}
                      onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="https://instagram.com/votre_compte"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">TikTok (URL complète)</label>
                    <input
                      type="url"
                      value={formData.tiktok_url}
                      onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="https://tiktok.com/@votre_compte"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Facebook (URL complète)</label>
                    <input
                      type="url"
                      value={formData.facebook_url}
                      onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 text-sm"
                      placeholder="https://facebook.com/votre_page"
                    />
                  </div>
                </div>
              </div>

              {/* Synchronisation Calendrier (iCal) */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Calendar className="text-zinc-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Synchronisation Calendrier</h3>
                    <p className="text-xs text-zinc-500">Apple Calendar, Google Calendar, Outlook</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  Abonnez votre calendrier mobile à vos rendez-vous Inkflow. L’URL est sécurisée par un token unique.
                </p>
                {(() => {
                  const profileRecord = profile as Record<string, unknown> | undefined;
                  const hasIcalColumn = profileRecord && 'ical_feed_token' in profileRecord;
                  const token = (hasIcalColumn && profileRecord?.ical_feed_token) ? String(profileRecord.ical_feed_token) : null;
                  // Domaine de production (VITE_SITE_URL en prod) pour lien sécurisé iOS et parsing Apple Calendar.
                  const baseUrl = SITE_URL.replace(/\/$/, '');
                  const feedUrl = token ? `${baseUrl}/api/calendar/feed?token=${encodeURIComponent(token)}` : null;
                  let webcalHost: string;
                  try {
                    webcalHost = new URL(baseUrl).host;
                  } catch {
                    webcalHost = 'ink-flow.me';
                  }
                  // webcal:// force iOS à ouvrir directement l'app Calendrier (évite "Connexion non sécurisée").
                  const webcalUrl = token ? `webcal://${webcalHost}/api/calendar/feed?token=${encodeURIComponent(token)}` : null;
                  const googleCalUrl = feedUrl ? `https://www.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}` : null;
                  const isLocalhost = typeof window !== 'undefined' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);

                  const handleGenerateToken = async () => {
                    if (!hasIcalColumn) {
                      toast.error('Migration calendrier requise', { description: 'Exécutez la migration ical_feed_token dans Supabase.' });
                      return;
                    }
                    setGeneratingCalendarToken(true);
                    try {
                      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                        .map((b) => b.toString(16).padStart(2, '0'))
                        .join('');
                      await updateProfile({ ical_feed_token: newToken } as any);
                      await refreshProfile();
                      toast.success('Lien généré', { description: 'Vous pouvez copier l’URL et l’ajouter à votre calendrier.' });
                    } catch (err) {
                      toast.error('Erreur', { description: err instanceof Error ? err.message : 'Impossible de générer le lien.' });
                    } finally {
                      setGeneratingCalendarToken(false);
                    }
                  };

                  const handleCopy = () => {
                    if (!webcalUrl) return;
                    navigator.clipboard.writeText(webcalUrl).then(
                      () => toast.success('Lien copié dans le presse-papier'),
                      () => toast.error('Copie impossible')
                    );
                  };

                  return (
                    <div className="space-y-4">
                      {webcalUrl ? (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={webcalUrl}
                              className="flex-1 bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs font-mono truncate"
                              aria-label="Lien d'abonnement calendrier (webcal)"
                            />
                            <button
                              type="button"
                              onClick={handleCopy}
                              className="shrink-0 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors flex items-center gap-2"
                            >
                              <Copy size={16} />
                              Copier
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <a
                              href={webcalUrl ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                            >
                              <Calendar size={16} />
                              Apple Calendar
                            </a>
                            <a
                              href={googleCalUrl ?? '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
                            >
                              <ExternalLink size={16} />
                              Google Calendar
                            </a>
                          </div>
                          {isLocalhost && (
                            <p className="text-xs text-amber-400/90 mt-2">
                              Sur iOS, Apple Calendar ne peut pas atteindre localhost. Déployez l&apos;app et ouvrez cette page depuis votre domaine (ex. https://ink-flow.me) pour que le lien fonctionne sur mobile.
                            </p>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerateToken}
                          disabled={generatingCalendarToken || !hasIcalColumn}
                          className="px-4 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {generatingCalendarToken ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
                          {generatingCalendarToken ? 'Génération…' : 'Générer le lien'}
                        </button>
                      )}
                      {!hasIcalColumn && (
                        <p className="text-xs text-amber-500/80">
                          Exécutez la migration <code className="bg-white/10 px-1 rounded">migration-ical-feed-token.sql</code> dans Supabase pour activer le lien sécurisé.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Configuration Cal.com */}
              <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Calendar className="text-zinc-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Cal.com - Réservation en ligne</h3>
                    <p className="text-xs text-zinc-500">Intégration calendrier Cal.com</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-4">
                  Connectez votre compte Cal.com pour permettre à vos clients de réserver directement en ligne. 
                  Entrez votre nom d&apos;utilisateur Cal.com (ex: si votre lien est cal.com/john-doe, entrez &quot;john-doe&quot;).
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Nom d&apos;utilisateur Cal.com
                    </label>
                    <input
                      type="text"
                      value={formData.calcom_username}
                      onChange={(e) => {
                        let value = e.target.value.trim();
                        // Extraire le username si l'utilisateur entre l'URL complète
                        // Ex: "cal.com/noam-41pyox" ou "https://cal.com/noam-41pyox" → "noam-41pyox"
                        if (value.includes('cal.com/')) {
                          value = value.split('cal.com/')[1]?.split('?')[0]?.split('/')[0] || value;
                        }
                        // Supprimer les protocoles et domaines
                        value = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
                        setFormData({ ...formData, calcom_username: value.toLowerCase() });
                      }}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="noam-41pyox"
                    />
                    <p className="text-xs text-zinc-500 mt-2">
                      Entrez votre username Cal.com (ex: <code className="bg-white/10 px-1 rounded">noam-41pyox</code>). 
                      Vous pouvez aussi coller le lien complet, il sera automatiquement extrait.
                    </p>
                  </div>
                  {formData.calcom_username && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-xs text-zinc-400 mb-2">Aperçu de votre lien Cal.com :</p>
                      <a
                        href={`https://cal.com/${formData.calcom_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white hover:text-zinc-300 underline flex items-center gap-2"
                      >
                        cal.com/{formData.calcom_username}
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Pourcentage d'acompte
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={formData.deposit_percentage}
                    onChange={(e) => setFormData({ ...formData, deposit_percentage: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-xl md:text-2xl font-display font-bold text-white w-12 md:w-16 text-right shrink-0">
                    {formData.deposit_percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600 mt-2 flex-wrap gap-1">
                  <span className="shrink-0">0%</span>
                  <span className="shrink-0 hidden sm:inline">30% (Standard)</span>
                  <span className="shrink-0 sm:hidden">30%</span>
                  <span className="shrink-0">50%</span>
                  <span className="shrink-0">100%</span>
                </div>
              </div>
            </div>

            {/* Section: Abonnement */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Crown className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Abonnement</h3>
                  <p className="text-sm text-zinc-500">Gérez votre abonnement et votre facturation</p>
                </div>
              </div>

              <div className="space-y-4">
                {subscriptionLoading ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="animate-spin text-zinc-400" size={20} />
                  </div>
                ) : subscription?.status === 'active' || subscription?.status === 'trialing' ? (
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <CheckCircle className="text-purple-400 shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="text-purple-400 font-semibold text-sm mb-1">
                          Abonnement actif - {getPlanDisplayName(subscription.plan)}
                        </p>
                        <p className="text-zinc-400 text-xs">
                          {subscription.subscriptionCurrentPeriodEnd
                            ? `Renouvellement le ${new Date(subscription.subscriptionCurrentPeriodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
                            : 'Abonnement actif'}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handleManageSubscription}
                      disabled={loadingPortal}
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingPortal ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Settings size={18} />
                          Gérer mon abonnement
                        </>
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="text-amber-400 font-semibold text-sm mb-1">Aucun abonnement actif</p>
                        <p className="text-zinc-400 text-xs">
                          Abonnez-vous pour accéder à toutes les fonctionnalités d'InkFlow.
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={() => {}}
                      className="w-full bg-white/10 text-zinc-400 font-semibold py-3 rounded-xl cursor-default flex items-center justify-center gap-2"
                    >
                      <Crown size={18} />
                      Accès inclus avec votre essai
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Paiements Stripe */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <CreditCard className="text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Paiements Stripe</h3>
                  <p className="text-sm text-zinc-500">Configurez votre compte bancaire pour recevoir les acomptes</p>
                </div>
              </div>

              <div className="space-y-4">
                {profile?.stripe_onboarding_complete ? (
                  <div className="p-4 bg-brand-mint/10 border border-brand-mint/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-brand-mint shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="text-brand-mint font-semibold text-sm mb-1">Compte Stripe actif</p>
                        <p className="text-zinc-400 text-xs">
                          Votre compte bancaire est configuré. Vous pouvez recevoir des paiements.
                        </p>
                        {profile.stripe_account_id && (
                          <p className="text-zinc-600 text-xs mt-2 font-mono">
                            Compte: {profile.stripe_account_id.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="text-amber-400 shrink-0 mt-0.5" size={20} />
                      <div className="flex-1">
                        <p className="text-amber-400 font-semibold text-sm mb-1">Configuration requise</p>
                        <p className="text-zinc-400 text-xs">
                          Connectez votre compte bancaire pour recevoir les acomptes de vos clients.
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="button"
                      onClick={handleStripeConnect}
                      disabled={stripeConnecting}
                      className="w-full bg-gradient-to-r from-amber-400 to-amber-600 text-white font-semibold py-3 rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {stripeConnecting ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Configuration en cours...
                        </>
                      ) : (
                        <>
                          <ExternalLink size={18} />
                          Configurer les virements
                        </>
                      )}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Informations de Compte */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 border-b border-white/5 pb-3 md:pb-4">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-brand-mint/10 flex items-center justify-center shrink-0">
                  <Link2 className="text-brand-mint" size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-white">Informations de Compte</h3>
                  <p className="text-xs md:text-sm text-zinc-500">Informations de connexion</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-zinc-500 mb-1">Email</label>
                  <div className="bg-[#050505] border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-zinc-400 text-xs md:text-sm break-all">
                    {user?.email}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">L'email ne peut pas être modifié ici</p>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-zinc-500 mb-1">Lien de votre profil</label>
                  <div className="bg-[#050505] border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-zinc-400 font-mono text-xs md:text-sm break-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/${profile.slug_profil}` : `inkflow.app/${profile.slug_profil}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push('/dashboard/overview')}
                className="flex-1 glass text-zinc-300 font-medium py-3 rounded-xl hover:bg-white/10 transition-colors text-sm md:text-base"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
