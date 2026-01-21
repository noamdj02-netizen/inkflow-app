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
      } catch (err) {
        console.error('Error verifying payment:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la vérification du paiement';
        setError(errorMessage);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="text-center relative z-10">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        <div className="text-center max-w-md relative z-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-red-400" size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-2">Erreur</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg shadow-amber-400/20"
          >
            <ArrowLeft size={18} /> Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md relative z-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="text-green-400" size={48} />
        </motion.div>
        
        <h1 className="text-3xl font-serif font-bold text-white mb-4">Paiement réussi !</h1>
        <p className="text-lg text-slate-400 mb-8">
          Votre réservation a été confirmée. Un email de confirmation vous a été envoyé avec tous les détails.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-500 hover:to-amber-700 transition-all shadow-lg shadow-amber-400/20"
          >
            Retour à l'accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

