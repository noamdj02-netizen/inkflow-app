/**
 * Modal de résolution de conflits : RDV sur créneaux marqués indisponibles.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { AvailabilityConflict } from '../../types/calendar';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export interface ConflictResolverProps {
  conflicts: AvailabilityConflict[];
  open: boolean;
  onClose: () => void;
  onMarkAsAvailable: (day: number, hour: number) => void;
  onProposeAlternatives?: (conflict: AvailabilityConflict) => void;
}

export function ConflictResolver({
  conflicts,
  open,
  onClose,
  onMarkAsAvailable,
  onProposeAlternatives,
}: ConflictResolverProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
              <span aria-hidden>🔧</span>
              Résolution de conflits
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-500 hover:text-white transition-colors rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto space-y-3">
            <p className="text-sm text-zinc-400 mb-4">
              Ces rendez-vous tombent sur des créneaux actuellement marqués indisponibles. Autorisez le créneau ou proposez une alternative.
            </p>
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {conflict.clientName || 'Client'}
                    </p>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {format(conflict.date, "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {DAY_LABELS[conflict.day]} {conflict.hour}h
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onMarkAsAvailable(conflict.day, conflict.hour)}
                      className="inline-flex items-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition-colors"
                    >
                      <Check size={16} />
                      Autoriser ce créneau
                    </button>
                    {onProposeAlternatives && (
                      <button
                        type="button"
                        onClick={() => onProposeAlternatives(conflict)}
                        className="inline-flex items-center gap-2 min-h-[40px] px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-zinc-300 border border-white/10 hover:bg-white/15 transition-colors"
                      >
                        <RefreshCw size={16} />
                        Proposer alternatives
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
