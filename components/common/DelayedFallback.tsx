import React, { useState, useEffect } from 'react';
import { PageLoadingFallback } from './PageLoadingFallback';
import { RouteSkeletonFallback } from './RouteSkeletonFallback';

const SKELETON_DELAY_MS = 400;

/**
 * Fallback Suspense : spinner court puis skeleton pour réduire le sentiment d'attente.
 * Micro-animation fluide entre les pages (skeleton au lieu d'un spinner long).
 */
export const DelayedFallback: React.FC = () => {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  if (!showSkeleton) {
    return <PageLoadingFallback />;
  }
  return <RouteSkeletonFallback />;
};
