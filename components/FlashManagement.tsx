import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Upload, X, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../types/supabase';
import { EmptyState } from './common/EmptyState';
import { Skeleton } from './common/Skeleton';
import { ImageSkeleton } from './common/ImageSkeleton';

type Flash = Database['public']['Tables']['flashs']['Row'];
type FlashInsert = Database['public']['Tables']['flashs']['Insert'];
type FlashUpdate = Database['public']['Tables']['flashs']['Update'];

export const FlashManagement: React.FC = () => {
  const { user } = useAuth();
  const [flashs, setFlashs] = useState<Flash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlash, setEditingFlash] = useState<Flash | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    prix: '',
    duree_minutes: '',
    taille_cm: '',
    style: '',
    stock_limit: '1',
    imageFile: null as File | null,
    imageUrl: '',
  });

  useEffect(() => {
    if (user) {
      fetchFlashs();
    }
  }, [user]);

  const fetchFlashs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('flashs')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setFlashs(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des flashs';
      setError(errorMessage);
      console.error('Error fetching flashs:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `flashs/${fileName}`;

    setUploading(true);
    setUploadProgress(0);

    try {
      const { error: uploadError } = await supabase.storage
        .from('flash-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('flash-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      return urlData.publicUrl;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    try {
      let imageUrl = formData.imageUrl;

      if (formData.imageFile) {
        imageUrl = await uploadImage(formData.imageFile);
      }

      if (!imageUrl && !editingFlash) {
        setError('Veuillez sélectionner une image');
        return;
      }

      if (editingFlash) {
        const updateData: FlashUpdate = {
          title: formData.title,
          prix: Math.round(parseFloat(formData.prix) * 100),
          duree_minutes: parseInt(formData.duree_minutes),
          taille_cm: formData.taille_cm || null,
          style: formData.style || null,
          stock_limit: parseInt(formData.stock_limit) || 1,
          image_url: imageUrl || editingFlash.image_url,
          statut: 'available',
        };

        const { error: updateError } = await supabase
          .from('flashs')
          // @ts-expect-error - Supabase builder Update type can resolve to never with some type versions
          .update(updateData)
          .eq('id', editingFlash.id);

        if (updateError) throw updateError;
      } else {
        const insertData: FlashInsert = {
          artist_id: user.id,
          title: formData.title,
          prix: Math.round(parseFloat(formData.prix) * 100),
          duree_minutes: parseInt(formData.duree_minutes),
          taille_cm: formData.taille_cm || null,
          style: formData.style || null,
          stock_limit: parseInt(formData.stock_limit) || 1,
          image_url: imageUrl || '',
          statut: 'available',
        };

        const { error: insertError } = await supabase
          .from('flashs')
          // @ts-expect-error - Supabase builder Insert type can resolve to never with some type versions
          .insert(insertData);

        if (insertError) throw insertError;
      }

      resetForm();
      setIsModalOpen(false);
      fetchFlashs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      console.error('Error saving flash:', err);
    }
  };

  const handleDelete = async (flashId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce flash ?')) return;

    try {
      const { error } = await supabase
        .from('flashs')
        .delete()
        .eq('id', flashId);

      if (error) throw error;
      fetchFlashs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      console.error('Error deleting flash:', err);
    }
  };

  const handleEdit = (flash: Flash) => {
    setEditingFlash(flash);
    setFormData({
      title: flash.title,
      prix: (flash.prix / 100).toString(),
      duree_minutes: flash.duree_minutes.toString(),
      taille_cm: flash.taille_cm || '',
      style: flash.style || '',
      stock_limit: flash.stock_limit.toString(),
      imageFile: null,
      imageUrl: flash.image_url,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      prix: '',
      duree_minutes: '',
      taille_cm: '',
      style: '',
      stock_limit: '1',
      imageFile: null,
      imageUrl: '',
    });
    setEditingFlash(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setFormData({ ...formData, imageFile: file });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-11 w-44" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl overflow-hidden">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Mes Flashs</h2>
          <p className="text-zinc-500 text-sm mt-1">Gérez vos designs disponibles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
        >
          <Plus size={18} /> Nouveau Flash
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="text-brand-pink shrink-0" size={20} />
          <p className="text-brand-pink text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X size={18} className="text-brand-pink/60 hover:text-brand-pink" />
          </button>
        </motion.div>
      )}

      {/* Flashs Grid */}
      {flashs.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <EmptyState
            icon={ImageIcon}
            title="Aucun flash pour le moment"
            description="Ajoutez vos premiers designs pour commencer à recevoir des réservations."
            primaryAction={{
              label: 'Créer mon premier flash',
              onClick: () => {
                resetForm();
                setIsModalOpen(true);
              },
            }}
          />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashs.map((flash, index) => (
            <motion.div
              key={flash.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl overflow-hidden hover:bg-white/5 transition-colors group"
            >
              <div className="aspect-square relative overflow-hidden bg-[#050505]">
                <ImageSkeleton
                  src={flash.image_url}
                  alt={`Tatouage ${flash.title} - Design de flash`}
                  className="w-full h-full"
                  aspectRatio="aspect-square"
                  fallbackSrc="https://via.placeholder.com/400?text=Image+non+disponible"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      flash.statut === 'available'
                        ? 'bg-brand-mint/10 text-brand-mint border-brand-mint/20'
                        : flash.statut === 'reserved'
                        ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20'
                        : 'bg-brand-pink/10 text-brand-pink border-brand-pink/20'
                    }`}
                  >
                    {flash.statut === 'available' ? 'Disponible' : flash.statut === 'reserved' ? 'Réservé' : 'Vendu'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white mb-2">{flash.title}</h3>
                <div className="flex items-center justify-between text-sm text-zinc-500 mb-4">
                  <span className="text-white font-bold">{flash.prix / 100}€</span>
                  <span>{flash.duree_minutes} min</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(flash)}
                    className="flex-1 flex items-center justify-center gap-2 glass text-zinc-300 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
                  >
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(flash.id)}
                    className="flex items-center justify-center gap-2 bg-brand-pink/10 text-brand-pink px-3 py-2 rounded-xl hover:bg-brand-pink/20 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Création/Édition */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-display font-bold text-white">
                    {editingFlash ? 'Modifier le Flash' : 'Nouveau Flash'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Image du Flash <span className="text-brand-pink">*</span>
                    </label>
                    {formData.imageUrl && !formData.imageFile && (
                      <div className="mb-4 relative">
                        <ImageSkeleton
                          src={formData.imageUrl}
                          alt="Aperçu du design de flash"
                          className="w-full h-64 rounded-xl border border-white/10"
                          aspectRatio=""
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute top-2 right-2 bg-brand-pink text-white p-2 rounded-full hover:bg-brand-pink/80"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {formData.imageFile && (
                      <div className="mb-4 relative">
                        <img
                          src={URL.createObjectURL(formData.imageFile)}
                          alt="Aperçu du design de flash sélectionné"
                          className="w-full h-64 object-cover rounded-xl border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageFile: null })}
                          className="absolute top-2 right-2 bg-brand-pink text-white p-2 rounded-full hover:bg-brand-pink/80"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-white/30 transition-colors bg-[#050505]">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="text-zinc-500 mb-2" size={24} />
                        <p className="text-sm text-zinc-500">
                          <span className="font-semibold text-zinc-300">Cliquez pour uploader</span> ou glissez-déposez
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">PNG, JPG jusqu'à 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={uploading}
                      />
                    </label>
                    {uploading && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Loader2 className="animate-spin" size={16} />
                          <span>Upload en cours... {uploadProgress}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Titre <span className="text-brand-pink">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                      placeholder="Ex: Serpent Floral"
                    />
                  </div>

                  {/* Prix et Durée */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Prix (€) <span className="text-brand-pink">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.prix}
                        onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                        required
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Durée (min) <span className="text-brand-pink">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.duree_minutes}
                        onChange={(e) => setFormData({ ...formData, duree_minutes: e.target.value })}
                        required
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="120"
                      />
                    </div>
                  </div>

                  {/* Taille et Style */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Taille (cm)</label>
                      <input
                        type="text"
                        value={formData.taille_cm}
                        onChange={(e) => setFormData({ ...formData, taille_cm: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="10x5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Style</label>
                      <input
                        type="text"
                        value={formData.style}
                        onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                        className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                        placeholder="Fine Line"
                      />
                    </div>
                  </div>

                  {/* Stock Limit */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Nombre de réservations possibles
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.stock_limit}
                      onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                    />
                    <p className="text-xs text-zinc-600 mt-1">
                      1 = flash unique (une seule réservation possible)
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        resetForm();
                      }}
                      className="flex-1 glass text-zinc-300 font-medium py-3 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Upload...' : editingFlash ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
