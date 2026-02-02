import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Redirection unique vers "/" pour les routes inconnues.
 * Évite toute boucle de redirection en n'effectuant la navigation qu'une seule fois.
 */
export const RedirectToHome: React.FC = () => {
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (didRedirect.current) return;
    didRedirect.current = true;
    navigate('/', { replace: true });
  }, [navigate]);

  // Ne rien afficher (même fond que l'app) pour éviter flash blanc
  return (
    <div
      className="min-h-screen w-full"
      style={{ background: '#0a0a0a' }}
      aria-live="polite"
      aria-label="Redirection en cours"
    />
  );
};
