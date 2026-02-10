import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQ: FAQItem[] = [
  {
    id: '1',
    question: "Comment fonctionne l'essai gratuit ?",
    answer:
      "Vous créez un compte et avez accès à toutes les fonctionnalités pendant 14 jours. Aucune carte bancaire demandée. À la fin, vous choisissez un abonnement ou votre compte reste en lecture seule.",
  },
  {
    id: '2',
    question: "Puis-je gérer plusieurs artistes ou un studio ?",
    answer:
      "Oui. Un abonnement studio permet plusieurs comptes artistes sous un même espace : calendrier partagé, statistiques globales et facturation centralisée.",
  },
  {
    id: '3',
    question: "Les acomptes passent par Stripe. Qu'est-ce que ça implique ?",
    answer:
      "Les paiements sont sécurisés par Stripe. Vous créez un compte Stripe Connect (gratuit) et vous recevez les acomptes directement sur votre compte, moins les frais Stripe usuels. InkFlow ne prélève aucune commission sur les paiements.",
  },
  {
    id: '4',
    question: "Mes clients peuvent-ils réserver sans compte ?",
    answer:
      "Oui. Vos clients choisissent un créneau et paient l'acompte sans créer de compte InkFlow. Ils reçoivent un lien de confirmation et les rappels par email.",
  },
  {
    id: '5',
    question: "Puis-je importer mon agenda existant ?",
    answer:
      "Pour l'instant, la création des créneaux se fait dans InkFlow. L'import calendrier (Google, iCal) est prévu dans une prochaine mise à jour.",
  },
];

export interface FAQSectionProps {
  faqs?: FAQItem[];
  /** Pour le JSON-LD : URL canonique de la page */
  pageUrl?: string;
  className?: string;
}

/**
 * Section FAQ avec accordéon <details>, micro-animations framer-motion
 * (flèche tourne, contenu se déplie en douceur) et JSON-LD Schema.org FAQPage.
 */
export function FAQSection({ faqs = DEFAULT_FAQ, pageUrl, className = '' }: FAQSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <section className={`relative py-24 md:py-32 px-4 ${className}`} id="faq" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto">
        <h2
          id="faq-heading"
          className="text-4xl md:text-5xl font-bold text-center text-white mb-4 tracking-tighter"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Questions fréquentes
        </h2>
        <p className="text-zinc-400 text-center text-lg mb-12">
          Tout ce que vous devez savoir avant de commencer.
        </p>

        <div className="space-y-3">
          {faqs.map(item => {
            const isOpen = openId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={false}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden"
              >
                <details
                  open={isOpen}
                  onClick={e => e.preventDefault()}
                  className="group"
                >
                  <summary
                    className="list-none cursor-pointer flex items-center justify-between gap-4 px-5 py-4 text-left"
                    onClick={() => setOpenId(prev => (prev === item.id ? null : item.id))}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setOpenId(prev => (prev === item.id ? null : item.id));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-white pr-4">{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex-shrink-0 text-zinc-400"
                    >
                      <ChevronDown size={20} strokeWidth={2} />
                    </motion.span>
                  </summary>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-white/5">
                          {item.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </details>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
