/**
 * Éditeur de disponibilités en mode "peinture" : grille de créneaux cliquables.
 * Détecte les conflits avec les RDV existants et affiche un toast "Résoudre" + modal ConflictResolver.
 */
import React, { useState, useCallback } from 'react';
import { Check, X, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useDisponibilites } from '../../hooks/useDisponibilites';
import { useSyncAvailability } from '../../hooks/useSyncAvailability';
import { TimeSlot } from './TimeSlot';
import { ConflictResolver } from './ConflictResolver';
import { TemplateManager } from './TemplateManager';
import type { PaintMode } from '../../types/calendar';
import type { DisponibilitesState } from '../../types/calendar';
import { slotKey } from '../../hooks/useDisponibilites';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export interface DisponibilitesEditorProps {
  /** En mode contrôlé, le parent fournit l’état (pour partage avec useSyncAvailability). */
  disponibilites?: DisponibilitesState;
  setSlot?: (day: number, hour: number, isAvailable: boolean) => void;
  toggleSlot?: (day: number, hour: number, paintMode: PaintMode) => void;
  copyWeek?: () => DisponibilitesState;
  pasteWeek?: (template: DisponibilitesState) => void;
  days?: number;
  hourStart?: number;
  hourEnd?: number;
}

export function DisponibilitesEditor(props: DisponibilitesEditorProps = {}) {
  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState<PaintMode>('available');

  const { user } = useAuth();
  const internal = useDisponibilites();
  const {
    disponibilites = internal.disponibilites,
    setSlot = internal.setSlot,
    toggleSlot = internal.toggleSlot,
    copyWeek = internal.copyWeek,
    pasteWeek = internal.pasteWeek,
    days = internal.days,
    hourStart = internal.hourStart,
    hourEnd = internal.hourEnd,
  } = props;

  const isControlled = props.disponibilites !== undefined;
  const sync = useSyncAvailability({
    artistId: user?.id,
    disponibilites,
    setSlot,
    silent: isControlled,
  });

  const handleSlotHover = useCallback(
    (day: number, hour: number) => {
      if (isPainting) toggleSlot(day, hour, paintMode);
    },
    [isPainting, paintMode, toggleSlot]
  );

  const handleCopyWeek = useCallback(() => {
    const template = copyWeek();
    try {
      sessionStorage.setItem('disponibilites_week_template', JSON.stringify(template));
      toast.success('Semaine copiée');
    } catch {
      toast.error('Impossible de copier');
    }
  }, [copyWeek]);

  const handlePasteWeek = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('disponibilites_week_template');
      if (!raw) {
        toast.error('Aucune semaine enregistrée');
        return;
      }
      const template = JSON.parse(raw) as Record<string, boolean | undefined>;
      pasteWeek(template);
      toast.success('Semaine collée');
    } catch {
      toast.error('Impossible de coller');
    }
  }, [pasteWeek]);

  const hours = Array.from({ length: hourEnd - hourStart }, (_, i) => hourStart + i);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPaintMode('available')}
          className={
            'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
            (paintMode === 'available'
              ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10')
          }
        >
          <Check size={16} />
          Disponible
        </button>
        <button
          type="button"
          onClick={() => setPaintMode('blocked')}
          className={
            'min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ' +
            (paintMode === 'blocked'
              ? 'bg-red-500/30 text-red-300 border border-red-400/50'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10')
          }
        >
          <X size={16} />
          Bloqué
        </button>
        <button
          type="button"
          onClick={handleCopyWeek}
          className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-2"
        >
          <Copy size={16} />
          Copier la semaine
        </button>
        <button
          type="button"
          onClick={handlePasteWeek}
          className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Coller la semaine
        </button>
      </div>

      {/* Grille : en-têtes jours */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-8 gap-1 min-w-[320px]">
          <div className="h-8 flex items-center text-xs text-zinc-500 font-medium" />
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center text-xs text-zinc-400 font-medium"
            >
              {label}
            </div>
          ))}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              <div className="h-10 sm:h-12 flex items-center text-xs text-zinc-500 font-mono">
                {hour}h
              </div>
              {Array.from({ length: days }, (_, day) => (
                <TimeSlot
                  key={slotKey(day, hour)}
                  day={day}
                  hour={hour}
                  isAvailable={disponibilites[slotKey(day, hour)] === true}
                  isPainting={isPainting}
                  paintMode={paintMode}
                  onMouseDown={() => setIsPainting(true)}
                  onMouseUp={() => setIsPainting(false)}
                  onMouseEnter={() => handleSlotHover(day, hour)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Cliquez ou faites glisser pour marquer des créneaux comme disponibles (vert) ou bloqués (rouge).
      </p>

      <TemplateManager getCurrentSchedule={copyWeek} applySchedule={pasteWeek} />

      <ConflictResolver
        conflicts={sync.conflicts}
        open={sync.resolverOpen}
        onClose={sync.closeConflictResolver}
        onMarkAsAvailable={sync.markSlotAsAvailable}
        onProposeAlternatives={(conflict) => {
          toast('Proposer des alternatives : à venir', { icon: '🔄' });
        }}
      />
    </div>
  );
}
