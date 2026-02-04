/**
 * Hook pour l’état des créneaux "peints" (disponible / bloqué) par jour et heure.
 * Clé : `${day}-${hour}` avec day 0–6 (Lun–Dim), hour 8–20.
 * État en mémoire ; persistance optionnelle (localStorage ou API à brancher).
 */
import { useState, useCallback } from 'react';
import type { DisponibilitesState } from '../types/calendar';

const DAYS = 7;
const HOUR_START = 8;
const HOUR_END = 20;

export function slotKey(day: number, hour: number): string {
  return `${day}-${hour}`;
}

export function useDisponibilites() {
  const [disponibilites, setDisponibilites] = useState<DisponibilitesState>({});

  const setSlot = useCallback((day: number, hour: number, isAvailable: boolean) => {
    setDisponibilites((prev) => ({ ...prev, [slotKey(day, hour)]: isAvailable }));
  }, []);

  const toggleSlot = useCallback((day: number, hour: number, paintMode: 'available' | 'blocked') => {
    const value = paintMode === 'available';
    setDisponibilites((prev) => ({ ...prev, [slotKey(day, hour)]: value }));
  }, []);

  /** Retourne une copie de la semaine courante (pour "Copier la semaine"). */
  const copyWeek = useCallback(() => {
    return { ...disponibilites };
  }, [disponibilites]);

  /** Enregistre la semaine copiée comme nouveau modèle (écrase l’état actuel). */
  const pasteWeek = useCallback((template: DisponibilitesState) => {
    setDisponibilites({ ...template });
  }, []);

  return {
    disponibilites,
    setSlot,
    toggleSlot,
    copyWeek,
    pasteWeek,
    loading: false,
    days: DAYS,
    hourStart: HOUR_START,
    hourEnd: HOUR_END,
  };
}
