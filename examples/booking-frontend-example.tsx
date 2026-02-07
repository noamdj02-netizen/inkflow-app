/**
 * Exemple de composant Frontend pour créer une réservation
 * 
 * Ce composant montre comment utiliser les APIs de réservation
 * avec Stripe Elements pour le paiement de l'acompte.
 */

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type BookingFormProps = {
  artistId: string;
  serviceId: string;
  clientId: string;
};

export function BookingForm({ artistId, serviceId, clientId }: BookingFormProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const stripe = useStripe();
  const elements = useElements();

  // Étape 1: Charger les créneaux disponibles
  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 jours
          serviceDurationMin: 120, // 2h
          slotIntervalMin: 30,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des créneaux');
      }

      const { slots } = await response.json();
      setAvailableSlots(slots.filter((slot: any) => slot.available));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2: Créer la réservation
  const createBooking = async () => {
    if (!selectedSlot) {
      setError('Veuillez sélectionner un créneau');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          artistId,
          serviceId,
          startTime: selectedSlot,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Gérer les erreurs spécifiques
        if (data.code === 'SLOT_UNAVAILABLE' || data.code === 'SLOT_TAKEN') {
          setError(`Ce créneau n'est plus disponible. ${data.reason || ''}`);
          // Recharger les créneaux disponibles
          await loadAvailableSlots();
        } else {
          setError(data.error || 'Erreur lors de la création de la réservation');
        }
        return;
      }

      // Réservation créée avec succès
      setBookingId(data.booking.id);
      setClientSecret(data.paymentIntent.clientSecret);

      // Le formulaire Stripe s'affichera automatiquement
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  // Étape 3: Confirmer le paiement
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    try {
      setLoading(true);

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success?booking_id=${bookingId}`,
        },
        redirect: 'if_required', // Ne redirige pas si le paiement est déjà confirmé
      });

      if (stripeError) {
        setError(stripeError.message || 'Erreur lors du paiement');
        return;
      }

      // Paiement réussi (le webhook mettra à jour le booking automatiquement)
      alert('Paiement réussi ! Votre réservation est confirmée.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-form">
      <h2>Réserver un créneau</h2>

      {/* Étape 1: Charger les créneaux */}
      {availableSlots.length === 0 && !clientSecret && (
        <div>
          <button onClick={loadAvailableSlots} disabled={loading}>
            {loading ? 'Chargement...' : 'Voir les créneaux disponibles'}
          </button>
        </div>
      )}

      {/* Étape 2: Sélectionner un créneau */}
      {availableSlots.length > 0 && !clientSecret && (
        <div>
          <h3>Sélectionnez un créneau</h3>
          <div className="slots-grid">
            {availableSlots.map((slot) => (
              <button
                key={slot.startTime}
                onClick={() => setSelectedSlot(slot.startTime)}
                className={selectedSlot === slot.startTime ? 'selected' : ''}
                disabled={!slot.available}
              >
                {new Date(slot.startTime).toLocaleString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </button>
            ))}
          </div>
          <button onClick={createBooking} disabled={loading || !selectedSlot}>
            {loading ? 'Création...' : 'Réserver ce créneau'}
          </button>
        </div>
      )}

      {/* Étape 3: Payer l'acompte */}
      {clientSecret && (
        <form onSubmit={handlePayment}>
          <h3>Payer l'acompte</h3>
          <PaymentElement />
          <button type="submit" disabled={loading || !stripe}>
            {loading ? 'Traitement...' : 'Payer l\'acompte'}
          </button>
        </form>
      )}

      {/* Affichage des erreurs */}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

// Wrapper avec Stripe Elements Provider
export function BookingFormWrapper(props: BookingFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <BookingForm {...props} />
    </Elements>
  );
}
