import React, { useMemo, useState } from 'react';
import { FlashCard } from './FlashCard';
import type { Flash } from '../../types/supabase';
import type { ArtistVitrine } from '../../hooks/usePublicArtist';
import { PenTool } from 'lucide-react';

export interface FlashGalleryProps {
  flashs: Flash[];
  artist: ArtistVitrine;
  artistSlug: string;
}

/** Unique non-empty styles from flashs, sorted */
function getStyles(flashs: Flash[]): string[] {
  const set = new Set<string>();
  flashs.forEach((f) => {
    if (f.style && f.style.trim()) set.add(f.style.trim());
  });
  return Array.from(set).sort();
}

export function FlashGallery({ flashs, artist, artistSlug }: FlashGalleryProps) {
  const [activeFilter, setActiveFilter] = useState<string>('Tous');

  const styles = useMemo(() => getStyles(flashs), [flashs]);
  const filterOptions = useMemo(
    () => ['Tous', ...styles],
    [styles]
  );

  const filteredFlashs = useMemo(
    () =>
      activeFilter === 'Tous'
        ? flashs
        : flashs.filter((f) => f.style?.trim() === activeFilter),
    [flashs, activeFilter]
  );

  const depositPercentage = artist.deposit_percentage ?? 30;

  return (
    <div>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/5 pb-6">
        <h2
          className="text-2xl text-white/90 italic"
          style={{ fontFamily: 'var(--font-family-vitrine-serif)' }}
        >
          Créations sélectionnées
        </h2>

        {filterOptions.length > 1 && (
          <div
            className="flex p-1 rounded-full border border-white/5 overflow-x-auto max-w-full"
            style={{ backgroundColor: 'rgba(18, 18, 18, 0.5)' }}
            role="tablist"
            aria-label="Filtrer par style"
          >
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-label={`Filtrer par style : ${option}`}
                aria-selected={activeFilter === option}
                onClick={() => setActiveFilter(option)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  activeFilter === option
                    ? 'bg-white text-[#0a0a0a] shadow-lg scale-105'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredFlashs.length === 0 ? (
        <div className="py-20 text-center text-white/40 font-light italic">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <PenTool className="text-zinc-500" size={40} />
          </div>
          <p>Aucune pièce trouvée dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {filteredFlashs.map((flash, index) => {
            const priceEuros = Math.round(flash.prix / 100);
            const depositCentimes =
              flash.deposit_amount ??
              Math.round((flash.prix * depositPercentage) / 100);
            const depositEuros = Math.round(depositCentimes / 100);

            return (
              <FlashCard
                key={flash.id}
                flash={flash}
                artistSlug={artistSlug}
                depositEuros={depositEuros}
                priceEuros={priceEuros}
                priority={index < 2}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
