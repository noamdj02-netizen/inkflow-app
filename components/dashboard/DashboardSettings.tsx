import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Bell,
  Lock,
  Palette,
  Globe,
  DollarSign,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';

export const DashboardSettings: React.FC = () => {
  const { theme, toggleTheme } = useDashboardTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'billing'>('profile');
  const [showPassword, setShowPassword] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Palette },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'billing', label: 'Facturation', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Paramètres
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className={`flex items-center gap-2 p-2 rounded-xl overflow-x-auto ${
        isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
      }`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Informations personnelles
              </h3>

              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    JD
                  </div>
                  <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </button>
                </div>
                <div>
                  <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    John Doe
                  </h4>
                  <p className="text-gray-500">Tatoueur professionnel</p>
                  <button className="mt-2 text-sm text-violet-500 hover:text-violet-400 font-medium">
                    Modifier la photo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Nom complet</label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <User size={18} className="text-gray-500" />
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Email</label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <Mail size={18} className="text-gray-500" />
                    <input
                      type="email"
                      defaultValue="john@studio.com"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Téléphone</label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <Phone size={18} className="text-gray-500" />
                    <input
                      type="tel"
                      defaultValue="+33 6 12 34 56 78"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Localisation</label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <MapPin size={18} className="text-gray-500" />
                    <input
                      type="text"
                      defaultValue="Paris, France"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-2">Bio</label>
                <textarea
                  rows={4}
                  defaultValue="Tatoueur professionnel spécialisé dans le japonais traditionnel et le réalisme. +10 ans d'expérience."
                  className={`w-full px-4 py-3 rounded-xl resize-none ${
                    isDark
                      ? 'bg-white/5 text-white placeholder-gray-500'
                      : 'bg-gray-100 text-gray-900 placeholder-gray-400'
                  } outline-none`}
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
                  <Save size={18} />
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Apparence
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette size={20} className="text-gray-500" />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Thème sombre
                      </p>
                      <p className="text-sm text-gray-500">Activer le mode sombre</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      isDark ? 'bg-violet-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-transform ${
                        isDark ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe size={20} className="text-gray-500" />
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Langue
                      </p>
                      <p className="text-sm text-gray-500">Français</p>
                    </div>
                  </div>
                  <select className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                  }`}>
                    <option>Français</option>
                    <option>English</option>
                    <option>Español</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>

              <div className="space-y-4">
                {[
                  { label: 'Nouvelles demandes', desc: 'Recevoir une notification pour chaque nouvelle demande' },
                  { label: 'Rappels de RDV', desc: 'Recevoir des rappels 24h avant chaque rendez-vous' },
                  { label: 'Paiements', desc: 'Notifications pour les paiements reçus' },
                  { label: 'Messages clients', desc: 'Alertes pour les nouveaux messages' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-gray-500" />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <button className="relative w-14 h-8 rounded-full bg-violet-500">
                      <div className="absolute w-6 h-6 bg-white rounded-full top-1 translate-x-7" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Changer le mot de passe
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Mot de passe actuel
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                    <button onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} className="text-gray-500" /> : <Eye size={18} className="text-gray-500" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isDark ? 'bg-white/5' : 'bg-gray-100'
                  }`}>
                    <Lock size={18} className="text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                </div>

                <button className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all">
                  Mettre à jour le mot de passe
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Informations de facturation
              </h3>

              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${
                  isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'
                }`}>
                  <p className={`text-sm ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>
                    Compte Stripe connecté ✓
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Les paiements sont traités via Stripe
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    defaultValue="Studio Ink"
                    className={`w-full px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                    } outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    SIRET
                  </label>
                  <input
                    type="text"
                    defaultValue="123 456 789 00012"
                    className={`w-full px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                    } outline-none`}
                  />
                </div>

                <button className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2">
                  <Save size={18} />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
