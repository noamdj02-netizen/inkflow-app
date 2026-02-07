'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function BookingSuccessStripe() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={48} className="text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold mb-4">Réservation confirmée !</h1>
        <p className="text-zinc-400 mb-6">
          Votre acompte a été payé avec succès. Votre réservation est confirmée.
        </p>

        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Vous recevrez un email de confirmation avec tous les détails de votre rendez-vous.
          </p>

          <button
            onClick={() => router.push('/')}
            className="w-full bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </motion.div>
    </div>
  );
}
