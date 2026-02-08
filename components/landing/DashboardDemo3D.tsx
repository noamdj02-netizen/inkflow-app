import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  MessageSquare,
  Clock,
  Users,
  PieChart,
  Settings,
  DollarSign,
  CalendarDays,
  AlertCircle,
  TrendingUp,
  Share2,
  Plus,
} from 'lucide-react';

/**
 * Mini dashboard UI for landing hero – client-side demo with 3D container.
 * Mirrors the real dashboard layout: sidebar + header + KPI cards + chart area.
 */
export function DashboardDemo3D() {
  const kpis = [
    { label: 'Revenus du mois', value: '2 840€', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'RDV à venir', value: '12', icon: CalendarDays, color: 'text-violet-400' },
    { label: 'En attente', value: '3', icon: AlertCircle, color: 'text-amber-400' },
  ];

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard' },
    { icon: Calendar, label: 'Calendrier' },
    { icon: MessageSquare, label: 'Demandes' },
    { icon: Clock, label: 'Mes Flashs' },
    { icon: Users, label: 'Clients' },
    { icon: PieChart, label: 'Finance' },
  ];

  // Mini sparkline data (static)
  const sparkData = [1200, 1800, 1400, 2200, 1900, 2840];

  return (
    <div className="flex w-full h-full min-h-[280px] bg-[#0d0d0d] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Sidebar */}
      <aside className="w-14 sm:w-16 flex-shrink-0 bg-[#0a0a0a] border-r border-white/5 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <span className="text-sm font-bold tracking-tight text-white">INK</span>
        </div>
        <div className="flex-1 py-2 space-y-0.5">
          {navItems.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 mx-1.5 rounded-lg text-xs ${
                i === 0 ? 'bg-white/10 text-white' : 'text-zinc-500'
              }`}
            >
              <item.icon size={14} />
              <span className="hidden sm:inline truncate">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="p-2 border-t border-white/5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-700 flex items-center justify-center text-xs font-bold text-white mx-1.5">
            A
          </div>
          <div className="mt-1.5 mx-1.5 w-2 h-2 rounded-full bg-emerald-400" title="En ligne" />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-10 sm:h-12 border-b border-white/5 bg-[#0a0a0a]/80 flex items-center justify-between px-3 sm:px-4 flex-shrink-0">
          <span className="text-sm font-bold text-white">Tableau de Bord</span>
          <div className="flex gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 text-zinc-400 text-xs">
              <Share2 size={12} /> <span className="hidden sm:inline">Partager</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white text-black text-xs font-semibold">
              <Plus size={12} /> <span className="hidden sm:inline">Flash</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-3 sm:p-4 overflow-hidden space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {kpis.map((kpi) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-xl border border-white/10 bg-white/5 p-2.5 sm:p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <kpi.icon size={14} className={kpi.color} />
                  <TrendingUp size={10} className="text-emerald-400/70" />
                </div>
                <div className={`text-base sm:text-lg font-bold text-white ${kpis.indexOf(kpi) === 0 ? 'tabular-nums' : ''}`}>
                  {kpi.value}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-500 truncate">{kpi.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Chart + Activity row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 flex-1 min-h-0">
            {/* Chart placeholder */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="sm:col-span-2 rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500">Revenus</span>
                <span className="text-xs font-semibold text-white">2 840€</span>
              </div>
              <div className="flex-1 min-h-[60px] flex items-end gap-0.5">
                {sparkData.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${(v / 3000) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.05 }}
                    className="flex-1 rounded-t bg-gradient-to-t from-violet-500/60 to-violet-400/30 min-h-[4px]"
                  />
                ))}
              </div>
            </motion.div>

            {/* Activity */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="text-xs text-zinc-500 mb-2">Prochain RDV</div>
              <div className="space-y-1.5">
                {['Lun 14h · Flash', 'Mar 10h · Projet'].map((t, i) => (
                  <div key={i} className="text-xs text-white truncate py-1 border-b border-white/5 last:border-0">
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
