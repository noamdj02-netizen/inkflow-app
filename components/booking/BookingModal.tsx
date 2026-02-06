'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CalComEmbed } from './CalComEmbed';
import { createClient } from '@/lib/supabase/client';

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
  const [calcomUsername, setCalcomUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer le calcom_username de l'artiste
  useEffect(() => {
    if (isOpen && artistSlug) {
      fetchArtistCalcom();
    }
  }, [isOpen, artistSlug]);

  const fetchArtistCalcom = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('artists')
        .select('calcom_username')
        .eq('slug_profil', artistSlug)
        .single();

      if (error || !data) {
        console.error('Error fetching artist:', error);
        setCalcomUsername(null);
      } else {
        const artistData = data as any;
        setCalcomUsername(artistData.calcom_username || null);
      }
    } catch (err) {
      console.error('Error:', err);
      setCalcomUsername(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    // Cal.com gère la réservation, on peut juste fermer le modal
    setIsOpen(false);
  };

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
                className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {type === 'flash' ? flash?.title : 'Réserver un créneau'}
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                      Choisissez votre créneau disponible
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
                <div className="flex-1 overflow-y-auto p-6 min-h-[600px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : (
                    <CalComEmbed
                      calLink={calcomUsername || ''}
                      config={{
                        theme: 'dark',
                        layout: 'month_view',
                      }}
                      onBookingSuccess={handleBookingSuccess}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
