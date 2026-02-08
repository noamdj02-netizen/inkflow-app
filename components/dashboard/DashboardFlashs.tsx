import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Tag,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';

const mockFlashs = [
  {
    id: 1,
    title: 'Dragon Japonais',
    image: 'https://images.unsplash.com/photo-1565058164126-4e9b44a879f2?w=400',
    price: 450,
    category: 'Japonais',
    status: 'available',
    views: 234,
    likes: 45,
    sold: false,
  },
  {
    id: 2,
    title: 'Fleurs Aquarelle',
    image: 'https://images.unsplash.com/photo-1590246814883-57c5a8b3830a?w=400',
    price: 280,
    category: 'Aquarelle',
    status: 'available',
    views: 189,
    likes: 67,
    sold: false,
  },
  {
    id: 3,
    title: 'Mandala Géométrique',
    image: 'https://images.unsplash.com/photo-1598558256973-193b8e60f45d?w=400',
    price: 320,
    category: 'Géométrique',
    status: 'sold',
    views: 312,
    likes: 89,
    sold: true,
  },
  {
    id: 4,
    title: 'Portrait Lion',
    image: 'https://images.unsplash.com/photo-1599081595744-7f1e02df4d51?w=400',
    price: 550,
    category: 'Réalisme',
    status: 'available',
    views: 421,
    likes: 103,
    sold: false,
  },
  {
    id: 5,
    title: 'Serpent Tribal',
    image: 'https://images.unsplash.com/photo-1565058326883-da8e6f13246f?w=400',
    price: 380,
    category: 'Tribal',
    status: 'reserved',
    views: 267,
    likes: 54,
    sold: false,
  },
  {
    id: 6,
    title: 'Rose Noire',
    image: 'https://images.unsplash.com/photo-1611916656173-875e4277bea7?w=400',
    price: 220,
    category: 'Floral',
    status: 'available',
    views: 198,
    likes: 71,
    sold: false,
  },
];

export const DashboardFlashs: React.FC = () => {
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const stats = [
    { label: 'Total Flashs', value: mockFlashs.length, gradient: 'from-violet-500 to-purple-600', icon: ImageIcon },
    { label: 'Disponibles', value: mockFlashs.filter((f) => f.status === 'available').length, gradient: 'from-emerald-500 to-teal-600', icon: Tag },
    { label: 'Vendus', value: mockFlashs.filter((f) => f.sold).length, gradient: 'from-blue-500 to-cyan-600', icon: DollarSign },
    { label: 'Vues totales', value: mockFlashs.reduce((acc, f) => acc + f.views, 0), gradient: 'from-orange-500 to-amber-600', icon: TrendingUp },
  ];

  const statusConfig = {
    available: {
      label: 'Disponible',
      color: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    },
    sold: {
      label: 'Vendu',
      color: isDark ? 'bg-gray-500/10 text-gray-400' : 'bg-gray-100 text-gray-600',
    },
    reserved: {
      label: 'Réservé',
      color: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
    },
  };

  const filteredFlashs = mockFlashs.filter((flash) => {
    const matchesSearch = flash.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || flash.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || flash.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Flashs Tattoo
          </h1>
          <p className="text-gray-500 mt-1">
            {filteredFlashs.length} flash{filteredFlashs.length > 1 ? 's' : ''} disponible{filteredFlashs.length > 1 ? 's' : ''}
          </p>
        </div>

        <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2">
          <Plus size={20} />
          Ajouter un Flash
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl p-6 ${
                isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} rounded-full blur-3xl opacity-20`} />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${
          isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <Search size={20} className="text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un flash..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`bg-transparent outline-none w-full ${
                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'text-gray-500'
              }`}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'text-gray-500'
              }`}
            >
              <List size={18} />
            </button>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-4 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'}`}
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponibles</option>
            <option value="reserved">Réservés</option>
            <option value="sold">Vendus</option>
          </select>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlashs.map((flash, index) => (
              <motion.div
                key={flash.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl ${
                  isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={flash.image}
                    alt={flash.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                      <button className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                        <Eye size={16} />
                        Voir
                      </button>
                      <button className="p-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2.5 bg-red-500/10 backdrop-blur-sm text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm ${
                        statusConfig[flash.status as keyof typeof statusConfig].color
                      } border border-white/10`}
                    >
                      {statusConfig[flash.status as keyof typeof statusConfig].label}
                    </span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                      <Eye size={12} />
                      {flash.views}
                    </div>
                    <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white flex items-center gap-1">
                      ❤️ {flash.likes}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {flash.title}
                      </h3>
                      <p className="text-sm text-gray-500">{flash.category}</p>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                      €{flash.price}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFlashs.map((flash, index) => (
              <motion.div
                key={flash.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-6 p-6 rounded-2xl ${
                  isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
                }`}
              >
                <img src={flash.image} alt={flash.title} className="w-32 h-32 object-cover rounded-xl" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {flash.title}
                      </h3>
                      <p className="text-sm text-gray-500">{flash.category}</p>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        statusConfig[flash.status as keyof typeof statusConfig].color
                      }`}
                    >
                      {statusConfig[flash.status as keyof typeof statusConfig].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Eye size={16} />
                      {flash.views} vues
                    </div>
                    <div className="flex items-center gap-1">❤️ {flash.likes} likes</div>
                    <div className="flex items-center gap-1 text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                      <DollarSign size={16} />
                      {flash.price}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2">
                      <Eye size={16} />
                      Voir le détail
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {filteredFlashs.length === 0 && (
        <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'}`}>
          <p className="text-gray-500">Aucun flash trouvé</p>
        </div>
      )}
    </div>
  );
};
