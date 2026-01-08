import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Upload, X, Loader2, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import type { Database } from '../types/supabase';

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

  // Charger les flashs de l'artiste
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

  // Upload d'image vers Supabase Storage
  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `flashs/${fileName}`;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload vers Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('flash-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
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

      // Upload de l'image si un fichier est sélectionné
      if (formData.imageFile) {
        imageUrl = await uploadImage(formData.imageFile);
      }

      if (!imageUrl && !editingFlash) {
        setError('Veuillez sélectionner une image');
        return;
      }

      if (editingFlash) {
        // Mise à jour
        const updateData: FlashUpdate = {
          title: formData.title,
          prix: Math.round(parseFloat(formData.prix) * 100), // Convertir en centimes
          duree_minutes: parseInt(formData.duree_minutes),
          taille_cm: formData.taille_cm || null,
          style: formData.style || null,
          stock_limit: parseInt(formData.stock_limit) || 1,
          image_url: imageUrl || editingFlash.image_url,
          statut: 'available',
        };

        const { error: updateError } = await supabase
          .from('flashs')
          .update(updateData)
          .eq('id', editingFlash.id);

        if (updateError) throw updateError;
      } else {
        // Création
        const insertData: FlashInsert = {
          artist_id: user.id,
          title: formData.title,
          prix: Math.round(parseFloat(formData.prix) * 100), // Convertir en centimes
          duree_minutes: parseInt(formData.duree_minutes),
          taille_cm: formData.taille_cm || null,
          style: formData.style || null,
          stock_limit: parseInt(formData.stock_limit) || 1,
          image_url: imageUrl || '',
          statut: 'available',
        };

        const { error: insertError } = await supabase
          .from('flashs')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      // Réinitialiser le formulaire et fermer la modal
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
      prix: (flash.prix / 100).toString(), // Convertir centimes -> euros
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
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setFormData({ ...formData, imageFile: file });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-amber-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mes Flashs</h2>
          <p className="text-slate-400 text-sm mt-1">Gérez vos designs disponibles</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-300 transition-colors"
        >
          <Plus size={18} /> Nouveau Flash
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400 shrink-0" size={20} />
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} className="text-red-400" />
          </button>
        </div>
      )}

      {/* Flashs Grid */}
      {flashs.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <ImageIcon className="text-slate-600 mx-auto mb-4" size={48} />
          <p className="text-slate-400 mb-4">Aucun flash pour le moment</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-amber-300"
          >
            Créer votre premier flash
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashs.map((flash) => (
            <div
              key={flash.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-amber-500/50 transition-colors"
            >
              <div className="aspect-square relative overflow-hidden bg-slate-900">
                <img
                  src={flash.image_url}
                  alt={flash.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+non+disponible';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      flash.statut === 'available'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : flash.statut === 'reserved'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {flash.statut === 'available' ? 'Disponible' : flash.statut === 'reserved' ? 'Réservé' : 'Vendu'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white mb-2">{flash.title}</h3>
                <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                  <span>{flash.prix / 100}€</span>
                  <span>{flash.duree_minutes} min</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(flash)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-600 transition-colors text-sm font-medium"
                  >
                    <Edit2 size={16} /> Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(flash.id)}
                    className="flex items-center justify-center gap-2 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Création/Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingFlash ? 'Modifier le Flash' : 'Nouveau Flash'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image du Flash <span className="text-red-500">*</span>
                </label>
                {formData.imageUrl && !formData.imageFile && (
                  <div className="mb-4 relative">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {formData.imageFile && (
                  <div className="mb-4 relative">
                    <img
                      src={URL.createObjectURL(formData.imageFile)}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageFile: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-400/50 transition-colors bg-slate-900/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="text-slate-400 mb-2" size={24} />
                    <p className="text-sm text-slate-400">
                      <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG jusqu'à 5MB</p>
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
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <Loader2 className="animate-spin" size={16} />
                      <span>Upload en cours... {uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                  placeholder="Ex: Serpent Floral"
                />
              </div>

              {/* Prix et Durée */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Prix (€) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="150"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Durée (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duree_minutes}
                    onChange={(e) => setFormData({ ...formData, duree_minutes: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="120"
                  />
                </div>
              </div>

              {/* Taille et Style */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Taille (cm)</label>
                  <input
                    type="text"
                    value={formData.taille_cm}
                    onChange={(e) => setFormData({ ...formData, taille_cm: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="10x5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="Fine Line"
                  />
                </div>
              </div>

              {/* Stock Limit */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de réservations possibles
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.stock_limit}
                  onChange={(e) => setFormData({ ...formData, stock_limit: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                />
                <p className="text-xs text-slate-500 mt-1">
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
                  className="flex-1 border border-slate-600 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Upload...' : editingFlash ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

