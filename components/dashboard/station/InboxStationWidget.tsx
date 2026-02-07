/**
 * Widget Station : Inbox – aperçu des 3 derniers messages / demandes.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare } from 'lucide-react';
import { useDashboardData } from '../../../hooks/useDashboardData';

export const InboxStationWidget: React.FC = () => {
  const { loading, pendingProjects, recentBookings } = useDashboardData();

  const inboxItems: { id: string; type: 'demande' | 'résa'; from: string; preview: string; date: string }[] = [];
  pendingProjects.slice(0, 2).forEach((p) => {
    inboxItems.push({
      id: p.id,
      type: 'demande',
      from: p.client_name ?? p.client_email ?? '—',
      preview: `${p.body_part} • ${p.style}`,
      date: new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    });
  });
  recentBookings.slice(0, 1).forEach((b) => {
    inboxItems.push({
      id: b.id,
      type: 'résa',
      from: b.client_name ?? 'Client',
      preview: `Réservation confirmée`,
      date: b.date_debut ? new Date(b.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—',
    });
  });
  const displayItems = inboxItems.slice(0, 3);
  const emptyPlaceholder = displayItems.length === 0 && !loading;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 dark:border-[#262626] bg-white dark:bg-[#121212] p-4 overflow-hidden shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Mail size={16} className="text-slate-500 dark:text-neutral-400" />
        <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">Inbox</h3>
      </div>
      <ul className="space-y-2">
        {loading ? (
          [1, 2, 3].map((i) => (
            <li key={i} className="flex gap-2 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-neutral-700 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-24 bg-slate-200 dark:bg-neutral-700 rounded" />
                <div className="h-2 w-32 bg-slate-200 dark:bg-neutral-700 rounded" />
              </div>
            </li>
          ))
        ) : emptyPlaceholder ? (
          <li className="py-4 text-center text-xs text-slate-500 dark:text-neutral-400">Aucun message récent</li>
        ) : (
          displayItems.map((item) => (
            <li
              key={item.id}
              className="flex gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors cursor-default"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                <MessageSquare size={14} className="text-dash-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-800 dark:text-white truncate">{item.from}</div>
                <div className="text-xs text-slate-500 dark:text-neutral-400 truncate">{item.preview}</div>
                {item.date && <div className="text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">{item.date}</div>}
              </div>
            </li>
          ))
        )}
      </ul>
    </motion.article>
  );
};
