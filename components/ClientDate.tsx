'use client';

import React, { useState, useEffect } from 'react';

/**
 * Affiche du contenu uniquement après montage client.
 * Évite les erreurs d'hydratation quand le contenu dépend de `new Date()`, timezone, ou autre logique client.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}

/** Placeholder minimal pour les dates (évite layout shift) */
export function DatePlaceholder() {
  return <span className="inline-block w-14 h-3 bg-border/60 rounded animate-pulse" />;
}
