import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Save, Upload, X, Loader2, AlertCircle, CheckCircle, Palette, Mail, User, Image as ImageIcon } from 'lucide-react';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';

export const DashboardSettings: React.FC = () => {
  const { profile, loading: profileLoading, updateProfile, error: profileError } = useArtistProfile();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    nom_studio: '',
    bio_instagram: '',
    theme_color: 'amber',
    deposit_percentage: 30,
    avatarFile: null as File | null,
    avatarUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nom_studio: profile.nom_studio || '',
        bio_instagram: profile.bio_instagram || '',
        theme_color: profile.theme_color || profile.accent_color || 'amber',
        deposit_percentage: profile.deposit_percentage || 30,
        avatarFile: null,
        avatarUrl: profile.avatar_url || '',
      });
    }
  }, [profile]);

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    // Cache busting : nom unique avec timestamp pour forcer le rafraîchissement
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploadingAvatar(true);

    try {
      // Supprimer les anciens avatars s'ils existent (nettoyage optionnel)
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(`${user.id}/`, {
          search: `${user.id}-`,
        });

      if (existingFiles && existingFiles.length > 0) {
        // Supprimer les anciens avatars (garder seulement les 3 plus récents pour éviter l'accumulation)
        const filesToDelete = existingFiles
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
          .slice(3)
          .map(f => `${user.id}/${f.name}`);
        
        if (filesToDelete.length > 0) {
          await supabase.storage
            .from('avatars')
            .remove(filesToDelete);
        }
      }

      // Uploader le nouvel avatar
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false, // Pas d'upsert car le nom est unique
        });

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique avec cache busting
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      // Ajouter un paramètre de cache busting à l'URL pour forcer le rafraîchissement
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      return publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 2MB');
        return;
      }
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
      let avatarUrl = formData.avatarUrl;

      if (formData.avatarFile) {
        // Uploader et obtenir la nouvelle URL
        avatarUrl = await uploadAvatar(formData.avatarFile);
        
        // IMPORTANT : Mettre à jour l'état local immédiatement pour forcer le rafraîchissement
        setFormData(prev => ({
          ...prev,
          avatarUrl: avatarUrl,
          avatarFile: null, // Réinitialiser le fichier après upload
        }));
      }

      await updateProfile({
        nom_studio: formData.nom_studio,
        bio_instagram: formData.bio_instagram,
        theme_color: formData.theme_color,
        avatar_url: avatarUrl,
        deposit_percentage: formData.deposit_percentage,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la sauvegarde';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const themeOptions = [
    { name: 'Gold', value: 'amber', hex: '#fbbf24', tailwind: 'amber' },
    { name: 'Blood', value: 'red', hex: '#ef4444', tailwind: 'red' },
    { name: 'Ocean', value: 'blue', hex: '#3b82f6', tailwind: 'blue' },
    { name: 'Nature', value: 'emerald', hex: '#10b981', tailwind: 'emerald' },
    { name: 'Lavender', value: 'violet', hex: '#8b5cf6', tailwind: 'violet' },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
          <p className="text-slate-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center">
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

  if (profileError) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{profileError}</p>
          <button
            onClick={() => navigate('/dashboard/overview')}
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
      <div className="flex-1 flex items-center justify-center p-4">
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
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
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
                ) : formData.avatarUrl ? (
                  <div className="relative">
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar actuel"
                      className="w-20 h-20 rounded-full object-cover border-2 border-slate-600"
                      onError={(e) => {
                        // Si l'image ne charge pas, afficher le placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center';
                          placeholder.innerHTML = '<svg class="text-slate-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                          parent.appendChild(placeholder);
                        }
                      }}
                    />
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Thème de couleur (Page publique)
              </label>
              <div className="flex gap-3 flex-wrap">
                {themeOptions.map((theme) => (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme_color: theme.value })}
                    className={`w-14 h-14 rounded-full border-2 transition-all relative ${
                      formData.theme_color === theme.value
                        ? 'border-white scale-110 shadow-lg shadow-white/20'
                        : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: theme.hex }}
                    title={theme.name}
                  >
                    {formData.theme_color === theme.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Sélectionné: <span className="font-medium text-white">{themeOptions.find(t => t.value === formData.theme_color)?.name || 'Gold'}</span>
              </p>
            </div>

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
                  {typeof window !== 'undefined' ? `${window.location.origin}/p/${profile.slug_profil}` : `inkflow.app/p/${profile.slug_profil}`}
                </div>
                <p className="text-xs text-slate-500 mt-1">Le slug ne peut pas être modifié</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/overview')}
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

