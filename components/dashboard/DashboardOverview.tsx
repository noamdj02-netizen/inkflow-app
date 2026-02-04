/**
 * Dashboard Overview – affichage dynamique, widgets réordonnables par glisser-déposer (long-press).
 */

import React, { Suspense, useState, lazy, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Share2, CheckCircle, X, LayoutDashboard, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  pointerWithin,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardWidgets } from '../../hooks/useDashboardWidgets';
import {
  WidgetSkeleton,
  KPISkeleton,
  ChartSkeleton,
  ActivitySkeleton,
} from './widgets/WidgetSkeleton';
import { WidgetLibraryModal } from './WidgetLibraryModal';
import type { WidgetId } from '../../config/widgetRegistry';
import type { WidgetDefinition } from '../../config/widgetRegistry';

const NextAppointmentWidget = lazy(() =>
  import('./widgets/NextAppointmentWidget').then((m) => ({ default: m.NextAppointmentWidget }))
);
const KPIWidgets = lazy(() =>
  import('./widgets/KPIWidgets').then((m) => ({ default: m.KPIWidgets }))
);
const RevenueChartWidget = lazy(() =>
  import('./widgets/RevenueChartWidget').then((m) => ({ default: m.RevenueChartWidget }))
);
const RecentActivityWidget = lazy(() =>
  import('./widgets/RecentActivityWidget').then((m) => ({ default: m.RecentActivityWidget }))
);
const FlashesPreviewWidget = lazy(() =>
  import('./widgets/FlashesPreviewWidget').then((m) => ({ default: m.FlashesPreviewWidget }))
);
const PendingRequestsWidget = lazy(() =>
  import('./widgets/PendingRequestsWidget').then((m) => ({ default: m.PendingRequestsWidget }))
);
const DayViewWidget = lazy(() =>
  import('./widgets/DayViewWidget').then((m) => ({ default: m.DayViewWidget }))
);
const TopFlashsWidget = lazy(() =>
  import('./widgets/TopFlashsWidget').then((m) => ({ default: m.TopFlashsWidget }))
);
const StockWidget = lazy(() =>
  import('./widgets/StockWidget').then((m) => ({ default: m.StockWidget }))
);
const NewVsRegularWidget = lazy(() =>
  import('./widgets/NewVsRegularWidget').then((m) => ({ default: m.NewVsRegularWidget }))
);
const LastRegisteredWidget = lazy(() =>
  import('./widgets/LastRegisteredWidget').then((m) => ({ default: m.LastRegisteredWidget }))
);
const MonthlyGoalWidget = lazy(() =>
  import('./widgets/MonthlyGoalWidget').then((m) => ({ default: m.MonthlyGoalWidget }))
);
const AverageCartWidget = lazy(() =>
  import('./widgets/AverageCartWidget').then((m) => ({ default: m.AverageCartWidget }))
);

const WIDGET_SKELETONS: Partial<Record<WidgetId, React.ReactNode>> = {
  nextAppointment: <WidgetSkeleton />,
  kpi: <KPISkeleton />,
  revenue: <ChartSkeleton />,
  recentActivity: <ActivitySkeleton />,
  flashes: <WidgetSkeleton />,
  pending: <WidgetSkeleton />,
  dayView: <WidgetSkeleton />,
  topFlashs: <WidgetSkeleton />,
  stock: <WidgetSkeleton />,
  newVsRegular: <WidgetSkeleton />,
  lastRegistered: <WidgetSkeleton />,
  monthlyGoal: <WidgetSkeleton />,
  averageCart: <WidgetSkeleton />,
};

const WIDGET_COMPONENTS: Record<WidgetId, React.LazyExoticComponent<React.FC>> = {
  nextAppointment: NextAppointmentWidget,
  kpi: KPIWidgets,
  revenue: RevenueChartWidget,
  recentActivity: RecentActivityWidget,
  flashes: FlashesPreviewWidget,
  pending: PendingRequestsWidget,
  dayView: DayViewWidget,
  topFlashs: TopFlashsWidget,
  stock: StockWidget,
  newVsRegular: NewVsRegularWidget,
  lastRegistered: LastRegisteredWidget,
  monthlyGoal: MonthlyGoalWidget,
  averageCart: AverageCartWidget,
};

/** Sortable wrapper : long-press (400ms) anywhere on widget to drag, or use grip handle. */
function SortableWidgetItem({
  def,
  colSpanClass,
  Fallback,
}: {
  def: WidgetDefinition;
  colSpanClass: string;
  Fallback: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: def.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const Widget = WIDGET_COMPONENTS[def.id as WidgetId];
  if (!Widget) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`col-span-12 ${colSpanClass} min-w-0 ${isDragging ? 'opacity-80 z-50 shadow-xl' : ''}`}
    >
      <div
        className="relative group rounded-2xl border border-transparent hover:border-white/10 transition-colors min-h-0"
        {...attributes}
        {...listeners}
      >
        <div className="absolute left-2 top-2 z-10 p-1.5 rounded-lg text-zinc-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={18} aria-hidden />
        </div>
        <Suspense fallback={Fallback}>
          <Widget />
        </Suspense>
      </div>
    </div>
  );
}

