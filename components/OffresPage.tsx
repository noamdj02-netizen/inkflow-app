import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageSEO } from './seo/PageSEO';
import { SITE_URL } from '../constants/seo';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Building2, Sparkles } from 'lucide-react';
import { Skeleton } from './common/Skeleton';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
};

/** Skeleton pour la grille de prix. */
const PricingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-6 w-24 rounded-lg bg-white/10 mb-4" />
        <div className="h-10 w-20 rounded-lg bg-white/10 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((j) => (
            <div key={j} className="h-4 w-full rounded bg-white/10" />
          ))}
        </div>
        <div className="h-12 w-full rounded-xl bg-white/10 mt-8" />
      </div>
    ))}
  </div>
);

const OFFERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '29',
    period: '/mois',
    description: 'Pour démarrer',
    features: ['1 artiste', 'Flashs illimités', 'Acomptes Stripe (2%)', 'Support email'],
    cta: 'Commencer',
    href: '/register',
    icon: Zap,
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '49',
    period: '/mois',
    description: 'Pour les établis',
    features: ['Tout du Starter', 'Formulaire projet IA', 'Acomptes Stripe (0%)', 'Agenda synchronisé', 'Support prioritaire'],
    cta: 'Choisir Pro',
    href: '/register',
    icon: Sparkles,
    highlighted: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    price: '99',
    period: '/mois',
    description: 'Pour les équipes',
    features: ['Jusqu\'à 3 artistes', 'Multi-calendriers', 'Dashboard studio', 'Marque blanche'],
    cta: 'Choisir Studio',
    href: '/register',
    icon: Building2,
    highlighted: false,
  },
];

export const OffresPage: React.FC = () => {
  const navigate = useNavigate();
  // Contenu affiché immédiatement (pas de délai) pour fluidité mobile
  const [pricingReady, setPricingReady] = useState(true);

  return (
    <div className="min-h-screen bg-[#02040a] text-white font-sans antialiased overflow-x-hidden relative">
      <PageSEO
        title="Nos Offres | InkFlow"
        description="Découvrez les offres InkFlow : Starter, Pro et Enterprise. Tarifs pour tatoueurs et studios. Essai gratuit."
        canonical="/offres"
        image={`${SITE_URL.replace(/\/$/, '')}/pwa-512x512.png`}
        ogType="website"
      />

      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[#02040a] hero-bg-grid" />
        <div
          className="absolute w-[520px] h-[520px] rounded-full blur-[150px] opacity-[0.10]"
          style={{ top: '-15%', left: '-10%', background: '#1e3a8a' }}
        />
        <div
          className="absolute w-[480px] h-[480px] rounded-full blur-[150px] opacity-[0.10]"
          style={{ bottom: '-12%', right: '-8%', background: '#334155' }}
        />
        <div className="absolute inset-0 hero-vignette" />
      </div>

      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-16 border-b border-white/5 bg-[#02040a]/80 backdrop-blur-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Accueil</span>
        </Link>
        <span className="text-lg font-display font-bold tracking-tight text-white">
          INK<span className="text-zinc-400">FLOW</span>
        </span>
        <Link
          to="/login"
          className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Connexion
        </Link>
      </motion.header>

      <main id="main-content" className="min-h-screen flex flex-col justify-center px-4 md:px-6 pt-24 pb-20 md:pt-24 md:pb-8 relative">
        <div className="max-w-7xl mx-auto w-full">
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-center mb-16 md:mb-20"
          >
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Nos offres
            </motion.h1>
            <motion.p variants={fadeInUp} className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Choisissez la formule adaptée à votre activité. Tarifs détaillés ci-dessous.
            </motion.p>
          </motion.section>

          {/* Grille de prix */}
          <motion.section
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-2xl font-semibold text-white mb-10 text-center">
              Tarifs
            </motion.h2>
            {!pricingReady ? (
              <PricingSkeleton />
            ) : (
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
              >
                {OFFERS.map((offer) => {
                  const Icon = offer.icon;
                  return (
                    <motion.div
                      key={offer.id}
                      variants={fadeInUp}
                      className={`relative rounded-2xl border p-6 md:p-8 flex flex-col ${
                        offer.highlighted
                          ? 'border-amber-500/50 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      {offer.highlighted && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold">
                          Populaire
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-4">
                        <Icon size={22} className="text-amber-400 shrink-0" />
                        <h3 className="text-xl font-semibold text-white">{offer.name}</h3>
                      </div>
                      <div className="mb-2" data-offer-id={offer.id} data-offer-price={offer.price}>
                        <span className="text-3xl md:text-4xl font-bold text-white">{offer.price}€{offer.period || ''}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-6">{offer.description}</p>
                      <ul className="space-y-3 mb-8 flex-1">
                        {offer.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-zinc-300 text-sm">
                            <Check size={16} className="text-emerald-400 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => navigate(offer.href)}
                        className={`w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                          offer.highlighted
                            ? 'bg-amber-400 text-black hover:bg-amber-300'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {offer.cta}
                        <ArrowLeft size={18} className="rotate-180" />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.section>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Retour à l'accueil
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
};
