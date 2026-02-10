import React from 'react';
import { motion } from 'framer-motion';

export interface TestimonialCard {
  id: string;
  quote: string;
  author: string;
  role?: string;
  /** Style de tatouage (ex: "Blackwork", "Realisme") */
  style: string;
  /** URL photo de l'artiste (carrée ou rond) */
  avatarSrc?: string;
  /** Initiales si pas de photo */
  initials?: string;
}

const DEFAULT_TESTIMONIALS: TestimonialCard[] = [
  {
    id: '1',
    quote: 'Enfin un outil qui suit mon rythme. Les acomptes en ligne ont supprimé les no-show.',
    author: 'Léa M.',
    role: 'Tatoueuse',
    style: 'Fine line & minimaliste',
    avatarSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face',
    initials: 'LM',
  },
  {
    id: '2',
    quote: 'Mon agenda et ma vitrine flash au même endroit. Mes clients réservent en 2 clics.',
    author: 'Thomas R.',
    role: 'Studio Lyon',
    style: 'Old school',
    avatarSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    initials: 'TR',
  },
  {
    id: '3',
    quote: 'Les fiches clients et les rappels soins me font gagner des heures chaque semaine.',
    author: 'Julie D.',
    role: 'Tatoueuse',
    style: 'Realisme',
    avatarSrc: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face',
    initials: 'JD',
  },
  {
    id: '4',
    quote: 'Zéro commission InkFlow sur les paiements, ça change tout pour un petit studio.',
    author: 'Marc P.',
    role: 'Artiste indépendant',
    style: 'Blackwork',
    avatarSrc: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face',
    initials: 'MP',
  },
  {
    id: '5',
    quote: 'Interface claire, pas de formation. J\'ai tout configuré en une soirée.',
    author: 'Sophie L.',
    role: 'Tatoueuse',
    style: 'Aquarelle',
    avatarSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face',
    initials: 'SL',
  },
  {
    id: '6',
    quote: 'Les demandes de projet structurées : plus de messages éparpillés sur Instagram.',
    author: 'Nicolas K.',
    role: 'Studio Paris',
    style: 'Japonais',
    avatarSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face',
    initials: 'NK',
  },
];

function TestimonialCardItem({ card }: { card: TestimonialCard }) {
  return (
    <div className="flex-shrink-0 w-[320px] sm:w-[360px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 flex flex-col gap-4 hover:border-white/20 transition-colors">
      <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3 flex-1">&ldquo;{card.quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/40 to-purple-600/40 border border-white/10 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
          {card.avatarSrc ? (
            <img
              src={card.avatarSrc}
              alt={card.author}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          ) : (
            card.initials ?? card.author.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{card.author}</div>
          {card.role && <div className="text-xs text-zinc-500">{card.role}</div>}
          <div className="text-xs text-violet-400/90 font-medium mt-0.5">{card.style}</div>
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({
  cards,
  direction,
  speed = 30,
}: {
  cards: TestimonialCard[];
  direction: 'left' | 'right';
  speed?: number;
}) {
  const duplicated = [...cards, ...cards];
  return (
    <div className="flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-6 py-4"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          x: { repeat: Infinity, duration: speed, ease: 'linear' },
        }}
      >
        {duplicated.map((card, index) => (
          <TestimonialCardItem key={`${card.id}-${index}`} card={card} />
        ))}
      </motion.div>
    </div>
  );
}

export interface TestimonialMarqueeProps {
  testimonials?: TestimonialCard[];
  /** Durée en secondes pour un cycle complet (une rangée) */
  speed?: number;
  className?: string;
}

/**
 * Infinite Scroll Marquee : deux rangées de témoignages,
 * une vers la gauche, une vers la droite. Cartes légères (bg-white/5, backdrop-blur).
 */
export function TestimonialMarquee({
  testimonials = DEFAULT_TESTIMONIALS,
  speed = 30,
  className = '',
}: TestimonialMarqueeProps) {
  const row1 = testimonials.slice(0, Math.ceil(testimonials.length / 2));
  const row2 = testimonials.slice(Math.ceil(testimonials.length / 2));

  return (
    <section className={`relative py-12 md:py-16 overflow-hidden ${className}`} aria-label="Témoignages">
      <div className="space-y-4">
        <MarqueeRow cards={row1.length > 0 ? row1 : testimonials} direction="left" speed={speed} />
        <MarqueeRow cards={row2.length > 0 ? row2 : [...testimonials].reverse()} direction="right" speed={speed + 5} />
      </div>
    </section>
  );
}
