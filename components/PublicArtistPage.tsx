import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PenTool, ArrowLeft, Loader2, X, CheckCircle, Clock, Euro } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Artist, Flash } from '../types/supabase';
import { CustomProjectForm } from './CustomProjectForm';
import { bookingFormSchema, type BookingFormData } from '../utils/validation';
import { usePublicArtist, type ArtistVitrine } from '../hooks/usePublicArtist';
import { ArtistHero } from './vitrine/ArtistHero';
import { FlashGallery } from './vitrine/FlashGallery';
import { BookingCTA } from './vitrine/BookingCTA';
import { AIButton } from './vitrine/AIButton';

interface BookingDrawerProps {
  flash: Flash;
  artist: Artist;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  theme: ReturnType<typeof getThemeClasses>;
  /** Créneau préféré (ex. venant de /:slug/booking) au format datetime-local YYYY-MM-DDTHH:mm */
  initialDateSouhaitee?: string;
}

const BookingDrawer: React.FC<BookingDrawerProps> = ({ flash, artist, isOpen, onClose, onSuccess, theme, initialDateSouhaitee }) => {
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
  const accentHex = artist.theme_accent_hex || null;
  const secondaryHex = artist.theme_secondary_hex || null;
  const hasCustomHex = Boolean(accentHex);
  const primaryButtonClass =
    theme.primary === 'bg-amber-400'
      ? 'bg-white text-black hover:bg-zinc-100'
      : `${theme.primary} ${theme.primaryHover} text-white`;

  // Reset form when drawer opens/closes; prefill date if coming from booking page
  useEffect(() => {
    if (isOpen) {
      reset({
        client_name: '',
        client_email: '',
        client_phone: '',
        date_souhaitee: initialDateSouhaitee || '',
        commentaire: '',
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, reset, initialDateSouhaitee]);

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
        className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-white/10 rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Handle */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
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
              <p className="text-zinc-400">
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
                      alt={`Tatouage ${flash.title} - ${artist?.nom_studio || 'Artiste'}`}
                      loading="lazy"
                      className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400/30"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{flash.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Euro size={14} /> {Math.round(flash.prix / 100)}€
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {flash.duree_minutes} min
                      </span>
                    </div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">Acompte à payer</span>
                    <span className="text-amber-400 font-bold text-lg">
                      {Math.round((flash.prix * (artist.deposit_percentage || 30)) / 10000)}€
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
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
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('client_name')}
                    className={`w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_name ? 'border-red-500' : 'border-white/10 ' + theme.inputFocus
                    }`}
                    placeholder="Jean Dupont"
                  />
                  {errors.client_name && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    {...register('client_email')}
                    className={`w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_email ? 'border-red-500' : 'border-white/10 ' + theme.inputFocus
                    }`}
                    placeholder="jean.dupont@example.com"
                  />
                  {errors.client_email && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    {...register('client_phone')}
                    className={`w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.client_phone ? 'border-red-500' : 'border-white/10 ' + theme.inputFocus
                    }`}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.client_phone && (
                    <p className="text-red-400 text-xs mt-1">{errors.client_phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Date souhaitée <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register('date_souhaitee')}
                    min={new Date().toISOString().slice(0, 16)}
                    className={`w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none ${
                      errors.date_souhaitee ? 'border-red-500' : 'border-white/10 ' + theme.inputFocus
                    }`}
                  />
                  {errors.date_souhaitee && (
                    <p className="text-red-400 text-xs mt-1">{errors.date_souhaitee.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    rows={3}
                    {...register('commentaire')}
                    className={`w-full bg-[#050505] border rounded-xl px-4 py-3 text-white focus:outline-none resize-none ${
                      errors.commentaire ? 'border-red-500' : 'border-white/10 ' + theme.inputFocus
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
                  style={hasCustomHex ? { background: `linear-gradient(135deg, ${accentHex}, ${secondaryHex || accentHex})` } : undefined}
                  className={`w-full font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg ${
                    hasCustomHex ? 'text-white hover:brightness-110' : primaryButtonClass
                  }`}
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
    gold: {
      primary: 'bg-amber-500',
      primaryHover: 'hover:bg-amber-400',
      primaryText: 'text-amber-500',
      primaryBg: 'bg-amber-500/10',
      primaryBorder: 'border-amber-500',
      icon: 'text-amber-500',
      badge: 'bg-green-500/90',
      inputFocus: 'focus:border-amber-500',
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
  const location = useLocation();
  const { artist, flashs, loading, error: fetchError, notFound, refresh } = usePublicArtist(slug);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'flashs' | 'project'>('flashs');
  const [selectedFlash, setSelectedFlash] = useState<Flash | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // Créneau choisi sur la page /:slug/booking (format datetime-local pour le champ date_souhaitee)
  const preferredSlot = (location.state as { preferredSlot?: { iso: string; date: string; time: string } } | undefined)?.preferredSlot;
  const initialDateSouhaitee = preferredSlot?.iso ? preferredSlot.iso.slice(0, 16) : undefined;

  const artistVitrine = artist as ArtistVitrine | null;
  
  const themeColor = artist ? (artist.theme_color || artist.accent_color || 'violet') : 'violet';
  const theme = getThemeClasses(themeColor);
  const accentHex = artist?.theme_accent_hex || null;
  const secondaryHex = artist?.theme_secondary_hex || null;
  const glowA = accentHex || (themeColor === 'amber' ? '#fbbf24' : '#8b5cf6');
  const glowB = secondaryHex || (themeColor === 'amber' ? '#00BBF9' : '#a78bfa');

  const seoTitle = artist 
    ? `${artist.nom_studio} - Tatoueur${artistVitrine?.ville ? ` à ${artistVitrine.ville}` : ''} | InkFlow`
    : 'Artiste InkFlow';
  const seoDescription = artist?.bio_instagram || 'Découvrez mes flashs et projets sur InkFlow. Réservez votre créneau de tatouage en ligne.';
  const seoImage = artist?.avatar_url 
    ? (artist.avatar_url.startsWith('http') ? artist.avatar_url : `${typeof window !== 'undefined' ? window.location.origin : ''}${artist.avatar_url}`)
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/inkflow-logo-v2.png`;
  const seoUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleBookingSuccess = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-violet-400 mx-auto mb-4" size={48} aria-hidden />
          <p className="text-zinc-500 text-sm md:text-base">Chargement...</p>
        </div>
      </div>
    );
  }

  const displayError = fetchError && fetchError !== 'ARTIST_NOT_FOUND'
    ? (fetchError.includes('Unexpected end of JSON input') || fetchError.includes('Failed to execute')
        ? 'Erreur de communication avec le serveur. Veuillez réessayer.'
        : fetchError)
    : error;

  if ((notFound || fetchError) && !artist) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <PenTool className="text-red-400" size={40} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">404</h1>
          <p className="text-slate-400 text-sm md:text-base mb-6 min-h-[14px]">
            {displayError || "Cet artiste n'existe pas ou n'a pas encore configuré son profil."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={18} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased overflow-x-hidden selection:bg-violet-500 selection:text-white">
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:image" content={seoImage} />
        <meta property="og:url" content={seoUrl} />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={seoImage} />
      </Helmet>

      {/* Effets de lumière (ambiance) — personnalisables depuis le dashboard */}
      {(artistVitrine?.vitrine_show_glow !== false) && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-[0.08]"
            style={{ backgroundColor: glowA }}
          />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-[0.08]"
            style={{ backgroundColor: glowB }}
          />
        </div>
      )}

      <main className="relative max-w-6xl mx-auto px-4 pt-24 pb-20">
        <ArtistHero artist={artistVitrine!} slug={slug ?? ''} />

        {/* Tabs: Créations / Projet sur mesure */}
        <section id="public-profile-tabs" className="border-b border-white/5 mt-16 md:mt-24">
          <div className="flex justify-center gap-2 py-4">
            <button
              type="button"
              onClick={() => setActiveTab('flashs')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'flashs'
                  ? 'bg-white text-[#0a0a0a] shadow-lg'
                  : 'text-white/60 hover:text-white bg-white/5'
              }`}
              aria-pressed={activeTab === 'flashs'}
            >
              Créations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('project')}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === 'project'
                  ? 'bg-white text-[#0a0a0a] shadow-lg'
                  : 'text-white/60 hover:text-white bg-white/5'
              }`}
              aria-pressed={activeTab === 'project'}
            >
              Projet sur mesure
            </button>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {activeTab === 'flashs' ? (
            <motion.section
              key="flashs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="mt-16 md:mt-24"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
                >
                  <X className="text-red-400 shrink-0" size={20} aria-hidden />
                  <p className="text-red-300 text-sm flex-1">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="text-red-400/60 hover:text-red-400"
                    aria-label="Fermer"
                  >
                    <X size={18} />
                  </button>
                </motion.div>
              )}
              <FlashGallery
                flashs={flashs}
                artist={artistVitrine!}
                artistSlug={slug ?? ''}
              />
            </motion.section>
          ) : (
            <motion.section
              key="project"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="py-10 pb-28"
            >
              <div className="max-w-2xl mx-auto">
                <CustomProjectForm artistId={artist.id} />
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Drawer (conservé pour usage futur ou depuis URL) */}
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
            initialDateSouhaitee={initialDateSouhaitee}
          />
        )}
      </AnimatePresence>

      {/* Footer vitrine premium */}
      <footer className="mt-32 py-12 border-t border-white/5 text-center text-white/30 text-xs uppercase tracking-[0.2em]">
        © 2026 Inkflow • {artist.nom_studio}
        {artistVitrine?.ville ? ` Studio ${artistVitrine.ville}` : ''}
      </footer>

      {/* Mobile CTA fixe — style premium */}
      <BookingCTA artistSlug={slug ?? ''} isHidden={isDrawerOpen} />

      {/* Bouton flottant consultant IA (au-dessus du CTA mobile) */}
      <AIButton artistName={artist.nom_studio} />
    </div>
  );
};
