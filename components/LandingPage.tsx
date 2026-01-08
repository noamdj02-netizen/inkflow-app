import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Filter, CreditCard, Check, ArrowRight, Star, PenTool, LayoutGrid, Calendar, ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle, TrendingUp, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageProps {
  onNavigate?: (view: any) => void; // Gardé pour compatibilité mais non utilisé
}

interface Testimonial {
  id: number;
  quote: string;
  highlight: string;
  location: string;
  followers: string;
}

// Constante pour les images de démonstration locales
const DEMO_FLASHES = {
  serpent: '/images/demo-flashs/serpent-floral.jpg',
  dague: '/images/demo-flashs/dague-oldschool.jpg',
  papillon: '/images/demo-flashs/papillon-abstrait.jpg',
  rose: '/images/demo-flashs/rose-realiste.jpg',
  geometrique: '/images/demo-flashs/geometrique.jpg',
  blackwork: '/images/demo-flashs/bras-complet.jpg'
};

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Depuis que j'utilise InkFlow, je gagne",
    highlight: "5 heures par semaine",
    location: "Tatoueur à Lyon",
    followers: "48k abonnés"
  },
  {
    id: 2,
    quote: "Fini les messages Instagram à gérer. Mes clients réservent directement et paient l'acompte. Je gagne",
    highlight: "3 heures par jour",
    location: "Tatoueur à Paris",
    followers: "32k abonnés"
  },
  {
    id: 3,
    quote: "L'analyse IA des projets perso est incroyable. Je reçois uniquement des demandes réalisables. Ça m'a fait gagner",
    highlight: "10 heures par semaine",
    location: "Tatoueur à Marseille",
    followers: "25k abonnés"
  },
  {
    id: 4,
    quote: "Les flashs se vendent tout seuls maintenant. Plus besoin de poster sur Instagram tous les jours. J'ai récupéré",
    highlight: "2 heures par jour",
    location: "Tatoueur à Bordeaux",
    followers: "18k abonnés"
  },
  {
    id: 5,
    quote: "Le système d'acomptes Stripe a changé ma vie. Plus de no-show, mes revenus sont sécurisés.",
    highlight: "Zéro no-show",
    location: "Tatoueur à Toulouse",
    followers: "41k abonnés"
  }
];

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotation du carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000); // Change toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">
      
      {/* Marketing Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="/login" className="hover:text-white transition-colors">Connexion</a>
            <button 
                onClick={() => navigate('/register')}
                className="bg-amber-400 text-black px-6 py-2.5 rounded-full font-bold hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]"
            >
              Essayer Gratuitement
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Abstract Background Glows */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-400/10 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-md text-amber-400 text-xs font-bold tracking-wider mb-8 uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                Nouveau : Module IA Disponible
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 leading-[0.9] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                Gérez votre art,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-amber-200 to-amber-500">pas vos DMs.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                La première plateforme tout-en-un pour tatoueurs. Réservations de flashs instantanées, filtrage de projets perso, et sécurisation des acomptes via Stripe. Zéro No-Show.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                <button 
                    onClick={() => navigate('/register')}
                    className="h-14 px-8 rounded-full bg-white text-black font-bold text-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    Commencer maintenant <ArrowRight size={20}/>
                </button>
                 <button 
                    onClick={() => navigate('/client')}
                    className="h-14 px-8 rounded-full bg-slate-800/50 border border-slate-700 text-white font-bold text-lg hover:bg-slate-800 transition-colors backdrop-blur-md"
                >
                    Voir une démo client
                </button>
            </div>

            {/* Visual Representation of the App (3 floating screens) */}
            <div className="relative max-w-5xl mx-auto h-[300px] md:h-[500px] mt-10 perspective-1000">
                {/* Left Card - Flash Gallery */}
                <div className="absolute left-0 md:left-10 top-10 w-48 md:w-72 aspect-[9/19] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl transform -rotate-12 translate-y-10 opacity-60 hover:opacity-100 hover:z-20 hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/50">
                        <LayoutGrid size={14} className="text-blue-400"/> 
                        <span className="text-xs font-bold text-white">Mes Flashs</span>
                    </div>
                    <div className="p-3 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                            {/* Flash 1 */}
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                                <img 
                                    src={DEMO_FLASHES.serpent} 
                                    alt="Serpent Floral" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    150€
                                </div>
                            </div>
                            {/* Flash 2 */}
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                                <img 
                                    src={DEMO_FLASHES.dague} 
                                    alt="Dague Old School" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-green-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    Dispo
                                </div>
                            </div>
                            {/* Flash 3 */}
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                                <img 
                                    src={DEMO_FLASHES.papillon} 
                                    alt="Papillon Abstrait" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            {/* Flash 4 */}
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-slate-700">
                                <img 
                                    src={DEMO_FLASHES.rose} 
                                    alt="Rose Réaliste" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-1 right-1 bg-amber-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
                                    180€
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800">
                            <button className="w-full bg-blue-500/20 text-blue-400 text-[10px] font-bold py-2 rounded-lg border border-blue-500/30">
                                + Ajouter un flash
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Card - Revenue Dashboard */}
                <div className="absolute right-0 md:right-10 top-10 w-48 md:w-72 aspect-[9/19] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl transform rotate-12 translate-y-10 opacity-60 hover:opacity-100 hover:z-20 hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="p-3 border-b border-slate-800 flex items-center gap-2 bg-slate-950/50">
                        <Calendar size={14} className="text-green-400"/> 
                        <span className="text-xs font-bold text-white">Revenus</span>
                    </div>
                     <div className="p-4 space-y-4 flex-1 flex flex-col">
                        {/* Main Revenue */}
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                            <div className="text-[10px] text-slate-400 mb-1">Chiffre d'affaires</div>
                            <div className="text-2xl md:text-3xl font-black text-white mb-1">2 450€</div>
                            <div className="text-[10px] text-slate-400">Septembre 2024</div>
                        </div>

                        {/* Growth Indicator */}
                        <div className="flex items-center gap-2 bg-green-500/10 rounded-lg px-2.5 py-1.5 border border-green-500/20">
                            <TrendingUp size={12} className="text-green-400" />
                            <span className="text-[10px] font-bold text-green-400">+15% vs août</span>
                        </div>

                        {/* Secondary Stat */}
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                            <div className="text-[10px] text-slate-400 mb-1">Tatouages réalisés</div>
                            <div className="text-lg font-bold text-white">12</div>
                        </div>

                        {/* Simple Chart */}
                        <div className="flex-1 flex items-end gap-1 pt-2">
                            <div className="flex-1 bg-slate-800 rounded-t h-8"></div>
                            <div className="flex-1 bg-slate-800 rounded-t h-12"></div>
                            <div className="flex-1 bg-green-500/30 rounded-t h-16 border-t-2 border-green-400"></div>
                            <div className="flex-1 bg-green-500/50 rounded-t h-20 border-t-2 border-green-400"></div>
                            <div className="flex-1 bg-green-500/70 rounded-t h-24 border-t-2 border-green-400"></div>
                        </div>
                    </div>
                </div>

                {/* Center Card - New Client Request (Main) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-56 md:w-80 aspect-[9/19] bg-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] z-10 overflow-hidden flex flex-col">
                     <div className="p-4 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center justify-between">
                         <span className="text-xs font-bold text-white">Nouvelle Demande</span>
                         <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                     </div>
                     <div className="p-5 flex-1 flex flex-col justify-between">
                        {/* Client Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm border-2 border-slate-700">
                                    SM
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-white">Sophie Martin</div>
                                    <div className="text-[10px] text-slate-400">Nouveau client</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                                <div className="text-[10px] text-slate-400 mb-1">Projet</div>
                                <div className="text-sm font-bold text-white mb-2">Bras complet - Floral</div>
                                <div className="flex items-center gap-2 text-xs">
                                    <Euro size={12} className="text-amber-400" />
                                    <span className="text-amber-400 font-mono font-bold">450€</span>
                                    <span className="text-slate-500 ml-auto">Estimé</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-4 border-t border-slate-800">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl text-sm shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 animate-pulse"
                            >
                                <CheckCircle size={16} />
                                Accepter
                            </motion.button>
                            <button className="w-full py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl text-sm border border-slate-700 flex items-center justify-center gap-2">
                                <XCircle size={14} />
                                Refuser
                            </button>
                        </div>
                     </div>
                </div>
            </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Conçu pour les artistes débordés.</h2>
            <p className="text-slate-400">Tout ce dont vous avez besoin pour professionnaliser votre business.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Card 1: Flashs (Large) */}
            <div className="md:col-span-2 relative group bg-slate-800/30 border border-white/5 rounded-3xl p-8 overflow-hidden backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap size={200} />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-2">Flashs Instantanés</h3>
                        <p className="text-slate-400 text-lg max-w-md">Le client réserve et paie l'acompte en un clic. Votre agenda se remplit seul 24/7. Plus de "dispo ?" en DM.</p>
                    </div>
                </div>
            </div>

            {/* Card 2: Filter (Regular) */}
            <div className="md:col-span-1 relative group bg-slate-800/30 border border-white/5 rounded-3xl p-8 overflow-hidden backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 mb-6">
                    <Filter size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Filtrage Intelligent</h3>
                <p className="text-slate-400">Fini les projets irréalisables. Recevez des demandes qualifiées avec taille, emplacement et budget.</p>
            </div>

            {/* Card 3: Deposits (Regular) */}
            <div className="md:col-span-1 relative group bg-slate-800/30 border border-white/5 rounded-3xl p-8 overflow-hidden backdrop-blur-sm hover:bg-slate-800/50 transition-colors">
                 <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center text-green-400 mb-6">
                    <CreditCard size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Acomptes Auto</h3>
                <p className="text-slate-400">Intégration Stripe native. Sécurisez vos revenus avant même de commencer à dessiner.</p>
            </div>

             {/* Card 4: Dashboard (Large) */}
             <div className="md:col-span-2 relative group bg-slate-800/30 border border-white/5 rounded-3xl p-8 overflow-hidden backdrop-blur-sm hover:bg-slate-800/50 transition-colors flex items-center">
                 <div className="flex-1">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mb-6">
                        <Calendar size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Agenda Synchronisé</h3>
                    <p className="text-slate-400">Une vue claire sur votre semaine, vos revenus et vos projets en attente.</p>
                 </div>
                 <div className="hidden md:block w-1/3 bg-slate-900 rounded-xl h-32 border border-slate-700 opacity-50 rotate-3 transform translate-x-4"></div>
            </div>
        </div>
      </section>

      {/* Flashs Disponibles - Démonstration Premium */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Flashs Disponibles
          </h2>
          <p className="text-slate-400 text-lg">
            Premier arrivé, premier servi. Réservez votre créneau instantanément.
          </p>
        </div>

        {/* Filtres Simulés */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {['Tous', 'Blackwork', 'Couleur', 'Japonais', 'Fine Line'].map((filter) => (
            <button
              key={filter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === 'Tous'
                  ? 'bg-amber-400 text-black'
                  : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grille de Flashs Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Flash 1: Serpent Floral */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.serpent}
                alt="Serpent Floral"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Dispo
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Serpent Floral</h3>
                <span className="text-amber-400 font-mono font-black text-xl">150€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                  Fine Line
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Réserver (Acompte 30%)
              </button>
            </div>
          </motion.div>

          {/* Flash 2: Dague Old School */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.dague}
                alt="Dague Old School"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Dispo
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Dague Old School</h3>
                <span className="text-amber-400 font-mono font-black text-xl">200€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                  Traditionnel
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Réserver (Acompte 30%)
              </button>
            </div>
          </motion.div>

          {/* Flash 3: Papillon Abstrait */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.papillon}
                alt="Papillon Abstrait"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Dispo
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Papillon Abstrait</h3>
                <span className="text-amber-400 font-mono font-black text-xl">120€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                  Fine Line
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Réserver (Acompte 30%)
              </button>
            </div>
          </motion.div>

          {/* Flash 4: Rose Réaliste */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.rose}
                alt="Rose Réaliste"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Dispo
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Rose Réaliste</h3>
                <span className="text-amber-400 font-mono font-black text-xl">180€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                  Réalisme
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Réserver (Acompte 30%)
              </button>
            </div>
          </motion.div>

          {/* Flash 5: Géométrique */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 opacity-60"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.geometrique}
                alt="Géométrique"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 grayscale"
              />
              <div className="absolute top-3 right-3 bg-slate-800/90 backdrop-blur-sm text-slate-400 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Vendu
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Géométrique</h3>
                <span className="text-slate-500 font-mono font-black text-xl line-through">250€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-400 px-2.5 py-1 rounded-full border border-slate-600">
                  Géométrique
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-slate-700 text-slate-500 font-bold rounded-xl cursor-not-allowed" disabled>
                Indisponible
              </button>
            </div>
          </motion.div>

          {/* Flash 6: Jambe/Bras complet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all duration-300"
          >
            <div className="aspect-[4/5] relative overflow-hidden bg-slate-900">
              <img
                src={DEMO_FLASHES.blackwork}
                alt="Jambe/Bras complet"
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                Dispo
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-white">Paysage Blackwork</h3>
                <span className="text-amber-400 font-mono font-black text-xl">140€</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600">
                  Blackwork
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> 2h
                </span>
              </div>
              <button className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-amber-400 transition-colors">
                Réserver (Acompte 30%)
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof - Carrousel */}
      <section className="py-16 border-y border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative">
            {/* Carrousel Container */}
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait">
                {testimonials.map((testimonial, index) => {
                  if (index !== currentTestimonial) return null;
                  
                  return (
                    <motion.div
                      key={testimonial.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      {/* Stars */}
                      <div className="flex justify-center gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={20} className="fill-amber-400 text-amber-400"/>
                        ))}
                      </div>
                      
                      {/* Quote */}
                      <blockquote className="text-2xl md:text-3xl font-medium text-white mb-6 px-4">
                        {testimonial.id === 5 ? (
                          <>"{testimonial.quote} <span className="text-amber-400">{testimonial.highlight}</span>. C'est un game changer."</>
                        ) : (
                          <>"{testimonial.quote} <span className="text-amber-400">{testimonial.highlight}</span> sur ma gestion administrative. C'est un game changer."</>
                        )}
                      </blockquote>
                      
                      {/* Author Info */}
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                          <PenTool size={20} className="text-slate-400" />
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white">{testimonial.location}</div>
                          <div className="text-sm text-slate-500">{testimonial.followers}</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
              aria-label="Avis précédent"
            >
              <ChevronLeft size={20} />
            </button>
            
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
              aria-label="Avis suivant"
            >
              <ChevronRight size={20} />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? 'bg-amber-400 w-8'
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Aller à l'avis ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Des tarifs simples qui s'autofinancent.</h2>
            <p className="text-slate-400">Un seul no-show évité rembourse votre abonnement.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-slate-800/20 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm flex flex-col hover:border-slate-500 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <div className="text-4xl font-black text-white mb-6">29€<span className="text-lg text-slate-500 font-medium">/mois</span></div>
                <p className="text-slate-400 text-sm mb-8">Parfait pour lancer son activité digitale.</p>
                <a 
                    href="https://buy.stripe.com/9B6eV6cuG4qDe0e4NSfUQ06"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-slate-600 text-white font-bold hover:bg-slate-800 mb-8 transition-colors text-center"
                >
                    Commencer
                </a>
                <ul className="space-y-4 text-sm text-slate-300 flex-1">
                    <li className="flex items-center gap-3"><Check size={16} className="text-slate-500"/> 1 Artiste</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Flashs illimités</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Acomptes Stripe (2% frais)</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Support email</li>
                </ul>
            </div>

            {/* Pro (Highlighted) */}
            <div className="relative bg-slate-900/40 border border-amber-400 rounded-3xl p-8 backdrop-blur-md flex flex-col shadow-[0_0_30px_rgba(245,158,11,0.1)] transform md:-translate-y-4">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-black px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Le Best-Seller
                </div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Pro</h3>
                <div className="text-4xl font-black text-white mb-6">49€<span className="text-lg text-slate-500 font-medium">/mois</span></div>
                <p className="text-slate-400 text-sm mb-8">Pour les artistes qui veulent tout automatiser.</p>
                <a 
                    href="https://buy.stripe.com/14A7sE52eaP13lA6W0fUQ07"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300 mb-8 transition-colors shadow-lg shadow-amber-400/20 text-center block"
                >
                    Choisir le Pro
                </a>
                <ul className="space-y-4 text-sm text-slate-300 flex-1">
                    <li className="flex items-center gap-3"><Check size={16} className="text-amber-400"/> <strong>Tout du Starter</strong></li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Formulaire Projet IA</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Acomptes Stripe <strong>(0% frais)</strong></li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Agenda Synchronisé</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Support Prioritaire</li>
                </ul>
            </div>

            {/* Studio */}
            <div className="bg-slate-800/20 border border-slate-700 rounded-3xl p-8 backdrop-blur-sm flex flex-col hover:border-slate-500 transition-colors">
                <h3 className="text-xl font-bold text-white mb-2">Studio</h3>
                <div className="text-4xl font-black text-white mb-6">99€<span className="text-lg text-slate-500 font-medium">/mois</span></div>
                <p className="text-slate-400 text-sm mb-8">Pour les shops avec plusieurs résidents.</p>
                <a 
                    href="https://buy.stripe.com/00wcMY8eq3mz6xM1BGfUQ08"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl border border-slate-600 text-white font-bold hover:bg-slate-800 mb-8 transition-colors text-center"
                >
                    Choisir Studio
                </a>
                <ul className="space-y-4 text-sm text-slate-300 flex-1">
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Jusqu'à 3 Artistes</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Multi-calendriers</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Dashboard Studio</li>
                    <li className="flex items-center gap-3"><Check size={16} className="text-white"/> Marque Blanche</li>
                </ul>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
                <span className="text-xl font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
            </div>
            <div className="text-slate-500 text-sm">
                &copy; 2024 InkFlow SaaS. Tous droits réservés.
            </div>
            <div className="flex gap-6 text-sm text-slate-400">
                <a href="#" className="hover:text-white">Mentions Légales</a>
                <a href="#" className="hover:text-white">Contact</a>
                <a href="#" className="hover:text-white">Instagram</a>
            </div>
        </div>
      </footer>
    </div>
  );
};