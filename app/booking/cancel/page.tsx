/**
 * Page d'annulation après abandon du paiement Stripe
 * Route: /booking/cancel?booking_id={bookingId}
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BookingCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={48} className="text-red-500" />
        </div>

        <h1 className="text-3xl font-bold mb-4">Paiement annulé</h1>
        <p className="text-zinc-400 mb-6">
          Vous avez annulé le paiement. Votre réservation n'a pas été confirmée.
        </p>

        <div className="space-y-4">
          <p className="text-sm text-zinc-500">
            Le créneau reste disponible. Vous pouvez réessayer plus tard.
          </p>

          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-lg hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Retour
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors"
            >
              Accueil
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
