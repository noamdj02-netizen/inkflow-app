import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DashboardDemo = lazy(() =>
  import('./DashboardDemo').then((m) => ({ default: m.DashboardDemo }))
);

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 px-4 min-h-[85vh] flex flex-col justify-center overflow-hidden">
      {/* Glow derrière le Hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-6xl sm:text-7xl md:text-8xl font-bold leading-[1.05] tracking-tighter text-white mb-6"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Gérez votre studio comme jamais
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12"
        >
          Agenda, réservations, acomptes et vitrine en un seul outil. Simple et professionnel.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="rounded-full bg-white text-black px-8 py-4 text-base font-semibold hover:bg-zinc-200 transition-colors active:scale-95"
          >
            Commencer gratuitement
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-white/40 text-white px-8 py-4 text-base font-medium hover:bg-white/10 hover:border-white/60 transition-colors active:scale-95"
          >
            Se connecter
          </Link>
        </motion.div>
      </div>

      {/* Dashboard Demo : interactive demo, lazy-loaded */}
      <motion.div
        initial={{ opacity: 0, y: 64 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mt-14 md:mt-20 mx-auto max-w-5xl px-4 relative z-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-full max-w-4xl mx-auto"
          style={{
            marginBottom: '-5rem',
            boxShadow: '0 0 80px -20px rgba(99, 102, 241, 0.35), 0 0 40px -20px rgba(139, 92, 246, 0.2)',
            borderRadius: '1rem',
          }}
        >
          <Suspense
            fallback={
              <div
                className="aspect-video w-full rounded-2xl border border-white/10 bg-[#0d0d0d] animate-pulse"
                style={{
                  boxShadow: '0 0 80px -20px rgba(99, 102, 241, 0.25)',
                }}
              />
            }
          >
            <div className="aspect-video w-full">
              <DashboardDemo />
            </div>
          </Suspense>
        </motion.div>
      </motion.div>
    </section>
  );
}
