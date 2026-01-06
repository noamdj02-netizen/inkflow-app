import React from 'react';
import { PieChart, DollarSign } from 'lucide-react';

export const DashboardFinance: React.FC = () => {
  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <PieChart className="text-amber-400" size={20}/> 
            Finance & Stripe
          </h2>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-slate-800/20 rounded-2xl border border-slate-800 p-12 text-center">
          <DollarSign className="text-slate-600 mx-auto mb-4" size={64} />
          <h3 className="text-2xl font-bold text-white mb-2">Bientôt Disponible</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Le module Finance pour visualiser vos revenus Stripe, vos transactions et vos statistiques financières sera disponible prochainement.
          </p>
        </div>
      </div>
    </>
  );
};

