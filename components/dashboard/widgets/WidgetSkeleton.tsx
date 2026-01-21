/**
 * Skeleton components for widget loading states
 */

import React from 'react';
import { motion } from 'framer-motion';

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-6 border border-white/10"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-8 bg-white/10 rounded w-32" />
          </div>
        </motion.div>
      ))}
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
