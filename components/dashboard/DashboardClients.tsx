import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  Eye,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';

/* ─── Types ─── */
interface ClientBooking {
  id: string;
  flash_title: string | null;
  date_debut: string;
  prix_total: number;
  deposit_amount: number;
  statut_booking: string;
  statut_paiement: string;
}

interface ClientProject {
  id: string;
  body_part: string | null;
  style: string | null;
  description: string | null;
  budget_max: number | null;
  statut: string;
  created_at: string;
}

interface AggregatedClient {
  email: string;
  name: string;
  phone: string | null;
  bookings: ClientBooking[];
  projects: ClientProject[];
  totalSpent: number;
  bookingCount: number;
  lastVisit: string | null;
  isActive: boolean;
}

/* ─── Helpers ─── */
const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(cents / 100);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

const formatDateTime = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const SIX_MONTHS_AGO = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

const NOTES_KEY = (artistId: string, email: string) => `inkflow-client-notes-${artistId}-${email}`;

/* ─── Component ─── */
export const DashboardClients: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<AggregatedClient[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedClient, setSelectedClient] = useState<AggregatedClient | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [notes, setNotes] = useState('');

  /* ─── Fetch ─── */
  const fetchClients = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const [{ data: bookings }, { data: projects }] = await Promise.all([
        supabase
          .from('bookings')
          .select('id, client_email, client_name, client_phone, date_debut, prix_total, deposit_amount, statut_booking, statut_paiement, flash_id, flashs(title)')
          .eq('artist_id', user.id)
          .order('date_debut', { ascending: false }),
        supabase
          .from('projects')
          .select('id, client_email, client_name, body_part, style, description, budget_max, statut, created_at')
          .eq('artist_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const map = new Map<string, AggregatedClient>();

      (bookings || []).forEach((b: any) => {
        const email = (b.client_email || '').toLowerCase().trim();
        if (!email) return;
        if (!map.has(email)) {
          map.set(email, {
            email,
            name: b.client_name || '',
            phone: b.client_phone || null,
            bookings: [],
            projects: [],
            totalSpent: 0,
            bookingCount: 0,
            lastVisit: null,
            isActive: false,
          });
        }
        const c = map.get(email)!;
        if (b.client_name && !c.name) c.name = b.client_name;
        if (b.client_phone && !c.phone) c.phone = b.client_phone;

        const paid = b.statut_paiement === 'deposit_paid' || b.statut_paiement === 'completed';
        const amount = paid ? (b.deposit_amount || 0) : 0;

        c.bookings.push({
          id: b.id,
          flash_title: b.flashs?.title || null,
          date_debut: b.date_debut,
          prix_total: b.prix_total || 0,
          deposit_amount: b.deposit_amount || 0,
          statut_booking: b.statut_booking,
          statut_paiement: b.statut_paiement,
        });

        c.totalSpent += amount;
        c.bookingCount += 1;
        if (!c.lastVisit || b.date_debut > c.lastVisit) c.lastVisit = b.date_debut;
        if (b.date_debut >= SIX_MONTHS_AGO) c.isActive = true;
      });

      (projects || []).forEach((p: any) => {
        const email = (p.client_email || '').toLowerCase().trim();
        if (!email) return;
        if (!map.has(email)) {
          map.set(email, {
            email,
            name: p.client_name || '',
            phone: null,
            bookings: [],
            projects: [],
            totalSpent: 0,
            bookingCount: 0,
            lastVisit: null,
            isActive: false,
          });
        }
        const c = map.get(email)!;
        if (p.client_name && !c.name) c.name = p.client_name;
        c.projects.push({
          id: p.id,
          body_part: p.body_part,
          style: p.style,
          description: p.description,
          budget_max: p.budget_max,
          statut: p.statut,
          created_at: p.created_at,
        });
        if (p.created_at >= SIX_MONTHS_AGO) c.isActive = true;
      });

      setClients(Array.from(map.values()).sort((a, b) => {
        if (a.lastVisit && b.lastVisit) return b.lastVisit.localeCompare(a.lastVisit);
        if (a.lastVisit) return -1;
        if (b.lastVisit) return 1;
        return 0;
      }));
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* ─── Load notes when selecting client ─── */
  useEffect(() => {
    if (selectedClient && user) {
      const saved = localStorage.getItem(NOTES_KEY(user.id, selectedClient.email));
      setNotes(saved || '');
    }
  }, [selectedClient, user]);

  const saveNotes = () => {
    if (!user || !selectedClient) return;
    localStorage.setItem(NOTES_KEY(user.id, selectedClient.email), notes);
  };

  /* ─── Filtered clients ─── */
  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter === 'active') list = list.filter(c => c.isActive);
    if (statusFilter === 'inactive') list = list.filter(c => !c.isActive);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return list;
  }, [clients, search, statusFilter]);

  /* ─── KPIs ─── */
  const kpis = useMemo(() => {
    const total = clients.length;
    const revenue = clients.reduce((s, c) => s + c.totalSpent, 0);
    const avg = total > 0 ? Math.round(revenue / total) : 0;
    const returning = clients.filter(c => c.bookingCount > 1).length;
    return { total, revenue, avg, returning };
  }, [clients]);

  /* ─── Add client ─── */
  const handleAddClient = async () => {
    if (!user || !addForm.email.trim()) return;
    setAddLoading(true);
    try {
      const { error } = await supabase.from('customers').upsert({
        email: addForm.email.trim().toLowerCase(),
        name: addForm.name.trim() || null,
      }, { onConflict: 'email' });
      if (error) throw error;

      if (addForm.notes.trim()) {
        localStorage.setItem(NOTES_KEY(user.id, addForm.email.trim().toLowerCase()), addForm.notes.trim());
      }
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', notes: '' });
      await fetchClients();
    } catch (err) {
      console.error('Error adding client:', err);
    } finally {
      setAddLoading(false);
    }
  };

  /* ─── Status helpers ─── */
  const bookingStatusBadge = (status: string) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      confirmed: { label: 'Confirmé', cls: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      completed: { label: 'Terminé', cls: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      pending: { label: 'En attente', cls: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600' },
      rejected: { label: 'Refusé', cls: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600' },
      cancelled: { label: 'Annulé', cls: isDark ? 'bg-zinc-500/10 text-zinc-400' : 'bg-gray-100 text-gray-500' },
      no_show: { label: 'No-show', cls: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600' },
    };
    const c = cfg[status] || { label: status, cls: isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.cls}`}>{c.label}</span>;
  };

  const paymentStatusBadge = (status: string) => {
    const cfg: Record<string, { label: string; cls: string }> = {
      deposit_paid: { label: 'Acompte payé', cls: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      completed: { label: 'Payé', cls: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600' },
      pending: { label: 'Non payé', cls: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600' },
    };
    const c = cfg[status] || { label: status, cls: isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500' };
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.cls}`}>{c.label}</span>;
  };

  /* ─── Skeleton ─── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-9 w-48 rounded-lg animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-5 w-64 mt-2 rounded animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`rounded-2xl p-6 h-36 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`} />
          ))}
        </div>
        <div className={`rounded-2xl p-6 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`}>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-16 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── KPI cards config ─── */
  const kpiCards = [
    { title: 'Total clients', value: String(kpis.total), icon: Users, gradient: 'from-violet-500 to-purple-600', bgGradient: isDark ? 'from-violet-500/10 to-purple-600/10' : 'from-violet-50 to-purple-50' },
    { title: 'Revenus clients', value: formatCurrency(kpis.revenue), icon: DollarSign, gradient: 'from-emerald-500 to-teal-600', bgGradient: isDark ? 'from-emerald-500/10 to-teal-600/10' : 'from-emerald-50 to-teal-50' },
    { title: 'Revenu moyen', value: formatCurrency(kpis.avg), icon: TrendingUp, gradient: 'from-blue-500 to-cyan-600', bgGradient: isDark ? 'from-blue-500/10 to-cyan-600/10' : 'from-blue-50 to-cyan-50' },
    { title: 'Clients fidèles', value: String(kpis.returning), icon: RefreshCw, gradient: 'from-amber-400 to-orange-500', bgGradient: isDark ? 'from-amber-500/10 to-orange-500/10' : 'from-amber-50 to-orange-50' },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Clients</h1>
            <p className="text-gray-500 mt-1">{kpis.total} client{kpis.total > 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all"
          >
            <UserPlus size={16} />
            Ajouter un client
          </button>
        </div>

        {/* ─── Search & Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                isDark
                  ? 'bg-white/5 text-white border border-white/[0.06] placeholder-gray-600 focus:border-white/20'
                  : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-violet-300'
              }`}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/5 border border-white/[0.06]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {s === 'all' ? 'Tous' : s === 'active' ? 'Actifs' : 'Inactifs'}
              </button>
            ))}
          </div>
        </div>

        {/* ─── KPI Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {kpiCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative overflow-hidden rounded-2xl p-6 ${
                  isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-3xl opacity-50`} />
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <h3 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </h3>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Client List ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`rounded-2xl overflow-hidden ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Liste des clients
            </h3>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                <Users size={24} className="text-gray-500" />
              </div>
              <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {search || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun client'}
              </p>
              <p className="text-gray-500 text-sm">
                {search || statusFilter !== 'all'
                  ? 'Essayez de modifier votre recherche ou vos filtres.'
                  : 'Vos clients apparaîtront ici dès que vous recevrez des réservations.'}
              </p>
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
              {filtered.map((client, index) => {
                const isExpanded = expandedClient === client.email;
                return (
                  <motion.div
                    key={client.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.03 }}
                  >
                    {/* Row */}
                    <div
                      className={`px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setExpandedClient(isExpanded ? null : client.email)}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'
                      }`}>
                        {(client.name || client.email).charAt(0).toUpperCase()}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {client.name || 'Sans nom'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            client.isActive
                              ? isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                              : isDark ? 'bg-zinc-500/10 text-zinc-400' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {client.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1"><Mail size={11} /> {client.email}</span>
                          {client.phone && <span className="flex items-center gap-1"><Phone size={11} /> {client.phone}</span>}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-5 text-xs flex-shrink-0">
                        <div className="text-center">
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{client.bookingCount}</div>
                          <div className="text-gray-500">résa.</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(client.totalSpent)}</div>
                          <div className="text-gray-500">dépensé</div>
                        </div>
                        <div className="text-center hidden sm:block">
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {client.lastVisit ? formatDate(client.lastVisit) : '—'}
                          </div>
                          <div className="text-gray-500">dernière visite</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                          }`}
                          title="Voir le détail"
                        >
                          <Eye size={16} />
                        </button>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </div>

                    {/* Expanded preview */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className={`px-5 pb-4 pt-1 ml-0 md:ml-[52px] ${isDark ? 'border-t border-white/5' : 'border-t border-gray-100'}`}>
                            {/* Recent bookings */}
                            {client.bookings.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Dernières réservations</p>
                                <div className="space-y-1.5">
                                  {client.bookings.slice(0, 3).map(b => (
                                    <div key={b.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                      isDark ? 'bg-white/[0.03]' : 'bg-gray-50'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <Calendar size={12} className="text-gray-500" />
                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                          {b.flash_title || 'Flash'} — {formatDate(b.date_debut)}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {bookingStatusBadge(b.statut_booking)}
                                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                          {formatCurrency(b.prix_total)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Recent projects */}
                            {client.projects.length > 0 && (
                              <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Projets personnalisés</p>
                                <div className="space-y-1.5">
                                  {client.projects.slice(0, 2).map(p => (
                                    <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                      isDark ? 'bg-white/[0.03]' : 'bg-gray-50'
                                    }`}>
                                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                                        {p.body_part} • {p.style}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        p.statut === 'approved' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                          : p.statut === 'rejected' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                                          : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
                                      }`}>
                                        {p.statut}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                              className="mt-3 text-xs font-medium text-violet-500 hover:text-violet-400 transition-colors"
                            >
                              Voir tout le détail →
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════ Client Detail Modal ═══════ */}
      <AnimatePresence>
        {selectedClient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => { saveNotes(); setSelectedClient(null); }}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:left-1/2 md:-translate-x-1/2 md:max-w-2xl md:inset-x-auto z-[61] overflow-y-auto rounded-2xl"
            >
              <div className={`min-h-full rounded-2xl shadow-2xl p-5 md:p-6 ${
                isDark ? 'bg-[#1a1a2e]/95 border border-white/10' : 'bg-white/95 border border-gray-200'
              } backdrop-blur-xl`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-violet-100 text-violet-600'
                    }`}>
                      {(selectedClient.name || selectedClient.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedClient.name || 'Sans nom'}
                      </h2>
                      <p className="text-sm text-gray-500">{selectedClient.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { saveNotes(); setSelectedClient(null); }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Contact info + summary */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 mb-5`}>
                  {[
                    { label: 'Réservations', value: String(selectedClient.bookingCount) },
                    { label: 'Total dépensé', value: formatCurrency(selectedClient.totalSpent) },
                    { label: 'Dernière visite', value: selectedClient.lastVisit ? formatDate(selectedClient.lastVisit) : '—' },
                    { label: 'Statut', value: selectedClient.isActive ? 'Actif' : 'Inactif' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{s.label}</div>
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Contact row */}
                <div className={`flex items-center gap-4 p-3 rounded-xl mb-5 text-xs ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                  <span className="flex items-center gap-1.5 text-gray-500"><Mail size={13} /> {selectedClient.email}</span>
                  {selectedClient.phone && <span className="flex items-center gap-1.5 text-gray-500"><Phone size={13} /> {selectedClient.phone}</span>}
                </div>

                {/* Payment summary */}
                {selectedClient.bookings.length > 0 && (() => {
                  const paid = selectedClient.bookings
                    .filter(b => b.statut_paiement === 'deposit_paid' || b.statut_paiement === 'completed')
                    .reduce((s, b) => s + (b.deposit_amount || 0), 0);
                  const pending = selectedClient.bookings
                    .filter(b => b.statut_paiement === 'pending')
                    .reduce((s, b) => s + (b.deposit_amount || 0), 0);
                  return (
                    <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign size={16} className="text-emerald-500" />
                        <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Résumé paiements</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">Payé</div>
                          <div className="text-sm font-bold text-emerald-500">{formatCurrency(paid)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">En attente</div>
                          <div className="text-sm font-bold text-amber-500">{formatCurrency(pending)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Booking history */}
                <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-violet-500" />
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Historique des réservations ({selectedClient.bookings.length})
                    </span>
                  </div>
                  {selectedClient.bookings.length === 0 ? (
                    <p className="text-xs text-gray-500">Aucune réservation pour ce client.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {selectedClient.bookings.map(b => (
                        <div key={b.id} className={`flex items-center justify-between p-3 rounded-lg text-xs ${
                          isDark ? 'bg-white/[0.03]' : 'bg-white'
                        }`}>
                          <div className="min-w-0 flex-1">
                            <div className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {b.flash_title || 'Flash'}
                            </div>
                            <div className="text-gray-500 mt-0.5">{formatDateTime(b.date_debut)}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {bookingStatusBadge(b.statut_booking)}
                            {paymentStatusBadge(b.statut_paiement)}
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(b.prix_total)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Projects */}
                {selectedClient.projects.length > 0 && (
                  <div className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={16} className="text-blue-500" />
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Projets ({selectedClient.projects.length})
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedClient.projects.map(p => (
                        <div key={p.id} className={`p-3 rounded-lg text-xs ${isDark ? 'bg-white/[0.03]' : 'bg-white'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {p.body_part} • {p.style}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.statut === 'approved' ? (isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                                : p.statut === 'rejected' ? (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600')
                                : (isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600')
                            }`}>
                              {p.statut}
                            </span>
                          </div>
                          {p.description && (
                            <p className="text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-gray-500">
                            <span>{formatDate(p.created_at)}</span>
                            {p.budget_max && <span>Budget: {formatCurrency(p.budget_max)}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className={`rounded-xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote size={16} className="text-amber-500" />
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Notes privées</span>
                  </div>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={saveNotes}
                    placeholder="Ajoutez vos notes sur ce client…"
                    className={`w-full rounded-xl px-3 py-3 text-sm focus:outline-none resize-none transition-colors ${
                      isDark
                        ? 'bg-[#0f0f23] border border-white/10 text-white placeholder-zinc-600 focus:border-white/30'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-300'
                    }`}
                  />
                  <p className="text-[10px] text-gray-500 mt-1.5">Les notes sont sauvegardées localement sur votre navigateur.</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════ Add Client Modal ═══════ */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] w-[90vw] max-w-md"
            >
              <div className={`rounded-2xl shadow-2xl p-6 ${
                isDark ? 'bg-[#1a1a2e]/95 border border-white/10' : 'bg-white/95 border border-gray-200'
              } backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ajouter un client</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={addForm.name}
                      onChange={(e) => setAddForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Jean Dupont"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-white/5 text-white border border-white/[0.06] placeholder-gray-600 focus:border-white/20'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-violet-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="client@example.com"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-white/5 text-white border border-white/[0.06] placeholder-gray-600 focus:border-white/20'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-violet-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      value={addForm.phone}
                      onChange={(e) => setAddForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+33 6 12 34 56 78"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-white/5 text-white border border-white/[0.06] placeholder-gray-600 focus:border-white/20'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-violet-300'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
                    <textarea
                      rows={3}
                      value={addForm.notes}
                      onChange={(e) => setAddForm(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Notes privées sur ce client…"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none transition-colors ${
                        isDark
                          ? 'bg-white/5 text-white border border-white/[0.06] placeholder-gray-600 focus:border-white/20'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 placeholder-gray-400 focus:border-violet-300'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isDark
                        ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleAddClient}
                    disabled={!addForm.email.trim() || addLoading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {addLoading ? (
                      <><Loader2 size={14} className="animate-spin" /> Ajout…</>
                    ) : (
                      <><UserPlus size={14} /> Ajouter</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
