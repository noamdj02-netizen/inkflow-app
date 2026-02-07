import React from 'react';
import { Link } from 'react-router-dom';

export interface BookingCTAProps {
  artistSlug: string;
  isHidden?: boolean;
}

export function BookingCTA({ artistSlug, isHidden }: BookingCTAProps) {
  if (isHidden) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-xs md:hidden"
      aria-label="Réserver une session"
    >
      <Link
        to={`/${artistSlug}/booking`}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-center text-white shadow-2xl transition-all active:scale-95 hover:opacity-95"
        style={{ backgroundColor: 'var(--color-ink-accent)' }}
      >
        <svg
          className="w-5 h-5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Réserver une Session
      </Link>
    </div>
  );
}
