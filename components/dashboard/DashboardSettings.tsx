import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Upload, X, Loader2, AlertCircle, CheckCircle, Palette, Mail, User, Image as ImageIcon, Settings, Shield } from 'lucide-react';
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
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    setUploadingAvatar(true);

    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(`${user.id}/`, {
          search: `${user.id}-`,
        });

      if (existingFiles && existingFiles.length > 0) {
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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

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
        avatarUrl = await uploadAvatar(formData.avatarFile);
        
        setFormData(prev => ({
          ...prev,
          avatarUrl: avatarUrl,
          avatarFile: null,
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
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <Loader2 className="animate-spin text-white mx-auto mb-4" size={40} />
          <p className="text-zinc-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <div className="text-center">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <p className="text-zinc-400 mb-4">Vous devez être connecté</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-black px-6 py-2 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-brand-pink mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-white mb-2">Erreur</h2>
          <p className="text-zinc-400 mb-6">{profileError}</p>
          <button
            onClick={() => navigate('/dashboard/overview')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505] p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="text-brand-yellow mx-auto mb-4" size={48} />
          <h2 className="text-xl font-display font-bold text-white mb-2">Profil non trouvé</h2>
          <p className="text-zinc-400 mb-6">
            Vous devez d'abord compléter votre profil dans l'onboarding.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-zinc-200"
          >
            Créer mon profil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-5 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
              <Settings className="text-brand-purple" size={20} />
            </div>
            Paramètres du Compte
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Gérez vos informations personnelles et préférences</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-brand-pink/10 border border-brand-pink/20 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="text-brand-pink shrink-0" size={20} />
              <p className="text-brand-pink text-sm flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-brand-pink/60 hover:text-brand-pink">
                <X size={18} />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-brand-mint/10 border border-brand-mint/20 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="text-brand-mint shrink-0" size={20} />
              <p className="text-brand-mint text-sm">Profil mis à jour avec succès !</p>
            </motion.div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section: Informations de Base */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center">
                  <User className="text-brand-cyan" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Informations de Base</h3>
                  <p className="text-sm text-zinc-500">Vos informations publiques</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Nom du Studio <span className="text-brand-pink">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nom_studio}
                  onChange={(e) => setFormData({ ...formData, nom_studio: e.target.value })}
                  required
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="Ex: Zonett Ink"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Bio Instagram
                </label>
                <textarea
                  rows={3}
                  value={formData.bio_instagram}
                  onChange={(e) => setFormData({ ...formData, bio_instagram: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
                  placeholder="Tatoueur Lyon • Fineline & Blackwork • Agenda Ouvert 👇"
                  maxLength={150}
                />
                <p className="text-xs text-zinc-600 mt-1">
                  {formData.bio_instagram.length}/150 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Photo de Profil (Avatar)
                </label>
                <div className="flex items-center gap-4">
                  {formData.avatarFile ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(formData.avatarFile)}
                        alt="Aperçu de l'avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarFile: null })}
                        className="absolute -top-2 -right-2 bg-brand-pink text-white rounded-full p-1 hover:bg-brand-pink/80 shadow-sm"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Avatar actuel"
                      loading="lazy"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full glass border-2 border-dashed border-white/20 flex items-center justify-center">
                      <ImageIcon className="text-zinc-600" size={24} />
                    </div>
                  )}
                  <label className="flex-1">
                    <div className="flex items-center gap-2 glass rounded-xl px-4 py-2.5 cursor-pointer hover:bg-white/10 transition-colors">
                      <Upload size={18} className="text-zinc-400" />
                      <span className="text-sm text-zinc-300">
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
                <p className="text-xs text-zinc-600 mt-2">PNG, JPG jusqu'à 2MB. Image carrée recommandée.</p>
              </div>
            </div>

            {/* Section: Préférences */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center">
                  <Palette className="text-brand-purple" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Préférences</h3>
                  <p className="text-sm text-zinc-500">Personnalisez votre expérience</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Thème de couleur (Page publique)
                </label>
                <div className="flex gap-3 flex-wrap">
                  {themeOptions.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme_color: theme.value })}
                      className={`w-12 h-12 rounded-full border-2 transition-all relative ${
                        formData.theme_color === theme.value
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: theme.hex }}
                      title={theme.name}
                    >
                      {formData.theme_color === theme.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="text-white drop-shadow" size={18} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-600 mt-2">
                  Sélectionné: <span className="font-medium text-white">{themeOptions.find(t => t.value === formData.theme_color)?.name || 'Gold'}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
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
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <span className="text-2xl font-display font-bold text-white w-16 text-right">
                    {formData.deposit_percentage}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600 mt-2">
                  <span>0%</span>
                  <span>30% (Standard)</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Section: Informations de Compte */}
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-mint/10 flex items-center justify-center">
                  <Shield className="text-brand-mint" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Informations de Compte</h3>
                  <p className="text-sm text-zinc-500">Informations de connexion</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Email</label>
                  <div className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-zinc-400">
                    {user?.email}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">L'email ne peut pas être modifié ici</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Lien de votre profil</label>
                  <div className="bg-[#050505] border border-white/10 rounded-xl px-4 py-3 text-zinc-400 font-mono text-sm truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/p/${profile.slug_profil}` : `inkflow.app/p/${profile.slug_profil}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard/overview')}
                className="flex-1 glass text-zinc-300 font-medium py-3 rounded-xl hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
