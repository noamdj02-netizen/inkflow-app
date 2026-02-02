/**
 * Widget "Derniers inscrits" – liste des derniers clients.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const LastRegisteredWidget: React.FC = () => {
  const navigate = useNavigate();
  const { recentBookings, loading } = useDashboardData();
  const items = (recentBookings ?? []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-zinc-400" />
          <h3 className="text-sm font-semibold text-white">Derniers inscrits</h3>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard/clients')}
          className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Voir tout
        </button>
      </div>
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-white/10 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-sm text-zinc-500">Aucun client récent</div>
      ) : (
        <ul className="space-y-2">
          {items.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-zinc-400 shrink-0">
                {((b?.client_name ?? 'C').charAt(0) || 'C').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {b.client_name ?? 'Client'}
                </div>
                <div className="text-xs text-zinc-500">
                  {b.date_debut
                    ? new Date(b.date_debut).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : '—'}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};
