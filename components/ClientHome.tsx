import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, PenTool, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ClientHomeProps {
  onNavigate?: (view: any) => void;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

export const ClientHome: React.FC<ClientHomeProps> = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-4xl mx-auto w-full relative z-10"
      >
        <motion.div variants={fadeInUp} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-zinc-400 tracking-wider uppercase mb-6">
            <Sparkles size={14} className="text-white" />
            Bienvenue
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
            Quel est votre projet ?
          </h2>
          <p className="text-zinc-500 text-lg max-w-md mx-auto">
            Choisissez une option pour commencer votre expérience.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Option 1: Flash */}
          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/flashs')}
            className="group relative glass rounded-3xl p-8 text-left transition-all overflow-hidden min-h-[300px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <LayoutGrid size={180} />
            </div>
             
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:bg-white/10 transition-all duration-300">
              <LayoutGrid size={28} />
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 group-hover:text-zinc-300 transition-colors">
                Flashs
              </h3>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                Explorez les designs disponibles, réservez et payez votre acompte instantanément.
              </p>
              
              <div className="inline-flex items-center gap-2 text-white font-semibold group-hover:translate-x-2 transition-transform">
                Voir la galerie <ArrowRight size={18} />
              </div>
            </div>
          </motion.button>

          {/* Option 2: Custom */}
          <motion.button 
            variants={fadeInUp}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/project')}
            className="group relative glass rounded-3xl p-8 text-left transition-all overflow-hidden min-h-[300px] flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <PenTool size={180} />
            </div>
             
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-zinc-400 mb-6 group-hover:bg-white/10 transition-all duration-300">
              <PenTool size={28} />
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3 group-hover:text-zinc-300 transition-colors">
                Projet Perso
              </h3>
              <p className="text-zinc-500 mb-6 leading-relaxed">
                Décrivez votre idée, obtenez une estimation IA et envoyez votre dossier complet.
              </p>
              
              <div className="inline-flex items-center gap-2 text-white font-semibold group-hover:translate-x-2 transition-transform">
                Créer mon projet <ArrowRight size={18} />
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div 
          variants={fadeInUp}
          className="text-center mt-12"
        >
          <p className="text-zinc-600 text-sm">
            Powered by <span className="font-display font-semibold text-zinc-500">INKFLOW</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
