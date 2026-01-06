import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, PenTool, ArrowRight } from 'lucide-react';

interface ClientHomeProps {
  onNavigate?: (view: any) => void; // Gardé pour compatibilité mais non utilisé
}

export const ClientHome: React.FC<ClientHomeProps> = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Quel est votre projet ?</h2>
        <p className="text-slate-400 text-lg">Choisissez une option pour commencer votre expérience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Flash */}
        <button 
          onClick={() => navigate('/flashs')}
          className="group relative bg-slate-800 rounded-3xl p-8 text-left border border-slate-700 hover:border-amber-400/50 transition-all hover:bg-slate-800/80 overflow-hidden min-h-[300px] flex flex-col justify-between"
        >
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <LayoutGrid size={180} />
           </div>
           
           <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <LayoutGrid size={32} />
           </div>

           <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Flashs</h3>
              <p className="text-slate-400 mb-6">Explorez les designs disponibles, réservez et payez votre acompte instantanément.</p>
              
              <div className="inline-flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                Voir la galerie <ArrowRight size={20} />
              </div>
           </div>
        </button>

        {/* Option 2: Custom */}
        <button 
          onClick={() => navigate('/project')}
          className="group relative bg-slate-800 rounded-3xl p-8 text-left border border-slate-700 hover:border-amber-400/50 transition-all hover:bg-slate-800/80 overflow-hidden min-h-[300px] flex flex-col justify-between"
        >
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <PenTool size={180} />
           </div>
           
           <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-300">
              <PenTool size={32} />
           </div>

           <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">Projet Perso</h3>
              <p className="text-slate-400 mb-6">Décrivez votre idée, obtenez une estimation IA et envoyez votre dossier complet.</p>
              
              <div className="inline-flex items-center gap-2 text-white font-bold group-hover:translate-x-2 transition-transform">
                Créer mon projet <ArrowRight size={20} />
              </div>
           </div>
        </button>
      </div>
    </div>
  );
};