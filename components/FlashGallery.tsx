import React, { useState } from 'react';
import { Zap, Clock, CheckCircle } from 'lucide-react';
import { FlashDesign } from '../types';
import { EXAMPLE_FLASHS } from '../constants/flashExamples';

// Interface étendue pour inclure la durée
interface ExtendedFlashDesign extends FlashDesign {
  duration?: number; // Durée en minutes
}

// Convertir les exemples de flashs au format FlashDesign
const MOCK_FLASHS: ExtendedFlashDesign[] = EXAMPLE_FLASHS.map((flash) => ({
  id: flash.id,
  title: flash.title,
  price: flash.price / 100, // Convertir centimes en euros
  size: flash.size,
  style: flash.style,
  available: flash.status !== 'sold_out',
  imageUrl: flash.imageUrl,
  duration: flash.duration
}));

export const FlashGallery: React.FC = () => {
  const [selectedFlash, setSelectedFlash] = useState<FlashDesign | null>(null);

  const handleBook = (flash: FlashDesign) => {
    if(!flash.available) return;
    setSelectedFlash(flash);
    // In a real app, this would open a Stripe modal
    setTimeout(() => {
        alert(`Redirection vers le paiement de l'acompte (30%) pour le flash "${flash.title}".\nMontant acompte: ${(flash.price * 0.3).toFixed(0)}€`);
        setSelectedFlash(null);
    }, 500);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Zap className="text-amber-400" /> Flashs Disponibles
        </h2>
        <p className="text-slate-400">Premier arrivé, premier servi. Réservez votre créneau instantanément.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_FLASHS.map((flash) => (
          <div 
            key={flash.id} 
            className={`group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 transition-all hover:border-amber-500/50 ${!flash.available ? 'opacity-50 grayscale' : ''}`}
          >
            <div className="aspect-square relative overflow-hidden">
                <img 
                    src={flash.imageUrl} 
                    alt={flash.title} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />
                {!flash.available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-1 font-bold transform -rotate-12 rounded">VENDU</span>
                    </div>
                )}
            </div>
            
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white">{flash.title}</h3>
                    <span className="text-amber-400 font-mono font-bold">{flash.price}€</span>
                </div>
                
                <div className="flex gap-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> 
                      {flash.duration ? `${Math.floor(flash.duration / 60)}h${flash.duration % 60 > 0 ? ` ${flash.duration % 60}min` : ''}` : '2h'} approx
                    </span>
                    <span className="border border-slate-600 px-2 rounded text-xs py-0.5">{flash.size}</span>
                    <span className="border border-slate-600 px-2 rounded text-xs py-0.5">{flash.style}</span>
                </div>

                <button 
                    onClick={() => handleBook(flash)}
                    disabled={!flash.available}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                        flash.available 
                        ? 'bg-white text-slate-900 hover:bg-amber-400 hover:text-black' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                >
                    {flash.available ? 'Réserver (Acompte 30%)' : 'Indisponible'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};