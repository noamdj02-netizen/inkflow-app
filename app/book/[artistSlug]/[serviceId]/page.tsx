/**
 * Page de réservation native
 * Route: /book/[artistSlug]/[serviceId]
 * 
 * Interface en 4 étapes :
 * 1. Sélection de la date (Calendrier)
 * 2. Sélection du créneau (Liste des slots disponibles)
 * 3. Formulaire client (Nom, Email, Téléphone)
 * 4. Paiement de l'acompte (Redirection Stripe)
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, Loader2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getAvailableSlots, createBookingSession, type AvailableSlot } from '@/lib/actions/booking';

interface Artist {
  id: string;
  slug: string;
  nomStudio: string | null;
  depositPercentage: number;
}

interface Service {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  depositAmount: number;
  imageUrl: string | null;
}

type BookingStep = 'date' | 'slot' | 'form' | 'processing';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const artistSlug = params.artistSlug as string;
  const serviceId = params.serviceId as string;

  const [step, setStep] = useState<BookingStep>('date');
  const [loading, setLoading] = useState(true);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
  });

  // Charger l'artiste et le service
  useEffect(() => {
    loadArtistAndService();
  }, [artistSlug, serviceId]);

  // Charger les créneaux disponibles quand une date est sélectionnée
  useEffect(() => {
    if (selectedDate && artist && service) {
      loadAvailableSlots();
    }
  }, [selectedDate, artist, service]);

  const loadArtistAndService = async () => {
    try {
      setLoading(true);
      
      // Récupérer l'artiste par slug
      const artistData = await fetch(`/api/artists/${artistSlug}`).then(res => res.json());
      if (!artistData) {
        toast.error('Artiste non trouvé');
        router.push('/');
        return;
      }

      // Récupérer le service
      const serviceData = await fetch(`/api/services/${serviceId}`).then(res => res.json());
      if (!serviceData || serviceData.artistId !== artistData.id) {
        toast.error('Service non trouvé');
        router.push(`/${artistSlug}`);
        return;
      }

      setArtist(artistData);
      setService(serviceData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !artist || !service) return;

    try {
      setLoading(true);
      const slots = await getAvailableSlots({
        artistId: artist.id,
        date: selectedDate,
        durationMin: service.durationMin,
      });
      setAvailableSlots(slots);

      if (slots.length === 0) {
        toast.info('Aucun créneau disponible pour cette date');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      toast.error('Erreur lors du chargement des créneaux disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('slot');
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSlot || !artist || !service) return;

    try {
      setStep('processing');
      
      const { checkoutUrl } = await createBookingSession({
        artistId: artist.id,
        serviceId: service.id,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        durationMin: service.durationMin,
        depositAmount: Number(service.depositAmount),
        price: Number(service.price),
      });

      // Rediriger vers Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      toast.error('Erreur lors de la création de la réservation');
      setStep('form');
    }
  };

  if (loading && !artist) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  if (!artist || !service) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Artiste ou service non trouvé</p>
          <button
            onClick={() => router.push('/')}
            className="text-amber-400 hover:text-amber-300"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          <h1 className="text-3xl font-bold mb-2">Réservation</h1>
          <p className="text-zinc-400">
            {service.name} - {artist.nomStudio || 'Studio'}
          </p>
          <div className="mt-4 flex items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              {service.durationMin} minutes
            </div>
            <div className="flex items-center gap-2">
              <CreditCard size={16} />
              {Number(service.price).toFixed(2)}€ (Acompte: {Number(service.depositAmount).toFixed(2)}€)
            </div>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          {['date', 'slot', 'form'].map((s, index) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === s
                    ? 'bg-amber-400 text-black'
                    : ['date', 'slot', 'form'].indexOf(step) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    ['date', 'slot', 'form'].indexOf(step) > index
                      ? 'bg-green-500'
                      : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 'date' && (
            <motion.div
              key="date"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DateSelectionStep onDateSelect={handleDateSelect} />
            </motion.div>
          )}

          {step === 'slot' && selectedDate && (
            <motion.div
              key="slot"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SlotSelectionStep
                date={selectedDate}
                slots={availableSlots}
                onSlotSelect={handleSlotSelect}
                onBack={() => setStep('date')}
                loading={loading}
              />
            </motion.div>
          )}

          {step === 'form' && selectedSlot && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FormStep
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleFormSubmit}
                onBack={() => setStep('slot')}
                depositAmount={Number(service.depositAmount)}
                slot={selectedSlot}
              />
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
              <p className="text-xl">Redirection vers le paiement...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Composant Étape 1 : Sélection de la date
function DateSelectionStep({ onDateSelect }: { onDateSelect: (date: Date) => void }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleContinue = () => {
    if (selectedDate) {
      onDateSelect(selectedDate);
    }
  };

  // Générer les 30 prochains jours
  const availableDates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    availableDates.push(date);
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Choisissez une date</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
        {availableDates.map((date) => {
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-400/10 text-amber-400'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
              }`}
            >
              <div className="text-sm font-medium">
                {date.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div className="text-lg font-bold">
                {date.getDate()}
              </div>
              <div className="text-xs text-zinc-400">
                {date.toLocaleDateString('fr-FR', { month: 'short' })}
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleContinue}
        disabled={!selectedDate}
        className="w-full bg-amber-400 text-black font-bold py-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors"
      >
        Continuer
      </button>
    </div>
  );
}

// Composant Étape 2 : Sélection du créneau
function SlotSelectionStep({
  date,
  slots,
  onSlotSelect,
  onBack,
  loading,
}: {
  date: Date;
  slots: AvailableSlot[];
  onSlotSelect: (slot: AvailableSlot) => void;
  onBack: () => void;
  loading: boolean;
}) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          Créneaux disponibles - {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <button
          onClick={onBack}
          className="text-zinc-400 hover:text-white"
        >
          Changer la date
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={32} />
          <p className="text-zinc-400">Chargement des créneaux...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg">
          <Clock className="mx-auto mb-4 text-zinc-600" size={48} />
          <p className="text-zinc-400 mb-4">Aucun créneau disponible pour cette date</p>
          <button
            onClick={onBack}
            className="text-amber-400 hover:text-amber-300"
          >
            Choisir une autre date
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slots.map((slot, index) => (
            <button
              key={index}
              onClick={() => onSlotSelect(slot)}
              className="p-4 rounded-lg border-2 border-zinc-800 bg-zinc-900 hover:border-amber-400 hover:bg-amber-400/10 transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock size={18} className="text-amber-400" />
                <span className="font-semibold">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </span>
              </div>
              <div className="text-sm text-zinc-400">
                Durée: {slot.durationMin} minutes
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant Étape 3 : Formulaire client
function FormStep({
  formData,
  setFormData,
  onSubmit,
  onBack,
  depositAmount,
  slot,
}: {
  formData: { clientName: string; clientEmail: string; clientPhone: string };
  setFormData: (data: { clientName: string; clientEmail: string; clientPhone: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  depositAmount: number;
  slot: AvailableSlot;
}) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-zinc-400 hover:text-white mb-4"
        >
          ← Changer le créneau
        </button>
        <h2 className="text-2xl font-semibold mb-2">Vos informations</h2>
        <div className="bg-zinc-900 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={16} className="text-amber-400" />
            <span>
              {slot.startTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {formatTime(slot.startTime)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Nom complet <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
            placeholder="Jean Dupont"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
            placeholder="jean.dupont@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
            placeholder="06 12 34 56 78"
          />
        </div>

        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Acompte à payer</span>
            <span className="text-2xl font-bold text-amber-400">
              {depositAmount.toFixed(2)}€
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Le solde sera réglé le jour du rendez-vous
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-amber-400 text-black font-bold py-4 rounded-lg hover:bg-amber-300 transition-colors flex items-center justify-center gap-2"
        >
          <CreditCard size={20} />
          Payer l'acompte ({depositAmount.toFixed(2)}€)
        </button>
      </form>
    </div>
  );
}
