import React from 'react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '../common/OptimizedImage';
import type { Flash } from '../../types/supabase';

export interface FlashCardProps {
  flash: Flash;
  artistSlug: string;
  depositEuros: number;
  priceEuros: number;
  priority?: boolean;
  index?: number;
}

function isAvailable(flash: Flash): boolean {
  return (
    flash.statut === 'available' && flash.stock_current < flash.stock_limit
  );
}

export function FlashCard({
  flash,
  artistSlug,
  depositEuros,
  priceEuros,
  priority = false,
  index = 0,
}: FlashCardProps) {
  const available = isAvailable(flash);

  return (
    <div
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-white/5 transition-all duration-500 hover:-translate-y-2 shadow-2xl hover:border-violet-500/30"
      style={{ backgroundColor: 'var(--color-ink-card)' }}
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden relative">
        <OptimizedImage
          src={flash.image_url}
          alt={`Flash tatouage ${flash.title} — design réservable en ligne`}
          className="absolute inset-0 w-full h-full transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, #0a0a0a, transparent 30%, transparent)',
          }}
        />

        {/* Price badge */}
        <div
          className="absolute top-4 right-4 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg text-white"
          style={{
            backgroundColor: 'var(--color-ink-accent)',
            opacity: 0.95,
          }}
        >
          {priceEuros}€
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h3
            className="text-xl text-white/90 group-hover:text-violet-400 transition-colors min-w-0"
            style={{ fontFamily: 'var(--font-family-vitrine-serif)' }}
          >
            {flash.title}
          </h3>
          {flash.style && (
            <span className="text-[10px] uppercase tracking-widest text-white/30 border border-white/10 px-2 py-0.5 rounded shrink-0">
              {flash.style}
            </span>
          )}
        </div>

        {/* CTA by availability */}
        {available ? (
          <div className="pt-2 flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-white/30 text-[10px] uppercase tracking-tighter">
                Acompte
              </span>
              <span className="text-white font-medium">{depositEuros}€</span>
            </div>
            <Link
              to={`/${artistSlug}/booking?flashId=${flash.id}`}
              className="text-xs font-bold px-5 py-2.5 rounded-full transition-all border border-white/10 bg-white/5 text-white hover:bg-white hover:text-[#0a0a0a] hover:border-white"
            >
              Réserver ce flash
            </Link>
          </div>
        ) : (
          <div className="pt-2">
            <Link
              to={`/${artistSlug}/booking`}
              className="block w-full py-3 rounded-xl text-center text-xs font-bold border border-white/10 bg-white/5 text-white hover:bg-white hover:text-[#0a0a0a] transition-all"
            >
              Inspiré par ce projet ?
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
