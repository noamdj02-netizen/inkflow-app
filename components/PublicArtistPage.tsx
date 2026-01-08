import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  PenTool, Instagram, Zap, ArrowLeft, Loader2, X, CheckCircle, Clock, 
  Mail, User, MessageSquare, Share2, Phone, Calendar, Euro
} from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Artist, Flash } from '../types/supabase';
import { CustomProjectForm } from './CustomProjectForm';
import { bookingFormSchema, type BookingFormData } from '../utils/validation';

interface BookingDrawerProps {
  flash: Flash;
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: ReturnType<typeof getThemeClasses>;
}

const BookingDrawer: React.FC<BookingDrawerProps> = ({ flash, artist, isOpen, onClose, onSuccess, theme }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      client_name: '',
      client_email: '',
      client_phone: '',
      date_souhaitee: '',
      commentaire: '',
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: BookingFormData) => {
    setError(null);

    try {
      const dateDebut = new Date(data.date_souhaitee);
      const dateFin = new Date(dateDebut.getTime() + flash.duree_minutes * 60000);
      const depositPercentage = artist.deposit_percentage || 30;
      const depositAmount = Math.round((flash.prix * depositPercentage) / 100); // En centimes (prix est déjà en centimes)

      // 1. Créer la réservation dans Supabase avec statut 'pending'
      const { data: bookingData, error: insertError } = await supabase
        .from('bookings')
        .insert({
          artist_id: artist.id,
          flash_id: flash.id,
          client_email: data.client_email,
          client_name: data.client_name,
          client_phone: data.client_phone || null,
          date_debut: dateDebut.toISOString(),
          date_fin: dateFin.toISOString(),
          duree_minutes: flash.duree_minutes,
          prix_total: flash.prix,
          deposit_amount: depositAmount,
          deposit_percentage: depositPercentage,
          statut_paiement: 'pending',
          statut_booking: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Vérifier la configuration Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Configuration Supabase manquante. ' +
          'Vérifiez que les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies dans votre fichier .env.local'
        );
      }

      // 3. Appeler l'Edge Function pour créer la session Stripe
      let sessionData;
      let sessionError;
      
      try {
        const response = await supabase.functions.invoke('create-checkout-session', {
          body: {
            amount: depositAmount, // En centimes
            flash_title: flash.title,
            client_email: data.client_email,
            client_name: data.client_name,
            booking_id: bookingData.id,
            artist_id: artist.id,
            success_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${typeof window !== 'undefined' ? window.location.origin : ''}/payment/cancel`,
          },
        });
        
        sessionData = response.data;
        sessionError = response.error;
      } catch (invokeError) {
        // Erreur de connexion à l'Edge Function
        console.error('Edge Function invoke error:', invokeError);
        throw new Error(
          `Impossible de contacter le serveur de paiement. ` +
          `Vérifiez votre connexion internet et réessayez. ` +
          `Si le problème persiste, contactez le support.`
        );
      }

      if (sessionError) {
        console.error('Edge Function error:', sessionError);
        // Améliorer le message d'erreur selon le type d'erreur
        if (sessionError.message?.includes('Function not found') || sessionError.message?.includes('404')) {
          throw new Error(
            'La fonction de paiement n\'est pas disponible. ' +
            'Veuillez contacter le support technique.'
          );
        } else if (sessionError.message?.includes('Failed to send')) {
          throw new Error(
            'Impossible de contacter le serveur de paiement. ' +
            'Vérifiez votre connexion et réessayez.'
          );
        } else {
          throw new Error(sessionError.message || 'Erreur lors de la création de la session de paiement');
        }
      }
      
      if (!sessionData?.url) {
        throw new Error('URL de paiement non reçue du serveur');
      }

      // 3. Rediriger vers Stripe Checkout
      if (typeof window !== 'undefined' && sessionData.url) {
        window.location.href = sessionData.url;
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la réservation';
      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      
      {/* Drawer */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-400" size={40} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Réservation confirmée !</h3>
              <p className="text-slate-400">
                Un email de confirmation vous sera envoyé avec les détails du paiement de l'acompte.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Flash Info */}
              <div className="mb-6">
                <div className="flex items-start gap-4 mb-4">
                  {flash.image_url && (
                    <img
                      src={flash.image_url}
                      alt={flash.title}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400/30"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{flash.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Euro size={14} /> {Math.round(flash.prix / 100)}€
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {flash.duree_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Acompte à payer</span>
                    <span className="text-amber-400 font-bold text-lg">
                      {Math.round((flash.prix * (artist.deposit_percentage || 30)) / 10000)}€
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    ({artist.deposit_percentage || 30}% du montant total)
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('client_name')}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_name ? 'border-red-500' : 'border-slate-700 ' + theme.inputFocus
                    }`}
                    placeholder="Jean Dupont"
                  />
                  {errors.client_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('client_email')}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_email ? 'border-red-500' : 'border-slate-700 ' + theme.inputFocus
                    }`}
                    placeholder="jean.dupont@example.com"
                  />
                  {errors.client_email && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    {...register('client_phone')}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_phone ? 'border-red-500' : 'border-slate-700 ' + theme.inputFocus
                    }`}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.client_phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date souhaitée <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register('date_souhaitee')}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.date_souhaitee ? 'border-red-500' : 'border-slate-700 ' + theme.inputFocus
                    }`}
                  />
                  {errors.date_souhaitee && (
                    <p className="text-red-400 text-xs mt-1">{errors.date_souhaitee.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    {...register('commentaire')}
                    className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-white focus:outline-none resize-none ${
                      errors.commentaire ? 'border-red-500' : 'border-slate-700 ' + theme.inputFocus
                    }`}
                    placeholder="Précisions, préférences..."
                  />
                  {errors.commentaire && (
                    <p className="text-red-400 text-xs mt-1">{errors.commentaire.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full ${theme.primary} text-black font-bold py-4 rounded-xl ${theme.primaryHover} transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Traitement...
                    </>
                  ) : (
                    <>
                      Confirmer la réservation
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Fonction pour obtenir les classes Tailwind selon le thème
const getThemeClasses = (themeColor: string = 'amber') => {
  const themes: Record<string, {
    primary: string;
    primaryHover: string;
    primaryText: string;
    primaryBg: string;
    primaryBorder: string;
    icon: string;
    badge: string;
    inputFocus: string;
  }> = {
    amber: {
      primary: 'bg-amber-400',
      primaryHover: 'hover:bg-amber-300',
      primaryText: 'text-amber-400',
      primaryBg: 'bg-amber-400/10',
      primaryBorder: 'border-amber-400',
      icon: 'text-amber-400',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-amber-400',
    },
    red: {
      primary: 'bg-red-500',
      primaryHover: 'hover:bg-red-400',
      primaryText: 'text-red-500',
      primaryBg: 'bg-red-500/10',
      primaryBorder: 'border-red-500',
      icon: 'text-red-500',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-red-500',
    },
    blue: {
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-400',
      primaryText: 'text-blue-500',
      primaryBg: 'bg-blue-500/10',
      primaryBorder: 'border-blue-500',
      icon: 'text-blue-500',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-blue-500',
    },
    emerald: {
      primary: 'bg-emerald-500',
      primaryHover: 'hover:bg-emerald-400',
      primaryText: 'text-emerald-500',
      primaryBg: 'bg-emerald-500/10',
      primaryBorder: 'border-emerald-500',
      icon: 'text-emerald-500',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-emerald-500',
    },
    violet: {
      primary: 'bg-violet-500',
      primaryHover: 'hover:bg-violet-400',
      primaryText: 'text-violet-500',
      primaryBg: 'bg-violet-500/10',
      primaryBorder: 'border-violet-500',
      icon: 'text-violet-500',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-violet-500',
    },
  };

  return themes[themeColor] || themes.amber;
};

export const PublicArtistPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [flashs, setFlashs] = useState<Flash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flashs' | 'project'>('flashs');
  const [selectedFlash, setSelectedFlash] = useState<Flash | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Obtenir les classes du thème (doit être après que artist soit chargé)
  const themeColor = artist ? (artist.theme_color || artist.accent_color || 'amber') : 'amber';
  const theme = getThemeClasses(themeColor);

  // Meta tags SEO dynamiques
  useEffect(() => {
    if (!artist) return;

    const updateMetaTags = () => {
      const title = `Réservez un tatouage avec ${artist.nom_studio} - InkFlow`;
      const description = artist.bio_instagram || `Découvrez mes flashs et projets sur InkFlow.`;
      const image = artist.avatar_url || `${typeof window !== 'undefined' ? window.location.origin : ''}/og-default.jpg`;
      const url = typeof window !== 'undefined' ? window.location.href : '';

      // Mettre à jour ou créer les meta tags
      const setMetaTag = (property: string, content: string, isProperty = true) => {
        const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
        let meta = document.querySelector(selector) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          if (isProperty) {
            meta.setAttribute('property', property);
          } else {
            meta.setAttribute('name', property);
          }
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      // Title
      document.title = title;

      // Meta description
      setMetaTag('description', description, false);

      // Open Graph
      setMetaTag('og:title', title);
      setMetaTag('og:description', description);
      setMetaTag('og:image', image);
      setMetaTag('og:url', url);
      setMetaTag('og:type', 'website');

      // Twitter Card
      setMetaTag('twitter:card', 'summary_large_image', false);
      setMetaTag('twitter:title', title, false);
      setMetaTag('twitter:description', description, false);
      setMetaTag('twitter:image', image, false);
    };

    updateMetaTags();

    // Cleanup function
    return () => {
      // Optionnel: remettre les meta tags par défaut
    };
  }, [artist]);

  useEffect(() => {
    const fetchData = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        setError('Supabase n\'est pas configuré.');
        setLoading(false);
        return;
      }

      if (!slug) {
        setError('Slug manquant');
        setLoading(false);
        return;
      }

      try {
        // Récupérer l'artiste
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('slug_profil', slug)
          .single();

        if (artistError) {
          if (artistError.code === 'PGRST116') {
            setError('Artiste non trouvé');
          } else {
            setError('Erreur lors du chargement');
          }
          setLoading(false);
          return;
        }

        setArtist(artistData);

        // Récupérer les flashs disponibles
        const { data: flashsData, error: flashsError } = await supabase
          .from('flashs')
          .select('*')
          .eq('artist_id', artistData.id)
          .eq('statut', 'available')
          .order('created_at', { ascending: false });

        if (flashsError) {
          console.error('Error fetching flashs:', flashsError);
        } else {
          setFlashs(flashsData || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    
    const url = window.location.href;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${artist?.nom_studio} - InkFlow`,
          text: `Découvrez les flashs disponibles de ${artist?.nom_studio}`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url);
        }
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
  };

  const handleFlashClick = (flash: Flash) => {
    setSelectedFlash(flash);
    setIsDrawerOpen(true);
  };

  const handleBookingSuccess = () => {
    if (artist) {
      supabase
        .from('flashs')
        .select('*')
        .eq('artist_id', artist.id)
        .eq('statut', 'available')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setFlashs(data);
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PenTool className="text-red-400" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">404</h1>
          <p className="text-slate-400 mb-6">
            {error || "Cet artiste n'existe pas ou n'a pas encore configuré son profil."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-amber-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-amber-300 transition-colors"
          >
            <ArrowLeft size={18} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      {/* Header Fixe */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-black tracking-tighter text-white">
              INK<span className={theme.primaryText}>FLOW</span>
            </span>
          </Link>
          <button
            onClick={handleShare}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden ${
              artist.avatar_url 
                ? '' 
                : `bg-gradient-to-br ${theme.primary} shadow-[0_0_30px_rgba(0,0,0,0.3)]`
            }`}
          >
            {artist.avatar_url ? (
              <img
                src={`${artist.avatar_url}${artist.avatar_url.includes('?') ? '&' : '?'}v=${new Date().getTime()}`}
                alt={artist.nom_studio}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-3xl font-black text-black">${artist.nom_studio[0]?.toUpperCase()}</span>`;
                    parent.className += ` bg-gradient-to-br ${theme.primary}`;
                  }
                }}
              />
            ) : (
              <span className="text-3xl font-black text-black">
                {artist.nom_studio[0]?.toUpperCase()}
              </span>
            )}
          </motion.div>

          {/* Nom */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white mb-4"
          >
            {artist.nom_studio}
          </motion.h1>

          {/* Bio */}
          {artist.bio_instagram && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-slate-400 mb-6 max-w-xl mx-auto"
            >
              {artist.bio_instagram}
            </motion.p>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 text-slate-400"
          >
            <div className="flex items-center gap-2">
              <Zap size={18} className={theme.icon} />
              <span className="text-sm font-medium">{flashs.length} Flashs disponibles</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <section className="border-b border-slate-800 sticky top-[73px] z-30 bg-slate-900/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex">
            <button
              onClick={() => setActiveTab('flashs')}
              className={`flex-1 px-6 py-4 font-bold transition-colors relative ${
                activeTab === 'flashs'
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Zap size={18} />
                Flashs
              </span>
              {activeTab === 'flashs' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.primary}`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('project')}
              className={`flex-1 px-6 py-4 font-bold transition-colors relative ${
                activeTab === 'project'
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare size={18} />
                Projet Perso
              </span>
              {activeTab === 'project' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 ${theme.primary}`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'flashs' ? (
          <motion.section
            key="flashs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-8 pb-24"
          >
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-3 flex items-center justify-center gap-2">
                  <Zap className={theme.icon} size={32} />
                  Flashs Disponibles
                </h2>
                <p className="text-slate-400 text-lg">Premier arrivé, premier servi. Réservez votre créneau instantanément.</p>
              </div>

              {/* Afficher uniquement les flashs réels de la base de données */}
              {(() => {
                if (flashs.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PenTool className="text-slate-600" size={48} />
                      </div>
                      <p className="text-slate-400 text-lg">Aucun flash disponible pour le moment.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {flashs.map((flash, index) => (
                      <motion.div
                        key={flash.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleFlashClick(flash)}
                        className="group relative bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 transition-all active:scale-95 cursor-pointer"
                      >
                        <div className="aspect-square relative overflow-hidden bg-slate-900">
                          {flash.image_url ? (
                            <img
                              src={flash.image_url}
                              alt={flash.title}
                              className="object-cover w-full h-full transition-transform duration-500 group-active:scale-110"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%231e293b" width="400" height="400"/%3E%3Ctext fill="%23475569" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <PenTool size={48} />
                            </div>
                          )}
                          <div className={`absolute top-2 right-2 ${theme.badge} backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full`}>
                            Disponible
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white mb-2 line-clamp-1">{flash.title}</h3>
                          <div className="flex items-center justify-between">
                            <span className={`${theme.primaryText} font-mono font-bold text-lg`}>
                              {Math.round(flash.prix / 100)}€
                            </span>
                            <span className="text-slate-400 text-sm flex items-center gap-1">
                              <Clock size={14} /> {flash.duree_minutes}min
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="project"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="px-4 py-8 pb-24"
          >
            <div className="max-w-3xl mx-auto">
              <CustomProjectForm artistId={artist.id} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Booking Drawer */}
      <AnimatePresence>
        {selectedFlash && (
          <BookingDrawer
            flash={selectedFlash}
            artist={artist}
            isOpen={isDrawerOpen}
            onClose={() => {
              setIsDrawerOpen(false);
              setTimeout(() => setSelectedFlash(null), 300);
            }}
            onSuccess={handleBookingSuccess}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Footer Légal */}
      <footer className="border-t border-slate-800 py-6 mt-12 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span>Propulsé par</span>
              <span className="font-bold text-slate-400">InkFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('CGV - Fonctionnalité à venir');
                }}
                className="hover:text-slate-300 transition-colors"
              >
                CGV
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Mentions Légales - Fonctionnalité à venir');
                }}
                className="hover:text-slate-300 transition-colors"
              >
                Mentions Légales
              </a>
            </div>
            <div className="text-slate-600">
              &copy; 2024 InkFlow SaaS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
