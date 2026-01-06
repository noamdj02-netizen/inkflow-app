import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const PaymentCancel: React.FC = () => {
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
          className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="text-orange-400" size={48} />
        </motion.div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Paiement annulé</h1>
        <p className="text-lg text-slate-400 mb-8">
          Vous avez annulé le paiement. Votre réservation n'a pas été confirmée.
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

