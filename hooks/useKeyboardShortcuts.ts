import { useEffect } from 'react';

export interface UseKeyboardShortcutsOptions {
  /** Ctrl/Cmd + N : ouvrir le QuickAdd (nouveau RDV) */
  onNewRDV?: () => void;
  /** Ctrl/Cmd + D : basculer entre Mes RDV et Mes Disponibilités */
  onToggleAvailability?: () => void;
  /** Échap : fermer tous les modals */
  onEscape?: () => void;
}

/**
 * Raccourcis clavier pour le calendrier :
 * - Ctrl/Cmd + N : Nouveau RDV (QuickAdd)
 * - Ctrl/Cmd + D : Mode disponibilités
 * - Échap : Fermer modals
 */
export function useKeyboardShortcuts({
  onNewRDV,
  onToggleAvailability,
  onEscape,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est dans un input/textarea (sauf Échap)
      const target = e.target as HTMLElement;
      const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? '');
      if (isInput && e.key !== 'Escape') return;

      // Ctrl/Cmd + N : Nouveau RDV
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewRDV?.();
        return;
      }

      // Ctrl/Cmd + D : Mode disponibilités
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        onToggleAvailability?.();
        return;
      }

      // Échap : Fermer modals
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewRDV, onToggleAvailability, onEscape]);
}
