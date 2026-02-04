import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Search, Filter, Mail, Phone, MapPin, Calendar } from 'lucide-react';

export const DashboardClients: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                <Users className="text-brand-cyan" size={20} />
              </div>
              Clients & Documents
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Gérez vos clients et leurs documents</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors">
              <UserPlus size={16} />
              Ajouter
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-6">
        {/* Coming Soon Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-12 text-center"
        >
          <div className="w-20 h-20 glass rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="text-zinc-500" size={40} />
          </div>
          <h3 className="text-2xl font-display font-bold text-white mb-3">Bientôt Disponible</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-8">
            Le module CRM pour gérer vos clients, leurs historiques de tatouages et leurs documents (décharges, consentements) sera disponible prochainement.
          </p>
          
          {/* Preview Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="glass rounded-xl p-4 text-left">
              <div className="w-10 h-10 bg-brand-purple/10 rounded-lg flex items-center justify-center mb-3">
                <Users className="text-brand-purple" size={18} />
              </div>
              <h4 className="text-white font-medium mb-1">Fiches Clients</h4>
              <p className="text-zinc-500 text-xs">Historique complet de chaque client</p>
            </div>
            <div className="glass rounded-xl p-4 text-left">
              <div className="w-10 h-10 bg-brand-cyan/10 rounded-lg flex items-center justify-center mb-3">
                <Mail className="text-brand-cyan" size={18} />
              </div>
              <h4 className="text-white font-medium mb-1">Communication</h4>
              <p className="text-zinc-500 text-xs">SMS et emails automatisés</p>
            </div>
            <div className="glass rounded-xl p-4 text-left">
              <div className="w-10 h-10 bg-brand-mint/10 rounded-lg flex items-center justify-center mb-3">
                <Calendar className="text-brand-mint" size={18} />
              </div>
              <h4 className="text-white font-medium mb-1">Documents</h4>
              <p className="text-zinc-500 text-xs">Décharges et consentements</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
