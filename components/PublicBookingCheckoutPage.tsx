/**
 * Page Checkout : récap flash + créneau + formulaire client (Nom, Prénom, Email, Téléphone).
 * Route : /:slug/booking/checkout?flash_id=xxx&slot=ISO
 * - Si Stripe configuré : création booking → session Stripe → redirection paiement.
 * - Sinon : création booking → message "Réservation enregistrée (en attente)".
 */

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Calendar, CreditCard, CheckCircle, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { checkoutFormSchema, type CheckoutFormData } from '../utils/validation';
import { PageSEO } from './seo/PageSEO';
import { Breadcrumbs } from './seo/Breadcrumbs';
import { usePublicArtist } from '../hooks/usePublicArtist';
import type { Flash } from '../types/supabase';

type ArtistBookingInfo = {
  artist: {
    id: string;
    nom_studio: string;
    slug_profil: string;
    deposit_percentage: number;
    stripe_configured: boolean;
  };
  flash: {
    id: string;
    title: string;
    prix: number;
    duree_minutes: number;
    deposit_amount: number;
  };
};

const getApiBase = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

function getStripeErrorMessage(message: string): string {
  if (/network|fetch|failed/i.test(message)) return 'Problème de connexion. Réessayez.';
  if (/stripe|payment/i.test(message)) return 'Paiement indisponible. Contactez l\'artiste.';
  return message || 'Une erreur est survenue.';
}

function getBookingErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: string }).message);
  return 'Impossible d\'enregistrer la réservation. Réessayez.';
}

