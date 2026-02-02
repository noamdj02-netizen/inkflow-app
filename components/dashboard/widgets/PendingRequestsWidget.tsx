/**
 * Widget "Demandes en attente" – compteur + lien vers la page Demandes.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const PendingRequestsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { pendingProjects, loading } = useDashboardData();
  const count = pendingProjects?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-white/5">
            <MessageSquare size={18} className="text-zinc-300" />
          </div>
          <h3 className="text-sm font-semibold text-white">Demandes en attente</h3>
        </div>
        {count > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
            {count}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          {loading ? (
            <div className="h-8 w-12 bg-white/10 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-display font-bold text-white">{count}</p>
          )}
          <p className="text-xs text-zinc-400 mt-0.5">projets à traiter</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard/requests')}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
        >
          Voir les demandes
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
};
