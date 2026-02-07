import React from 'react';

/**
 * Skeleton affiché immédiatement pendant le chargement des sous-routes du dashboard
 * (Overview, Calendar, etc.). Évite un écran vide lors du changement d'onglet.
 */
export const DashboardContentFallback: React.FC = () => (
  <div className="flex flex-col h-full px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6 gap-6 bg-background transition-colors duration-300">
    <div className="h-8 w-48 rounded-lg bg-border animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 rounded-xl bg-border animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
    <div className="flex-1 min-h-[200px] rounded-xl bg-border animate-pulse" />
  </div>
);
