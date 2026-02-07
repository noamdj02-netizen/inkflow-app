import { useState, useEffect, useCallback } from 'react';

/**
 * Hook pour détecter le statut en ligne / hors ligne.
 * Retourne { isOnline, wasOffline, clearWasOffline } pour afficher un toast "Connexion rétablie" au retour en ligne.
 */
export function useOnlineStatus(): {
  isOnline: boolean;
  wasOffline: boolean;
  clearWasOffline: () => void;
} {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const clearWasOffline = useCallback(() => setWasOffline(false), []);

  return { isOnline, wasOffline, clearWasOffline };
}
