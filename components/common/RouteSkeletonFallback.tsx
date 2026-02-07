import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton de chargement entre les pages : évite le sentiment d'attente
 * en affichant une structure proche de la page (barre + blocs) au lieu d'un spinner.
 */
export const RouteSkeletonFallback: React.FC = () => (
  <div
    className="min-h-screen w-full relative overflow-hidden"
    style={{ background: '#0a0a0a' }}
    role="status"
    aria-live="polite"
    aria-label="Chargement"
  >
    {/* Barre type header */}
    <div className="h-14 border-b border-white/5 flex items-center px-4 gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse" />
      <div className="h-5 w-24 rounded bg-white/10 animate-pulse" />
      <div className="flex-1" />
      <div className="w-9 h-9 rounded-xl bg-white/10 animate-pulse" />
    </div>

    {/* Contenu : blocs type dashboard */}
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="h-8 w-48 rounded bg-white/10 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/10 bg-white/5 p-4 h-28 animate-pulse"
          >
            <div className="h-4 w-20 rounded bg-white/10 mb-3" />
            <div className="h-8 w-16 rounded bg-white/10" />
          </motion.div>
        ))}
      </div>
      <div className="h-48 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-40 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
        <div className="h-40 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
      </div>
    </div>
  </div>
);
