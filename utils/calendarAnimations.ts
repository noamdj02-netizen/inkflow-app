/**
 * Animations calendrier : confettis (succès), shake (erreur).
 */
import confetti from 'canvas-confetti';

/** Lance des confettis lors d’un ajout de RDV réussi. */
export function celebrateAppointment(): void {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
}

/** Anime un élément avec un shake horizontal (en cas d’erreur). */
export function shakeElement(elementRef: { current?: HTMLElement | null } | null): void {
  const el = elementRef?.current;
  if (!el) return;
  el.animate(
    [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' },
    ],
    { duration: 400, easing: 'ease-in-out' }
  );
}
