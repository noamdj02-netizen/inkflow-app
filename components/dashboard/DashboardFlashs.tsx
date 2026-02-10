import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Grid3x3,
  List,
  Edit,
  Trash2,
  X,
  Upload,
  Image as ImageIcon,
  Tag,
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  ChevronDown,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { supabase } from '../../services/supabase';

// ─── Types ───────────────────────────────────────────────────────────
interface Flash {
  id: string;
  artist_id: string;
  title: string;
  image_url: string;
  prix: number;
  deposit_amount: number | null;
  duree_minutes: number;
  taille_cm: string | null;
  style: string | null;
  statut: 'available' | 'reserved' | 'sold_out';
  stock_limit: number;
  stock_current: number;
  created_at: string;
  updated_at: string;
}

interface FlashFormData {
  title: string;
  priceEuros: string;
  depositEuros: string;
  duree_minutes: string;
  taille_cm: string;
  style: string;
  statut: 'available' | 'reserved' | 'sold_out';
  stock_limit: string;
}

const STYLE_OPTIONS = [
  'Traditionnel', 'Neo-traditionnel', 'Réalisme', 'Japonais', 'Tribal',
  'Dotwork', 'Géométrique', 'Aquarelle', 'Minimaliste', 'Blackwork',
  'Lettering', 'Old School', 'New School', 'Floral', 'Mandala', 'Autre',
];

const STATUS_OPTIONS: { value: Flash['statut']; label: string }[] = [
  { value: 'available', label: 'Disponible' },
  { value: 'reserved', label: 'Réservé' },
  { value: 'sold_out', label: 'Vendu' },
];

const emptyForm: FlashFormData = {
  title: '',
  priceEuros: '',
  depositEuros: '',
  duree_minutes: '',
  taille_cm: '',
  style: '',
  statut: 'available',
  stock_limit: '1',
};

