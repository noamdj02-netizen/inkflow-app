import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Upload, X, Loader2, AlertCircle, CheckCircle, Palette, CreditCard, Mail, User, Image as ImageIcon } from 'lucide-react';
import { useArtistProfile } from '../contexts/ArtistProfileContext';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Utiliser les hooks normalement (ils doivent être au niveau racine)
  const { profile, loading: profileLoading, updateProfile, error: profileError } = useArtistProfile();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    nom_studio: '',
    bio_instagram: '',
    accent_color: 'gold',
    deposit_percentage: 30,
    avatarFile: null as File | null,
    avatarUrl: '',
  });

  // Charger les données du profil dans le formulaire
  useEffect(() => {
    if (profile) {
      setFormData({
        nom_studio: profile.nom_studio || '',
        bio_instagram: profile.bio_instagram || '',
        accent_color: profile.accent_color || 'gold',
        deposit_percentage: profile.deposit_percentage || 30,
        avatarFile: null,
        avatarUrl: '', // L'avatar sera géré séparément si nécessaire
      });
    }
  }, [profile]);

  // Upload de l'avatar vers Supabase Storage
  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `avatar.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploadingAvatar(true);

    try {
      // Supprimer l'ancien avatar s'il existe
      const { data: existingFiles } = await supabase.storage
        .from('flash-images')
        .list(`${user.id}/`, {
          search: 'avatar',
        });

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('flash-images')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      // Upload du nouvel avatar
      const { data, error: uploadError } = await supabase.storage
        .from('flash-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('flash-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      return urlData.publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier la taille (max 2MB pour avatar)
      if (file.size > 2 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 2MB');
        return;
      }
      // Vérifier le type
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }
      setFormData({ ...formData, avatarFile: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      let avatarUrl = profile?.bio_instagram || ''; // Placeholder, à remplacer par avatar_url si ajouté au schéma

      // Upload de l'avatar si un fichier est sélectionné
      if (formData.avatarFile) {
        avatarUrl = await uploadAvatar(formData.avatarFile);
        // Note: Si vous ajoutez avatar_url à la table artists, utilisez-le ici
      }

      // Mettre à jour le profil
      await updateProfile({
        nom_studio: formData.nom_studio,
        bio_instagram: formData.bio_instagram,
        accent_color: formData.accent_color,
        deposit_percentage: formData.deposit_percentage,
        // avatar_url: avatarUrl, // Décommentez si vous ajoutez ce champ au schéma
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const colorOptions = [
    { name: 'Or', value: 'gold', hex: '#fbbf24' },
    { name: 'Rouge', value: 'red', hex: '#ef4444' },
    { name: 'Bleu', value: 'blue', hex: '#3b82f6' },
    { name: 'Vert', value: 'green', hex: '#22c55e' },
    { name: 'Violet', value: 'purple', hex: '#a855f7' },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400 mb-4">Vous devez être connecté</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-amber-400 text-black px-6 py-2 rounded-lg font-bold"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Afficher une erreur si le contexte a une erreur
  if (profileError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{profileError}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-amber-300"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-amber-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Profil non trouvé</h2>
          <p className="text-slate-400 mb-6">
            Vous devez d'abord compléter votre profil dans l'onboarding.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-amber-400 text-black px-6 py-3 rounded-lg font-bold hover:bg-amber-300"
          >
            Créer mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres du Compte</h1>
          <p className="text-slate-400">Gérez vos informations personnelles et préférences</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-400 shrink-0" size={20} />
            <p className="text-red-300 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X size={18} className="text-red-400" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-400 shrink-0" size={20} />
            <p className="text-green-300 text-sm">Profil mis à jour avec succès !</p>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Informations de Base */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Informations de Base</h3>
                <p className="text-sm text-slate-400">Vos informations publiques</p>
              </div>
            </div>

            {/* Nom du Studio */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom du Studio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nom_studio}
                onChange={(e) => setFormData({ ...formData, nom_studio: e.target.value })}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                placeholder="Ex: Zonett Ink"
              />
            </div>

            {/* Bio Instagram */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio Instagram
              </label>
              <textarea
                rows={3}
                value={formData.bio_instagram}
                onChange={(e) => setFormData({ ...formData, bio_instagram: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-amber-400 resize-none"
                placeholder="Tatoueur Lyon • Fineline & Blackwork • Agenda Ouvert 👇"
                maxLength={150}
              />
              <p className="text-xs text-slate-500 mt-1">
                {formData.bio_instagram.length}/150 caractères
              </p>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Photo de Profil (Avatar)
              </label>
              <div className="flex items-center gap-4">
                {formData.avatarFile ? (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(formData.avatarFile)}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarFile: null })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <ImageIcon className="text-slate-500" size={24} />
                  </div>
                )}
                <label className="flex-1">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 cursor-pointer hover:border-amber-400 transition-colors">
                    <Upload size={18} className="text-slate-400" />
                    <span className="text-sm text-slate-300">
                      {uploadingAvatar ? 'Upload...' : formData.avatarFile ? 'Changer' : 'Choisir une image'}
                    </span>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">PNG, JPG jusqu'à 2MB. Image carrée recommandée.</p>
            </div>
          </div>

          {/* Section: Préférences */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Palette size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Préférences</h3>
                <p className="text-sm text-slate-400">Personnalisez votre expérience</p>
              </div>
            </div>

            {/* Couleur d'accent */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Couleur d'accentuation
              </label>
              <div className="flex gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, accent_color: color.value })}
                    className={`w-12 h-12 rounded-full border-2 transition-all ${
                      formData.accent_color === color.value
                        ? 'border-white scale-110 shadow-lg shadow-white/20'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Pourcentage d'acompte */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pourcentage d'acompte
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={formData.deposit_percentage}
                  onChange={(e) => setFormData({ ...formData, deposit_percentage: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-2xl font-black text-amber-400 w-16 text-right">
                  {formData.deposit_percentage}%
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0% (Risqué)</span>
                <span>30% (Standard)</span>
                <span>50% (Sécure)</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Section: Informations de Compte */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Informations de Compte</h3>
                <p className="text-sm text-slate-400">Informations de connexion</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-400">
                  {user?.email}
                </div>
                <p className="text-xs text-slate-500 mt-1">L'email ne peut pas être modifié ici</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Slug de votre profil</label>
                <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 font-mono">
                  inkflow.app/p/{profile.slug_profil}
                </div>
                <p className="text-xs text-slate-500 mt-1">Le slug ne peut pas être modifié</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="flex-1 border border-slate-600 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || uploadingAvatar}
              className="flex-1 bg-amber-400 text-black font-bold py-3 rounded-lg hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

