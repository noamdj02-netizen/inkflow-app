/**
 * Toggle Vue Client (Mes RDV) / Vue Disponibilités (éditeur peinture).
 */
import React from 'react';

export type CalendarViewMode = 'clients' | 'disponibilites';

export interface CalendarModeSwitchProps {
  value: CalendarViewMode;
  onValueChange: (mode: CalendarViewMode) => void;
  className?: string;
}

export function CalendarModeSwitch({ value, onValueChange, className = '' }: CalendarModeSwitchProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`} role="tablist" aria-label="Mode calendrier">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'clients'}
        onClick={() => onValueChange('clients')}
        className={
          'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
          (value === 'clients'
            ? 'bg-white/15 text-white border border-white/20'
            : 'text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10')
        }
      >
        <span aria-hidden>📅</span>
        Mes RDV
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'disponibilites'}
        onClick={() => onValueChange('disponibilites')}
        className={
          'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
          (value === 'disponibilites'
            ? 'bg-white/15 text-white border border-white/20'
            : 'text-zinc-400 border border-white/10 hover:text-white hover:bg-white/10')
        }
      >
        <span aria-hidden>⚙️</span>
        Mes Disponibilités
      </button>
    </div>
  );
}
