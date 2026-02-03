/**
 * Page d'abonnement pour les utilisateurs connectés
 * Affiche les plans et permet de créer une session Stripe Checkout
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageSEO } from './seo/PageSEO';
import { SITE_URL } from '../constants/seo';
import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Building2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { PLAN_CONFIG } from '../lib/subscription-utils';
import { toast } from 'sonner';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.04 } },
};

const PLANS = [
  {
    id: 'STARTER' as const,
    ...PLAN_CONFIG.STARTER,
    icon: Zap,
    highlighted: false,
  },
  {
    id: 'PRO' as const,
    ...PLAN_CONFIG.PRO,
    icon: Sparkles,
    highlighted: true,
  },
  {
    id: 'STUDIO' as const,
    ...PLAN_CONFIG.STUDIO,
    icon: Building2,
    highlighted: false,
  },
];

export const SubscribePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: 'STARTER' | 'PRO' | 'STUDIO') => {
    if (!user) {
      toast.error('Vous devez être connecté pour vous abonner');
      navigate('/login');
      return;
    }

    try {
      setLoading(plan);
      setError(null);

      const response = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la session de paiement');
      }

      if (data.url) {
        // Rediriger vers Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout non reçue');
      }
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'Une erreur est survenue');
      toast.error(err.message || 'Impossible de créer la session de paiement');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-white font-sans antialiased overflow-x-hidden relative">
      <PageSEO
        title="Choisissez votre abonnement | InkFlow"
        description="Sélectionnez le plan qui correspond à vos besoins : Starter, Pro ou Studio."
        canonical="/subscribe"
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
      </div>

      {/* Content */}
      <main className="relative z-10 pt-20 pb-24 px-4 md:px-6">
        <motion.section
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-16 md:mb-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Choisissez votre abonnement
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              Accédez à toutes les fonctionnalités d'InkFlow avec un abonnement mensuel.
            </p>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-red-400 font-medium">Erreur</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Pricing Grid */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto"
          >
            {PLANS.map((plan) => {
              const Icon = plan.icon;
              const isCurrentlyLoading = loading === plan.id;

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeInUp}
                  className={`relative rounded-2xl border ${
                    plan.highlighted
                      ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent'
                      : 'border-white/10 bg-white/5'
                  } p-6 md:p-8 flex flex-col`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-amber-500 text-black text-xs font-bold rounded-full">
                      POPULAIRE
                    </div>
                  )}

                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`p-2 rounded-lg ${
                        plan.highlighted ? 'bg-amber-500/20' : 'bg-white/5'
                      }`}
                    >
                      <Icon
                        size={24}
                        className={plan.highlighted ? 'text-amber-400' : 'text-zinc-400'}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}€</span>
                    <span className="text-zinc-400 ml-2">/mois</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check
                          size={18}
                          className={`mt-0.5 flex-shrink-0 ${
                            plan.highlighted ? 'text-amber-400' : 'text-zinc-400'
                          }`}
                        />
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentlyLoading}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {isCurrentlyLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        <span>Chargement...</span>
                      </>
                    ) : (
                      `Choisir ${plan.name}`
                    )}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Footer Note */}
          <motion.div variants={fadeInUp} className="text-center mt-12">
            <p className="text-sm text-zinc-500">
              Tous les plans incluent un essai gratuit de 14 jours. Annulez à tout moment.
            </p>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
};
