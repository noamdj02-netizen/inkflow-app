/**
 * Recent Activity Widget – SWR cache, ActivitySkeleton, error fallback.
 * Dates formatées uniquement côté client pour éviter Hydration Mismatch.
 */

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, Zap, CheckCircle } from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRecentActivitySWR } from '../../../hooks/useDashboardSWR';
import { ActivitySkeleton, WidgetErrorFallback } from './WidgetSkeleton';
import { ClientOnly, DatePlaceholder } from '../../ClientDate';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'booking':
      return <Calendar className="text-dash-success" size={16} strokeWidth={1.8} />;
    case 'project':
      return <MessageSquare className="text-dash-info" size={16} strokeWidth={1.8} />;
    case 'flash':
      return <Zap className="text-dash-warning" size={16} strokeWidth={1.8} />;
    default:
      return <CheckCircle className="text-foreground-muted" size={16} strokeWidth={1.8} />;
  }
};

export const RecentActivityWidget: React.FC = () => {
  const { activities, loading, error, refresh } = useRecentActivitySWR();

  const handleRetry = useCallback(() => {
    refresh();
  }, [refresh]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Moins d'une heure
    if (now.getTime() - date.getTime() < 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    }
    
    // Aujourd'hui ou hier
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: fr });
    }
    if (isYesterday(date)) {
      return 'Hier';
    }
    
    // Cette semaine
    if (isThisWeek(date)) {
      return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    }
    
    // Plus ancien
    return format(date, 'd MMM', { locale: fr });
  }, []);

  if (loading && activities.length === 0) {
    return <ActivitySkeleton />;
  }

  if (error) {
    return (
      <WidgetErrorFallback
        message="L'activité récente n'a pas pu être chargée."
        onRetry={handleRetry}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 h-full min-h-0 flex flex-col"
    >
      <h3 className="text-sm font-semibold text-foreground mb-3">Activité récente</h3>
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400 text-center py-4">Aucune activité récente</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="mt-0.5 shrink-0">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{activity.title}</p>
                {activity.client && (
                  <p className="text-[11px] text-foreground-muted mt-0.5">{activity.client}</p>
                )}
                <p className="text-[11px] text-foreground-muted mt-0.5 opacity-90">
                  <ClientOnly fallback={<DatePlaceholder />}>{formatDate(activity.date)}</ClientOnly>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};
