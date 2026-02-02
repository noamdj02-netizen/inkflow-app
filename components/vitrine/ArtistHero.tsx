import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import type { ArtistVitrine } from '../../hooks/usePublicArtist';

/** Icône TikTok (lucide n'a pas de brand TikTok) */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export interface ArtistHeroProps {
  artist: ArtistVitrine;
  slug: string;
}

/** Normaliser une URL (ajouter https si absent) */
function normalizeUrl(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  return u.startsWith('http') ? u : `https://${u}`;
}

/** Liens sociaux avec URL configurée (pour affichage logos) */
function getSocialLinks(artist: ArtistVitrine): { instagram?: string; tiktok?: string; facebook?: string } {
  let instagram = normalizeUrl(artist.instagram_url);
  if (!instagram && artist.bio_instagram?.trim()) {
    const bio = artist.bio_instagram.trim();
    const atMatch = bio.match(/@([a-zA-Z0-9._]+)/);
    if (atMatch) instagram = `https://instagram.com/${atMatch[1]}`;
    else if (bio.includes('instagram.com')) instagram = bio.startsWith('http') ? bio : `https://${bio}`;
  }
  const tiktok = normalizeUrl(artist.tiktok_url);
  const facebook = normalizeUrl(artist.facebook_url);
  return { instagram: instagram ?? undefined, tiktok: tiktok ?? undefined, facebook: facebook ?? undefined };
}

export function ArtistHero({ artist, slug }: ArtistHeroProps) {
  const socialLinks = getSocialLinks(artist);
  const hasSocialLinks = Boolean(socialLinks.instagram || socialLinks.tiktok || socialLinks.facebook);
  const yearsLabel =
    artist.years_experience != null && Number(artist.years_experience) > 0
      ? `${artist.years_experience}+ ans`
      : null;

  return (
    <div className="flex flex-col items-center text-center vitrine-fonts">
      {/* Avatar with glow */}
      <div className="relative group">
        <div
          className="absolute -inset-1 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"
          style={{
            background: 'linear-gradient(to right, var(--color-ink-accent), #a78bfa)',
          }}
        />
        <div className="relative w-32 h-32 sm:w-48 sm:h-48 rounded-full border-4 border-[#0a0a0a] overflow-hidden shadow-2xl bg-[var(--color-ink-card)]">
          {artist.avatar_url ? (
            <img
              src={artist.avatar_url}
              alt={`Photo de profil de ${artist.nom_studio}, tatoueur${artist.ville ? ` à ${artist.ville}` : ''}`}
              className="w-full h-full object-cover"
              width={192}
              height={192}
              loading="eager"
              decoding="async"
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-4xl sm:text-5xl font-bold text-white">
              {artist.nom_studio?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-4 max-w-2xl">
        <div className="space-y-1">
          <h1
            className="text-6xl sm:text-8xl font-bold tracking-tighter text-white uppercase italic leading-none"
            style={{ fontFamily: 'var(--font-family-vitrine-serif)' }}
          >
            {artist.nom_studio}
          </h1>
          <p
            className="text-sm sm:text-base font-medium tracking-[0.3em] uppercase"
            style={{ color: 'var(--color-ink-accent)' }}
          >
            Tatoueur{artist.ville ? ` • ${artist.ville}` : ''}
          </p>
        </div>

        {artist.bio_instagram && (
          <p className="text-base sm:text-lg font-light leading-relaxed px-4 text-white/60">
            {artist.bio_instagram}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-4 pt-4">
          {artist.rating != null && (
            <>
              <div className="flex flex-col items-center px-6">
                <span className="text-white font-bold text-xl">
                  {Number(artist.rating).toFixed(1)}
                </span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">
                  Note
                </span>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" aria-hidden />
            </>
          )}
          {artist.nb_avis != null && Number(artist.nb_avis) > 0 && (
            <>
              <div className="flex flex-col items-center px-6">
                <span className="text-white font-bold text-xl">{artist.nb_avis}</span>
                <span className="text-white/40 text-[10px] uppercase tracking-widest">
                  Avis
                </span>
              </div>
              <div className="w-px h-10 bg-white/10 hidden sm:block" aria-hidden />
            </>
          )}
          {yearsLabel && (
            <div className="flex flex-col items-center px-6">
              <span className="text-white font-bold text-xl">{yearsLabel}</span>
              <span className="text-white/40 text-[10px] uppercase tracking-widest">
                Exp.
              </span>
            </div>
          )}
        </div>

        {/* CTA principal */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link
            to={slug ? `/${slug}/booking` : '#'}
            className="w-full sm:w-auto px-10 py-4 bg-white text-[#0a0a0a] font-bold rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-xl text-center"
          >
            Réserver maintenant
          </Link>
        </div>

        {/* Liens réseaux sociaux (logos) — sous le bouton Réserver */}
        {hasSocialLinks && (
          <div className="flex items-center justify-center gap-4 pt-6" role="group" aria-label="Réseaux sociaux">
            {socialLinks.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:border-white/20 transition-all hover:scale-110 active:scale-95"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />
              </a>
            )}
            {socialLinks.tiktok && (
              <a
                href={socialLinks.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:border-white/20 transition-all hover:scale-110 active:scale-95"
                aria-label="TikTok"
              >
                <TikTokIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </a>
            )}
            {socialLinks.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/15 hover:border-white/20 transition-all hover:scale-110 active:scale-95"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6 sm:w-7 sm:h-7" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
