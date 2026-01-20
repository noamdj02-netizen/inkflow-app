import React from 'react';
import { Clock } from 'lucide-react';
import { FlashManagement } from '../FlashManagement';

export const DashboardFlashs: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
              <Clock className="text-brand-yellow" size={20} />
            </div>
            Mes Flashs
          </h1>
        </div>
        <p className="text-zinc-500 text-sm mt-1">Gérez votre collection de flashs disponibles</p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <FlashManagement />
      </div>
    </div>
  );
};
