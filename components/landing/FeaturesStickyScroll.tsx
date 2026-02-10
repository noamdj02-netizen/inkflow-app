import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  User,
  CreditCard,
  CheckCircle,
  Sparkles,
  Heart,
  Eye,
  ShoppingBag,
  Clock,
  Tag,
  ArrowRight,
  Shield,
  Zap,
  Send,
  Phone,
  Mail,
  MapPin,
  FileText,
  BadgeCheck,
  Palette,
  TrendingUp,
  Lock,
} from 'lucide-react';

/* ─── SVG tattoo mini-illustrations ─── */
function DragonSvg() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
      <circle cx="40" cy="40" r="36" className="stroke-violet-500/30" strokeWidth="1" />
      <path d="M25 55c5-20 15-35 30-30-8 3-14 10-16 20 10-8 18-5 20 2-6-2-12 0-15 5 8 2 10 8 8 12-5-2-10-4-14-2" className="stroke-violet-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M35 45c2-5 6-10 12-12" className="stroke-violet-300/50" strokeWidth="1" strokeLinecap="round" />
      <circle cx="52" cy="28" r="1.5" className="fill-violet-400" />
    </svg>
  );
}

function RoseSvg() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
      <circle cx="40" cy="40" r="36" className="stroke-pink-500/30" strokeWidth="1" />
      <path d="M40 20c-3 5-8 8-6 15 3-4 6-5 8-4-2 3-5 7-3 12 3-3 5-5 7-4-1 4-3 8-1 11" className="stroke-pink-400" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M40 20c3 5 8 8 6 15-3-4-6-5-8-4 2 3 5 7 3 12-3-3-5-5-7-4 1 4 3 8 1 11" className="stroke-pink-400" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M36 55c1 5 2 10 4 15M44 55c-1 5-2 10-4 15" className="stroke-emerald-500/60" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 58c3-1 5 0 6 2M48 60c-3-1-5 0-6 2" className="stroke-emerald-500/40" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function AncreSvg() {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full" fill="none">
      <circle cx="40" cy="40" r="36" className="stroke-amber-500/30" strokeWidth="1" />
      <circle cx="40" cy="22" r="5" className="stroke-amber-400" strokeWidth="1.5" />
      <path d="M40 27v33" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28 60c0-10 6-16 12-18" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 60c0-10-6-16-12-18" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 48h14" className="stroke-amber-400" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DemoVitrine() {
  const [hoveredFlash, setHoveredFlash] = useState<number | null>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHoveredFlash(1), 1800);
    const t2 = setTimeout(() => setShowBooking(true), 3000);
    const t3 = setTimeout(() => setShowBooking(false), 5500);
    const t4 = setTimeout(() => setHoveredFlash(null), 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const flashes = [
    { label: 'Dragon Koi', prix: '180€', accent: 'from-violet-500/40 to-violet-900/60', border: 'border-violet-500/20', badge: 'Popular', badgeColor: 'bg-violet-500/20 text-violet-300', svg: <DragonSvg />, views: 234, likes: 47 },
    { label: 'Rose Neo-Trad', prix: '120€', accent: 'from-pink-500/40 to-pink-900/60', border: 'border-pink-500/20', badge: 'Nouveau', badgeColor: 'bg-pink-500/20 text-pink-300', svg: <RoseSvg />, views: 156, likes: 32 },
    { label: 'Ancre Marine', prix: '80€', accent: 'from-amber-500/40 to-amber-900/60', border: 'border-amber-500/20', badge: null, badgeColor: '', svg: <AncreSvg />, views: 89, likes: 18 },
  ];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-violet-900/30 via-zinc-900/95 to-zinc-900/95 aspect-[4/3] p-4 flex flex-col relative"
      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Header with search-like bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="text-white" size={14} />
          </div>
          <div>
            <span className="text-sm font-bold text-white block leading-tight">Ma vitrine Flash</span>
            <span className="text-[10px] text-zinc-500">3 designs disponibles</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="px-2 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-[10px] text-zinc-400 flex items-center gap-1">
            <Eye size={10} /> <span>479</span>
          </div>
          <div className="px-2 py-1 rounded-lg bg-violet-500/20 border border-violet-500/20 text-[10px] text-violet-300 font-medium">
            Partager
          </div>
        </div>
      </div>

      {/* Flash gallery grid */}
      <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
        {flashes.map((flash, i) => (
          <motion.div
            key={flash.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            onMouseEnter={() => setHoveredFlash(i)}
            onMouseLeave={() => setHoveredFlash(null)}
            className={`rounded-xl border ${hoveredFlash === i ? 'border-white/25 scale-[1.02]' : flash.border} bg-gradient-to-br ${flash.accent} p-2 flex flex-col items-center relative group cursor-pointer transition-all duration-300 overflow-hidden`}
          >
            {/* Badge */}
            {flash.badge && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className={`absolute top-1.5 left-1.5 ${flash.badgeColor} text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider z-10`}
              >
                {flash.badge}
              </motion.span>
            )}

            {/* Like button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLiked(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; }); }}
              className="absolute top-1.5 right-1.5 z-10"
            >
              <Heart
                size={12}
                className={`transition-colors ${liked.has(i) ? 'fill-pink-500 text-pink-500' : 'text-white/40 hover:text-pink-400'}`}
              />
            </button>

            {/* Tattoo illustration */}
            <div className="w-full aspect-square rounded-lg bg-black/20 mb-1.5 flex items-center justify-center overflow-hidden relative">
              <div className="w-3/4 h-3/4 opacity-80 group-hover:opacity-100 transition-opacity">
                {flash.svg}
              </div>
              {/* Hover overlay */}
              <motion.div
                initial={false}
                animate={{ opacity: hoveredFlash === i ? 1 : 0 }}
                className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg"
              >
                <span className="text-[9px] text-white font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">Voir détails</span>
              </motion.div>
            </div>

            {/* Info */}
            <span className="text-[10px] font-semibold text-white truncate w-full text-center leading-tight">{flash.label}</span>
            <span className="text-xs font-bold text-white mt-0.5">{flash.prix}</span>

            {/* Stats row */}
            <div className="flex items-center gap-2 mt-1 text-[8px] text-zinc-500">
              <span className="flex items-center gap-0.5"><Eye size={8} />{flash.views}</span>
              <span className="flex items-center gap-0.5"><Heart size={8} />{flash.likes}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="mt-2 flex items-center justify-between"
      >
        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <ShoppingBag size={12} className="text-emerald-400" />
          <span>Réservation instantanée</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-violet-400 font-medium">
          <span>Voir la vitrine</span>
          <ArrowRight size={10} />
        </div>
      </motion.div>

      {/* Floating booking notification */}
      <AnimatePresence>
        {showBooking && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute bottom-12 left-3 right-3 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl p-2.5 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={13} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-white">Nouvelle réservation !</div>
                <div className="text-[9px] text-zinc-500">Marie L. · Rose Neo-Trad · 120€</div>
              </div>
              <span className="text-[8px] text-zinc-600 flex-shrink-0">à l'instant</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DemoCalendrier() {
  const [selectedDay, setSelectedDay] = useState(14);
  const [showSlotPopup, setShowSlotPopup] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSelectedDay(15), 2000);
    const t2 = setTimeout(() => setShowSlotPopup(true), 2800);
    const t3 = setTimeout(() => setShowSlotPopup(false), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const calDays = Array.from({ length: 28 }, (_, i) => i + 1);
  const bookedDays = new Set([3, 7, 8, 12, 14, 15, 19, 21, 22, 25, 27]);
  const fullDays = new Set([8, 22]);

  const todaySlots = [
    { time: '10:00', client: 'Sophie L.', type: 'Flash Rose', color: 'bg-violet-500', confirmed: true },
    { time: '14:00', client: 'Marc D.', type: 'Sleeve bras', color: 'bg-amber-500', confirmed: true },
    { time: '16:30', client: 'Léa R.', type: 'Lettering', color: 'bg-emerald-500', confirmed: false },
  ];

  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-indigo-900/20 via-zinc-900/95 to-zinc-900/95 aspect-[4/3] p-4 flex flex-col"
      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 60px -15px rgba(139, 92, 246, 0.15)' }}
      animate={{ y: [0, 4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Calendar className="text-white" size={14} />
          </div>
          <div>
            <span className="text-sm font-bold text-white block leading-tight">Février 2026</span>
            <span className="text-[10px] text-zinc-500">11 RDV ce mois</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <span className="text-[9px] text-zinc-500">Réservé</span>
          <span className="w-2 h-2 rounded-full bg-zinc-600 ml-1.5" />
          <span className="text-[9px] text-zinc-500">Libre</span>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* Calendar grid */}
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-7 gap-[2px] text-center mb-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="text-[8px] text-zinc-600 font-medium py-0.5">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-[2px] text-center flex-1">
            {/* offset: Feb 2026 starts Sunday => 6 empty slots */}
            {Array(6).fill(null).map((_, i) => <span key={`e${i}`} />)}
            {calDays.map((day) => (
              <motion.button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={`text-[8px] rounded-[4px] flex items-center justify-center aspect-square transition-all duration-200 relative ${
                  day === selectedDay
                    ? 'bg-violet-500 text-white font-bold shadow-lg shadow-violet-500/30'
                    : fullDays.has(day)
                    ? 'bg-red-500/15 text-red-400/80 line-through'
                    : bookedDays.has(day)
                    ? 'bg-violet-500/20 text-violet-300 hover:bg-violet-500/30'
                    : 'text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300'
                }`}
              >
                {day}
                {bookedDays.has(day) && day !== selectedDay && !fullDays.has(day) && (
                  <span className="absolute bottom-[1px] w-1 h-[2px] rounded-full bg-violet-400" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Day detail sidebar */}
        <div className="w-[42%] flex flex-col gap-1.5 border-l border-white/[0.06] pl-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-white">
              {selectedDay} Fév
            </span>
            <span className="text-[8px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full font-medium">
              3 RDV
            </span>
          </div>
          <div className="flex-1 space-y-1 overflow-hidden">
            {todaySlots.map((slot, i) => (
              <motion.div
                key={slot.time}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.35 }}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
              >
                <div className={`w-[3px] h-5 rounded-full ${slot.color} flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-medium text-white truncate">{slot.client}</span>
                    {slot.confirmed ? (
                      <CheckCircle size={8} className="text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Clock size={8} className="text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[7px] text-zinc-500 truncate block">{slot.time} · {slot.type}</span>
                </div>
              </motion.div>
            ))}
          </div>
          {/* Open slot indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="border border-dashed border-emerald-500/30 rounded-lg p-1.5 text-center"
          >
            <span className="text-[8px] text-emerald-400/80">+ Créneau libre 18:00</span>
          </motion.div>
        </div>
      </div>

      {/* Slot booking popup */}
      <AnimatePresence>
        {showSlotPopup && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-3 left-3 right-3 bg-[#1a1a1a] border border-violet-500/30 rounded-xl p-2.5 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar size={13} className="text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-white">Créneau réservé automatiquement</div>
                <div className="text-[9px] text-zinc-500">Dim 15 Fév · 14h00 · Acompte reçu ✓</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DemoClients() {
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setActiveTab('history'), 2500);
    const t2 = setTimeout(() => setShowReminder(true), 4000);
    const t3 = setTimeout(() => setShowReminder(false), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const history = [
    { date: '10 Fév 2026', type: 'Flash Rose Neo-Trad', amount: '120€', status: 'done', color: 'bg-pink-500' },
    { date: '12 Jan 2026', type: 'Projet Bras Droit', amount: '350€', status: 'done', color: 'bg-violet-500' },
    { date: '28 Nov 2025', type: 'Lettering poignet', amount: '80€', status: 'done', color: 'bg-amber-500' },
  ];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/20 via-zinc-900/95 to-zinc-900/95 aspect-[4/3] p-4 flex flex-col relative"
      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <User className="text-white" size={14} />
          </div>
          <span className="text-sm font-bold text-white">Fiche Client</span>
        </div>
        <div className="flex items-center gap-1">
          {['info', 'history'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab as 'info' | 'history')}
              className={`text-[9px] px-2 py-1 rounded-lg font-medium transition-all ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'info' ? 'Profil' : 'Historique'}
            </button>
          ))}
        </div>
      </div>

      {/* Client card */}
      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-2.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/40 to-teal-600/40 flex items-center justify-center text-emerald-300 font-bold text-sm flex-shrink-0 border border-emerald-500/20">
          JD
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white">Julie Dupont</span>
            <BadgeCheck size={11} className="text-emerald-400" />
          </div>
          <div className="text-[9px] text-zinc-500 flex items-center gap-2 mt-0.5">
            <span className="flex items-center gap-0.5"><MapPin size={8} /> Paris 11e</span>
            <span>·</span>
            <span>3 séances</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-bold text-emerald-400">550€</span>
          <span className="text-[8px] text-zinc-600">total</span>
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'info' ? (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col gap-2 min-h-0"
          >
            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {['Fidèle', 'Neo-Trad', 'Bras', 'Floral'].map((tag) => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400">
                  {tag}
                </span>
              ))}
            </div>

            {/* Contact details */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[9px] text-zinc-400">
                <Phone size={9} className="text-zinc-500" />
                <span>06 •• •• •• 42</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-zinc-400">
                <Mail size={9} className="text-zinc-500" />
                <span>julie.d•••@gmail.com</span>
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
              <div className="flex items-center gap-1 mb-1">
                <FileText size={9} className="text-zinc-500" />
                <span className="text-[8px] text-zinc-500 font-medium">Notes</span>
              </div>
              <p className="text-[9px] text-zinc-400 leading-relaxed">
                Peau sensible — préfère séances courtes. Projet manchette florale en cours. Prochaine étape : remplissage couleur.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1.5">
              <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-medium">
                <Send size={9} /> Rappel soins
              </div>
              <div className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px] font-medium">
                <Calendar size={9} /> Nouveau RDV
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col gap-1.5 min-h-0"
          >
            {history.map((item, i) => (
              <motion.div
                key={item.date}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-colors"
              >
                <div className={`w-[3px] h-8 rounded-full ${item.color} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-medium text-white block truncate">{item.type}</span>
                  <span className="text-[8px] text-zinc-500">{item.date}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-semibold text-white">{item.amount}</span>
                  <span className="text-[7px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle size={7} /> Payé
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Total bar */}
            <div className="mt-auto pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[9px] text-zinc-500">Total client</span>
              <span className="text-xs font-bold text-white flex items-center gap-1">
                550€ <TrendingUp size={10} className="text-emerald-400" />
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-reminder toast */}
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute bottom-3 left-3 right-3 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl p-2.5 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Send size={11} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-white">Rappel soins envoyé !</div>
                <div className="text-[9px] text-zinc-500">Julie D. · Instructions post-tattoo · auto</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DemoPaiements() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1500);
    const t2 = setTimeout(() => setStep(2), 3000);
    const t3 = setTimeout(() => setStep(3), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const steps = [
    { label: 'Sélection flash', icon: Palette },
    { label: 'Paiement acompte', icon: CreditCard },
    { label: 'Confirmation', icon: CheckCircle },
  ];

  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-amber-900/15 via-zinc-900/95 to-zinc-900/95 aspect-[4/3] p-4 flex flex-col relative"
      style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      animate={{ y: [0, 5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <CreditCard className="text-white" size={14} />
          </div>
          <div>
            <span className="text-sm font-bold text-white block leading-tight">Paiement sécurisé</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Shield size={8} className="text-emerald-400" /> Stripe Connect
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Lock size={9} className="text-emerald-400" />
          <span className="text-[9px] text-emerald-400 font-medium">SSL</span>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-3">
        {steps.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className={`flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all duration-500 ${
              step >= i ? 'bg-white/[0.08] text-white' : 'text-zinc-600'
            }`}>
              <s.icon size={10} className={step >= i ? (step > i ? 'text-emerald-400' : 'text-amber-400') : 'text-zinc-600'} />
              <span className="text-[8px] font-medium hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-[1px] transition-colors duration-500 ${step > i ? 'bg-emerald-500/40' : 'bg-white/[0.06]'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Payment card area */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-medium">Récapitulatif</span>
            <Tag size={10} className="text-zinc-500" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/30 to-violet-900/30 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <div className="w-6 h-6 opacity-60"><DragonSvg /></div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-semibold text-white block">Dragon Koi — Flash</span>
              <span className="text-[8px] text-zinc-500">Taille M · Bras · ~2h</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white block">180€</span>
              <span className="text-[8px] text-zinc-500">total</span>
            </div>
          </div>
        </motion.div>

        {/* Card form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: step >= 1 ? 1 : 0.4, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="rounded-xl border border-white/[0.08] bg-gradient-to-br from-slate-800/60 to-slate-900/60 p-3 flex-1 flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-2.5">
            <div className="h-6 w-9 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-[6px] text-white font-bold">VISA</span>
            </div>
            <div className="h-6 w-9 rounded bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center opacity-40">
              <span className="text-[6px] text-white font-bold">MC</span>
            </div>
            <span className="text-[9px] text-zinc-500 ml-auto">Carte bancaire</span>
          </div>

          {/* Card number */}
          <div className="rounded-lg bg-black/30 border border-white/[0.06] px-2.5 py-1.5 mb-1.5">
            <motion.span
              className="text-[11px] text-zinc-300 font-mono tracking-widest block"
              initial={{ width: 0 }}
              animate={{ width: 'auto' }}
              transition={{ delay: 1.5, duration: 0.8 }}
            >
              4242 •••• •••• 4242
            </motion.span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-black/30 border border-white/[0.06] px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-400 font-mono">02/28</span>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/[0.06] px-2.5 py-1.5">
              <span className="text-[10px] text-zinc-400 font-mono">•••</span>
            </div>
          </div>
        </motion.div>

        {/* Pay button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className={`rounded-xl py-2 flex items-center justify-center gap-2 transition-all duration-700 ${
            step >= 3
              ? 'bg-emerald-500 border border-emerald-400/50'
              : step >= 2
              ? 'bg-amber-500 animate-pulse border border-amber-400/50'
              : 'bg-white/10 border border-white/[0.08]'
          }`}
        >
          {step >= 3 ? (
            <>
              <CheckCircle size={13} className="text-white" />
              <span className="text-[11px] font-bold text-white">Acompte de 54€ reçu !</span>
            </>
          ) : step >= 2 ? (
            <>
              <Zap size={13} className="text-white" />
              <span className="text-[11px] font-bold text-white">Paiement en cours...</span>
            </>
          ) : (
            <>
              <Lock size={11} className="text-zinc-400" />
              <span className="text-[11px] font-medium text-zinc-400">Payer 54€ d'acompte (30%)</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Success notification */}
      <AnimatePresence>
        {step >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="absolute bottom-12 left-3 right-3 bg-[#1a1a1a] border border-emerald-500/30 rounded-xl p-2.5 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Shield size={13} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-white">RDV confirmé automatiquement</div>
                <div className="text-[9px] text-zinc-500">Créneau bloqué · Rappel SMS programmé</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const FEATURES = [
  {
    id: 'vitrine',
    title: 'Une vitrine qui vend pour vous',
    description:
      "Présentez vos flashs et projets avec une galerie claire. Vos clients choisissent un design, voient le prix et l'acompte, et réservent en quelques clics. Plus besoin d'échanger des dizaines de messages.",
    cta: 'Créer ma vitrine',
    href: '/register',
    image: <DemoVitrine />,
  },
  {
    id: 'calendrier',
    title: 'Calendrier & réservations en temps réel',
    description:
      'Un seul calendrier pour vos créneaux, absences et rendez-vous. Vos clients voient en temps réel les disponibilités et réservent sans vous déranger. Les créneaux se ferment automatiquement.',
    cta: 'Voir le calendrier',
    href: '/register',
    image: <DemoCalendrier />,
  },
  {
    id: 'clients',
    title: 'Gestion clients sans prise de tête',
    description:
      'Fiches clients, historique des rendez-vous et des paiements au même endroit. Envoyez des rappels et des instructions de soins après tatouage. Tout est tracé et professionnel.',
    cta: 'Découvrir le dashboard',
    href: '/register',
    image: <DemoClients />,
  },
  {
    id: 'paiements',
    title: 'Acomptes automatiques via Stripe',
    description:
      "Exigez un acompte en ligne via Stripe. Le créneau n'est confirmé qu'une fois le paiement reçu. Fini les oublis et les annulations de dernière minute. Zéro commission InkFlow.",
    cta: 'En savoir plus',
    href: '/register',
    image: <DemoPaiements />,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export function FeaturesStickyScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const refs = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = refs.indexOf(entry.target as HTMLDivElement);
          if (idx >= 0) setActiveIndex(idx);
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    refs.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setSectionRef = (i: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[i] = el;
  };

  return (
    <section
      id="deep-dive"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4 tracking-tighter"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Fonctionnalités
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-zinc-400 text-center text-lg max-w-2xl mx-auto mb-20"
        >
          Tout ce dont vous avez besoin pour gérer votre studio.
        </motion.p>

        <div
          ref={containerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start"
        >
          <div className="hidden lg:block space-y-32 lg:space-y-48">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                ref={setSectionRef(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="min-h-[50vh] lg:min-h-[60vh] flex flex-col justify-center"
              >
                <span className="text-xs uppercase tracking-widest text-violet-400/80 mb-4">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl">
                  {feature.description}
                </p>
                <Link
                  to={feature.href}
                  className="inline-flex rounded-full border border-white/40 text-white px-6 py-3 text-sm font-medium hover:bg-white/10 hover:border-white/60 transition-colors w-fit"
                >
                  {feature.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="relative lg:sticky lg:top-32 hidden lg:block">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0,
                    scale: activeIndex === i ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={activeIndex === i ? 'absolute inset-0 pointer-events-auto' : 'absolute inset-0 pointer-events-none'}
                >
                  {feature.image}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:hidden space-y-16">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <span className="text-xs uppercase tracking-widest text-violet-400/80 mb-2 block">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="text-xl font-bold text-white mb-3"
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <Link
                    to={feature.href}
                    className="inline-flex rounded-full border border-white/40 text-white px-5 py-2.5 text-sm font-medium hover:bg-white/10"
                  >
                    {feature.cta}
                  </Link>
                </div>
                {feature.image}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
