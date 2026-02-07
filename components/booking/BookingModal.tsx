'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar } from 'lucide-react';

interface BookingModalProps {
  type: 'flash' | 'project';
  flash?: {
    id: string;
    title: string;
    prix: number;
    acompte: number;
  };
  artistSlug: string;
  trigger: React.ReactNode;
}

export function BookingModal({ type, flash, artistSlug, trigger }: BookingModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{trigger}</div>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {type === 'flash' ? flash?.title : 'Réserver un créneau'}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      Réservation en ligne
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center">
                      <Calendar className="text-zinc-400" size={40} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        Prochainement : Réservation en ligne
                      </h3>
                      <p className="text-zinc-400">
                        Le système de réservation natif sera bientôt disponible.
                        Vous pourrez réserver directement depuis cette page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
