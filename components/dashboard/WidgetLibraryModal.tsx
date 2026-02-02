/**
 * Widget Store – modal style Linear / Apple Control Center.
 * Onglets par catégorie, cartes avec icône / titre / description, switch "Ajouter au Dashboard".
 * Onglet Apparence : intensité du fond et couleurs des néons.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, RotateCcw, Palette } from 'lucide-react';
import type { WidgetId } from '../../hooks/useDashboardWidgets';
import {
  WIDGET_CATEGORIES,
  getWidgetsByCategory,
  type WidgetCategoryId,
} from '../../config/widgetRegistry';
import { WidgetCard } from './WidgetCard';
import { useDashboardAppearance } from '../../contexts/DashboardAppearanceContext';

type TabId = WidgetCategoryId | 'appearance';

type Props = {
  open: boolean;
  onClose: () => void;
  activeWidgets: WidgetId[];
  isActive: (id: WidgetId) => boolean;
  toggleWidget: (id: WidgetId) => void;
  resetToDefault: () => void;
};

export const WidgetLibraryModal: React.FC<Props> = ({
  open,
  onClose,
  activeWidgets,
  isActive,
  toggleWidget,
  resetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('appearance');
  const appearance = useDashboardAppearance();

  const categories = [...WIDGET_CATEGORIES].sort((a, b) => a.order - b.order);
  const widgetsInTab = activeTab === 'appearance' ? [] : getWidgetsByCategory(activeTab as WidgetCategoryId);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="widget-store-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,520px)] max-h-[88vh] flex flex-col bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl z-[81] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <LayoutGrid size={18} className="text-zinc-400" />
                </div>
                <div>
                  <h2 id="widget-store-title" className="text-base font-display font-bold text-white">
                    Widget Store
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {activeWidgets.length} widget{activeWidgets.length !== 1 ? 's' : ''} actif{activeWidgets.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs — Apparence en premier pour que les couleurs néon soient visibles tout de suite */}
            <div className="flex gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-hide flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Palette size={16} />
                Apparence
              </button>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'bg-white/10 text-white'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={16} />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Content: widgets grid or appearance panel */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {activeTab === 'appearance' ? (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  <p className="text-sm text-zinc-400 mb-4">
                    Changez les couleurs des néons du fond du dashboard (bleu / gris) quand vous voulez.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Intensité des néons
                    </label>
                    <input
                      type="range"
                      min={0.05}
                      max={0.25}
                      step={0.01}
                      value={appearance.appearance.glowIntensity}
                      onChange={(e) => appearance.setGlowIntensity(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-white/10 accent-amber-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {Math.round(appearance.appearance.glowIntensity * 100)} % (néons)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Voile (lisibilité du texte)
                    </label>
                    <input
                      type="range"
                      min={0.2}
                      max={0.6}
                      step={0.05}
                      value={appearance.appearance.overlayOpacity}
                      onChange={(e) => appearance.setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none bg-white/10 accent-amber-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {Math.round(appearance.appearance.overlayOpacity * 100)} %
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Néon haut gauche (bleu par défaut)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={appearance.appearance.glowLeftColor}
                        onChange={(e) => appearance.setGlowLeftColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                        title="Choisir la couleur du néon haut gauche"
                      />
                      <input
                        type="text"
                        value={appearance.appearance.glowLeftColor}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const v = raw.startsWith('#') ? raw : `#${raw}`;
                          if (/^#[0-9A-Fa-f]{6}$/.test(v)) appearance.setGlowLeftColor(v);
                        }}
                        placeholder="#0891b2"
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Néon bas droite (gris / violet par défaut)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={appearance.appearance.glowRightColor}
                        onChange={(e) => appearance.setGlowRightColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-white/10 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={appearance.appearance.glowRightColor}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const v = raw.startsWith('#') ? raw : `#${raw}`;
                          if (/^#[0-9A-Fa-f]{6}$/.test(v)) appearance.setGlowRightColor(v);
                        }}
                        placeholder="#4f46e5"
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={appearance.resetToDefault}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <RotateCcw size={16} />
                    Réinitialiser l&apos;apparence
                  </button>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {widgetsInTab.map((widget) => (
                      <WidgetCard
                        key={widget.id}
                        icon={widget.icon}
                        title={widget.title}
                        description={widget.description}
                        active={isActive(widget.id as WidgetId)}
                        onToggle={() => toggleWidget(widget.id as WidgetId)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
              {activeTab !== 'appearance' && widgetsInTab.length === 0 && (
                <div className="py-12 text-center text-sm text-zinc-500">
                  Aucun widget dans cette catégorie.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-white/5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  resetToDefault();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <RotateCcw size={16} />
                Réinitialiser par défaut
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
