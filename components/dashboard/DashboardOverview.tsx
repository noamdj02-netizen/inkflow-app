/**
 * Dashboard Overview Page
 * 
 * Uses React Suspense for streaming data.
 * Each widget loads independently, showing skeletons while data streams in.
 */

import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Share2, CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { NextAppointmentWidget } from './widgets/NextAppointmentWidget';
import { KPIWidgets } from './widgets/KPIWidgets';
import { RevenueChartWidget } from './widgets/RevenueChartWidget';
import { RecentActivityWidget } from './widgets/RecentActivityWidget';
import { WidgetSkeleton, KPISkeleton, ChartSkeleton, ActivitySkeleton } from './widgets/WidgetSkeleton';

export const DashboardOverview: React.FC = () => {
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const handleShare = async () => {
    if (!profile?.slug_profil || typeof window === 'undefined') return;
    
    const url = `${window.location.origin}/${profile.slug_profil}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${profile.nom_studio} - InkFlow`,
          text: `Découvrez mes flashs disponibles`,
          url: url,
        });
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast('Lien copié !');
        setTimeout(() => setToast(null), 3000);
      }
    } catch (err) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(url);
          setToast('Lien copié !');
          setTimeout(() => setToast(null), 3000);
        } catch (clipboardErr) {
          console.error('Failed to copy to clipboard:', clipboardErr);
        }
      }
    }
  };

  return (
    <>
      {/* Header (Desktop only) */}
      <header className="hidden md:flex h-16 border-b border-white/5 bg-[#0a0a0a] items-center justify-between px-6 z-10 flex-shrink-0">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-display font-bold text-white"
        >
          Tableau de Bord
        </motion.h2>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="flex items-center gap-2 glass text-zinc-300 px-4 py-2 rounded-xl text-sm font-medium hover:text-white transition-all"
          >
            <Share2 size={16} /> Partager mon lien
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all"
          >
            <Plus size={16}/> Nouveau Flash
          </motion.button>
        </div>
      </header>

      {/* Content with Suspense for Streaming */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 space-y-6">
        {/* Next Appointment Widget - Streams in first */}
        <Suspense fallback={<WidgetSkeleton />}>
          <NextAppointmentWidget />
        </Suspense>

        {/* KPI Widgets - Stream in parallel */}
        <Suspense fallback={<KPISkeleton />}>
          <KPIWidgets />
        </Suspense>

        {/* Revenue Chart & Recent Activity - Stream in parallel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChartWidget />
          </Suspense>
          <div className="lg:col-span-2">
            <Suspense fallback={<ActivitySkeleton />}>
              <RecentActivityWidget />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl glass text-white flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircle size={16} className="text-emerald-400" />
            <span>{toast}</span>
            <button onClick={() => setToast(null)} className="ml-1 text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
