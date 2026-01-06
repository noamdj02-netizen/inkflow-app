import React from 'react';
import { FlashManagement } from '../FlashManagement';

export const DashboardFlashs: React.FC = () => {
  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            Mes Flashs
          </h2>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <FlashManagement />
      </div>
    </>
  );
};

