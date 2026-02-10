import React, { useState, useEffect } from 'react';
import { toast as sonnerToast } from 'sonner';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Euro, Calendar, User, Mail, Phone, Image as ImageIcon, X, Share2, FileText, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import type { Database } from '../../types/supabase';
import { InvoiceButton } from './InvoiceButton';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../common/EmptyState';
import { Skeleton } from '../common/Skeleton';
import { ImageSkeleton } from '../common/ImageSkeleton';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  flashs?: {
    title: string;
    image_url: string;
    prix: number;
  } | null;
};

type Project = Database['public']['Tables']['projects']['Row'];
type CareTemplate = Database['public']['Tables']['care_templates']['Row'];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } }
};

export const DashboardRequests: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useArtistProfile();
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [careTemplates, setCareTemplates] = useState<CareTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'projects'>('bookings');
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [careTemplateId, setCareTemplateId] = useState<string | null>(null);
  const [customCare, setCustomCare] = useState<string>('');
  const [savingCare, setSavingCare] = useState(false);
  const [sendingCare, setSendingCare] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, viewMode]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('care_templates')
        .select('*')
        .eq('artist_id', user.id)
        .order('updated_at', { ascending: false });
      if (!error) setCareTemplates(data || []);
    })();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Optimisé: sélectionner uniquement les champs nécessaires (évite de charger tous les champs)
      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          client_email,
          date_debut,
          date_fin,
          prix_total,
          deposit_amount,
          statut_booking,
          statut_paiement,
          created_at,
          flash_id,
          project_id,
          flashs (
            title,
            image_url,
            prix
          )
        `)
        .eq('artist_id', user.id);

      if (viewMode === 'pending') {
        bookingsQuery = bookingsQuery.eq('statut_booking', 'pending');
      } else {
        bookingsQuery = bookingsQuery.in('statut_booking', ['confirmed', 'rejected', 'completed', 'cancelled', 'no_show']);
      }

      const { data: bookingsData, error: bookingsError } = await bookingsQuery
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        setBookings(bookingsData || []);
      }

      // Optimisé: sélectionner uniquement les champs utilisés dans le composant
      let projectsQuery = supabase
        .from('projects')
        .select(`
          id,
          client_name,
          client_email,
          body_part,
          size_cm,
          style,
          description,
          budget_max,
          statut,
          artist_quoted_price,
          created_at,
          updated_at,
          is_cover_up,
          is_first_tattoo,
          care_template_id,
          custom_care_instructions,
          care_sent_at
        `)
        .eq('artist_id', user.id);

      if (viewMode === 'pending') {
        // "INQUIRY" = demandes entrantes (compat legacy: 'pending')
        projectsQuery = projectsQuery.in('statut', ['inquiry', 'pending']);
      } else {
        projectsQuery = projectsQuery.in('statut', ['approved', 'rejected', 'quoted']);
      }

      const { data: projectsData, error: projectsError } = await projectsQuery
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      } else {
        setProjects(projectsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!profile?.slug_profil || typeof window === 'undefined') {
      setToast({ message: 'Ajoutez un slug de profil pour pouvoir partager votre lien.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const url = `${window.location.origin}/${profile.slug_profil}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `${profile.nom_studio || 'Mon studio'} - InkFlow`,
          text: `Découvrez mes flashs disponibles et réservez votre créneau.`,
          url,
        });
        setToast({ message: 'Lien partagé.', type: 'success' });
        setTimeout(() => setToast(null), 2500);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast({ message: 'Lien copié !', type: 'success' });
        setTimeout(() => setToast(null), 2500);
        return;
      }

      setToast({ message: 'Impossible de partager automatiquement sur cet appareil.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: 'Erreur lors du partage.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setCareTemplateId(project.care_template_id || null);
    setCustomCare(project.custom_care_instructions || '');
  };

  const saveProjectCare = async () => {
    if (!user || !selectedProject) return;
    setSavingCare(true);
    try {
      const { data, error } = await (supabase as any)
        .from('projects')
        .update({
          care_template_id: careTemplateId,
          custom_care_instructions: customCare.trim().length > 0 ? customCare.trim() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id)
        .eq('artist_id', user.id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setProjects(prev => prev.map(p => (p.id === data.id ? data : p)));
      setSelectedProject(data);
      setToast({ message: 'Soins enregistrés', type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      setToast({ message: `Erreur: ${e instanceof Error ? e.message : 'Impossible d’enregistrer'}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingCare(false);
    }
  };

  const sendCareInstructions = async () => {
    if (!selectedProject) return;
    setSendingCare(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/send-care-instructions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_id: selectedProject.id,
          care_template_id: careTemplateId,
          custom_care_instructions: customCare.trim().length > 0 ? customCare.trim() : null,
        }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Erreur serveur (HTTP ${res.status})`);
      }

      const care_sent_at = json.care_sent_at as string | undefined;
      const updatedProject = {
        ...selectedProject,
        care_template_id: careTemplateId,
        custom_care_instructions: customCare.trim().length > 0 ? customCare.trim() : null,
        care_sent_at: care_sent_at || new Date().toISOString(),
      } as Project;

      setProjects(prev => prev.map(p => (p.id === updatedProject.id ? updatedProject : p)));
      setSelectedProject(updatedProject);
      setToast({ message: 'Email de soins envoyé', type: 'success' });
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      setToast({ message: `Erreur: ${msg}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSendingCare(false);
    }
  };

  const RequestsSkeleton: React.FC<{ showImage?: boolean }> = ({ showImage = true }) => {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`rounded-2xl p-4 md:p-5 ${isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'}`}>
            <div className="flex flex-col md:flex-row gap-4">
              {showImage && (
                <Skeleton className="w-full md:w-20 h-28 md:h-20 rounded-xl" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <div className="flex flex-wrap gap-3">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-16" />
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <div className={`flex gap-2 pt-3 border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    if (!user) return;

    setBookings(prev => prev.filter(b => b.id !== bookingId));
    setUpdating(bookingId);

    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({ 
          statut_booking: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('artist_id', user.id);

      if (error) throw error;

      setToast({ 
        message: newStatus === 'confirmed' ? 'Réservation confirmée !' : 'Réservation refusée.', 
        type: 'success' 
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error updating booking status:', err);
      await fetchData();
      setToast({ 
        message: `Erreur: ${err instanceof Error ? err.message : 'Impossible de mettre à jour'}`, 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const handleProjectStatusUpdate = async (projectId: string, newStatus: 'approved' | 'rejected' | 'quoted') => {
    if (!user) return;

    setProjects(prev => prev.filter(p => p.id !== projectId));
    setUpdating(projectId);

    try {
      const { error } = await (supabase as any)
        .from('projects')
        .update({ 
          statut: newStatus,
          artist_response_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .eq('artist_id', user.id);

      if (error) throw error;

      const messages = {
        approved: 'Projet approuvé !',
        rejected: 'Projet refusé.',
        quoted: 'Devis envoyé !',
      };
      setToast({ message: messages[newStatus], type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Error updating project status:', err);
      await fetchData();
      setToast({ 
        message: `Erreur: ${err instanceof Error ? err.message : 'Impossible de mettre à jour'}`, 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string, type: 'booking' | 'project') => {
    const badges = {
      booking: {
        pending: { icon: Clock, color: 'amber', text: 'En attente' },
        confirmed: { icon: CheckCircle, color: 'emerald', text: 'Booked' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        completed: { icon: CheckCircle, color: 'zinc', text: 'Complété' },
        cancelled: { icon: XCircle, color: 'zinc', text: 'Annulé' },
        no_show: { icon: AlertCircle, color: 'red', text: 'No-show' },
        deposit_paid: { icon: CheckCircle, color: 'emerald', text: 'Acompte payé' },
      },
      project: {
        inquiry: { icon: MessageSquare, color: 'blue', text: 'Inquiry' },
        pending: { icon: MessageSquare, color: 'blue', text: 'Inquiry' },
        approved: { icon: CheckCircle, color: 'emerald', text: 'Approuvé' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        quoted: { icon: AlertCircle, color: 'violet', text: 'Devis' },
      },
    };

    const statusMap = type === 'booking' ? badges.booking : badges.project;
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = badge.icon;

    const colorClasses = {
      amber: isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
      emerald: isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-600 border-emerald-200',
      red: isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-200',
      gold: isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-200',
      violet: isDark ? 'bg-violet-500/10 text-violet-300 border-violet-500/20' : 'bg-violet-50 text-violet-600 border-violet-200',
      zinc: isDark ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 'bg-gray-100 text-gray-500 border-gray-200',
      blue: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200',
    };

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorClasses[badge.color as keyof typeof colorClasses] || colorClasses.zinc}`}>
        <Icon size={12} />
        <span>{badge.text}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Demandes & Réservations
        </h1>
        <p className="text-gray-500 mt-1">Gérez vos réservations flash et projets personnalisés</p>
      </div>

      {/* Tabs Card */}
      <div className={`rounded-2xl overflow-hidden mb-6 ${
        isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
      }`}>
        {/* Main Tabs */}
        <div className={`border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-4 md:px-6 py-4 font-medium transition-colors relative text-sm ${
                activeTab === 'bookings'
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                Réservations Flash
              </span>
              {activeTab === 'bookings' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${isDark ? 'bg-white' : 'bg-violet-500'}`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 md:px-6 py-4 font-medium transition-colors relative text-sm ${
                activeTab === 'projects'
                  ? isDark ? 'text-white' : 'text-gray-900'
                  : isDark ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                Projets Perso
              </span>
              {activeTab === 'projects' && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${isDark ? 'bg-white' : 'bg-violet-500'}`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          {/* Sous-onglets */}
          <div className={`flex border-t ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
            <button
              onClick={() => setViewMode('pending')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                viewMode === 'pending'
                  ? isDark ? 'text-white bg-white/5' : 'text-gray-900 bg-gray-50'
                  : isDark ? 'text-zinc-600 hover:text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                viewMode === 'history'
                  ? isDark ? 'text-white bg-white/5' : 'text-gray-900 bg-gray-50'
                  : isDark ? 'text-zinc-600 hover:text-white' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-5">
          {loading ? (
            <RequestsSkeleton showImage={activeTab === 'bookings'} />
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'bookings' ? (
                <motion.div
                  key="bookings"
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  className="space-y-3"
                >
                  {bookings.length === 0 ? (
                    <motion.div variants={fadeInUp}>
                      {viewMode === 'pending' ? (
                        <EmptyState
                          icon={CheckCircle}
                          title="Tout est à jour !"
                          description="Aucune réservation flash en attente. Créez des flashs et partagez votre lien pour recevoir plus de demandes."
                          primaryAction={{ label: 'Créer un flash', onClick: () => navigate('/dashboard/flashs') }}
                          secondaryAction={{ label: 'Partager mon lien', onClick: handleShareLink }}
                        />
                      ) : (
                        <EmptyState
                          icon={Calendar}
                          title="Aucun historique"
                          description="Les réservations confirmées/refusées apparaîtront ici."
                          primaryAction={{ label: 'Voir mon calendrier', onClick: () => navigate('/dashboard/calendar') }}
                        />
                      )}
                    </motion.div>
                  ) : (
                    bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        variants={fadeInUp}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        className={`rounded-xl p-4 md:p-5 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                            : 'bg-gray-50 border border-gray-100 hover:bg-gray-100/80 hover:border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Image du flash */}
                          <div className={`w-full md:w-20 h-28 md:h-20 rounded-xl overflow-hidden flex-shrink-0 ${
                            isDark ? 'bg-white/5' : 'bg-gray-200'
                          }`}>
                            {booking.flashs?.image_url ? (
                              <ImageSkeleton
                                src={booking.flashs.image_url}
                                alt={`Tatouage ${booking.flashs.title}`}
                                className="w-full h-full"
                                aspectRatio=""
                                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%2318181b' width='400' height='400'/%3E%3C/svg%3E"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${isDark ? 'text-zinc-700' : 'text-gray-400'}`}>
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-base font-semibold mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {booking.flashs?.title || 'Flash'}
                                </h3>
                                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User size={12} /> {booking.client_name || 'Non renseigné'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail size={12} /> {booking.client_email}
                                  </span>
                                </div>
                              </div>
                              {getStatusBadge(booking.statut_booking, 'booking')}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(booking.date_debut)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {booking.duree_minutes} min
                              </span>
                            </div>

                            {/* Prix */}
                            <div className="flex items-center gap-4 text-xs mb-3">
                              <span className="text-gray-500">
                                Total: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(booking.prix_total / 100)}€</span>
                              </span>
                              <span className="text-gray-500">
                                Acompte: <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(booking.deposit_amount / 100)}€</span>
                              </span>
                              {booking.statut_booking === 'confirmed' && booking.statut_paiement === 'deposit_paid' && profile && (
                                <InvoiceButton booking={booking} artist={profile} />
                              )}
                            </div>

                            {/* Actions */}
                            {(booking.statut_booking === 'pending' || booking.statut_paiement === 'pending') && (
                              <div className={`flex gap-2 pt-3 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                  disabled={updating === booking.id}
                                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    isDark
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                >
                                  {updating === booking.id ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <>
                                      <CheckCircle size={14} />
                                      Accepter
                                    </>
                                  )}
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'rejected')}
                                  disabled={updating === booking.id}
                                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                                    isDark
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                  }`}
                                >
                                  {updating === booking.id ? (
                                    <Loader2 className="animate-spin" size={14} />
                                  ) : (
                                    <>
                                      <XCircle size={14} />
                                      Refuser
                                    </>
                                  )}
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="projects"
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0 }}
                  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
                  className="space-y-3"
                >
                  {projects.length === 0 ? (
                    <motion.div variants={fadeInUp}>
                      {viewMode === 'pending' ? (
                        <EmptyState
                          icon={MessageSquare}
                          title="Aucune demande de projet perso"
                          description="Les demandes personnalisées envoyées par vos clients apparaîtront ici."
                          primaryAction={{ label: 'Optimiser mon profil', onClick: () => navigate('/dashboard/settings') }}
                          secondaryAction={{ label: 'Partager mon lien', onClick: handleShareLink }}
                        />
                      ) : (
                        <EmptyState
                          icon={MessageSquare}
                          title="Aucun historique"
                          description="Les projets approuvés/refusés apparaîtront ici."
                          primaryAction={{ label: 'Voir mon calendrier', onClick: () => navigate('/dashboard/calendar') }}
                        />
                      )}
                    </motion.div>
                  ) : (
                    projects.map((project) => (
                      <motion.div
                        key={project.id}
                        variants={fadeInUp}
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        className={`rounded-xl p-4 md:p-5 transition-all cursor-pointer ${
                          isDark
                            ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                            : 'bg-gray-50 border border-gray-100 hover:bg-gray-100/80 hover:border-gray-200'
                        }`}
                        onClick={() => openProject(project)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {project.body_part} • {project.style}
                              </h3>
                              {getStatusBadge(project.statut, 'project')}
                            </div>
                            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                              <span>Taille: {project.size_cm}cm</span>
                              {project.budget_max && (
                                <span>Budget: {Math.round(project.budget_max / 100)}€</span>
                              )}
                              <span>{project.client_email}</span>
                            </div>
                          </div>
                        </div>

                        {project.ai_technical_notes && (
                          <div className={`rounded-xl p-3 mb-3 ${
                            isDark ? 'bg-white/5 border border-white/5' : 'bg-gray-100 border border-gray-200'
                          }`}>
                            <p className="text-xs text-gray-500">{project.ai_technical_notes}</p>
                          </div>
                        )}

                        {['pending', 'inquiry'].includes(project.statut) && (
                          <div className={`flex gap-2 pt-3 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleProjectStatusUpdate(project.id, 'approved'); }}
                              disabled={updating === project.id}
                              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                                isDark
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <>
                                  <CheckCircle size={14} />
                                  Approuver
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleProjectStatusUpdate(project.id, 'quoted'); }}
                              disabled={updating === project.id}
                              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                                isDark
                                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
                                  : 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100'
                              }`}
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <>
                                  <AlertCircle size={14} />
                                  Devis
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); handleProjectStatusUpdate(project.id, 'rejected'); }}
                              disabled={updating === project.id}
                              className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                                isDark
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                  : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                              }`}
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={14} />
                              ) : (
                                <>
                                  <XCircle size={14} />
                                  Refuser
                                </>
                              )}
                            </motion.button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Project Details (with Post-Tattoo Care) */}
      <AnimatePresence>
        {selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setSelectedProject(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.22 }}
              className="fixed left-0 right-0 bottom-0 z-[61] md:left-1/2 md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl"
            >
              <div className={`rounded-t-3xl md:rounded-3xl shadow-2xl p-5 md:p-6 ${
                isDark
                  ? 'bg-[#1a1a2e]/95 border border-white/10'
                  : 'bg-white/95 border border-gray-200'
              } backdrop-blur-xl`}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Détails du projet</div>
                    <div className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedProject.body_part} • {selectedProject.style}
                    </div>
                    <div className="text-gray-500 text-sm mt-1 truncate">
                      {selectedProject.client_name || 'Client'} • {selectedProject.client_email}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isDark ? 'bg-white/5 hover:bg-white/10 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={`rounded-2xl p-4 mb-4 ${
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Description</div>
                  <div className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedProject.description}</div>
                </div>

                <div className={`rounded-2xl p-4 ${
                  isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-violet-500" />
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Post‑Tattoo Care</div>
                    </div>
                    {selectedProject.care_sent_at && (
                      <div className="text-xs text-gray-500">
                        Envoyé le {new Date(selectedProject.care_sent_at).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Template</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={careTemplateId || ''}
                      onChange={(e) => setCareTemplateId(e.target.value || null)}
                      className={`flex-1 rounded-xl px-3 py-2.5 focus:outline-none transition-colors ${
                        isDark
                          ? 'bg-[#0f0f23] border border-white/10 text-white focus:border-white/30'
                          : 'bg-white border border-gray-200 text-gray-900 focus:border-violet-300'
                      }`}
                    >
                      <option value="">— Aucun —</option>
                      {careTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const url = '/dashboard/settings/care-sheets';
                        navigate(url);
                        sonnerToast('Ouverture', { description: 'Gérez vos templates dans les paramètres.' });
                      }}
                      className={`px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      title="Gérer mes templates"
                    >
                      Gérer
                    </button>
                  </div>

                  <label className="block text-xs text-gray-500 uppercase tracking-wider mt-4 mb-2">
                    Notes personnalisées (override)
                  </label>
                  <textarea
                    rows={4}
                    value={customCare}
                    onChange={(e) => setCustomCare(e.target.value)}
                    className={`w-full rounded-xl px-3 py-3 focus:outline-none transition-colors resize-none ${
                      isDark
                        ? 'bg-[#0f0f23] border border-white/10 text-white placeholder-zinc-600 focus:border-white/30'
                        : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-300'
                    }`}
                    placeholder={"Optionnel. Si rempli, ce texte remplace le template.\nEx:\n- Laver 2x/jour\n- Pas de piscine 2 semaines"}
                  />

                  <div className="flex gap-2 pt-4">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={saveProjectCare}
                      disabled={savingCare}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                          : 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {savingCare ? 'Sauvegarde…' : 'Enregistrer'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={sendCareInstructions}
                      disabled={sendingCare}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-colors ${
                        isDark
                          ? 'bg-white text-black hover:bg-zinc-100'
                          : 'bg-violet-600 text-white hover:bg-violet-700'
                      }`}
                    >
                      {sendingCare ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Envoi…
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Envoyer
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl flex items-center gap-3 backdrop-blur-xl shadow-lg ${
              toast.type === 'success'
                ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : isDark ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-gray-500 hover:text-gray-300 transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
