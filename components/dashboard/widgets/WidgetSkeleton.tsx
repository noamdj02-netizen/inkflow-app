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
    className={`rounded-3xl p-6 border border-border bg-card flex flex-col items-center justify-center min-h-[140px] text-center shadow-soft-light dark:shadow-soft-dark ${className}`}
  >
    <AlertCircle className="text-amber-500 mb-3" size={28} />
    <p className="text-sm text-foreground-muted mb-4">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-white text-sm font-medium transition-opacity shadow-soft-light"
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
      className={`rounded-3xl p-6 border border-border bg-card shadow-soft-light dark:shadow-soft-dark ${className}`}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-border rounded w-32 animate-pulse" />
        <div className="h-8 bg-border rounded w-48 animate-pulse" />
        <div className="h-4 bg-border rounded w-24 animate-pulse" />
      </div>
    </motion.div>
  );
};

export const KPISkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-soft-light dark:shadow-soft-dark">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card p-4 sm:p-5 min-h-[88px] sm:min-h-[110px] animate-pulse">
            <div className="flex justify-between mb-2">
              <div className="h-3 bg-border rounded w-20" />
              <div className="w-8 h-8 rounded-lg bg-border" />
            </div>
            <div className="h-7 bg-border rounded w-16 mt-4" />
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
      className="rounded-3xl p-6 border border-border bg-card shadow-soft-light dark:shadow-soft-dark"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-border rounded w-48 animate-pulse" />
        <div className="h-64 bg-border rounded animate-pulse" />
      </div>
    </motion.div>
  );
};

export const ActivitySkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 border border-border bg-card shadow-soft-light dark:shadow-soft-dark"
    >
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-border rounded w-48 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-border rounded animate-pulse" />
        ))}
      </div>
    </motion.div>
  );
};
