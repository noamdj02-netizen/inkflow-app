/**
 * Composant React pour créer une session Stripe Checkout
 * 
 * Exemple d'utilisation :
 * <StripeCheckoutButton 
 *   priceId="price_xxx" 
 *   userId={user.id}
 *   onSuccess={() => console.log('Success!')}
 * />
 */

import React, { useState } from 'react';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { safeParseJson } from '../lib/fetchJson';

interface StripeCheckoutButtonProps {
  priceId: string; // Stripe Price ID
  userId: string; // Supabase user ID
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  priceId,
  userId,
  onSuccess,
  onError,
  className = '',
  children,
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!priceId || !userId) {
      toast.error('Configuration manquante', {
        description: 'priceId et userId sont requis',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: `${window.location.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }),
      });

      const data = await safeParseJson<{ url?: string; error?: string }>(response);

      if (!response.ok) {
        throw new Error(data.error || `Erreur serveur (${response.status}). Réessayez.`);
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      const errorMessage = error.message || 'Erreur lors de la création de la session de paiement';
      
      toast.error('Erreur', {
        description: errorMessage,
      });
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || !priceId || !userId}
      className={`inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-black font-semibold rounded-xl hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          Chargement...
        </>
      ) : (
        <>
          <CreditCard size={20} />
          {children || 'Upgrade to Premium'}
        </>
      )}
    </button>
  );
};
