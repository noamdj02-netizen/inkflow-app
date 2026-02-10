import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Calendar,
  MessageSquare,
  Clock,
  Users,
  PieChart,
  DollarSign,
  CalendarDays,
  AlertCircle,
  TrendingUp,
  Bell,
  Search,
  ChevronRight,
  Check,
  Star,
  Zap,
  ArrowUpRight,
  Image as ImageIcon,
} from 'lucide-react';

/* ─── helpers ─── */
const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
const revenueData = [1200, 1800, 1450, 2200, 1900, 2840];
const maxRevenue = Math.max(...revenueData);

const appointments = [
  { time: '10:00', name: 'Sophie L.', type: 'Flash Rose', color: 'bg-violet-500', status: 'confirmed' },
  { time: '14:00', name: 'Marc D.', type: 'Sleeve Projet', color: 'bg-amber-500', status: 'confirmed' },
  { time: '16:30', name: 'Léa R.', type: 'Lettering', color: 'bg-emerald-500', status: 'pending' },
];

const activity = [
  { text: 'Nouveau RDV confirmé', sub: 'Sophie L. · Flash Rose', time: 'il y a 12 min', icon: Check, accent: 'text-emerald-400' },
  { text: 'Acompte reçu', sub: '35€ · Stripe', time: 'il y a 1h', icon: DollarSign, accent: 'text-violet-400' },
  { text: 'Nouvelle demande', sub: 'Marc D. · Projet sleeve', time: 'il y a 3h', icon: MessageSquare, accent: 'text-amber-400' },
  { text: 'Flash vendu', sub: 'Dragon Koi · 180€', time: 'il y a 5h', icon: Zap, accent: 'text-pink-400' },
];

const calendarDays = Array.from({ length: 28 }, (_, i) => i + 1);
const bookedDays = new Set([3, 7, 8, 12, 14, 15, 19, 21, 22, 25, 27]);
const todayDay = 14;

const navItems = [
  { icon: LayoutGrid, label: 'Dashboard', active: true },
  { icon: Calendar, label: 'Calendrier' },
  { icon: MessageSquare, label: 'Demandes', badge: 3 },
  { icon: ImageIcon, label: 'Mes Flashs' },
  { icon: Users, label: 'Clients' },
  { icon: PieChart, label: 'Finance' },
];

const kpis = [
  { label: 'Revenus du mois', value: '2 840€', delta: '+18%', icon: DollarSign, color: 'from-emerald-500/20 to-emerald-500/5', iconColor: 'text-emerald-400', deltaColor: 'text-emerald-400' },
  { label: 'RDV à venir', value: '12', delta: '+3', icon: CalendarDays, color: 'from-violet-500/20 to-violet-500/5', iconColor: 'text-violet-400', deltaColor: 'text-violet-400' },
  { label: 'En attente', value: '3', delta: 'urgent', icon: AlertCircle, color: 'from-amber-500/20 to-amber-500/5', iconColor: 'text-amber-400', deltaColor: 'text-amber-400' },
  { label: 'Flashs vendus', value: '24', delta: '+6', icon: Star, color: 'from-pink-500/20 to-pink-500/5', iconColor: 'text-pink-400', deltaColor: 'text-pink-400' },
];

/* ─── Animated counter ─── */
function AnimatedValue({ value, delay = 0 }: { value: string; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <span className="inline-block">
      {show ? (
        <motion.span
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      ) : (
        <span className="opacity-0">{value}</span>
      )}
    </span>
  );
}

/* ─── Notification dot pulse ─── */
function PulseDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
    </span>
  );
}

