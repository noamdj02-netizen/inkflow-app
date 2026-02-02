import React from 'react';
import { PageLoadingFallback } from './PageLoadingFallback';

/**
 * Fallback de chargement pour Suspense. Affiche immédiatement un état de chargement
 * (plus de délai ni d'écran vide) pour éviter tout flash blanc/noir lors de la navigation.
 * Alias de PageLoadingFallback pour compatibilité.
 */
export const DelayedFallback: React.FC = () => <PageLoadingFallback />;