export const DashboardOverview: React.FC = () => {
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState<number | 'auto'>('auto');
  const {
    activeWidgets,
    activeDefinitions,
    isActive,
    toggleWidget,
    resetToDefault,
    reorderWidgets,
  } = useDashboardWidgets();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 400, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 400, tolerance: 5 },
    })
  );

  const widgetIds = useMemo(() => activeDefinitions.map((d) => d.id), [activeDefinitions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = activeDefinitions.findIndex((d) => d.id === active.id);
    const toIndex = activeDefinitions.findIndex((d) => d.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    reorderWidgets(fromIndex, toIndex);
  };

  // Mesurer la hauteur du header au montage
  React.useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const measureHeader = () => {
      if (isHeaderVisible && header.offsetHeight > 0) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    measureHeader();
    const resizeObserver = new ResizeObserver(measureHeader);
    resizeObserver.observe(header);

    return () => resizeObserver.disconnect();
  }, [isHeaderVisible]);

  // Scroll listener : masquer/afficher le header selon la direction du scroll
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollY = container.scrollTop;
      const scrollThreshold = 30; // Seuil pour éviter les changements trop sensibles

      // Si on est tout en haut, toujours afficher
      if (currentScrollY < scrollThreshold) {
        setIsHeaderVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      // Masquer si on scroll vers le bas, afficher si on remonte
      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
      <motion.header
        ref={headerRef}
        initial={{ opacity: 1 }}
        animate={{
          opacity: isHeaderVisible ? 1 : 0,
          height: isHeaderVisible ? (typeof headerHeight === 'number' ? `${headerHeight}px` : 'auto') : '0px',
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="sticky top-0 flex flex-col gap-2 py-2 px-4 md:flex-row md:gap-0 md:h-14 md:items-center md:justify-between md:py-0 md:px-6 border-b border-white/5 bg-[#0a0a0a] z-10 flex-shrink-0"
        style={{ 
          pointerEvents: isHeaderVisible ? 'auto' : 'none',
          overflow: 'hidden',
        }}
      >
        <div className="shrink-0">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-display font-bold text-white"
          >
            Tableau de Bord
          </motion.h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Maintenez appuyé sur un widget pour le déplacer.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setWidgetModalOpen(true)}
            className="flex items-center gap-2 glass text-zinc-300 px-4 py-2.5 min-h-[44px] md:min-h-0 rounded-xl text-sm font-medium hover:text-white transition-all touch-manipulation"
            aria-label="Personnaliser le tableau de bord"
          >
            <LayoutDashboard size={16} /> Personnaliser
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleShare}
            className="flex items-center gap-2 glass text-zinc-300 px-4 py-2.5 min-h-[44px] md:min-h-0 rounded-xl text-sm font-medium hover:text-white transition-all touch-manipulation"
          >
            <Share2 size={16} /> Partager
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/dashboard/flashs')}
            className="flex items-center gap-2 bg-white text-black px-4 py-2.5 min-h-[44px] md:min-h-0 rounded-xl text-sm font-semibold hover:bg-zinc-100 transition-all touch-manipulation"
          >
            <Plus size={16} /> Nouveau Flash
          </motion.button>
        </div>
      </motion.header>

      <WidgetLibraryModal
        open={widgetModalOpen}
        onClose={() => setWidgetModalOpen(false)}
        activeWidgets={activeWidgets}
        isActive={isActive}
        toggleWidget={toggleWidget}
        resetToDefault={resetToDefault}
      />

      <div 
        ref={scrollContainerRef} 
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-2 md:pt-3 pb-20 md:pb-6"
      >
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
          <SortableContext items={widgetIds} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-12 gap-4 items-start [grid-auto-flow:dense]">
              {activeDefinitions.map((def) => {
                const Fallback = WIDGET_SKELETONS[def.id as WidgetId] ?? <WidgetSkeleton />;
                const colSpanClass =
                  def.colSpan === 4
                    ? 'lg:col-span-4'
                    : def.colSpan === 6
                      ? 'lg:col-span-6'
                      : def.colSpan === 8
                        ? 'lg:col-span-8'
                        : 'lg:col-span-12';

                return (
                  <SortableWidgetItem
                    key={def.id}
                    def={def}
                    colSpanClass={colSpanClass}
                    Fallback={Fallback}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {activeWidgets.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 md:p-12 text-center border border-white/10"
          >
            <p className="text-zinc-400 mb-4">Aucun widget affiché.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWidgetModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors"
            >
              <LayoutDashboard size={16} /> Choisir des widgets
            </motion.button>
          </motion.div>
        )}
      </div>

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
            <button
              onClick={() => setToast(null)}
              className="ml-1 text-zinc-500 hover:text-white transition-colors"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
