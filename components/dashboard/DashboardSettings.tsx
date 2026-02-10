import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
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
  ExternalLink,
  Link as LinkIcon,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  WifiOff,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useArtistProfile, type SaveStatus } from '../../contexts/ArtistProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';
import { validateArtistProfile } from '../../utils/validation';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SaveStatusIndicator — Feedback visuel permanent pour l'état de save
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SaveStatusIndicator({ status, lastSavedAt, isDark }: {
  status: SaveStatus;
  lastSavedAt: Date | null;
  isDark: boolean;
}) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence mode="wait">
      {status === 'saving' && (
        <motion.div
          key="saving"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 text-sm"
        >
          <Loader2 size={14} className="animate-spin text-violet-400" />
          <span className="text-violet-400 font-medium">Sauvegarde en cours...</span>
        </motion.div>
      )}
      {status === 'retrying' && (
        <motion.div
          key="retrying"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className="animate-spin text-amber-400" />
          <span className="text-amber-400 font-medium">Nouvelle tentative...</span>
        </motion.div>
      )}
      {status === 'saved' && (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-2 text-sm"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span className="text-emerald-400 font-medium">Sauvegardé</span>
          {lastSavedAt && (
            <span className="text-gray-500 text-xs">
              {formatTime(lastSavedAt)}
            </span>
          )}
        </motion.div>
      )}
      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-2 text-sm"
        >
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-red-400 font-medium">Erreur de sauvegarde</span>
        </motion.div>
      )}
      {status === 'idle' && lastSavedAt && (
        <motion.div
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex items-center gap-2 text-xs text-gray-500"
        >
          <Clock size={12} />
          <span>Dernière sauvegarde : {formatTime(lastSavedAt)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UnsavedChangesBar — Barre flottante quand des modifications non sauvegardées
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UnsavedChangesBar({
  hasChanges,
  onSave,
  onDiscard,
  saving,
  isDark,
}: {
  hasChanges: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving: boolean;
  isDark: boolean;
}) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
            isDark
              ? 'bg-[#1a1a2e]/95 border-amber-500/30 shadow-amber-500/10'
              : 'bg-white/95 border-amber-300 shadow-amber-200/30'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className={`text-sm font-medium ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                Modifications non sauvegardées
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onDiscard}
                disabled={saving}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inline Field Error
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <motion.p
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
    >
      <AlertCircle size={12} />
      {error}
    </motion.p>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PublicPageSetup — Sub-component for slug activation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PublicPageSetup({
  isDark,
  nomStudio,
  emailField,
  onSlugSaved,
}: {
  isDark: boolean;
  nomStudio: string;
  emailField: string;
  onSlugSaved: (slug: string) => Promise<void>;
}) {
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  };

  const suggestedSlug = nomStudio
    ? generateSlug(nomStudio)
    : emailField
    ? generateSlug(emailField.split('@')[0])
    : '';

  const [editSlug, setEditSlug] = useState(suggestedSlug);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const slug = nomStudio
      ? generateSlug(nomStudio)
      : emailField
      ? generateSlug(emailField.split('@')[0])
      : '';
    setEditSlug(slug);
  }, [nomStudio, emailField]);

  const handleSave = async () => {
    const slug = editSlug.trim();
    if (!slug) { setError('Le slug ne peut pas être vide'); return; }
    if (slug.length < 3) { setError('Le slug doit contenir au moins 3 caractères'); return; }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 2) {
      setError('Uniquement des lettres minuscules, chiffres et tirets'); return;
    }
    setError('');
    setSaving(true);
    try {
      await onSlugSaved(slug);
    } catch {
      setError('Ce slug est peut-être déjà pris. Essayez-en un autre.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl ${
        isDark ? 'bg-violet-500/10 border border-violet-500/20' : 'bg-violet-50 border border-violet-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-violet-500/20' : 'bg-violet-100'
          }`}>
            <Globe size={20} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
          </div>
          <div>
            <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-violet-300' : 'text-violet-800'}`}>
              Activez votre vitrine en 1 clic
            </p>
            <p className={`text-xs ${isDark ? 'text-violet-400/80' : 'text-violet-600'}`}>
              Choisissez un slug pour créer votre page publique. Vos clients pourront voir vos flashs et réserver directement.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-500 mb-2">Choisissez votre URL</label>
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200'
        }`}>
          <span className="text-gray-500 text-sm shrink-0">{window.location.origin}/</span>
          <input
            type="text"
            value={editSlug}
            onChange={(e) => {
              setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
              setError('');
            }}
            placeholder="mon-studio"
            className={`bg-transparent outline-none w-full text-sm font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
            <AlertCircle size={12} />
            {error}
          </p>
        )}
        {!error && editSlug && (
          <p className="text-xs text-gray-500 mt-1.5">
            Votre page sera accessible à : <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>{window.location.origin}/{editSlug}</span>
          </p>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !editSlug.trim()}
        className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Globe size={18} />
        )}
        {saving ? 'Création en cours...' : 'Activer ma page publique'}
      </button>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DashboardSettings — Main component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const DashboardSettings: React.FC = () => {
  const { theme, toggleTheme } = useDashboardTheme();
  const isDark = theme === 'dark';
  const { profile, updateProfile, updateProfileOptimistic, saveStatus, lastSavedAt } = useArtistProfile();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'billing'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  // ── Profile form state ──
  const [nomStudio, setNomStudio] = useState('');
  const [bioInstagram, setBioInstagram] = useState('');
  const [slugProfil, setSlugProfil] = useState('');
  const [emailField, setEmailField] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Track "original" values to detect changes
  const originalValuesRef = useRef({
    nomStudio: '',
    bioInstagram: '',
    slugProfil: '',
    emailField: '',
  });

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      const values = {
        nomStudio: profile.nom_studio || '',
        bioInstagram: profile.bio_instagram || '',
        slugProfil: profile.slug_profil || '',
        emailField: profile.email || '',
      };
      setNomStudio(values.nomStudio);
      setBioInstagram(values.bioInstagram);
      setSlugProfil(values.slugProfil);
      originalValuesRef.current = values;
    }
    if (user) {
      setEmailField(user.email || '');
      originalValuesRef.current.emailField = user.email || '';
    }
  }, [profile, user]);

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const orig = originalValuesRef.current;
    return (
      nomStudio !== orig.nomStudio ||
      bioInstagram !== orig.bioInstagram ||
      slugProfil !== orig.slugProfil ||
      emailField !== orig.emailField
    );
  }, [nomStudio, bioInstagram, slugProfil, emailField]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    const orig = originalValuesRef.current;
    setNomStudio(orig.nomStudio);
    setBioInstagram(orig.bioInstagram);
    setSlugProfil(orig.slugProfil);
    setEmailField(orig.emailField);
    setFieldErrors({});
  }, []);

  // ── Save profile with validation ──
  const handleSaveProfile = useCallback(async () => {
    // 1. Validate with Zod
    const formData = {
      nom_studio: nomStudio.trim(),
      email: emailField.trim(),
      slug_profil: slugProfil.trim() || undefined,
      bio_instagram: bioInstagram.trim() || null,
    };

    const validation = validateArtistProfile(formData);
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      toast.error('Données invalides', {
        description: validation.error || 'Vérifiez les champs en rouge.',
      });
      return;
    }

    setFieldErrors({});
    setProfileSaving(true);

    // 2. Prepare update payload
    const updates: Record<string, any> = {
      nom_studio: validation.data!.nom_studio,
      bio_instagram: validation.data!.bio_instagram || null,
      email: validation.data!.email,
    };
    if (validation.data!.slug_profil) {
      updates.slug_profil = validation.data!.slug_profil;
    }

    // 3. Save with optimistic update + retry + verify
    const result = await updateProfileOptimistic(updates);

    if (result.success) {
      // Update original values to reflect saved state
      originalValuesRef.current = {
        nomStudio: result.data?.nom_studio || nomStudio,
        bioInstagram: result.data?.bio_instagram || '',
        slugProfil: result.data?.slug_profil || slugProfil,
        emailField: result.data?.email || emailField,
      };

      toast.success('Profil mis à jour avec succès', {
        description: 'Vos modifications sont enregistrées et votre page publique est à jour.',
        icon: <CheckCircle2 size={18} className="text-emerald-400" />,
      });
    } else {
      toast.error('Erreur lors de la sauvegarde', {
        description: result.error || 'Veuillez réessayer. Si le problème persiste, contactez le support.',
        icon: <AlertCircle size={18} className="text-red-400" />,
      });
    }

    setProfileSaving(false);
  }, [nomStudio, emailField, slugProfil, bioInstagram, updateProfileOptimistic]);

  // ── Preferences state ──
  const notifStorageKey = user ? `inkflow-notification-prefs-${user.id}` : '';
  const langStorageKey = user ? `inkflow-lang-${user.id}` : '';

  const defaultNotifPrefs = {
    nouvelles_demandes: true,
    rappels_rdv: true,
    paiements: true,
    messages_clients: true,
  };

  const [notifPrefs, setNotifPrefs] = useState(defaultNotifPrefs);
  const [language, setLanguage] = useState('Français');

  useEffect(() => {
    if (!user) return;
    try {
      const stored = localStorage.getItem(notifStorageKey);
      if (stored) setNotifPrefs(JSON.parse(stored));
    } catch { /* ignore */ }
    try {
      const storedLang = localStorage.getItem(langStorageKey);
      if (storedLang) setLanguage(storedLang);
    } catch { /* ignore */ }
  }, [user, notifStorageKey, langStorageKey]);

  const toggleNotifPref = (key: keyof typeof defaultNotifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    if (notifStorageKey) localStorage.setItem(notifStorageKey, JSON.stringify(updated));
    toast.success('Préférence mise à jour');
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    if (langStorageKey) localStorage.setItem(langStorageKey, lang);
    toast.success(`Langue changée : ${lang}`);
  };

  // ── Security state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Mot de passe mis à jour avec succès', {
        icon: <ShieldCheck size={18} className="text-emerald-400" />,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setPasswordSaving(false);
    }
  };

  const publicUrl = profile?.slug_profil
    ? `${window.location.origin}/${profile.slug_profil}`
    : '';

  const handleCopyUrl = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setSlugCopied(true);
    toast.success('URL copiée !');
    setTimeout(() => setSlugCopied(false), 2000);
  };

  const displayName = profile?.nom_studio || user?.email?.split('@')[0] || 'Pro';
  const displayEmail = user?.email || '';
  const initial = (profile?.nom_studio?.[0] || user?.email?.[0] || 'P').toUpperCase();

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'preferences', label: 'Préférences', icon: Palette },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'billing', label: 'Facturation', icon: DollarSign },
  ];

  // Character count helpers
  const bioMaxLength = 500;
  const bioLength = bioInstagram.length;

  return (
    <div className="space-y-6">
      {/* ── Header with save status ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Paramètres
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez votre compte et vos préférences
          </p>
        </div>
        <SaveStatusIndicator
          status={saveStatus}
          lastSavedAt={lastSavedAt}
          isDark={isDark}
        />
      </div>

      {/* ── Tabs ── */}
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

      {/* ── Tab Content ── */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ════════════════════ PROFILE TAB ════════════════════ */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Informations personnelles */}
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Informations personnelles
                </h3>
                {/* Inline data integrity badge */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <ShieldCheck size={12} />
                  Données chiffrées SSL
                </div>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-6 mb-8">
                <div className="relative group">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-24 h-24 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {initial}
                    </div>
                  )}
                  <button className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </button>
                </div>
                <div>
                  <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {displayName}
                  </h4>
                  <p className="text-gray-500">{displayEmail}</p>
                  <button className="mt-2 text-sm text-violet-500 hover:text-violet-400 font-medium">
                    Modifier la photo
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom du studio */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Nom du studio <span className="text-red-400">*</span>
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    fieldErrors.nom_studio
                      ? 'bg-red-500/10 border border-red-500/30'
                      : isDark ? 'bg-white/5 border border-transparent focus-within:border-violet-500/50' : 'bg-gray-100 border border-transparent focus-within:border-violet-500'
                  }`}>
                    <User size={18} className="text-gray-500" />
                    <input
                      type="text"
                      value={nomStudio}
                      onChange={(e) => {
                        setNomStudio(e.target.value);
                        if (fieldErrors.nom_studio) setFieldErrors(prev => ({ ...prev, nom_studio: '' }));
                      }}
                      placeholder="Mon Studio"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                  <FieldError error={fieldErrors.nom_studio} />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    fieldErrors.email
                      ? 'bg-red-500/10 border border-red-500/30'
                      : isDark ? 'bg-white/5 border border-transparent focus-within:border-violet-500/50' : 'bg-gray-100 border border-transparent focus-within:border-violet-500'
                  }`}>
                    <Mail size={18} className="text-gray-500" />
                    <input
                      type="email"
                      value={emailField}
                      onChange={(e) => {
                        setEmailField(e.target.value);
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                      }}
                      placeholder="email@studio.com"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                  <FieldError error={fieldErrors.email} />
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Slug du profil</label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    fieldErrors.slug_profil
                      ? 'bg-red-500/10 border border-red-500/30'
                      : isDark ? 'bg-white/5 border border-transparent focus-within:border-violet-500/50' : 'bg-gray-100 border border-transparent focus-within:border-violet-500'
                  }`}>
                    <LinkIcon size={18} className="text-gray-500" />
                    <span className="text-gray-500">/</span>
                    <input
                      type="text"
                      value={slugProfil}
                      onChange={(e) => {
                        setSlugProfil(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                        if (fieldErrors.slug_profil) setFieldErrors(prev => ({ ...prev, slug_profil: '' }));
                      }}
                      placeholder="mon-studio"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                  <FieldError error={fieldErrors.slug_profil} />
                  {slugProfil && !fieldErrors.slug_profil && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      URL : <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>{window.location.origin}/{slugProfil}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bio Instagram */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-500">Bio Instagram</label>
                  <span className={`text-xs ${bioLength > bioMaxLength ? 'text-red-400' : 'text-gray-500'}`}>
                    {bioLength}/{bioMaxLength}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={bioInstagram}
                  onChange={(e) => {
                    setBioInstagram(e.target.value);
                    if (fieldErrors.bio_instagram) setFieldErrors(prev => ({ ...prev, bio_instagram: '' }));
                  }}
                  placeholder="Décrivez votre style, votre parcours..."
                  className={`w-full px-4 py-3 rounded-xl resize-none transition-colors ${
                    fieldErrors.bio_instagram
                      ? 'bg-red-500/10 border border-red-500/30'
                      : isDark
                        ? 'bg-white/5 text-white placeholder-gray-500 border border-transparent focus:border-violet-500/50'
                        : 'bg-gray-100 text-gray-900 placeholder-gray-400 border border-transparent focus:border-violet-500'
                  } outline-none`}
                />
                <FieldError error={fieldErrors.bio_instagram} />
              </div>

              {/* Save button with multi-state */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <AnimatePresence>
                    {hasUnsavedChanges && !profileSaving && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        <span className="text-xs text-amber-400">Modifications non enregistrées</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving || !hasUnsavedChanges}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:cursor-not-allowed ${
                    profileSaving
                      ? 'bg-violet-500/50 text-white/80'
                      : hasUnsavedChanges
                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
                        : 'bg-gray-200 text-gray-500 dark:bg-white/5 dark:text-gray-600'
                  }`}
                >
                  {profileSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sauvegarde en cours...
                    </>
                  ) : saveStatus === 'saved' && !hasUnsavedChanges ? (
                    <>
                      <Check size={18} />
                      Sauvegardé
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Sauvegarder le profil
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── Page publique ── */}
            <div className={`rounded-2xl p-6 ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDark ? 'bg-violet-500/10' : 'bg-violet-50'
                }`}>
                  <Globe size={20} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Page publique
                  </h3>
                  <p className="text-sm text-gray-500">Votre vitrine visible par vos clients</p>
                </div>
              </div>

              {profile?.slug_profil ? (
                <div className="space-y-4">
                  {/* Confirmation visuelle */}
                  <div className={`p-3 rounded-xl flex items-center gap-2 ${
                    isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                  }`}>
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className={`text-sm ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      Votre page publique est active et synchronisée
                    </span>
                  </div>

                  {/* URL preview */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Votre URL publique</label>
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                      <LinkIcon size={16} className="text-gray-500 shrink-0" />
                      <span className={`text-sm truncate flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {publicUrl}
                      </span>
                      <button
                        onClick={handleCopyUrl}
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          slugCopied
                            ? 'text-emerald-400'
                            : isDark
                              ? 'text-gray-400 hover:text-white hover:bg-white/10'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                        title="Copier l'URL"
                      >
                        {slugCopied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Slug field (readonly) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Slug</label>
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                      isDark ? 'bg-white/5' : 'bg-gray-100'
                    }`}>
                      <span className="text-gray-500 text-sm">/</span>
                      <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {profile.slug_profil}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Identifiant unique de votre page. Contactez le support pour le modifier.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <a
                      href={`/${profile.slug_profil}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
                    >
                      <ExternalLink size={18} />
                      Voir ma page publique
                    </a>
                    <button
                      onClick={handleCopyUrl}
                      className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                        isDark
                          ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {slugCopied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                      {slugCopied ? 'Copié !' : 'Copier le lien'}
                    </button>
                  </div>
                </div>
              ) : (
                <PublicPageSetup
                  isDark={isDark}
                  nomStudio={nomStudio}
                  emailField={emailField}
                  onSlugSaved={async (newSlug: string) => {
                    const result = await updateProfile({ slug_profil: newSlug });
                    if (result.success) {
                      setSlugProfil(newSlug);
                      toast.success('Votre page publique est maintenant active !', {
                        description: `Accessible à ${window.location.origin}/${newSlug}`,
                        icon: <CheckCircle2 size={18} className="text-emerald-400" />,
                      });
                    } else {
                      throw new Error(result.error || 'Erreur lors de la création du slug');
                    }
                  }}
                />
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ PREFERENCES TAB ════════════════════ */}
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
                      <p className="text-sm text-gray-500">{language}</p>
                    </div>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className={`px-4 py-2 rounded-lg outline-none cursor-pointer ${
                      isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <option value="Français">Français</option>
                    <option value="English">English</option>
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
                {([
                  { key: 'nouvelles_demandes' as const, label: 'Nouvelles demandes', desc: 'Recevoir une notification pour chaque nouvelle demande' },
                  { key: 'rappels_rdv' as const, label: 'Rappels de RDV', desc: 'Recevoir des rappels 24h avant chaque rendez-vous' },
                  { key: 'paiements' as const, label: 'Paiements', desc: 'Notifications pour les paiements reçus' },
                  { key: 'messages_clients' as const, label: 'Messages clients', desc: 'Alertes pour les nouveaux messages' },
                ]).map((item) => {
                  const isOn = notifPrefs[item.key];
                  return (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell size={20} className="text-gray-500" />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleNotifPref(item.key)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          isOn ? 'bg-violet-500' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute w-6 h-6 bg-white rounded-full top-1 transition-transform ${
                          isOn ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ SECURITY TAB ════════════════════ */}
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
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
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
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                  {newPassword.length > 0 && newPassword.length < 8 && (
                    <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Minimum 8 caractères ({newPassword.length}/8)
                    </p>
                  )}
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`bg-transparent outline-none w-full ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    />
                  </div>
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>

                {passwordError && (
                  <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                    isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-200'
                  }`}>
                    <AlertCircle size={16} />
                    {passwordError}
                  </div>
                )}

                <button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                  className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordSaving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
                  Mettre à jour le mot de passe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════ BILLING TAB ════════════════════ */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <div className={`rounded-2xl p-8 text-center ${
              isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
            }`}>
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                isDark ? 'bg-violet-500/10' : 'bg-violet-50'
              }`}>
                <DollarSign size={24} className={isDark ? 'text-violet-400' : 'text-violet-600'} />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Paiements & Facturation
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Configurez Stripe Connect, vos politiques d'acompte et vos informations de facturation.
              </p>
              <Link
                to="/dashboard/settings/payments"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
              >
                <DollarSign size={18} />
                Gérer les paiements
              </Link>

              {profile && (
                <div className="mt-6 flex items-center justify-center gap-4 text-xs">
                  <span className={`flex items-center gap-1.5 ${
                    profile.stripe_connected
                      ? 'text-emerald-400'
                      : 'text-gray-500'
                  }`}>
                    {profile.stripe_connected ? <Check size={12} /> : <AlertCircle size={12} />}
                    Stripe {profile.stripe_connected ? 'connecté' : 'non connecté'}
                  </span>
                  <span className="text-gray-600">·</span>
                  <span className="text-gray-500">
                    Acompte : {profile.deposit_percentage ?? 30}%
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Floating unsaved changes bar ── */}
      <UnsavedChangesBar
        hasChanges={hasUnsavedChanges && activeTab === 'profile'}
        onSave={handleSaveProfile}
        onDiscard={handleDiscardChanges}
        saving={profileSaving}
        isDark={isDark}
      />
    </div>
  );
};
