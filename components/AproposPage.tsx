import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Palette, Zap, Shield, Mail, ArrowLeft } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export const AproposPage: React.FC = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`[InkFlow] Message de ${contact.name}`);
    const body = encodeURIComponent(
      `${contact.message}\n\n---\nEnvoyé depuis la page À propos\nNom: ${contact.name}\nEmail: ${contact.email}`
    );
    window.location.href = `mailto:hello@inkflow.com?subject=${subject}&body=${body}`;
  };

  const values = [
    {
      title: "L'Art avant tout",
      description: "Nous automatisons l'administratif pour que vous puissiez vous concentrer sur vos aiguilles.",
      icon: Palette,
    },
    {
      title: 'Simplicité Radicale',
      description: "Pas de menus compliqués. Si ça prend plus de 2 clics, c'est que c'est trop long.",
      icon: Zap,
    },
    {
      title: 'Transparence',
      description: "Pas de commissions cachées sur vos tattoos. Votre argent est à vous.",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-[#02040a] text-white font-sans antialiased overflow-x-hidden relative">
      <Helmet>
        <title>À propos | InkFlow</title>
        <meta name="description" content="L'histoire d'InkFlow : créé par des passionnés, pour des artistes. Nos valeurs et notre vision." />
      </Helmet>

      {/* Background immersif (identique Landing) */}
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
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5"
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-display font-bold tracking-tight text-white hover:text-zinc-300 transition-colors"
          >
            INK<span className="text-zinc-500">FLOW</span>
          </Link>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            Accueil
          </button>
        </div>
      </motion.header>

      <main className="relative z-10 pt-24 pb-20 md:pt-28 md:pb-24">
        <div className="max-w-3xl mx-auto px-4 md:px-6">

          {/* Section 1 : Hero Simple */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center mb-20 md:mb-28"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold leading-tight mb-4"
            >
              Créé par des passionnés, pour des artistes.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto"
            >
              L'histoire d'InkFlow commence par une simple frustration : la gestion du chaos.
            </motion.p>
          </motion.section>

          {/* Section 2 : L'Histoire */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-20 md:mb-28"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-display font-bold mb-6"
            >
              Tout est parti d'un soir de galère...
            </motion.h2>
            <motion.div variants={fadeInUp} className="space-y-4 text-zinc-300 leading-relaxed">
              <p>
                L'idée d'InkFlow n'est pas sortie d'une salle de réunion, mais d'une réalité que vous connaissez bien. Un soir, tard, en essayant de trier des dizaines de DMs Instagram pour caler des rendez-vous, je me suis rendu compte que je passais plus de temps à faire du secrétariat qu'à dessiner.
              </p>
              <p>
                Les messages perdus, les acomptes oubliés, les clients qui demandent 10 fois le prix... Il fallait que ça change. J'ai voulu créer l'outil que j'aurais rêvé avoir : simple, beau, et qui me rend ma liberté de créer.
              </p>
            </motion.div>
          </motion.section>

          {/* Section 3 : Nos Valeurs */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-20 md:mb-28"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-display font-bold mb-10 text-center"
            >
              Nos Valeurs
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((item, i) => (
                <motion.article
                  key={item.title}
                  variants={fadeInUp}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8 hover:border-white/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                    <item.icon size={24} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </motion.section>

          {/* Section 4 : Contact */}
          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl md:text-3xl font-display font-bold mb-8 text-center"
            >
              Une question ? Une idée ?
            </motion.h2>
            <motion.form
              variants={fadeInUp}
              onSubmit={handleContactSubmit}
              className="max-w-xl mx-auto space-y-4"
            >
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Nom
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
                  placeholder="vous@exemple.com"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-400 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  value={contact.message}
                  onChange={(e) => setContact((c) => ({ ...c, message: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none"
                  placeholder="Votre message..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 transition-colors"
                >
                  <Mail size={18} />
                  Envoyer via email
                </button>
                <a
                  href="mailto:hello@inkflow.com"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  hello@inkflow.com
                </a>
              </div>
            </motion.form>
          </motion.section>
        </div>
      </main>
    </div>
  );
};
