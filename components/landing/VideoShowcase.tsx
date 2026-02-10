import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

export interface VideoShowcaseProps {
  /** URL de la vidéo (fichier local ou YouTube/Vimeo embed) */
  videoSrc?: string;
  /** Type: 'local' | 'youtube' | 'vimeo' */
  videoType?: 'local' | 'youtube' | 'vimeo';
  /** Image poster (thumbnail) haute qualité */
  posterSrc: string;
  /** Texte alternatif pour le poster */
  posterAlt?: string;
  /** Titre pour l'accessibilité */
  title?: string;
  /** Classe CSS additionnelle sur le conteneur */
  className?: string;
}

const defaultPoster = new URL('../dashboard.png', import.meta.url).href;

/**
 * Showcase vidéo : conteneur 16:9, coins arrondis, bordure subtile, ombre glow.
 * Affiche un poster avec bouton Play (glassmorphism), au clic lance la vidéo.
 * Lazy-loading pour ne pas ralentir le chargement initial.
 */
export function VideoShowcase({
  videoSrc,
  videoType = 'local',
  posterSrc = defaultPoster,
  posterAlt = 'Aperçu du dashboard InkFlow',
  title = 'Démonstration InkFlow',
  className = '',
}: VideoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // YouTube: extraire l'ID et construire l'URL embed sans contrôles intrusifs (controls=0 possible, ou on garde pour UX)
  const getEmbedUrl = () => {
    if (!videoSrc) return '';
    if (videoType === 'youtube') {
      const id = videoSrc.includes('v=')
        ? new URL(videoSrc).searchParams.get('v')
        : videoSrc.split('/').pop()?.replace('watch?', '');
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : '';
    }
    if (videoType === 'vimeo') {
      const id = videoSrc.split('/').pop();
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : '';
    }
    return videoSrc;
  };

  const embedUrl = getEmbedUrl();
  const hasVideo = (videoType === 'local' && videoSrc) || (videoType !== 'local' && embedUrl);

  return (
    <div
      className={`relative w-full aspect-video rounded-3xl border border-white/10 overflow-hidden bg-[#0d0d0d] ${className}`}
      style={{
        boxShadow: '0 0 80px -20px rgba(99, 102, 241, 0.35), 0 0 40px -20px rgba(139, 92, 246, 0.2)',
      }}
    >
      <AnimatePresence mode="wait">
        {!isPlaying ? (
          <motion.div
            key="poster"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative w-full h-full cursor-pointer group"
            onClick={hasVideo ? handlePlay : undefined}
            role={hasVideo ? 'button' : undefined}
            tabIndex={hasVideo ? 0 : undefined}
            onKeyDown={e => hasVideo && (e.key === 'Enter' || e.key === ' ') && handlePlay()}
            aria-label={hasVideo ? 'Lancer la démonstration vidéo' : undefined}
          >
            <img
              src={posterSrc}
              alt={posterAlt}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              onLoad={() => setIsLoaded(true)}
            />
            {!isLoaded && (
              <div className="absolute inset-0 bg-zinc-900/80 animate-pulse" />
            )}
            {hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <motion.div
                  className="flex items-center justify-center w-20 h-20 rounded-full border-2 border-white/40 bg-white/10 backdrop-blur-md shadow-xl"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Play className="w-10 h-10 text-white ml-1" fill="currentColor" stroke="none" />
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            {videoType === 'local' && videoSrc ? (
              <video
                src={videoSrc}
                title={title}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onEnded={handleClose}
              />
            ) : (
              <iframe
                src={embedUrl}
                title={title}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 text-xs font-medium hover:bg-black/80 transition-colors"
              aria-label="Fermer la vidéo"
            >
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
