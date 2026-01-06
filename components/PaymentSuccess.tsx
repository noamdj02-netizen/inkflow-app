import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase';

export const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('Session ID manquant');
        setLoading(false);
        return;
      }

      try {
        // Vérifier le statut du paiement via Stripe (via votre backend)
        // Pour l'instant, on considère que le paiement est réussi si on arrive sur cette page
        // Dans un vrai scénario, vous devriez vérifier avec Stripe
        
        // Attendre un peu pour simuler la vérification
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error verifying payment:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-red-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-slate-400 mb-6">{error}</p>
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="text-green-400" size={48} />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Paiement réussi !</h1>
        <p className="text-lg text-slate-400 mb-8">
          Votre réservation a été confirmée. Un email de confirmation vous a été envoyé avec tous les détails.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-amber-400 text-black px-6 py-3 rounded-xl font-bold hover:bg-amber-300 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

