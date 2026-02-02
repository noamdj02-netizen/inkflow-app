import React, { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageSEO } from './seo/PageSEO';

export const PaymentCancel: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!bookingId || cancelledRef.current) return;
    cancelledRef.current = true;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    fetch(`${origin}/api/cancel-pending-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_id: bookingId }),
    }).catch(() => {});
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <PageSEO title="Paiement annulé | InkFlow" description="Vous avez annulé le paiement. Votre réservation n'a pas été confirmée." canonical="/payment/cancel" noindex />
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
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
          className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="text-orange-400" size={48} />
        </motion.div>
        
        <h1 className="text-3xl font-serif font-bold text-white mb-4">Paiement annulé</h1>
        <p className="text-lg text-slate-400 mb-8">
          Vous avez annulé le paiement. Votre réservation n'a pas été confirmée.
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

