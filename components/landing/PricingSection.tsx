import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Crown,
  Users,
} from 'lucide-react';

/* ─── Data ─── */
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ElementType;
  iconGradient: string;
  popular?: boolean;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaVariant: 'outline' | 'solid' | 'gradient';
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Pour démarrer sereinement',
    monthlyPrice: 29,
    yearlyPrice: 24,
    icon: Zap,
    iconGradient: 'from-violet-500 to-indigo-500',
    features: [
      { text: '1 artiste', included: true },
      { text: 'Flashs illimités', included: true },
      { text: 'Calendrier & réservations', included: true },
      { text: 'Acomptes Stripe (2% com.)', included: true },
      { text: 'Rappels automatiques', included: true },
      { text: 'Support email', included: true },
      { text: 'Formulaire projet IA', included: false },
      { text: 'Marque blanche', included: false },
    ],
    cta: 'Commencer l\'essai gratuit',
    ctaVariant: 'outline',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les artistes établis',
    monthlyPrice: 49,
    yearlyPrice: 39,
    icon: Sparkles,
    iconGradient: 'from-amber-400 to-orange-500',
    popular: true,
    features: [
      { text: '1 artiste', included: true },
      { text: 'Flashs illimités', included: true },
      { text: 'Calendrier & réservations', included: true },
      { text: 'Acomptes Stripe (0% com.)', included: true },
      { text: 'Rappels automatiques', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Formulaire projet IA', included: true },
      { text: 'Marque blanche', included: false },
    ],
    cta: 'Commencer l\'essai gratuit',
    ctaVariant: 'gradient',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Pour les équipes',
    monthlyPrice: 99,
    yearlyPrice: 79,
    icon: Crown,
    iconGradient: 'from-emerald-400 to-teal-500',
    features: [
      { text: 'Jusqu\'à 3 artistes', included: true },
      { text: 'Flashs illimités', included: true },
      { text: 'Multi-calendriers', included: true },
      { text: 'Acomptes Stripe (0% com.)', included: true },
      { text: 'Rappels automatiques', included: true },
      { text: 'Support prioritaire', included: true },
      { text: 'Formulaire projet IA', included: true },
      { text: 'Marque blanche', included: true },
    ],
    cta: 'Commencer l\'essai gratuit',
    ctaVariant: 'outline',
  },
];

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

/* ─── Toggle Component ─── */
function BillingToggle({ yearly, onChange }: { yearly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-12">
      <span className={`text-sm font-medium transition-colors ${!yearly ? 'text-white' : 'text-zinc-500'}`}>
        Mensuel
      </span>
      <button
        type="button"
        onClick={() => onChange(!yearly)}
        className="relative w-12 h-7 rounded-full bg-white/10 border border-white/10 transition-colors hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        aria-label={yearly ? 'Passer en mensuel' : 'Passer en annuel'}
      >
        <motion.div
          className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-md"
          animate={{ left: yearly ? 24 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      <span className={`text-sm font-medium transition-colors ${yearly ? 'text-white' : 'text-zinc-500'}`}>
        Annuel
      </span>
      {yearly && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2.5 py-0.5"
        >
          -20%
        </motion.span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="tarifs" className="relative py-24 md:py-32 px-4" aria-labelledby="pricing-heading">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <motion.h2
          id="pricing-heading"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4 tracking-tighter"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Tarifs simples, sans surprise
        </motion.h2>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-zinc-400 text-center text-lg max-w-2xl mx-auto mb-8"
        >
          30 jours d'essai gratuit sur tous les plans. Sans carte bancaire.
        </motion.p>

        <BillingToggle yearly={yearly} onChange={setYearly} />

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            return (
              <motion.div
                key={plan.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className={`relative rounded-2xl border p-6 md:p-8 flex flex-col transition-all duration-300 ${
                  plan.popular
                    ? 'border-amber-400/40 bg-gradient-to-b from-amber-400/[0.06] to-transparent shadow-lg shadow-amber-400/5 md:scale-[1.03]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold text-black bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1 rounded-full shadow-md shadow-amber-400/20">
                      Le plus populaire
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.iconGradient} flex items-center justify-center shadow-lg`}>
                      <plan.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-zinc-500">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mt-4">
                    <motion.span
                      key={`${plan.id}-${yearly}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl md:text-5xl font-bold text-white tabular-nums tracking-tight"
                    >
                      {price}€
                    </motion.span>
                    <span className="text-zinc-500 text-sm">/mois</span>
                  </div>
                  {yearly && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-zinc-500 mt-1"
                    >
                      Facturé {price * 12}€/an
                    </motion.p>
                  )}
                </div>

                {/* Features list */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      ) : (
                        <X size={16} className="text-zinc-600 mt-0.5 flex-shrink-0" strokeWidth={2} />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/register"
                  className={`w-full text-center rounded-xl py-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    plan.ctaVariant === 'gradient'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-amber-400/20'
                      : plan.ctaVariant === 'solid'
                      ? 'bg-white text-black hover:bg-zinc-200'
                      : 'border border-white/15 text-white hover:bg-white/5 hover:border-white/25'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-zinc-500 text-sm mt-10 max-w-lg mx-auto"
        >
          Tous les prix sont HT. Les frais Stripe standards s'appliquent en plus (1,5% + 0,25€ par transaction).
          Annulez à tout moment.
        </motion.p>
      </div>
    </section>
  );
}
