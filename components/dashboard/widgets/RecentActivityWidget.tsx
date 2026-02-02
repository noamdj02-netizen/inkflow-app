/**
 * Recent Activity Widget – SWR cache, ActivitySkeleton, error fallback.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Zap, CheckCircle } from 'lucide-react';
import { useRecentActivitySWR } from '../../../hooks/useDashboardSWR';
import { ActivitySkeleton, WidgetErrorFallback } from './WidgetSkeleton';

export const RecentActivityWidget: React.FC = () => {
  const { activities, loading, error, refresh } = useRecentActivitySWR();

  if (loading && activities.length === 0) {
    return <ActivitySkeleton />;
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="L'activité récente n'a pas pu être chargée."
        onRetry={() => refresh()}
      />
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="text-emerald-400" size={16} />;
      case 'project':
        return <MessageSquare className="text-cyan-400" size={16} />;
      case 'flash':
        return <Zap className="text-amber-400" size={16} />;
      default:
        return <CheckCircle className="text-zinc-400" size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffHours < 1) return "Il y a moins d'une heure";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10"
    >
      <h3 className="text-sm font-semibold text-white mb-3">Activité récente</h3>
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-4">Aucune activité récente</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{activity.title}</p>
                {activity.client && (
                  <p className="text-[11px] text-zinc-400 mt-0.5">{activity.client}</p>
                )}
                <p className="text-[11px] text-zinc-500 mt-0.5">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
