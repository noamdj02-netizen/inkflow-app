'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import dashboardImage from '../dashboard.png';

const FEATURES = [
  {
    id: 'vitrine',
    title: 'Une vitrine qui vend pour vous',
    description:
      'Présentez vos flashs et projets avec une galerie claire. Vos clients choisissent un design, voient le prix et l\'acompte, et réservent en quelques clics. Plus besoin d\'échanger des dizaines de messages.',
    cta: 'Créer ma vitrine',
    href: '/register',
    image: (
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-violet-900/30 via-zinc-900/80 to-zinc-900/80 aspect-[4/3] flex items-center justify-center">
        <div className="text-zinc-400 text-sm text-center px-6">
          Galerie Flashs — Vitrine personnalisable
        </div>
      </div>
    ),
  },
  {
    id: 'calendrier',
    title: 'Calendrier & réservations en temps réel',
    description:
      'Un seul calendrier pour vos créneaux, absences et rendez-vous. Vos clients voient en temps réel les disponibilités et réservent sans vous déranger. Les créneaux se ferment automatiquement.',
    cta: 'Voir le calendrier',
    href: '/register',
    image: (
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] aspect-[4/3] shadow-2xl shadow-violet-500/10">
        <Image
          src={dashboardImage}
          alt="Calendrier InkFlow"
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 100vw, 600px"
        />
      </div>
    ),
  },
  {
    id: 'clients',
    title: 'Gestion clients sans prise de tête',
    description:
      'Fiches clients, historique des rendez-vous et des paiements au même endroit. Envoyez des rappels et des instructions de soins après tatouage. Tout est tracé et professionnel.',
    cta: 'Découvrir le dashboard',
    href: '/register',
    image: (
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/20 via-zinc-900/80 to-zinc-900/80 aspect-[4/3] flex items-center justify-center">
        <div className="text-zinc-400 text-sm text-center px-6">
          Fiche client — Historique & soins
        </div>
      </div>
    ),
  },
  {
    id: 'paiements',
    title: 'Acomptes automatiques via Stripe',
    description:
      'Exigez un acompte en ligne via Stripe. Le créneau n\'est confirmé qu\'une fois le paiement reçu. Fini les oublis et les annulations de dernière minute. Zéro commission InkFlow.',
    cta: 'En savoir plus',
    href: '/register',
    image: (
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-amber-900/20 via-zinc-900/80 to-zinc-900/80 aspect-[4/3] flex items-center justify-center">
        <div className="text-zinc-400 text-sm text-center px-6">
          Paiements sécurisés — Stripe
        </div>
      </div>
    ),
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export function FeaturesStickyScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = FEATURES.map(() => useRef<HTMLDivElement>(null));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = sectionRefs.findIndex((r) => r.current === entry.target);
          if (idx >= 0) setActiveIndex(idx);
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    sectionRefs.forEach(({ current }) => current && observer.observe(current));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="deep-dive"
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4">
        <motion.h2
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4 tracking-tighter"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Fonctionnalités
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-zinc-400 text-center text-lg max-w-2xl mx-auto mb-20"
        >
          Tout ce dont vous avez besoin pour gérer votre studio.
        </motion.p>

        {/* Sticky Scroll Layout : texte à gauche, image fixe à droite */}
        <div
          ref={containerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start"
        >
          {/* Colonne gauche : texte défilant (desktop only) */}
          <div className="hidden lg:block space-y-32 lg:space-y-48">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                ref={sectionRefs[i]}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-100px' }}
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="min-h-[50vh] lg:min-h-[60vh] flex flex-col justify-center"
              >
                <span className="text-xs uppercase tracking-widest text-violet-400/80 mb-4">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3
                  className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 tracking-tight"
                  style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                >
                  {feature.title}
                </h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-xl">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="inline-flex rounded-full border border-white/40 text-white px-6 py-3 text-sm font-medium hover:bg-white/10 hover:border-white/60 transition-colors w-fit"
                >
                  {feature.cta}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Colonne droite : image sticky avec transition douce */}
          <div className="relative lg:sticky lg:top-32 hidden lg:block">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0,
                    scale: activeIndex === i ? 1 : 0.98,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className={`absolute inset-0 ${activeIndex === i ? 'pointer-events-auto' : 'pointer-events-none'}`}
                >
                  {feature.image}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile : une carte par feature (texte + image) */}
          <div className="lg:hidden space-y-16">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <span className="text-xs uppercase tracking-widest text-violet-400/80 mb-2 block">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3
                    className="text-xl font-bold text-white mb-3"
                    style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 text-base leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  <Link
                    href={feature.href}
                    className="inline-flex rounded-full border border-white/40 text-white px-5 py-2.5 text-sm font-medium hover:bg-white/10"
                  >
                    {feature.cta}
                  </Link>
                </div>
                {feature.image}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