// ─── Component ───────────────────────────────────────────────────────
export const DashboardFlashs: React.FC = () => {
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const { profile } = useArtistProfile();

  // Data
  const [flashs, setFlashs] = useState<Flash[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingFlash, setEditingFlash] = useState<Flash | null>(null);
  const [form, setForm] = useState<FlashFormData>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Flash | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Status quick-change
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Flashs ────────────────────────────────────────────────
  const fetchFlashs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashs')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlashs((data as Flash[]) || []);
    } catch (err) {
      console.error('Erreur chargement flashs:', err);
      toast.error('Impossible de charger les flashs');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFlashs();
  }, [fetchFlashs]);

  // ─── Filtering ───────────────────────────────────────────────────
  const filteredFlashs = flashs.filter((f) => {
    const matchSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || f.statut === filterStatus;
    return matchSearch && matchStatus;
  });

  // ─── KPI ─────────────────────────────────────────────────────────
  const totalFlashs = flashs.length;
  const disponibles = flashs.filter((f) => f.statut === 'available').length;
  const reserves = flashs.filter((f) => f.statut === 'reserved').length;
  const revenuTotal = flashs
    .filter((f) => f.statut === 'reserved' || f.statut === 'sold_out')
    .reduce((sum, f) => sum + f.prix, 0);

  const stats = [
    { label: 'Total Flashs', value: totalFlashs, gradient: 'from-violet-500 to-purple-600', icon: ImageIcon },
    { label: 'Disponibles', value: disponibles, gradient: 'from-emerald-500 to-teal-600', icon: Tag },
    { label: 'Réservés', value: reserves, gradient: 'from-amber-500 to-orange-600', icon: Clock },
    { label: 'Revenu total', value: `${(revenuTotal / 100).toFixed(0)}€`, gradient: 'from-blue-500 to-cyan-600', icon: TrendingUp },
  ];

  // ─── Status config ───────────────────────────────────────────────
  const statusConfig: Record<Flash['statut'], { label: string; color: string }> = {
    available: {
      label: 'Disponible',
      color: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    reserved: {
      label: 'Réservé',
      color: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
    },
    sold_out: {
      label: 'Vendu',
      color: isDark ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-gray-100 text-gray-600 border-gray-200',
    },
  };

  // ─── Modal helpers ───────────────────────────────────────────────
  const openAddModal = () => {
    setEditingFlash(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (flash: Flash) => {
    setEditingFlash(flash);
    setForm({
      title: flash.title,
      priceEuros: (flash.prix / 100).toString(),
      depositEuros: flash.deposit_amount ? (flash.deposit_amount / 100).toString() : '',
      duree_minutes: flash.duree_minutes.toString(),
      taille_cm: flash.taille_cm || '',
      style: flash.style || '',
      statut: flash.statut,
      stock_limit: flash.stock_limit.toString(),
    });
    setImageFile(null);
    setImagePreview(flash.image_url);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingFlash(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview(null);
  };

  // ─── Image handling ──────────────────────────────────────────────
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 Mo');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ─── Save flash ──────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error('Le titre est requis'); return; }
    if (!form.priceEuros || parseFloat(form.priceEuros) <= 0) { toast.error('Le prix est requis'); return; }
    if (!form.duree_minutes || parseInt(form.duree_minutes) <= 0) { toast.error('La durée est requise'); return; }
    if (!editingFlash && !imageFile) { toast.error('Une image est requise'); return; }

    setSaving(true);
    try {
      let imageUrl = editingFlash?.image_url || '';

      // Upload image if new file selected
      if (imageFile) {
        const filePath = `${user.id}/${Date.now()}_${imageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('flash-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('flash-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      }

      const prixCentimes = Math.round(parseFloat(form.priceEuros) * 100);
      const depositCentimes = form.depositEuros ? Math.round(parseFloat(form.depositEuros) * 100) : null;

      const flashData = {
        title: form.title.trim(),
        image_url: imageUrl,
        prix: prixCentimes,
        deposit_amount: depositCentimes,
        duree_minutes: parseInt(form.duree_minutes),
        taille_cm: form.taille_cm.trim() || null,
        style: form.style || null,
        statut: form.statut,
        stock_limit: parseInt(form.stock_limit) || 1,
      };

      if (editingFlash) {
        const { error } = await supabase
          .from('flashs')
          .update({ ...flashData, updated_at: new Date().toISOString() })
          .eq('id', editingFlash.id);
        if (error) throw error;
        toast.success('Flash mis à jour');
      } else {
        const { error } = await supabase
          .from('flashs')
          .insert({ ...flashData, artist_id: user.id });
        if (error) throw error;
        toast.success('Flash ajouté');
      }

      closeModal();
      fetchFlashs();
    } catch (err: any) {
      console.error('Erreur sauvegarde flash:', err);
      toast.error(err?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete flash ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete image from storage
      const urlParts = deleteTarget.image_url.split('/flash-images/');
      if (urlParts.length > 1) {
        const storagePath = decodeURIComponent(urlParts[1]);
        await supabase.storage.from('flash-images').remove([storagePath]);
      }

      const { error } = await supabase.from('flashs').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      toast.success('Flash supprimé');
      setDeleteTarget(null);
      fetchFlashs();
    } catch (err: any) {
      console.error('Erreur suppression flash:', err);
      toast.error(err?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Quick status change ─────────────────────────────────────────
  const handleStatusChange = async (flash: Flash, newStatus: Flash['statut']) => {
    setStatusMenuId(null);
    try {
      const { error } = await supabase
        .from('flashs')
        .update({ statut: newStatus, updated_at: new Date().toISOString() })
        .eq('id', flash.id);
      if (error) throw error;
      toast.success(`Statut changé: ${statusConfig[newStatus].label}`);
      fetchFlashs();
    } catch (err: any) {
      console.error('Erreur changement statut:', err);
      toast.error('Erreur lors du changement de statut');
    }
  };

  // ─── Styles helpers ──────────────────────────────────────────────
  const cardClass = isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200';
  const inputClass = `w-full px-4 py-3 rounded-xl outline-none transition-colors ${
    isDark
      ? 'bg-white/5 text-white border border-white/[0.06] focus:border-violet-500/50 placeholder-gray-500'
      : 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-violet-400 placeholder-gray-400'
  }`;
  const labelClass = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  // ─── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className={`h-8 w-48 rounded-lg animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
            <div className={`h-4 w-32 rounded mt-2 animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`h-28 rounded-xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
          ))}
        </div>
        <div className={`h-16 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-80 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Flashs Tattoo
          </h1>
          <p className="text-gray-500 mt-1">
            {totalFlashs} flash{totalFlashs > 1 ? 's' : ''} au total
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Ajouter un Flash
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-xl p-6 ${cardClass}`}
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

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${cardClass}`}
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
            className={`px-4 py-3 rounded-xl font-medium outline-none ${
              isDark ? 'bg-white/5 text-white border border-white/[0.06]' : 'bg-gray-100 text-gray-900 border border-gray-200'
            }`}
          >
            <option value="all">Tous les statuts</option>
            <option value="available">Disponibles</option>
            <option value="reserved">Réservés</option>
            <option value="sold_out">Vendus</option>
          </select>
        </div>
      </motion.div>

      {/* Flash Grid / List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {filteredFlashs.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${cardClass}`}>
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
              <Zap size={28} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
            </div>
            <p className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {searchTerm || filterStatus !== 'all' ? 'Aucun flash trouvé' : 'Aucun flash pour le moment'}
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm || filterStatus !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Ajoutez votre premier flash tattoo pour commencer'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={openAddModal}
                className="mt-4 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Ajouter un Flash
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFlashs.map((flash, index) => (
              <motion.div
                key={flash.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-2xl ${cardClass}`}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={flash.image_url}
                    alt={flash.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(flash)}
                        className="flex-1 px-4 py-2.5 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Modifier
                      </button>
                      <button
                        onClick={() => setDeleteTarget(flash)}
                        className="p-2.5 bg-red-500/10 backdrop-blur-sm text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {/* Status badge */}
                  <div className="absolute top-4 right-4">
                    <div className="relative">
                      <button
                        onClick={() => setStatusMenuId(statusMenuId === flash.id ? null : flash.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border flex items-center gap-1 transition-colors ${statusConfig[flash.statut].color}`}
                      >
                        {statusConfig[flash.statut].label}
                        <ChevronDown size={12} />
                      </button>
                      <AnimatePresence>
                        {statusMenuId === flash.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`absolute top-full right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-20 min-w-[130px] ${
                              isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'
                            }`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(flash, opt.value)}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                  flash.statut === opt.value
                                    ? 'bg-violet-500/10 text-violet-400'
                                    : isDark
                                    ? 'text-gray-300 hover:bg-white/5'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  {/* Style tag */}
                  {flash.style && (
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-xs text-white">
                        {flash.style}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {flash.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        {flash.duree_minutes > 0 && (
                          <span className="flex items-center gap-1"><Clock size={12} />{flash.duree_minutes} min</span>
                        )}
                        {flash.taille_cm && (
                          <span>{flash.taille_cm} cm</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent whitespace-nowrap ml-2">
                      {(flash.prix / 100).toFixed(0)}€
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
                className={`flex items-center gap-6 p-6 rounded-2xl ${cardClass}`}
              >
                <img
                  src={flash.image_url}
                  alt={flash.title}
                  className="w-32 h-32 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <h3 className={`font-bold text-xl truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {flash.title}
                      </h3>
                      {flash.style && <p className="text-sm text-gray-500">{flash.style}</p>}
                    </div>
                    <div className="relative ml-3 flex-shrink-0">
                      <button
                        onClick={() => setStatusMenuId(statusMenuId === flash.id ? null : flash.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 ${statusConfig[flash.statut].color}`}
                      >
                        {statusConfig[flash.statut].label}
                        <ChevronDown size={12} />
                      </button>
                      <AnimatePresence>
                        {statusMenuId === flash.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className={`absolute top-full right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-20 min-w-[130px] ${
                              isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'
                            }`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(flash, opt.value)}
                                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                                  flash.statut === opt.value
                                    ? 'bg-violet-500/10 text-violet-400'
                                    : isDark
                                    ? 'text-gray-300 hover:bg-white/5'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                    {flash.duree_minutes > 0 && (
                      <span className="flex items-center gap-1"><Clock size={14} />{flash.duree_minutes} min</span>
                    )}
                    {flash.taille_cm && <span>{flash.taille_cm} cm</span>}
                    <span className="text-xl font-bold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
                      {(flash.prix / 100).toFixed(0)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(flash)}
                      className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Edit size={16} />
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeleteTarget(flash)}
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

      {/* ─── Add / Edit Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 ${
                isDark ? 'bg-[#12122a] border border-white/10' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {editingFlash ? 'Modifier le Flash' : 'Nouveau Flash'}
                </h2>
                <button
                  onClick={closeModal}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image upload */}
              <div className="mb-5">
                <label className={labelClass}>Image *</label>
                <div
                  ref={dropZoneRef}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden ${
                    imagePreview
                      ? 'border-transparent'
                      : isDark
                      ? 'border-white/10 hover:border-violet-500/40 bg-white/[0.02]'
                      : 'border-gray-300 hover:border-violet-400 bg-gray-50'
                  }`}
                >
                  {imagePreview ? (
                    <div className="relative aspect-video">
                      <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <span className="text-white font-medium text-sm">Changer l'image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Upload size={32} className={isDark ? 'text-gray-500 mb-3' : 'text-gray-400 mb-3'} />
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Glissez une image ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP • Max 5 Mo</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                  />
                </div>
              </div>

              {/* Form grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="md:col-span-2">
                  <label className={labelClass}>Titre *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ex: Dragon Japonais"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Prix (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.priceEuros}
                    onChange={(e) => setForm({ ...form, priceEuros: e.target.value })}
                    placeholder="150"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Acompte (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.depositEuros}
                    onChange={(e) => setForm({ ...form, depositEuros: e.target.value })}
                    placeholder="50"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Durée (min) *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.duree_minutes}
                    onChange={(e) => setForm({ ...form, duree_minutes: e.target.value })}
                    placeholder="120"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Taille (cm)</label>
                  <input
                    type="text"
                    value={form.taille_cm}
                    onChange={(e) => setForm({ ...form, taille_cm: e.target.value })}
                    placeholder="Ex: 15x10"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Style</label>
                  <select
                    value={form.style}
                    onChange={(e) => setForm({ ...form, style: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un style</option>
                    {STYLE_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Stock limite</label>
                  <input
                    type="number"
                    min="1"
                    value={form.stock_limit}
                    onChange={(e) => setForm({ ...form, stock_limit: e.target.value })}
                    placeholder="1"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Status selector */}
              <div className="mb-6">
                <label className={labelClass}>Statut</label>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, statut: opt.value })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.statut === opt.value
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-transparent'
                          : isDark
                          ? 'bg-white/5 text-gray-400 border-white/[0.06] hover:border-white/10'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                    isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {editingFlash ? 'Mettre à jour' : 'Créer le Flash'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirmation ──────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl p-6 ${
                isDark ? 'bg-[#12122a] border border-white/10' : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <AlertTriangle size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Supprimer ce flash ?
                  </h3>
                  <p className="text-sm text-gray-500">Cette action est irréversible</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-4 rounded-xl mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <img
                  src={deleteTarget.image_url}
                  alt={deleteTarget.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {deleteTarget.title}
                  </p>
                  <p className="text-sm text-gray-500">{(deleteTarget.prix / 100).toFixed(0)}€</p>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${
                    isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleting && <Loader2 size={16} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away for status menus */}
      {statusMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setStatusMenuId(null)} />
      )}
    </div>
  );
};
