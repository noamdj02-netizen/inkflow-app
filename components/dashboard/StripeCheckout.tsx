/**
 * Stripe Checkout Component
 * 
 * Composant de paiement sécurisé avec Stripe Elements
 * Adapté pour Vite (import.meta.env)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CreditCard, 
  Lock, 
  Check, 
  AlertCircle, 
  Loader2,
  Shield,
  Euro
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutProps {
  bookingId: string;
  artistId: string;
  amount: number; // En centimes
  paymentType: 'deposit' | 'balance';
  onSuccess: () => void;
  onCancel?: () => void;
}

const CheckoutForm: React.FC<StripeCheckoutProps> = ({
  bookingId,
  artistId,
  amount,
  paymentType,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';
  
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer le Payment Intent au montage
  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          artistId,
          amount,
          paymentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Impossible de créer le paiement');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      toast.error('Erreur', {
        description: 'Impossible de préparer le paiement',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        toast.success('Paiement réussi !', {
          description: 'Votre réservation est confirmée.',
        });
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Paiement échoué';
      setError(errorMessage);
      toast.error('Erreur de paiement', {
        description: errorMessage,
      });
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: isDark ? '#ffffff' : '#1f2937',
        fontFamily: '"Inter", system-ui, sans-serif',
        '::placeholder': {
          color: isDark ? '#71717a' : '#9ca3af',
        },
        iconColor: '#a855f7',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 border transition-all ${
          isDark
            ? 'bg-[#1a1a2e]/80 backdrop-blur-xl border-white/[0.06]'
            : 'bg-white/80 backdrop-blur-xl border-gray-200/80'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <CreditCard className="text-white" size={20} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {paymentType === 'deposit' ? 'Payer l\'acompte' : 'Payer le solde'}
              </h3>
              <p className="text-gray-500 text-sm">Paiement sécurisé par Stripe</p>
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className={`mb-6 p-4 rounded-xl ${
          isDark
            ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20'
            : 'bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Montant à payer</span>
            <div className="flex items-center gap-2">
              <Euro className="text-violet-400" size={18} />
              <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {(amount / 100).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Element */}
          <div className="space-y-2">
            <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <CreditCard size={16} />
              Informations de carte
            </label>
            <div className={`p-4 rounded-xl transition-colors ${
              isDark
                ? 'bg-white/5 border border-white/[0.06] focus-within:border-violet-500/50'
                : 'bg-gray-50 border border-gray-200 focus-within:border-violet-500'
            }`}>
              <CardElement
                options={cardElementOptions}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </div>
          </div>

          {/* Security Info */}
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            isDark ? 'bg-emerald-500/[0.06] border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-200'
          }`}>
            <Shield className="text-emerald-400 shrink-0 mt-0.5" size={16} />
            <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Vos informations sont protégées par un cryptage SSL 256-bit
            </p>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                }`}
              >
                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!stripe || !clientSecret || !cardComplete || processing}
            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Lock size={20} />
                Payer {(amount / 100).toFixed(2)}€
              </>
            )}
          </motion.button>

          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={processing}
              className={`w-full px-6 py-3 rounded-xl font-medium disabled:opacity-50 transition-colors ${
                isDark
                  ? 'bg-white/5 text-gray-300 hover:bg-white/10'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Annuler
            </button>
          )}
        </form>

        {/* Powered by Stripe */}
        <div className={`mt-6 pt-4 border-t flex items-center justify-center gap-2 text-xs text-gray-500 ${
          isDark ? 'border-white/5' : 'border-gray-100'
        }`}>
          <Lock size={12} />
          <span>Powered by Stripe</span>
        </div>
      </motion.div>
    </div>
  );
};

// Wrapper avec Elements Provider
export const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default StripeCheckout;
