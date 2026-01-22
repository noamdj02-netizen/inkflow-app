import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Star, ChevronLeft, ChevronRight, Check, Shield, Users, Calendar, CreditCard, LayoutGrid, Filter, BarChart3, Clock, MapPin, Instagram, Sparkles, Zap, TrendingUp, Eye, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onNavigate?: (view: any) => void;
}

interface Testimonial {
  id: number;
  quote: string;
  highlight: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "InkFlow a transformé ma gestion quotidienne. Je gagne",
    highlight: "5 heures par semaine",
    author: "Marie D.",
    role: "Tatoueur indépendant, Lyon"
  },
  {
    id: 2,
    quote: "Plus de messages Instagram à trier. Mes clients réservent et paient directement. J'ai récupéré",
    highlight: "3 heures par jour",
    author: "Thomas L.",
    role: "Artiste tatoueur, Paris"
  },
  {
    id: 3,
    quote: "Le système d'acomptes Stripe a éliminé les no-shows. Résultat :",
    highlight: "Zéro rendez-vous manqué",
    author: "Sophie M.",
    role: "Studio Encre Noire, Marseille"
  }
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans antialiased overflow-x-hidden">
      <Helmet>
        <title>InkFlow | La Plateforme Premium pour Tatoueurs</title>
        <meta 
          name="description" 
          content="InkFlow - La solution élégante de gestion et réservation pour tatoueurs professionnels. Gérez vos flashs, projets personnalisés et paiements avec style." 
        />
        <meta name="keywords" content="logiciel tatoueur, réservation tatouage, gestion studio tatouage, flash tattoo, booking tattoo" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="InkFlow | La Plateforme Premium pour Tatoueurs" />
        <meta property="og:description" content="La solution élégante de gestion et réservation pour tatoueurs professionnels." />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Navigation - Glass Effect */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="fixed top-0 left-0 right-0 z-50 glass"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-display font-bold tracking-tight">
              INK<span className="text-zinc-500">FLOW</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors tracking-wide py-2 min-h-[44px] flex items-center">
              Fonctionnalités
            </a>
            <a href="#showcase" className="text-sm text-zinc-400 hover:text-white transition-colors tracking-wide py-2 min-h-[44px] flex items-center">
              Portfolio
            </a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors tracking-wide py-2 min-h-[44px] flex items-center">
              Tarifs
            </a>
            <a href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors tracking-wide py-2 min-h-[44px] flex items-center">
              Connexion
            </a>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/register')}
              className="bg-white text-black px-6 py-2.5 text-sm font-semibold hover:bg-zinc-100 transition-all min-h-[44px]"
            >
              Commencer
            </motion.button>
          </div>

          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="md:hidden bg-white text-black px-5 py-2.5 text-sm font-semibold min-h-[44px]"
          >
            Commencer
          </motion.button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-4 md:px-6 pt-20 md:pt-24 pb-8 relative">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left - Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full glass text-[10px] md:text-xs text-zinc-400 tracking-wider uppercase mb-6 md:mb-8"
              >
                <Sparkles size={12} className="text-amber-400" />
                Pour les artistes exigeants
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-7xl font-display font-bold leading-[1.1] md:leading-[1.05] mb-6 md:mb-8 tracking-tight"
              >
                <span className="gradient-text">Maîtrisez</span>
                <br />
                votre art.
                <br />
                <span className="text-zinc-600">Simplifiez</span>
                <br />
                le reste.
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 md:mb-10 max-w-md"
              >
                Une plateforme élégante pour gérer vos réservations, 
                présenter vos flashs et recevoir vos paiements. 
                Sans friction.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3 md:gap-4"
              >
                <motion.button 
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255,255,255,0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/register')}
                  className="group bg-white text-black px-6 md:px-8 py-3.5 md:py-4 font-semibold hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 min-h-[48px]"
                >
                  Essai gratuit
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>

              {/* Trust badges */}
              <motion.div 
                variants={fadeInUp}
                className="mt-10 md:mt-16 flex flex-wrap items-center gap-4 md:gap-8"
              >
                <div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm">
                  <Shield size={14} />
                  <span>Paiements sécurisés</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs md:text-sm">
                  <Users size={14} />
                  <span>+500 artistes</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Visual Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main Dashboard Card */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="glass rounded-3xl p-8 relative z-10"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-zinc-500 text-xs tracking-wider uppercase mb-1">Revenus du mois</p>
                    <p className="text-4xl font-display font-bold">2 450€</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp size={14} className="text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <BarChart3 size={24} className="text-zinc-300" />
                  </div>
                </div>
                
                {/* Mini Chart */}
                <div className="h-20 flex items-end gap-1 mb-8">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 95, 75, 88, 92].map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-zinc-700 to-zinc-600 rounded-sm"
                    />
                  ))}
                </div>
                
                {/* Upcoming Appointments */}
                <div className="space-y-3">
                  <p className="text-zinc-500 text-xs tracking-wider uppercase mb-4">Prochains RDV</p>
                  {[
                    { name: "Marie D.", flash: "Serpent floral", time: "14h00", price: "150€" },
                    { name: "Lucas M.", flash: "Dague vintage", time: "17h00", price: "200€" },
                  ].map((booking, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 1.2 + i * 0.15 }}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <div className={`w-1 h-12 rounded-full ${i === 0 ? 'bg-white' : 'bg-zinc-600'}`} />
                      <div className="flex-1">
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-zinc-500 text-sm">{booking.flash} • {booking.time}</p>
                      </div>
                      <p className="text-zinc-400 font-medium group-hover:text-white transition-colors">{booking.price}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Floating Stats Cards */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 glass rounded-2xl p-5 z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Check size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-2xl">8</p>
                    <p className="text-zinc-500 text-xs">RDV confirmés</p>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -top-4 -right-4 glass rounded-2xl p-5 z-20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Eye size={20} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-2xl">342</p>
                    <p className="text-zinc-500 text-xs">Vues portfolio</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 md:mb-20"
          >
            <motion.p variants={fadeInUp} className="text-zinc-500 text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase mb-3 md:mb-4">
              Fonctionnalités
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-display font-bold gradient-text">
              Tout ce qu'il vous faut
            </motion.h2>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
          >
            {[
              { icon: LayoutGrid, title: "Galerie de Flashs", desc: "Présentez vos designs dans une galerie élégante. Réservation et paiement en un clic.", color: "purple" },
              { icon: CreditCard, title: "Paiements Stripe", desc: "Acomptes automatiques, factures générées. Vos revenus sont sécurisés.", color: "emerald" },
              { icon: Calendar, title: "Agenda intelligent", desc: "Vue claire sur vos rendez-vous, synchronisation automatique, rappels clients.", color: "cyan" },
              { icon: Filter, title: "Demandes filtrées", desc: "Formulaire structuré. Recevez uniquement des demandes qualifiées.", color: "amber" },
              { icon: Users, title: "Gestion clients", desc: "Base de données complète, historique des rendez-vous, notes personnalisées.", color: "pink" },
              { icon: BarChart3, title: "Analytics", desc: "Suivez vos revenus, analysez vos performances, prenez les bonnes décisions.", color: "blue" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="glass rounded-xl md:rounded-2xl p-6 md:p-8 hover:bg-white/5 active:bg-white/10 transition-all group cursor-pointer"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={20} className={`text-${feature.color}-400 md:w-6 md:h-6`} />
                </div>
                <h3 className="text-lg md:text-xl font-display font-semibold mb-2 md:mb-3">{feature.title}</h3>
                <p className="text-zinc-500 text-xs md:text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Showcase Section - Portfolio Preview */}
      <section id="showcase" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12 md:mb-20"
          >
            <motion.p variants={fadeInUp} className="text-zinc-500 text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase mb-3 md:mb-4">
              Vitrine
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-display font-bold gradient-text">
              Votre portfolio en ligne
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-500 text-sm md:text-base mt-4 md:mt-6 max-w-2xl mx-auto px-4">
              Une page publique élégante où vos clients découvrent vos flashs, 
              réservent et paient — sans effort de votre part.
            </motion.p>
          </motion.div>

          {/* Showcase Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <div className="glass rounded-2xl md:rounded-3xl overflow-hidden">
              {/* Browser Bar - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-red-500 transition-colors" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-yellow-500 transition-colors" />
                  <div className="w-3 h-3 rounded-full bg-zinc-700 hover:bg-green-500 transition-colors" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-6 py-2 bg-white/5 rounded-full text-xs text-zinc-500 font-medium">
                    inkflow.app/marie-studio
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="p-4 md:p-8 lg:p-12">
                {/* Artist Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 mb-8 md:mb-12 pb-6 md:pb-8 border-b border-white/5">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl font-display font-bold shadow-lg"
                  >
                    MS
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-display font-bold mb-2">Marie's Studio</h3>
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><MapPin size={12} /> Lyon</span>
                      <span className="flex items-center gap-1"><Instagram size={12} /> @marie_studio</span>
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" /> 4.9
                      </span>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full md:w-auto bg-white text-black px-6 md:px-8 py-3 text-sm font-semibold hover:bg-zinc-100 transition-colors min-h-[48px]"
                  >
                    Réserver
                  </motion.button>
                </div>

                {/* Flash Grid */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-display font-semibold text-lg">Flashs Disponibles</h4>
                    <span className="text-sm text-zinc-500 font-medium">12 designs</span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { emoji: "🐍", title: "Serpent", price: 180, views: 234 },
                      { emoji: "🦋", title: "Papillon", price: 150, views: 189 },
                      { emoji: "🌿", title: "Fougère", price: 120, views: 156 },
                      { emoji: "🌙", title: "Lune", price: 200, views: 312 },
                    ].map((flash, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        className="group cursor-pointer"
                      >
                        <div className="aspect-[4/5] bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center text-5xl mb-3 border border-white/5 group-hover:border-white/20 transition-all relative overflow-hidden">
                          <span className="group-hover:scale-110 transition-transform">{flash.emoji}</span>
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Eye size={14} />
                              {flash.views}
                            </div>
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Heart size={14} />
                              {Math.floor(flash.views * 0.3)}
                            </div>
                          </div>
                        </div>
                        <p className="font-medium text-sm">{flash.title}</p>
                        <p className="text-zinc-500 text-sm font-medium">{flash.price}€</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-10 md:mb-16"
          >
            <motion.p variants={fadeInUp} className="text-zinc-500 text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase mb-3 md:mb-4">
              Témoignages
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-display font-bold gradient-text">
              Ce qu'en disent les artistes
            </motion.h2>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12"
          >
            <AnimatePresence mode="wait">
              {testimonials.map((testimonial, index) => {
                if (index !== currentTestimonial) return null;
                
                return (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                  >
                    <div className="flex justify-center gap-1 mb-8">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.1 }}
                        >
                          <Star size={20} className="fill-amber-400 text-amber-400"/>
                        </motion.div>
                      ))}
                    </div>
                    
                    <blockquote className="text-lg md:text-xl lg:text-2xl font-display leading-relaxed mb-6 md:mb-8">
                      "{testimonial.quote} <span className="text-white font-bold">{testimonial.highlight}</span>."
                    </blockquote>
                    
                    <div className="flex items-center justify-center gap-3 md:gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center font-display font-bold text-base md:text-lg">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm md:text-base">{testimonial.author}</p>
                        <p className="text-zinc-500 text-xs md:text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-center items-center gap-3 md:gap-4 mt-8 md:mt-10">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevTestimonial}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-colors min-h-[44px]"
              >
                <ChevronLeft size={18} />
              </motion.button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? 'bg-white w-8'
                        : 'bg-zinc-700 hover:bg-zinc-600 w-2'
                    }`}
                  />
                ))}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextTestimonial}
                className="w-11 h-11 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white hover:border-white/30 transition-colors min-h-[44px]"
              >
                <ChevronRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-32 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-transparent" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12 md:mb-20"
          >
            <motion.p variants={fadeInUp} className="text-zinc-500 text-xs md:text-sm tracking-[0.2em] md:tracking-[0.3em] uppercase mb-3 md:mb-4">
              Tarifs
            </motion.p>
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-5xl font-display font-bold gradient-text">
              Simple et transparent
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-500 text-sm md:text-base mt-4 md:mt-6">
              Un seul no-show évité rembourse votre abonnement.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {/* Starter */}
            <motion.div 
              variants={scaleIn}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl md:rounded-2xl p-6 md:p-8 hover:bg-white/5 active:bg-white/10 transition-all"
            >
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-display font-semibold mb-2">Starter</h3>
                <p className="text-zinc-500 text-xs md:text-sm">Pour démarrer</p>
              </div>
              <div className="mb-6 md:mb-8">
                <span className="text-4xl md:text-5xl font-display font-bold">29€</span>
                <span className="text-zinc-500 text-sm">/mois</span>
              </div>
              <a 
                href="https://buy.stripe.com/9B6eV6cuG4qDe0e4NSfUQ06"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 md:py-4 border border-white/10 text-center font-semibold hover:bg-white/5 transition-colors mb-6 md:mb-8 text-sm md:text-base min-h-[48px] flex items-center justify-center"
              >
                Commencer
              </a>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm">
                {["1 artiste", "Flashs illimités", "Acomptes Stripe (2%)", "Support email"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3 text-zinc-400">
                    <Check size={14} className="text-zinc-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Pro - Highlighted */}
            <motion.div 
              variants={scaleIn}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl md:rounded-2xl p-6 md:p-8 border-2 border-white/20 relative order-first md:order-none"
            >
              <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 md:px-5 py-1 md:py-1.5 text-[10px] md:text-xs font-bold tracking-wider">
                POPULAIRE
              </div>
              <div className="mb-6 md:mb-8 mt-2 md:mt-0">
                <h3 className="text-lg md:text-xl font-display font-semibold mb-2">Pro</h3>
                <p className="text-zinc-500 text-xs md:text-sm">Pour les établis</p>
              </div>
              <div className="mb-6 md:mb-8">
                <span className="text-4xl md:text-5xl font-display font-bold">49€</span>
                <span className="text-zinc-500 text-sm">/mois</span>
              </div>
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://buy.stripe.com/14A7sE52eaP13lA6W0fUQ07"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 md:py-4 bg-white text-black text-center font-bold hover:bg-zinc-100 transition-colors mb-6 md:mb-8 text-sm md:text-base min-h-[48px] flex items-center justify-center"
              >
                Choisir Pro
              </motion.a>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm">
                {["Tout du Starter", "Formulaire projet IA", "Acomptes Stripe (0%)", "Agenda synchronisé", "Support prioritaire"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3 text-zinc-300">
                    <Check size={14} className="text-white flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Studio */}
            <motion.div 
              variants={scaleIn}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.98 }}
              className="glass rounded-xl md:rounded-2xl p-6 md:p-8 hover:bg-white/5 active:bg-white/10 transition-all"
            >
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-display font-semibold mb-2">Studio</h3>
                <p className="text-zinc-500 text-xs md:text-sm">Pour les équipes</p>
              </div>
              <div className="mb-6 md:mb-8">
                <span className="text-4xl md:text-5xl font-display font-bold">99€</span>
                <span className="text-zinc-500 text-sm">/mois</span>
              </div>
              <a 
                href="https://buy.stripe.com/00wcMY8eq3mz6xM1BGfUQ08"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 md:py-4 border border-white/10 text-center font-semibold hover:bg-white/5 transition-colors mb-6 md:mb-8 text-sm md:text-base min-h-[48px] flex items-center justify-center"
              >
                Choisir Studio
              </a>
              <ul className="space-y-3 md:space-y-4 text-xs md:text-sm">
                {["Jusqu'à 3 artistes", "Multi-calendriers", "Dashboard studio", "Marque blanche"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3 text-zinc-400">
                    <Check size={14} className="text-zinc-600 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-32 px-4 md:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold gradient-text mb-4 md:mb-6">
              Prêt à transformer votre activité ?
            </h2>
          </motion.div>
          <p className="text-zinc-500 text-base md:text-lg mb-8 md:mb-10 px-4">
            Rejoignez +500 artistes qui utilisent InkFlow chaque jour.
          </p>
          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(255,255,255,0.15)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/register')}
            className="group bg-white text-black px-8 md:px-12 py-4 md:py-5 font-bold text-base md:text-lg hover:bg-zinc-100 transition-all inline-flex items-center gap-3 min-h-[52px]"
          >
            Commencer gratuitement
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
          <p className="text-xs md:text-sm text-zinc-600 mt-4 md:mt-6">
            14 jours gratuits • Sans carte bancaire
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="text-xl md:text-2xl font-display font-bold tracking-tight">
            INK<span className="text-zinc-500">FLOW</span>
          </div>
          <div className="text-zinc-600 text-xs md:text-sm">
            © 2025 InkFlow. Tous droits réservés.
          </div>
          <div className="flex gap-6 md:gap-8 text-xs md:text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors py-2 min-h-[44px] flex items-center">Mentions légales</a>
            <a href="#" className="hover:text-white transition-colors py-2 min-h-[44px] flex items-center">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
