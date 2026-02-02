import React, { useState } from 'react';
import { Zap, Clock, ArrowLeft, Sparkles, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FlashDesign } from '../types';
import { EXAMPLE_FLASHS } from '../constants/flashExamples';
import { OptimizedImage } from './common/OptimizedImage';

interface ExtendedFlashDesign extends FlashDesign {
  duration?: number;
}

const MOCK_FLASHS: ExtendedFlashDesign[] = EXAMPLE_FLASHS.map((flash) => ({
  id: flash.id,
  title: flash.title,
  price: flash.price / 100,
  size: flash.size,
  style: flash.style,
  available: flash.status !== 'sold_out',
  imageUrl: flash.imageUrl,
  duration: flash.duration
}));

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

export const FlashGallery: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);

  const handleBook = (flash: FlashDesign) => {
    if(!flash.available) return;
    setSelectedFlash(flash);
    setTimeout(() => {
      alert(`Redirection vers le paiement de l'acompte (30%) pour le flash "${flash.title}".\nMontant acompte: ${(flash.price * 0.3).toFixed(0)}€`);
      setSelectedFlash(null);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.button
            whileHover={{ x: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Retour</span>
          </motion.button>
          <span className="text-lg font-display font-bold text-white">
            INK<span className="text-zinc-500">FLOW</span>
          </span>
          <div className="w-20"></div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-12 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-zinc-400 tracking-wider uppercase mb-6">
            <Zap size={14} className="text-white" />
            Designs exclusifs
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Flashs Disponibles
          </h2>
          <p className="text-zinc-500 text-lg max-w-md mx-auto">
            Premier arrivé, premier servi. Réservez votre créneau instantanément.
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {MOCK_FLASHS.map((flash) => (
            <motion.div 
              key={flash.id}
              variants={fadeInUp}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`group relative glass rounded-2xl overflow-hidden transition-all ${
                !flash.available ? 'opacity-50' : ''
              }`}
            >
              {/* Image */}
              <div className="aspect-square relative overflow-hidden">
                <OptimizedImage
                  src={flash.imageUrl}
                  alt={`Tatouage ${flash.title}`}
                  className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/80 text-xs">
                      <Eye size={14} />
                      <span>Voir détails</span>
                    </div>
                  </div>
                </div>

                {!flash.available && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-2 font-display font-bold text-sm tracking-wider">
                      VENDU
                    </span>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-display font-semibold text-lg text-white">
                    {flash.title}
                  </h3>
                  <span className="text-white font-display font-bold">
                    {flash.price}€
                  </span>
                </div>
                
                <div className="flex gap-2 text-xs text-zinc-500 mb-5">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> 
                    {flash.duration ? `${Math.floor(flash.duration / 60)}h${flash.duration % 60 > 0 ? `${flash.duration % 60}min` : ''}` : '2h'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {flash.size}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    {flash.style}
                  </span>
                </div>

                <motion.button 
                  whileHover={{ scale: flash.available ? 1.02 : 1 }}
                  whileTap={{ scale: flash.available ? 0.98 : 1 }}
                  onClick={() => handleBook(flash)}
                  disabled={!flash.available}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    flash.available 
                      ? 'bg-white text-black hover:bg-zinc-100' 
                      : 'bg-white/5 text-zinc-600 cursor-not-allowed border border-white/10'
                  }`}
                >
                  {flash.available ? (
                    <>
                      <Sparkles size={16} />
                      Réserver (Acompte 30%)
                    </>
                  ) : (
                    'Indisponible'
                  )}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-zinc-600 text-sm">
            Powered by <span className="font-display font-semibold text-zinc-500">INKFLOW</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};
