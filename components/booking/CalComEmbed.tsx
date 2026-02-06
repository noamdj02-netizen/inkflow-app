'use client';

import React, { useEffect } from 'react';
import Cal from '@calcom/embed-react';

interface CalComEmbedProps {
  calLink: string;
  config?: {
    theme?: 'light' | 'dark' | 'auto';
    layout?: 'month_view' | 'column_view' | 'week_view';
  };
  onBookingSuccess?: () => void;
}

export function CalComEmbed({ calLink, config, onBookingSuccess }: CalComEmbedProps) {

  // Nettoyer le calLink pour extraire juste le username si nécessaire
  const cleanCalLink = React.useMemo(() => {
    if (!calLink) return '';
    let cleaned = calLink.trim();
    // Extraire le username si l'utilisateur a entré l'URL complète
    if (cleaned.includes('cal.com/')) {
      cleaned = cleaned.split('cal.com/')[1]?.split('?')[0]?.split('/')[0] || cleaned;
    }
    // Supprimer les protocoles et domaines
    cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
    return cleaned.toLowerCase();
  }, [calLink]);

  useEffect(() => {
    // Cal.com embed s'initialise automatiquement via le script
    // On peut écouter les événements si nécessaire
    if (typeof window !== 'undefined' && (window as any).Cal) {
      (window as any).Cal('on', {
        action: 'bookingSuccessful',
        callback: () => {
          if (onBookingSuccess) {
            onBookingSuccess();
          }
        },
      });
    }
  }, [onBookingSuccess]);

  if (!cleanCalLink) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>Cal.com n&apos;est pas configuré pour cet artiste.</p>
        <p className="text-xs mt-2">Contactez l&apos;artiste pour réserver.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Cal
        calLink={cleanCalLink}
        config={{
          theme: 'dark',
          layout: 'month_view',
          ...config,
        } as any}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      />
    </div>
  );
}
