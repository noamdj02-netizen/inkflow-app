import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Filter, CreditCard, Check, ArrowRight, Star, PenTool, LayoutGrid, Calendar } from 'lucide-react';

interface LandingPageProps {
  onNavigate?: (view: any) => void; // Gardé pour compatibilité mais non utilisé
}

export const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50 font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden">
      
      {/* Marketing Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center transform -rotate-3 shadow-[0_0_15px_rgba(251,191,36,0.4)]">
                <PenTool className="text-black" size={22} />
            </div>
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
                {/* Left Card - Flash */}
                <div className="absolute left-0 md:left-10 top-10 w-48 md:w-72 aspect-[9/19] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl transform -rotate-12 translate-y-10 opacity-60 hover:opacity-100 hover:z-20 hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                        <LayoutGrid size={16} className="text-blue-400"/> <span className="text-xs font-bold text-slate-300">Flashs</span>
                    </div>
                    <div className="p-4 space-y-3">
                         <div className="aspect-square bg-slate-800 rounded-lg animate-pulse"></div>
                         <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                         <div className="h-8 bg-blue-500/20 rounded-lg w-full"></div>
                    </div>
                </div>

                {/* Right Card - Dashboard */}
                <div className="absolute right-0 md:right-10 top-10 w-48 md:w-72 aspect-[9/19] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl transform rotate-12 translate-y-10 opacity-60 hover:opacity-100 hover:z-20 hover:scale-105 transition-all duration-500 overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                        <Calendar size={16} className="text-green-400"/> <span className="text-xs font-bold text-slate-300">Revenus</span>
                    </div>
                     <div className="p-4 space-y-3">
                         <div className="h-24 bg-slate-800 rounded-lg flex items-end justify-between p-2 pb-0">
                            <div className="w-4 h-10 bg-green-500/20 rounded-t"></div>
                            <div className="w-4 h-16 bg-green-500/50 rounded-t"></div>
                            <div className="w-4 h-8 bg-green-500/20 rounded-t"></div>
                         </div>
                    </div>
                </div>

                {/* Center Card - AI Filter (Main) */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 w-56 md:w-80 aspect-[9/19] bg-slate-950 border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] z-10 overflow-hidden flex flex-col">
                     <div className="p-4 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex items-center justify-between">
                         <span className="text-xs font-bold text-white">InkFlow AI</span>
                         <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                     </div>
                     <div className="p-5 flex-1 flex flex-col justify-center space-y-4">
                        <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center mx-auto border border-amber-400/20">
                            <Zap className="text-amber-400" />
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-white">Projet Validé</div>
                            <div className="text-xs text-slate-400">Difficulté: Moyenne</div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                             <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-500">Prix estimé</span>
                                <span className="text-amber-400 font-mono">350€</span>
                             </div>
                             <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-400 w-2/3 h-full"></div>
                             </div>
                        </div>
                        <button className="w-full py-3 bg-white text-black font-bold rounded-xl text-sm">Accepter le projet</button>
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

      {/* Social Proof */}
      <section className="py-12 border-y border-white/5 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-amber-400 text-amber-400"/>)}
            </div>
            <blockquote className="text-2xl md:text-3xl font-medium text-white mb-6">
                "Depuis que j'utilise InkFlow, je gagne <span className="text-amber-400">5 heures par semaine</span> sur ma gestion administrative. C'est un game changer."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                <div className="text-left">
                    <div className="font-bold text-white">@Zonett_ink</div>
                    <div className="text-sm text-slate-500">Tatoueur à Lyon, 48k abonnés</div>
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
                <button className="w-full py-3 rounded-xl border border-slate-600 text-white font-bold hover:bg-slate-800 mb-8 transition-colors">Commencer</button>
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
                    Le plus populaire
                </div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Pro</h3>
                <div className="text-4xl font-black text-white mb-6">49€<span className="text-lg text-slate-500 font-medium">/mois</span></div>
                <p className="text-slate-400 text-sm mb-8">Pour les artistes qui veulent tout automatiser.</p>
                <button 
                    onClick={() => navigate('/register')}
                    className="w-full py-3 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300 mb-8 transition-colors shadow-lg shadow-amber-400/20"
                >
                    Choisir le Pro
                </button>
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
                <button className="w-full py-3 rounded-xl border border-slate-600 text-white font-bold hover:bg-slate-800 mb-8 transition-colors">Contacter l'équipe</button>
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
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center transform rotate-3">
                    <PenTool className="text-black" size={16} />
                </div>
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