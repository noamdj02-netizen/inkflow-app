/**
 * Skeleton components for widget loading states.
 * Fallback d'erreur réutilisable pour les widgets dashboard.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

/** Fallback d'erreur avec message clair et bouton Réessayer */
export const WidgetErrorFallback: React.FC<{
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message = 'Impossible de charger les données.', onRetry, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass rounded-2xl p-6 border border-white/10 flex flex-col items-center justify-center min-h-[140px] text-center ${className}`}
  >
    <AlertCircle className="text-amber-400 mb-3" size={28} />
    <p className="text-sm text-zinc-400 mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors"
      >
        <RefreshCw size={14} />
        Réessayer
      </button>
    )}
  </motion.div>
);

export const WidgetSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl p-6 border border-white/10 ${className}`}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-32" />
        <div className="h-8 bg-white/10 rounded w-48" />
        <div className="h-4 bg-white/10 rounded w-24" />
      </div>
    </motion.div>
  );
};

export const KPISkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#0a0a0a] p-4 sm:p-5 min-h-[88px] sm:min-h-[110px] animate-pulse">
            <div className="flex justify-between mb-2">
              <div className="h-3 bg-white/10 rounded w-20" />
              <div className="w-8 h-8 rounded-lg bg-white/10" />
            </div>
            <div className="h-7 bg-white/10 rounded w-16 mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-white/10 rounded w-48" />
        <div className="h-64 bg-white/10 rounded" />
      </div>
    </motion.div>
  );
};

export const ActivitySkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-white/10 rounded w-48" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-white/10 rounded" />
        ))}
      </div>
    </motion.div>
  );
};