/* ─── Main Component ─── */
export function DashboardDemo() {
  const [activeNav, setActiveNav] = useState(0);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [notifVisible, setNotifVisible] = useState(false);

  // Simulate a notification appearing
  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // Auto-dismiss notification
  useEffect(() => {
    if (!notifVisible) return;
    const t = setTimeout(() => setNotifVisible(false), 4000);
    return () => clearTimeout(t);
  }, [notifVisible]);

  const handleNavClick = useCallback((i: number) => {
    setActiveNav(i);
  }, []);

  return (
    <div className="flex w-full h-full min-h-[320px] bg-[#0c0c0c] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl select-none">
      {/* ─── Sidebar ─── */}
      <aside className="hidden sm:flex w-[52px] md:w-44 flex-shrink-0 bg-[#080808] border-r border-white/[0.06] flex-col">
        {/* Logo */}
        <div className="h-11 flex items-center px-3 border-b border-white/[0.06]">
          <span className="text-sm font-display font-bold tracking-tight text-white">
            <span className="md:hidden">INK</span>
            <span className="hidden md:inline">INK<span className="text-zinc-500">FLOW</span></span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 space-y-0.5 px-1.5">
          {navItems.map((item, i) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleNavClick(i)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[11px] font-medium transition-all duration-200 relative ${
                activeNav === i
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
              }`}
            >
              <item.icon size={14} strokeWidth={activeNav === i ? 2 : 1.5} />
              <span className="hidden md:inline truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto hidden md:flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-violet-500/20 text-violet-400 text-[9px] font-bold px-1">
                  {item.badge}
                </span>
              )}
              {item.badge && (
                <span className="md:hidden absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>
          ))}
        </nav>

        {/* User avatar */}
        <div className="p-2.5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
              A
            </div>
            <div className="hidden md:block min-w-0">
              <div className="text-[10px] text-white font-medium truncate">Alex T.</div>
              <div className="text-[9px] text-zinc-500 truncate">Studio Paris</div>
            </div>
            <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-11 border-b border-white/[0.06] bg-[#080808]/60 backdrop-blur-sm flex items-center justify-between px-3 md:px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white">Tableau de bord</span>
            <span className="hidden md:inline text-[10px] text-zinc-500">· Mardi 10 Fév</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-zinc-500 text-[10px]">
              <Search size={11} />
              <span>Rechercher...</span>
            </div>
            <button type="button" className="relative p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 transition-colors">
              <Bell size={13} />
              <PulseDot className="absolute -top-0.5 -right-0.5" />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-2.5 md:p-3.5 overflow-hidden">
          <div className="flex flex-col gap-2.5 h-full">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {kpis.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="rounded-xl border border-white/[0.08] bg-gradient-to-b p-2.5 relative overflow-hidden group"
                  style={{ backgroundImage: `linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative flex items-center justify-between mb-1.5">
                    <div className={`w-6 h-6 rounded-lg bg-white/[0.06] flex items-center justify-center ${kpi.iconColor}`}>
                      <kpi.icon size={12} />
                    </div>
                    <span className={`text-[9px] font-semibold ${kpi.deltaColor} flex items-center gap-0.5`}>
                      <TrendingUp size={8} />
                      {kpi.delta}
                    </span>
                  </div>
                  <div className="relative text-sm md:text-base font-bold text-white tabular-nums">
                    <AnimatedValue value={kpi.value} delay={400 + i * 150} />
                  </div>
                  <div className="relative text-[9px] md:text-[10px] text-zinc-500 mt-0.5 truncate">{kpi.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Bottom row: Chart + Calendar + Activity */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 flex-1 min-h-0">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="md:col-span-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-zinc-400 font-medium">Revenus 6 mois</span>
                  <span className="text-[10px] font-semibold text-white flex items-center gap-1">
                    2 840€ <ArrowUpRight size={10} className="text-emerald-400" />
                  </span>
                </div>
                <div className="flex-1 flex items-end gap-[3px] min-h-[48px]">
                  {revenueData.map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1 relative"
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                    >
                      <AnimatePresence>
                        {hoveredBar === i && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-5 text-[8px] font-bold text-white bg-zinc-800 border border-white/10 rounded px-1 py-0.5 whitespace-nowrap z-10"
                          >
                            {v}€
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v / maxRevenue) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.5 + i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className={`w-full rounded-t-sm min-h-[3px] transition-colors duration-200 ${
                          hoveredBar === i
                            ? 'bg-gradient-to-t from-violet-400 to-violet-300'
                            : i === revenueData.length - 1
                            ? 'bg-gradient-to-t from-violet-500/80 to-violet-400/50'
                            : 'bg-gradient-to-t from-violet-500/40 to-violet-400/20'
                        }`}
                      />
                      <span className="text-[7px] text-zinc-600">{months[i]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Mini Calendar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="md:col-span-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium">Février 2026</span>
                  <Calendar size={11} className="text-zinc-500" />
                </div>
                <div className="grid grid-cols-7 gap-[2px] text-center flex-1">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                    <span key={i} className="text-[7px] text-zinc-600 py-0.5">{d}</span>
                  ))}
                  {/* offset: Feb 2026 starts Sunday => 6 empty slots (Mon-based grid) */}
                  <span /><span /><span /><span /><span /><span />
                  {calendarDays.map((day) => (
                    <div
                      key={day}
                      className={`text-[8px] rounded-[3px] flex items-center justify-center aspect-square transition-colors ${
                        day === todayDay
                          ? 'bg-violet-500 text-white font-bold'
                          : bookedDays.has(day)
                          ? 'bg-violet-500/20 text-violet-300'
                          : 'text-zinc-500 hover:bg-white/[0.04]'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Today's Appointments + Activity */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="md:col-span-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 flex flex-col gap-2 overflow-hidden"
              >
                {/* Today's appointments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-zinc-400 font-medium">Aujourd'hui</span>
                    <span className="text-[9px] text-violet-400 flex items-center gap-0.5 cursor-pointer hover:underline">
                      Voir tout <ChevronRight size={9} />
                    </span>
                  </div>
                  <div className="space-y-1">
                    {appointments.map((apt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.1, duration: 0.4 }}
                        className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
                      >
                        <div className={`w-1 h-6 rounded-full ${apt.color} flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-white truncate">{apt.name}</span>
                            {apt.status === 'pending' && (
                              <span className="text-[7px] bg-amber-500/20 text-amber-400 px-1 rounded font-semibold">EN ATTENTE</span>
                            )}
                          </div>
                          <span className="text-[8px] text-zinc-500">{apt.time} · {apt.type}</span>
                        </div>
                        <Clock size={10} className="text-zinc-600 flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Activity feed */}
                <div className="border-t border-white/[0.05] pt-1.5 flex-1 min-h-0">
                  <span className="text-[10px] text-zinc-400 font-medium mb-1 block">Activité récente</span>
                  <div className="space-y-1 overflow-hidden">
                    {activity.slice(0, 3).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + i * 0.12, duration: 0.35 }}
                        className="flex items-start gap-1.5"
                      >
                        <div className={`mt-0.5 ${item.accent}`}>
                          <item.icon size={9} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[9px] text-zinc-300 truncate">{item.text}</div>
                          <div className="text-[8px] text-zinc-600 truncate">{item.sub} · {item.time}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Floating notification toast ─── */}
      <AnimatePresence>
        {notifVisible && (
          <motion.div
            initial={{ opacity: 0, y: 16, x: 16 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-3 right-3 md:bottom-4 md:right-4 bg-[#141414] border border-white/[0.1] rounded-xl p-2.5 shadow-2xl max-w-[200px] z-20"
          >
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Check size={11} className="text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium text-white">Acompte reçu !</div>
                <div className="text-[8px] text-zinc-500 mt-0.5">Sophie L. — 35€ via Stripe</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
