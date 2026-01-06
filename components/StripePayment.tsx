import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { getStripe } from '../services/stripeService';
import type { Stripe, StripeElements, PaymentIntent } from '@stripe/stripe-js';

interface StripePaymentProps {
  amount: number; // En euros
  depositPercentage: number; // Pourcentage d'acompte (ex: 30)
  bookingId: string;
  artistId: string;
  description: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  amount,
  depositPercentage,
  bookingId,
  artistId,
  description,
  onSuccess,
  onCancel,
}) => {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const depositAmount = Math.round(amount * (depositPercentage / 100) * 100); // En centimes

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await getStripe();
      if (!stripeInstance) {
        setError('Stripe n\'est pas configuré. Veuillez contacter le support.');
        setLoading(false);
        return;
      }

      setStripe(stripeInstance);

      // Créer le Payment Intent (dans un vrai projet, cela devrait être fait côté serveur)
      try {
        // Simulation - dans un vrai projet, appeler votre API
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: depositAmount,
            artist_id: artistId,
            booking_id: bookingId,
            description: `Acompte ${depositPercentage}% - ${description}`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setClientSecret(data.clientSecret);
          
          const elementsInstance = stripeInstance.elements({
            clientSecret: data.clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#fbbf24',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
              },
            },
          });

          setElements(elementsInstance);
        } else {
          throw new Error('Failed to create payment intent');
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors de l\'initialisation du paiement');
      } finally {
        setLoading(false);
      }
    };

    initializeStripe();
  }, [depositAmount, artistId, bookingId, description, depositPercentage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Erreur lors de la soumission');
        setProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/booking/success?payment_intent={PAYMENT_INTENT_CLIENT_SECRET}`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        setError(confirmError.message || 'Erreur lors du paiement');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du traitement du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-400 mb-4" size={48} />
        <p className="text-slate-400">Initialisation du paiement...</p>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="text-red-400" size={24} />
          <h3 className="text-lg font-bold text-red-400">Erreur</h3>
        </div>
        <p className="text-red-300 mb-4">{error}</p>
        <button
          onClick={onCancel}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-400/10 rounded-xl flex items-center justify-center">
            <CreditCard className="text-amber-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Paiement de l'acompte</h2>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>
        </div>

        {/* Résumé du paiement */}
        <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>Montant total</span>
              <span className="font-bold">{amount.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between text-slate-400 text-sm">
              <span>Acompte ({depositPercentage}%)</span>
              <span>{(amount * (depositPercentage / 100)).toFixed(2)}€</span>
            </div>
            <div className="border-t border-slate-700 pt-3 flex justify-between text-white font-bold text-lg">
              <span>À payer maintenant</span>
              <span className="text-amber-400">{(amount * (depositPercentage / 100)).toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* Formulaire Stripe */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form id="payment-form" onSubmit={handleSubmit}>
          {elements && (
            <div id="payment-element" className="mb-6">
              {/* Stripe Elements sera injecté ici */}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-slate-600 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors"
              disabled={processing}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={processing || !stripe || !elements}
              className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Traitement...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Payer {(amount * (depositPercentage / 100)).toFixed(2)}€
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-xs text-slate-500 text-center mt-4">
          Paiement sécurisé par Stripe. Vos données bancaires sont cryptées.
        </p>
      </div>
    </div>
  );
};

