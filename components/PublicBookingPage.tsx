/**
 * Page réservation publique : calendrier des créneaux disponibles.
 * Route : /:slug/booking
 * Affiche les créneaux disponibles (sync dashboard), puis redirige vers la vitrine pour choisir un flash.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Loader2, ArrowLeft, Clock, Zap } from 'lucide-react';
import { usePublicArtist } from '../hooks/usePublicArtist';
import { toast } from 'sonner';

type Slot = { date: string; time: string; iso: string; displayDate: string };

const getApiBase = () => {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

/** Créneaux fictifs pour le dev local quand l’API /api/availability n’est pas servie (Vite seul). */
function buildMockSlots(): Slot[] {
  const now = new Date();
  const out: Slot[] = [];
  const workDays = [1, 2, 3, 4, 5];
  for (let d = 0; d < 14; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
    if (!workDays.includes(dayOfWeek)) continue;
    for (let hour = 9; hour < 18; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      if (slotStart.getTime() <= now.getTime()) continue;
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      out.push({
        date: date.toISOString().slice(0, 10),
        time: timeStr,
        iso: slotStart.toISOString(),
        displayDate: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
      });
    }
  }
  return out;
}

export const PublicBookingPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { artist, loading: artistLoading, notFound } = usePublicArtist(slug);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`${getApiBase()}/api/availability?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Créneaux indisponibles');
        return res.json();
      })
      .then((data: { slots?: Slot[] }) => {
        if (cancelled) return;
        if (data.slots && data.slots.length > 0) {
          setSlots(data.slots);
        } else if (import.meta.env.DEV) {
          setSlots(buildMockSlots());
        } else {
          setSlots([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          if (import.meta.env.DEV) setSlots(buildMockSlots());
          else setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const slotsByDate = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const dates = Object.keys(slotsByDate).sort().slice(0, 14);

  const timeSlotsForSelected = selectedDate ? slotsByDate[selectedDate] || [] : [];

  const handleConfirmSlot = () => {
    if (!selectedDate || !selectedTime || !slug) return;
    const slot = timeSlotsForSelected.find((s) => s.time === selectedTime);
    if (!slot) return;
    toast.success('Créneau sélectionné', {
      description: 'Choisissez un flash ci-dessous pour réserver ce créneau.',
      duration: 5000,
    });
    navigate(`/${slug}`, { state: { preferredSlot: slot }, replace: false });
  };

  if (artistLoading || notFound || !artist) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        {artistLoading ? (
          <div className="text-center">
            <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={40} />
            <p className="text-zinc-500">Chargement...</p>
          </div>
        ) : (
          <div className="text-center max-w-md px-4">
            <p className="text-zinc-300 mb-6">Artiste introuvable.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
            >
              <ArrowLeft size={18} /> Retour à l&apos;accueil
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased">
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Link
            to={slug ? `/${slug}` : '/'}
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors text-sm font-medium"
            aria-label="Retour à la vitrine"
          >
            <ArrowLeft size={18} /> Retour à la vitrine
          </Link>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl" role="main">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Réserver avec {artist.nom_studio}
        </h1>
        <p className="text-zinc-300 text-sm md:text-base mb-8">
          Choisissez un créneau disponible, puis vous pourrez sélectionner un flash sur la vitrine.
        </p>
        {import.meta.env.DEV && slots.length > 0 && (
          <p className="mb-4 text-amber-400/90 text-sm font-medium" role="status">
            Données de démo (API non servie en local) — le planning est fictif.
          </p>
        )}

        {loadingSlots ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-amber-400" size={40} />
          </div>
        ) : slots.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
            <Calendar className="text-zinc-500 mx-auto mb-4" size={48} />
            <p className="text-zinc-400 mb-2">Aucun créneau disponible pour le moment.</p>
            <p className="text-zinc-500 text-sm">Revenez plus tard ou contactez l&apos;artiste directement.</p>
            <Link
              to={slug ? `/${slug}` : '/'}
              className="inline-flex items-center gap-2 mt-6 text-amber-400 hover:text-amber-300 font-medium"
            >
              <ArrowLeft size={16} /> Retour à la vitrine
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} /> Date
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {dates.map((date) => {
                  const daySlots = slotsByDate[date];
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      className={`min-h-[44px] sm:min-h-0 py-3 px-3 sm:py-3 sm:px-3 rounded-xl text-left border transition-colors text-sm touch-manipulation ${
                        isSelected
                          ? 'bg-white text-black border-white'
                          : 'bg-[#0a0a0a] border-white/10 text-white hover:border-white/30 active:bg-white/5'
                      }`}
                    >
                      <span className="font-medium">{daySlots[0]?.displayDate ?? date}</span>
                      <span className="block text-xs opacity-80 mt-0.5">{daySlots.length} créneau(x)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={20} /> Heure
              </h2>
              {selectedDate ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {timeSlotsForSelected.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.iso}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={`min-h-[44px] py-3 px-3 rounded-xl border transition-colors text-sm font-medium touch-manipulation ${
                          isSelected
                            ? 'bg-white text-black border-white'
                            : 'bg-[#0a0a0a] border-white/10 text-white hover:border-white/30 active:bg-white/5'
                        }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-400 text-sm">Choisissez une date.</p>
              )}
            </div>
          </div>
        )}

        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-8 border-t border-white/10"
          >
            <p className="text-zinc-400 text-sm mb-4">
              Créneau : {slotsByDate[selectedDate]?.[0]?.displayDate} à {selectedTime}
            </p>
            <button
              type="button"
              onClick={handleConfirmSlot}
              className="w-full min-h-[44px] py-4 bg-white text-black rounded-xl font-semibold hover:bg-neutral-200 active:bg-neutral-300 transition-colors flex items-center justify-center gap-2 touch-manipulation"
            >
              <Zap size={20} /> Choisir un flash et réserver
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};
