import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  X,
  Edit2,
  Trash2,
  ImagePlus,
  FileSignature,
  ChevronRight,
  Loader2,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import {
  useClientsSWR,
  useClientSWR,
  createClient,
  updateClient,
  deleteClient,
  addClientPhoto,
  deleteClientPhoto,
  type ClientFilters,
  type ClientWithPhotos,
} from '../../hooks/useClients';
import { supabase } from '../../services/supabase';
import type { ClientInsert, ClientPhoto } from '../../types/supabase';
import { Skeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';

const TAGS_OPTIONS = ['VIP', 'Nouveau', 'Fidèle', 'Projet perso', 'Flash'];

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Formulaire client (modal)
function ClientForm({
  client,
  onClose,
  onSuccess,
}: {
  client?: ClientWithPhotos | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nom: client?.nom ?? '',
    prenom: client?.prenom ?? '',
    email: client?.email ?? '',
    telephone: client?.telephone ?? '',
    date_naissance: client?.date_naissance?.slice(0, 10) ?? '',
    allergies: (client?.allergies ?? []).join(', '),
    notes: client?.notes ?? '',
    consentement_signe: client?.consentement_signe ?? false,
    tags: client?.tags ?? [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const allergies = form.allergies
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      const data: Omit<ClientInsert, 'artist_id'> = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim().toLowerCase(),
        telephone: form.telephone.trim() || null,
        date_naissance: form.date_naissance || null,
        allergies,
        notes: form.notes.trim() || null,
        consentement_signe: form.consentement_signe,
        tags: form.tags,
      };

      if (client) {
        await updateClient(user.id, client.id, data);
        toast.success('Client mis à jour');
      } else {
        await createClient(user.id, data);
        toast.success('Client créé');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="bg-[#121212] border border-neutral-800 rounded-md w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-sm shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-display font-bold text-white">
            {client ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Nom</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Prénom</label>
              <input
                type="text"
                required
                value={form.prenom}
                onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
                placeholder="Marie"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              placeholder="marie@email.com"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Téléphone</label>
            <input
              type="tel"
              value={form.telephone}
              onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              placeholder="06 12 34 56 78"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Date de naissance</label>
            <input
              type="date"
              value={form.date_naissance}
              onChange={(e) => setForm((f) => ({ ...f, date_naissance: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Allergies (séparées par des virgules)</label>
            <input
              type="text"
              value={form.allergies}
              onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
              placeholder="Métaux, Latex, ..."
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.tags.includes(tag)
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 resize-none"
              placeholder="Notes personnelles..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.consentement_signe}
              onChange={(e) => setForm((f) => ({ ...f, consentement_signe: e.target.checked }))}
              className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-zinc-300">Consentement signé</span>
            <FileSignature size={14} className="text-zinc-500" />
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2.5 rounded-md border border-neutral-700 text-neutral-400 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              {client ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// Panneau détail client (slide-over)
function ClientDetailPanel({
  client,
  onClose,
  onEdit,
  onDeleted,
}: {
  client: ClientWithPhotos;
  onClose: () => void;
  onEdit: () => void;
  onDeleted: () => void;
}) {
  const { user } = useAuth();
  const { client: fresh, refresh } = useClientSWR(client.id);
  const c = fresh ?? client;
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bookings, setBookings] = useState<{ id: string; date_debut: string; statut_booking: string }[]>([]);

  React.useEffect(() => {
    if (!user) return;
    supabase
      .from('bookings')
      .select('id, date_debut, statut_booking')
      .eq('artist_id', user.id)
      .eq('client_email', c.email)
      .order('date_debut', { ascending: false })
      .limit(10)
      .then(({ data }) => setBookings(data ?? []));
  }, [user?.id, c.email]);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce client ?')) return;
    if (!user) return;
    setDeleting(true);
    try {
      await deleteClient(user.id, c.id);
      toast.success('Client supprimé');
      onDeleted();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setDeleting(false);
    }
  };

  const uploadPhoto = async (file: File, type: 'reference' | 'realisation') => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${c.id}/${type}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('client-photos').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('client-photos').getPublicUrl(path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await addClientPhoto(c.id, url, type);
      toast.success('Photo ajoutée');
      refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'reference' | 'realisation') => {
    const f = e.target.files?.[0];
    if (f && f.size <= 3 * 1024 * 1024 && f.type.startsWith('image/')) {
      uploadPhoto(f, type);
    } else if (f) {
      toast.error('Image max 3MB');
    }
    e.target.value = '';
  };

  const removePhoto = async (photo: ClientPhoto) => {
    try {
      await deleteClientPhoto(photo.id);
      toast.success('Photo supprimée');
      refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const photos = (c.client_photos ?? []) as ClientPhoto[];

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl flex flex-col"
    >
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-lg font-display font-bold text-white">
          {c.prenom} {c.nom}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        <div className="flex items-center gap-3">
          <a
            href={`mailto:${c.email}`}
            className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
          >
            <Mail size={16} />
            <span className="text-sm">{c.email}</span>
          </a>
        </div>
        {c.telephone && (
          <div className="flex items-center gap-3">
            <a
              href={`tel:${c.telephone}`}
              className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
            >
              <Phone size={16} />
              <span className="text-sm">{c.telephone}</span>
            </a>
          </div>
        )}

        {c.consentement_signe ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <FileSignature size={16} />
            Consentement signé
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <AlertTriangle size={16} />
            Consentement non signé
          </div>
        )}

        {c.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {c.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {c.allergies && c.allergies.length > 0 && (
          <div>
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Allergies</h4>
            <p className="text-sm text-zinc-300">{c.allergies.join(', ')}</p>
          </div>
        )}

        {c.notes && (
          <div>
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Notes</h4>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{c.notes}</p>
          </div>
        )}

        {/* Historique RDV (bookings par email) */}
        {bookings.length > 0 && (
          <div>
            <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Calendar size={12} />
              Historique RDV
            </h4>
            <ul className="space-y-1">
              {bookings.map((b) => (
                <li key={b.id} className="text-sm text-zinc-400">
                  {new Date(b.date_debut).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  — {b.statut_booking}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Photos */}
        <div>
          <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Tag size={12} />
            Photos
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.url}
                  alt={p.caption || p.type}
                  className="w-full aspect-square object-cover rounded-xl border border-white/10"
                />
                <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-zinc-300">
                  {p.type === 'reference' ? 'Référence' : 'Réalisation'}
                </span>
                <button
                  onClick={() => removePhoto(p)}
                  className="absolute top-1 right-1 p-1 rounded bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {uploading && (
              <div className="aspect-square rounded-xl border border-dashed border-white/20 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-zinc-500" />
              </div>
            )}
            <label className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
              <ImagePlus size={24} className="text-zinc-500 mb-1" />
              <span className="text-xs text-zinc-500">Référence</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoInput(e, 'reference')}
              />
            </label>
            <label className="aspect-square rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-white/40 transition-colors">
              <ImagePlus size={24} className="text-zinc-500 mb-1" />
              <span className="text-xs text-zinc-500">Réalisation</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhotoInput(e, 'realisation')}
              />
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const DashboardClients: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithPhotos | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientWithPhotos | null>(null);

  const filters: ClientFilters = React.useMemo(() => {
    const f: ClientFilters = {};
    if (search.trim()) f.search = search.trim();
    if (tagFilter.length > 0) f.tags = tagFilter;
    return f;
  }, [search, tagFilter]);

  const { clients, loading, error, refresh } = useClientsSWR(
    Object.keys(filters).length > 0 ? filters : undefined
  );

  const handleTagFilter = useCallback((tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                <Users className="text-brand-cyan" size={20} />
              </div>
              Clients & Documents
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Fiches clients, historique, photos et consentements</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="Nom, email, téléphone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors w-full sm:w-64"
              />
            </div>
            <button
              onClick={() => {
                setEditingClient(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors"
            >
              <UserPlus size={16} />
              Ajouter
            </button>
          </div>
        </div>

        {/* Filtres par tag */}
        <div className="flex flex-wrap gap-2 mt-3">
          {TAGS_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                tagFilter.includes(tag)
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-red-400">{error.message}</p>
            <button
              onClick={() => refresh()}
              className="mt-4 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              Réessayer
            </button>
          </div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description={
              search || tagFilter.length > 0
                ? 'Aucun client ne correspond à votre recherche.'
                : 'Ajoutez votre premier client pour commencer à gérer vos fiches.'
            }
            primaryAction={
              !search && tagFilter.length === 0
                ? { label: 'Ajouter un client', onClick: () => setShowForm(true) }
                : { label: 'Effacer les filtres', onClick: () => { setSearch(''); setTagFilter([]); } }
            }
          />
        ) : (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-2"
          >
            <AnimatePresence mode="popLayout">
              {clients.map((c) => (
                <motion.li
                  key={c.id}
                  variants={fadeInUp}
                  layout
                  className="glass rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => setSelectedClient(c)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {c.prenom} {c.nom}
                    </p>
                    <p className="text-sm text-zinc-500 truncate">{c.email}</p>
                    {c.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!c.consentement_signe && (
                      <AlertTriangle size={16} className="text-amber-400" title="Consentement non signé" />
                    )}
                    <ChevronRight size={18} className="text-zinc-500" />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <ClientForm
            key="client-form"
            client={editingClient}
            onClose={() => {
              setShowForm(false);
              setEditingClient(null);
            }}
            onSuccess={refresh}
          />
        )}
        {editingClient && !showForm && (
          <ClientForm
            client={editingClient}
            onClose={() => setEditingClient(null)}
            onSuccess={() => {
              refresh();
              setEditingClient(null);
              if (selectedClient?.id === editingClient.id) {
                setSelectedClient(null);
              }
            }}
          />
        )}
        {selectedClient && !showForm && (
          <ClientDetailPanel
            key={`client-detail-${selectedClient.id}`}
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={() => {
              setEditingClient(selectedClient);
              setSelectedClient(null);
              setShowForm(true);
            }}
            onDeleted={refresh}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
