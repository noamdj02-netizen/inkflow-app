import type { Metadata } from 'next';
import { LandingPage } from '@/components/LandingPage';
import { SITE_URL } from '@/constants/seo';
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getWebApplicationSchema,
  getFAQPageSchema,
  getTestimonialsAggregateSchema,
} from '@/lib/schema-markup';

const faqItems = [
  {
    question: "Est-ce une application mobile ou un site web ?",
    answer: "C'est une Web App progressive (PWA). Vous n'avez rien à télécharger sur l'App Store : elle s'installe directement depuis votre navigateur et fonctionne comme une application native sur iPhone et Android.",
  },
  {
    question: "Le système de paiement prend-il une commission ?",
    answer: "InkFlow ne prend aucune commission sur vos tatouages. Nous utilisons Stripe pour sécuriser les acomptes, qui applique ses propres frais bancaires standards (environ 1.4% + 0.25€), mais nous ne touchons rien dessus.",
  },
  {
    question: "Puis-je personnaliser ma vitrine ?",
    answer: "Absolument. Votre vitrine est votre identité. Vous pouvez modifier les couleurs, la disposition des flashs et afficher vos réseaux sociaux pour qu'elle corresponde à votre style artistique.",
  },
  {
    question: "Est-ce que mes clients doivent créer un compte ?",
    answer: "Non, nous avons simplifié le processus au maximum. Vos clients peuvent réserver un flash ou demander un projet sans créer de compte complexe, pour ne pas perdre de conversions.",
  },
  {
    question: "Comment fonctionne la gestion des acomptes ?",
    answer: "C'est automatique. Lors de la réservation, vous pouvez exiger un acompte (ex: 30% ou montant fixe). Le créneau n'est bloqué que lorsque le client a payé. Fini les lapins !",
  },
  {
    question: "Mes données et celles de mes clients sont-elles sécurisées ?",
    answer: "La sécurité est notre priorité. Toutes les données sont chiffrées et nous respectons strictement les normes RGPD. Vos fichiers clients restent privés et vous appartiennent.",
  },
  {
    question: "Puis-je importer ma liste de clients actuelle ?",
    answer: "Oui, nous proposons une fonctionnalité d'importation facile pour ne pas repartir de zéro. Vous retrouverez tout votre historique dès le premier jour.",
  },
  {
    question: "Que se passe-t-il si j'ai un problème technique ?",
    answer: "Notre support est dédié aux tatoueurs. En cas de bug ou de question, vous avez accès à une assistance prioritaire directement depuis votre tableau de bord.",
  },
];

export const metadata: Metadata = {
  title: 'InkFlow — Logiciel de gestion tatoueur & agenda tatouage | Réservation en ligne',
  description: 'Logiciel de gestion tatoueur avec agenda tatouage intégré : réservation en ligne, flashs, paiements et vitrine. Pour artistes et studios.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'InkFlow — Logiciel de gestion tatoueur & agenda tatouage',
    description: 'Logiciel de gestion tatoueur avec agenda tatouage intégré : réservation en ligne, flashs, paiements et vitrine.',
    url: SITE_URL,
    siteName: 'InkFlow',
    images: [`${SITE_URL.replace(/\/$/, '')}/pwa-512x512.png`],
    locale: 'fr_FR',
    type: 'website',
  },
  other: {
    'application/ld+json': JSON.stringify([
      getOrganizationSchema(),
      getWebSiteSchema(),
      getWebApplicationSchema(),
      getFAQPageSchema(faqItems),
      ...(getTestimonialsAggregateSchema(3) ? [getTestimonialsAggregateSchema(3)!] : []),
    ]),
  },
};

export default function HomePage() {
  return <LandingPage />;
}
