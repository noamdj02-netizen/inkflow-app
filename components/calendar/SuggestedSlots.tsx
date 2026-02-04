/**
 * Affichage des créneaux recommandés (top 5) avec animation et badge "Meilleur créneau".
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useSuggestedSlots } from '../../hooks/useSuggestedSlots';
import type { ClientPreferences, SuggestedSlot } from '../../types/calendar';
import { Skeleton } from '../common/Skeleton';

export interface SuggestedSlotsProps {
  durationMin: number;
  preferences?: ClientPreferences;
  onSelect: (slot: SuggestedSlot) => void;
  className?: string;
}

export function SuggestedSlots({
  durationMin,
  preferences,
  onSelect,
  className = '',
}: SuggestedSlotsProps) {
  const { suggestions, isLoading } = useSuggestedSlots({ durationMin, preferences });

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" aria-hidden />
          Créneaux recommandés
        </h3>
        <div className="grid gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" aria-hidden />
          Créneaux recommandés
        </h3>
        <p className="text-sm text-zinc-500">Aucun créneau disponible pour cette durée.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="font-semibold text-white flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" aria-hidden />
        Créneaux recommandés
      </h3>
      <div className="grid gap-2">
        {suggestions.map((slot, idx) => (
          <motion.button
            key={slot.id}
            type="button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 rounded-xl border-2 border-white/10 hover:border-purple-400/50 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-left transition-colors w-full"
            onClick={() => onSelect(slot)}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-medium text-white">
                  {format(slot.start, 'EEEE d MMMM', { locale: fr })}
                </p>
                <p className="text-sm text-zinc-400">
                  {format(slot.start, 'HH:mm', { locale: fr })} – {format(slot.end, 'HH:mm', { locale: fr })}
                </p>
              </div>
              {idx === 0 && (
                <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  ⭐ Meilleur créneau
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
