import React from 'react';
import { Clock } from 'lucide-react';
import { FlashManagement } from '../FlashManagement';
import { ThemeToggle } from '../ThemeToggle';

export const DashboardFlashs: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 transition-colors duration-300">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 sm:py-4 flex-shrink-0 transition-colors duration-300">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 dark:bg-primary/20 border border-border">
                  <Clock className="text-primary" size={20} />
                </div>
                Mes Flashs
              </h1>
            </div>
            <p className="text-foreground-muted text-sm mt-1">Gérez votre collection de flashs disponibles</p>
          </div>
          <ThemeToggle size="md" variant="outline" />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6">
        <FlashManagement />
      </div>
    </div>
  );
};