export const PublicBookingCheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const flashId = searchParams.get('flash_id')?.trim() || '';
  const slotIso = searchParams.get('slot')?.trim() || '';

  const [info, setInfo] = useState<ArtistBookingInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<'pending' | null>(null);

  const [form, setForm] = useState<CheckoutFormData>({
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});

  const { artist: publicArtist, flashs, loading: loadingArtist } = usePublicArtist(slug);

  // Redirection si pas de créneau ; sinon si pas de flash → étape "choisir un flash" ; si flash → charger récap
  useEffect(() => {
    if (!slug) return;
    if (!slotIso) {
      navigate(`/${slug}/booking`, { replace: true });
      return;
    }
    const slotDate = new Date(slotIso);
    if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() < Date.now()) {
      setInfoError('Créneau invalide ou passé. Choisissez un nouveau créneau.');
      setLoadingInfo(false);
      return;
    }
    if (!flashId) {
      setLoadingInfo(false);
      return;
    }

    let cancelled = false;
    setLoadingInfo(true);
    setInfoError(null);
    fetch(`${getApiBase()}/api/artist-booking-info?slug=${encodeURIComponent(slug)}&flash_id=${encodeURIComponent(flashId)}`)
      .then(async (res) => {
        const text = await res.text();
        let data: { error?: string } = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          if (!res.ok) data = { error: res.status === 404 ? 'Flash ou artiste introuvable.' : 'Service temporairement indisponible.' };
        }
        return { ok: res.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (!ok) {
          setInfoError((data as { error?: string })?.error || 'Flash ou artiste introuvable.');
          return;
        }
        const parsed = data as ArtistBookingInfo;
        if (!parsed?.artist || !parsed?.flash) {
          setInfoError('Données incomplètes. Réessayez.');
          return;
        }
        setInfo(parsed);
      })
      .catch(() => {
        if (!cancelled) {
          const inDev = import.meta.env.DEV;
          setInfoError(
            inDev
              ? 'Service indisponible. En local, lancez "vercel dev" pour activer les API.'
              : 'Chargement impossible. Réessayez.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingInfo(false);
      });
    return () => { cancelled = true; };
  }, [slug, flashId, slotIso, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = checkoutFormSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CheckoutFormData, string>> = {};
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof CheckoutFormData;
        if (path) fieldErrors[path] = issue.message;
      });
      setFormErrors(fieldErrors);
      return;
    }
    setFormErrors({});
    const data = parsed.data;
    if (!info || !slug) return;

    setSubmitting(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const clientName = `${data.client_first_name.trim()} ${data.client_last_name.trim()}`.trim();

    try {
      const createRes = await fetch(`${getApiBase()}/api/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          flash_id: info.flash.id,
          date_debut_iso: slotIso,
          duree_minutes: info.flash.duree_minutes,
          client_email: data.client_email.trim(),
          client_name: clientName || undefined,
          client_phone: data.client_phone?.trim() || undefined,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.booking_id) {
        setError(createJson.error || 'Impossible d\'enregistrer la réservation.');
        setSubmitting(false);
        return;
      }
      const bookingId = createJson.booking_id;

      if (info.artist.stripe_configured) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
          setError('Configuration serveur manquante. Contactez le support.');
          setSubmitting(false);
          return;
        }
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const amountCentimes = Math.round(info.flash.deposit_amount * 100);
        const response = await supabase.functions.invoke('create-checkout-session', {
          body: {
            amount: amountCentimes,
            flash_title: info.flash.title,
            client_email: data.client_email,
            client_name: clientName,
            booking_id: bookingId,
            artist_id: info.artist.id,
            success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/payment/cancel?booking_id=${bookingId}`,
          },
        });
        const sessionData = response.data as { url?: string } | null;
        const sessionError = response.error;
        if (sessionError || !sessionData?.url) {
          await fetch(`${origin}/api/cancel-pending-booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: bookingId }),
          }).catch(() => {});
          setError(
            sessionError?.message
              ? getStripeErrorMessage(sessionError.message)
              : 'URL de paiement non reçue. Réessayez ou contactez l\'artiste.'
          );
          setSubmitting(false);
          return;
        }
        if (typeof window !== 'undefined' && sessionData.url) {
          window.location.href = sessionData.url;
        }
        return;
      }

      setSuccess('pending');
    } catch (err) {
      console.error('Checkout error:', err);
      setError(getBookingErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (!slug) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-zinc-400">Slug manquant.</p>
      </div>
    );
  }

  const slotDateForDisplay = slotIso ? new Date(slotIso) : null;
  const slotFormattedShort = slotDateForDisplay && !Number.isNaN(slotDateForDisplay.getTime())
    ? slotDateForDisplay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';

  // Étape « Choisissez un flash » : créneau choisi, pas encore de flash
  if (slotIso && !flashId) {
    if (loadingArtist) {
      return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
          <Loader2 className="animate-spin text-amber-400" size={40} />
          <p className="text-zinc-400">Chargement...</p>
        </div>
      );
    }
    const availableFlashs = (flashs || []).filter((f: Flash) => f.statut === 'available' && (f.stock_current ?? 0) < (f.stock_limit ?? 1));
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans antialiased">
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <Link
              to={`/${slug}/booking`}
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} /> Retour au calendrier
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-2xl" role="main">
          <Breadcrumbs
            items={[
              { label: 'Accueil', path: '/' },
              { label: publicArtist?.nom_studio ?? 'Artiste', path: `/${slug}` },
              { label: 'Réservation', path: `/${slug}/booking` },
              { label: 'Choisir un flash' },
            ]}
            className="mb-6"
            currentUrl={typeof window !== 'undefined' ? window.location.href : undefined}
          />
          <h1 className="text-2xl font-bold text-white mb-2">Choisissez un flash</h1>
          <p className="text-zinc-400 text-sm mb-6">
            Créneau sélectionné : <span className="text-white font-medium">{slotFormattedShort}</span>. Sélectionnez un flash pour continuer vers vos informations et le paiement.
          </p>
          {availableFlashs.length === 0 ? (
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
              <p className="text-zinc-400 mb-4">Aucun flash disponible pour le moment.</p>
              <Link
                to={`/${slug}/booking`}
                className="inline-flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-amber-400"
              >
                <ArrowLeft size={18} /> Choisir un autre créneau
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {availableFlashs.map((flash: Flash) => (
                <li key={flash.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/${slug}/booking/checkout?slot=${encodeURIComponent(slotIso)}&flash_id=${encodeURIComponent(flash.id)}`, { replace: false })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#0a0a0a] border border-white/10 text-left hover:border-amber-500/50 hover:bg-white/5 transition-colors"
                  >
                    {flash.image_url && (
                      <img
                        src={flash.image_url}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{flash.title}</p>
                      <p className="text-sm text-zinc-400">{flash.prix / 100} € · {flash.duree_minutes} min</p>
                    </div>
                    <Zap size={20} className="text-amber-400 shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    );
  }

  if (loadingInfo || (!info && !infoError)) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-amber-400" size={40} />
        <p className="text-zinc-400">Chargement...</p>
      </div>
    );
  }

  if (infoError || !info || !info.artist || !info.flash) {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans">
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <Link
              to={`/${slug}/booking`}
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} /> Retour au calendrier
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-6 py-12 max-w-lg text-center">
          <p className="text-zinc-300 mb-6">{infoError || 'Données introuvables.'}</p>
          <Link
            to={`/${slug}/booking${flashId ? `?flashId=${encodeURIComponent(flashId)}` : ''}`}
            className="inline-flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-amber-400"
          >
            Choisir un créneau
          </Link>
        </main>
      </div>
    );
  }

  const slotDate = new Date(slotIso);
  const slotFormatted = slotDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (success === 'pending') {
    return (
      <div className="min-h-screen bg-[#050505] text-white font-sans">
        <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <Link
              to={`/${slug}`}
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} /> Retour à la vitrine
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 md:px-6 py-12 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center"
          >
            <CheckCircle className="text-emerald-400 mx-auto mb-4" size={56} />
            <h1 className="text-xl font-bold text-white mb-2">Réservation enregistrée</h1>
            <p className="text-zinc-300 mb-6">
              Votre demande a bien été prise en compte. {info.artist?.nom_studio ?? 'L\'artiste'} vous recontactera pour confirmer le rendez-vous.
            </p>
            <Link
              to={`/${slug}`}
              className="inline-flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-amber-400"
            >
              Retour à la vitrine
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  const pageTitle = `Finaliser la réservation | ${info.artist?.nom_studio ?? 'Artiste'} | InkFlow`;
  const pageDescription = `Finalisez votre réservation : ${info.flash?.title ?? ''} — ${slotFormatted}.`;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased">
      <PageSEO
        title={pageTitle}
        description={pageDescription}
        canonical={slug ? `/${slug}/booking/checkout` : '/booking/checkout'}
        ogType="website"
      />
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link
            to={`/${slug}/booking?flashId=${encodeURIComponent(flashId)}`}
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            aria-label="Retour au calendrier"
          >
            <ArrowLeft size={18} /> Retour au calendrier
          </Link>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-xl" role="main">
        <Breadcrumbs
          items={[
            { label: 'Accueil', path: '/' },
            { label: info.artist?.nom_studio ?? 'Artiste', path: `/${slug}` },
            { label: 'Réservation', path: `/${slug}/booking` },
            { label: 'Finaliser' },
          ]}
          className="mb-6"
          currentUrl={typeof window !== 'undefined' ? window.location.href : undefined}
        />

        <h1 className="text-2xl font-bold text-white mb-6">Finaliser la réservation</h1>

        {/* Récap */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-8">
          <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Récapitulatif</p>
          <p className="text-white font-semibold text-lg mb-1">{info.flash.title}</p>
          <p className="text-zinc-300 text-sm flex items-center gap-2 mt-2">
            <Calendar size={16} />
            {slotFormatted}
          </p>
          <p className="text-zinc-300 text-sm mt-1">
            Durée : {info.flash.duree_minutes} min — Total : {info.flash.prix} €
          </p>
          {info.artist.stripe_configured && (
            <p className="text-amber-400/90 text-sm mt-2 flex items-center gap-2">
              <CreditCard size={16} />
              Acompte : {info.flash.deposit_amount} € (paiement sécurisé)
            </p>
          )}
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="client_first_name" className="block text-sm font-medium text-zinc-300 mb-1">
                Prénom <span className="text-amber-400">*</span>
              </label>
              <input
                id="client_first_name"
                type="text"
                autoComplete="given-name"
                value={form.client_first_name}
                onChange={(e) => setForm((f) => ({ ...f, client_first_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                placeholder="Prénom"
              />
              {formErrors.client_first_name && (
                <p className="mt-1 text-sm text-red-400">{formErrors.client_first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="client_last_name" className="block text-sm font-medium text-zinc-300 mb-1">
                Nom <span className="text-amber-400">*</span>
              </label>
              <input
                id="client_last_name"
                type="text"
                autoComplete="family-name"
                value={form.client_last_name}
                onChange={(e) => setForm((f) => ({ ...f, client_last_name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                placeholder="Nom"
              />
              {formErrors.client_last_name && (
                <p className="mt-1 text-sm text-red-400">{formErrors.client_last_name}</p>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="client_email" className="block text-sm font-medium text-zinc-300 mb-1">
              Email <span className="text-amber-400">*</span>
            </label>
            <input
              id="client_email"
              type="email"
              autoComplete="email"
              value={form.client_email}
              onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
              placeholder="vous@exemple.fr"
            />
            {formErrors.client_email && (
              <p className="mt-1 text-sm text-red-400">{formErrors.client_email}</p>
            )}
          </div>
          <div>
            <label htmlFor="client_phone" className="block text-sm font-medium text-zinc-300 mb-1">
              Téléphone
            </label>
            <input
              id="client_phone"
              type="tel"
              autoComplete="tel"
              value={form.client_phone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value || null }))}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0a0a] border border-white/10 text-white placeholder-zinc-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
              placeholder="06 12 34 56 78"
            />
            {formErrors.client_phone && (
              <p className="mt-1 text-sm text-red-400">{formErrors.client_phone}</p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl font-semibold bg-amber-500 text-black hover:bg-amber-400 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#050505] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                {info.artist.stripe_configured ? 'Redirection vers le paiement...' : 'Enregistrement...'}
              </>
            ) : info.artist.stripe_configured ? (
              <>Payer l&apos;acompte ({info.flash.deposit_amount} €)</>
            ) : (
              'Confirmer la réservation'
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
