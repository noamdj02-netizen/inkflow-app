import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Image, Calendar, User, CreditCard, CheckCircle, Sparkles } from 'lucide-react';

const dashboardImage = new URL('../dashboard.png', import.meta.url).href;

function DemoVitrine() {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-violet-900/40 via-zinc-900/90 to-zinc-900/90 aspect-[4/3] p-5 flex flex-col"
      style={{ transform: 'perspective(800px) rotateY(-4deg) rotateX(2deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-violet-400" size={18} />
        <span className="text-sm font-semibold text-white">Ma vitrine</span>
      </div>
      <div className="grid grid-cols-3 gap-2 flex-1">
        {[
          { label: 'Dragon', prix: '80€', accent: 'from-violet-500/30' },
          { label: 'Rose', prix: '120€', accent: 'from-pink-500/30' },
          { label: 'Ancre', prix: '60€', accent: 'from-amber-500/30' },
        ].map((flash, i) => (
          <motion.div
            key={flash.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`rounded-xl border border-white/10 bg-gradient-to-br ${flash.accent} to-zinc-800/80 p-3 flex flex-col items-center justify-center min-h-[80px]`}
          >
            <Image className="text-zinc-500 mb-1" size={20} />
            <span className="text-xs font-medium text-white truncate w-full text-center">{flash.label}</span>
            <span className="text-xs text-violet-300 font-semibold">{flash.prix}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>Réservation en 1 clic</span>
        <CheckCircle size={14} className="text-emerald-400" />
      </div>
    </motion.div>
  );
}

function DemoCalendrier() {
  return (
    <motion.div
      className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0d0d0d] aspect-[4/3] shadow-2xl shadow-violet-500/20"
      style={{ transform: 'perspective(800px) rotateY(3deg) rotateX(-2deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 60px -15px rgba(139, 92, 246, 0.25)' }}
      animate={{ y: [0, 4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <img src={dashboardImage} alt="Calendrier InkFlow" className="w-full h-full object-cover object-top" />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex items-center justify-between">
        <span className="text-xs text-white/90 font-medium">Créneaux en temps réel</span>
        <Calendar size={14} className="text-violet-400" />
      </div>
    </motion.div>
  );
}

function DemoClients() {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/30 via-zinc-900/90 to-zinc-900/90 aspect-[4/3] p-5 flex flex-col"
      style={{ transform: 'perspective(800px) rotateY(4deg) rotateX(1deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <User className="text-emerald-400" size={18} />
        <span className="text-sm font-semibold text-white">Fiche client</span>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 mb-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 font-bold">JD</div>
        <div>
          <div className="text-sm font-semibold text-white">Julie D.</div>
          <div className="text-xs text-zinc-500">3 RDV · Dernier : 12/01</div>
        </div>
      </div>
      <div className="space-y-2 text-xs">
        {['Projet bras · 350€', 'Flash rose · 120€', 'Soins envoyés ✓'].map((line, i) => (
          <div key={i} className="flex items-center justify-between text-zinc-400">
            <span>{line}</span>
            {line.includes('✓') ? <CheckCircle size={12} className="text-emerald-400" /> : null}
          </div>
        ))}
      </div>
      <div className="mt-auto pt-3 border-t border-white/10">
        <span className="text-xs text-emerald-400/90 font-medium">Rappels & soins automatiques</span>
      </div>
    </motion.div>
  );
}

function DemoPaiements() {
  return (
    <motion.div
      className="rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-amber-900/25 via-zinc-900/90 to-zinc-900/90 aspect-[4/3] p-5 flex flex-col"
      style={{ transform: 'perspective(800px) rotateY(-3deg) rotateX(2deg)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)' }}
      animate={{ y: [0, 5, 0] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="text-amber-400" size={18} />
        <span className="text-sm font-semibold text-white">Acompte en ligne</span>
      </div>
      <div className="flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-12 rounded bg-gradient-to-br from-violet-500 to-indigo-600" />
          <span className="text-xs text-zinc-500">Carte · Stripe</span>
        </div>
        <div className="text-sm text-zinc-400 font-mono tracking-wider mb-2">•••• •••• •••• 4242</div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>30€ acompte</span>
          <span>Flash Dragon — 80€</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-amber-400/90">
        <CheckCircle size={14} />
        <span>Créneau réservé après paiement</span>
      </div>
    </motion.div>
  );
}

const FEATURES = [
  {
    id: 'vitrine',
    title: 'Une vitrine qui vend pour vous',
    description:
      "Présentez vos flashs et projets avec une galerie claire. Vos clients choisissent un design, voient le prix et l'acompte, et réservent en quelques clics. Plus besoin d'échanger des dizaines de messages.",
    cta: 'Créer ma vitrine',
    href: '/register',
    image: <DemoVitrine />,
  },
  {
    id: 'calendrier',
    title: 'Calendrier & réservations en temps réel',
    description:
      'Un seul calendrier pour vos créneaux, absences et rendez-vous. Vos clients voient en temps réel les disponibilités et réservent sans vous déranger. Les créneaux se ferment automatiquement.',
    cta: 'Voir le calendrier',
    href: '/register',
    image: <DemoCalendrier />,
  },
  {
    id: 'clients',
    title: 'Gestion clients sans prise de tête',
    description:
      'Fiches clients, historique des rendez-vous et des paiements au même endroit. Envoyez des rappels et des instructions de soins après tatouage. Tout est tracé et professionnel.',
    cta: 'Découvrir le dashboard',
    href: '/register',
    image: <DemoClients />,
  },
  {
    id: 'paiements',
    title: 'Acomptes automatiques via Stripe',
    description:
      "Exigez un acompte en ligne via Stripe. Le créneau n'est confirmé qu'une fois le paiement reçu. Fini les oublis et les annulations de dernière minute. Zéro commission InkFlow.",
    cta: 'En savoir plus',
    href: '/register',
    image: <DemoPaiements />,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

export function FeaturesStickyScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const refs = sectionRefs.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = refs.indexOf(entry.target as HTMLDivElement);
          if (idx >= 0) setActiveIndex(idx);
        });
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
    );

    refs.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setSectionRef = (i: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[i] = el;
  };

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

        <div
          ref={containerRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start"
        >
          <div className="hidden lg:block space-y-32 lg:space-y-48">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={feature.id}
                ref={setSectionRef(i)}
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
                  to={feature.href}
                  className="inline-flex rounded-full border border-white/40 text-white px-6 py-3 text-sm font-medium hover:bg-white/10 hover:border-white/60 transition-colors w-fit"
                >
                  {feature.cta}
                </Link>
              </motion.div>
            ))}
          </div>

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
                  className={activeIndex === i ? 'absolute inset-0 pointer-events-auto' : 'absolute inset-0 pointer-events-none'}
                >
                  {feature.image}
                </motion.div>
              ))}
            </div>
          </div>

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
                    to={feature.href}
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
