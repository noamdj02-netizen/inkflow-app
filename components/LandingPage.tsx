import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Calendar,
  CreditCard,
  UserCheck,
  Menu,
  X,
} from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { HeroSection } from './landing/HeroSection';
import { FeaturesStickyScroll } from './landing/FeaturesStickyScroll';
import { TestimonialMarquee } from './landing/TestimonialMarquee';
import { PricingSection } from './landing/PricingSection';
import { FAQSection } from './landing/FAQSection';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

interface LandingPageProps {
  onNavigate?: (view: string) => void;
}

function LandingContent() {
  const sectionRef1 = useRef<HTMLDivElement>(null);
  const sectionRefCta = useRef<HTMLDivElement>(null);
  const inView1 = useInView(sectionRef1, { once: true, margin: '-80px' });
  const inViewCta = useInView(sectionRefCta, { once: true, margin: '-80px' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold tracking-tight text-white">
              INK<span className="text-zinc-500">FLOW</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#solution" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Pourquoi InkFlow
            </a>
            <a href="#deep-dive" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Fonctionnalités
            </a>
            <a href="#temoignages" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Témoignages
            </a>
            <a href="#tarifs" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Tarifs
            </a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
          <button
            type="button"
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 px-4 py-4 flex flex-col gap-3">
            <a href="#solution" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Pourquoi InkFlow
            </a>
            <a href="#deep-dive" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Fonctionnalités
            </a>
            <a href="#temoignages" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Témoignages
            </a>
            <a href="#tarifs" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Tarifs
            </a>
            <a href="#faq" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </a>
            <Link to="/login" className="text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Se connecter
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-white text-black px-5 py-2.5 text-center font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              Commencer gratuitement
            </Link>
          </div>
        )}
      </nav>

      <HeroSection />

      <section
        id="solution"
        ref={sectionRef1}
        className="relative pt-24 pb-20 md:pt-28 md:pb-28 px-4"
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial="hidden"
            animate={inView1 ? 'visible' : 'hidden'}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-center text-white mb-4 tracking-tighter"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Domptez votre quotidien
          </motion.h2>
          <motion.p
            initial="hidden"
            animate={inView1 ? 'visible' : 'hidden'}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-zinc-400 text-center text-lg max-w-2xl mx-auto mb-16"
          >
            Trois piliers pour reprendre le contrôle de votre planning et de vos revenus.
          </motion.p>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={inView1 ? 'visible' : 'hidden'}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {[
              { icon: Calendar, title: 'Agenda synchronisé', text: 'Un seul calendrier pour vos créneaux, absences et rendez-vous. Vos clients voient en temps réel les disponibilités et réservent sans vous déranger.' },
              { icon: CreditCard, title: 'Acomptes automatiques', text: "Exigez un acompte en ligne via Stripe. Le créneau n'est confirmé qu'une fois le paiement reçu. Fini les oublis et les annulations de dernière minute." },
              { icon: UserCheck, title: 'Zéro no-show', text: 'Les rappels automatiques et le suivi des paiements réduisent les rendez-vous manqués. Vous travaillez serein et vos créneaux restent remplis.' },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-8 text-center hover:border-white/30 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white mb-6">
                  <item.icon className="w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}>
                  {item.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{item.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <FeaturesStickyScroll />

      <section id="temoignages" className="relative py-8 md:py-12 px-4">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tighter"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Ils gèrent leur studio avec InkFlow
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-zinc-400 text-lg"
          >
            Tatoueurs et studios nous font confiance.
          </motion.p>
        </div>
        <TestimonialMarquee speed={35} />
      </section>

      <PricingSection />

      <FAQSection />

      <section ref={sectionRefCta} className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 70%)' }}
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.h2
            initial="hidden"
            animate={inViewCta ? 'visible' : 'hidden'}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tighter"
            style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
          >
            Prêt à transformer votre studio ?
          </motion.h2>
          <motion.p
            initial="hidden"
            animate={inViewCta ? 'visible' : 'hidden'}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-zinc-400 text-lg mb-10"
          >
            30 jours d&apos;essai gratuit. Sans engagement.
          </motion.p>
          <motion.div
            initial="hidden"
            animate={inViewCta ? 'visible' : 'hidden'}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              to="/register"
              className="inline-flex rounded-full bg-white text-black px-10 py-4 text-base font-semibold hover:bg-zinc-200 transition-colors active:scale-95"
            >
              Commencer maintenant
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm font-display font-bold tracking-tight text-zinc-500">
            INK<span className="text-zinc-600">FLOW</span>
          </span>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#solution" className="hover:text-white transition-colors">Pourquoi InkFlow</a>
            <a href="#deep-dive" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#temoignages" className="hover:text-white transition-colors">Témoignages</a>
            <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link to="/register" className="hover:text-white transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

const SEO = {
  title: 'InkFlow - Logiciel de Gestion pour Tatoueurs & Studios',
  description:
    "Agenda, Acomptes, Fiches Clients. Le tout-en-un pour les artistes tatoueurs. Essai gratuit 14 jours.",
  keywords:
    "logiciel tatoueur, agenda tatouage, fiche client tattoo, gestion studio tatouage",
  /** Pour OpenGraph : définir VITE_APP_URL en production (ex. https://inkflow.fr) pour des images absolues. */
  baseUrl: typeof import.meta.env !== "undefined" && import.meta.env.VITE_APP_URL
    ? String(import.meta.env.VITE_APP_URL).replace(/\/$/, "")
    : "",
  ogImage: "/inkflow-logo-v2.png",
};

export function LandingPage(_props: LandingPageProps) {
  const ogImageUrl = SEO.baseUrl ? `${SEO.baseUrl}${SEO.ogImage}` : undefined;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased overflow-x-hidden font-sans relative">
      <Helmet>
        <title>{SEO.title}</title>
        <meta name="description" content={SEO.description} />
        <meta name="keywords" content={SEO.keywords} />
        {/* OpenGraph / Facebook & Instagram */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={SEO.title} />
        <meta property="og:description" content={SEO.description} />
        {ogImageUrl && <meta property="og:image" content={ogImageUrl} />}
        {ogImageUrl && <meta property="og:image:width" content="512" />}
        {ogImageUrl && <meta property="og:image:height" content="512" />}
        {SEO.baseUrl && <meta property="og:url" content={SEO.baseUrl} />}
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:site_name" content="InkFlow" />
      </Helmet>
      <LandingContent />
    </div>
  );
}
