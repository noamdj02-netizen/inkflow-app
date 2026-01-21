import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Euro, Calendar, User, Mail, Phone, Image as ImageIcon, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
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

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const } }
};

export const DashboardRequests: React.FC = () => {
  const { user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'projects'>('bookings');
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, viewMode]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let bookingsQuery = supabase
        .from('bookings')
        .select(`
          *,
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

      let projectsQuery = supabase
        .from('projects')
        .select('*')
        .eq('artist_id', user.id);

      if (viewMode === 'pending') {
        projectsQuery = projectsQuery.eq('statut', 'pending');
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

    const url = `${window.location.origin}/p/${profile.slug_profil}`;

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

  const RequestsSkeleton: React.FC<{ showImage?: boolean }> = ({ showImage = true }) => {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl p-4 md:p-5">
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

                <div className="flex gap-2 pt-3 border-t border-white/5">
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
        confirmed: { icon: CheckCircle, color: 'emerald', text: 'Confirmé' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        completed: { icon: CheckCircle, color: 'cyan', text: 'Terminé' },
        cancelled: { icon: XCircle, color: 'zinc', text: 'Annulé' },
        no_show: { icon: AlertCircle, color: 'red', text: 'No-show' },
        deposit_paid: { icon: CheckCircle, color: 'emerald', text: 'Acompte payé' },
      },
      project: {
        pending: { icon: Clock, color: 'amber', text: 'En attente' },
        approved: { icon: CheckCircle, color: 'emerald', text: 'Approuvé' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        quoted: { icon: AlertCircle, color: 'cyan', text: 'Devis envoyé' },
      },
    };

    const statusMap = type === 'booking' ? badges.booking : badges.project;
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = badge.icon;

    const colorClasses = {
      amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      red: 'bg-red-500/10 text-red-400 border-red-500/20',
      cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    };

    return (
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colorClasses[badge.color as keyof typeof colorClasses]}`}>
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
      <header className="h-16 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-4 md:px-6 z-10 flex-shrink-0">
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-display font-bold flex items-center gap-2 text-white"
        >
          <MessageSquare className="text-zinc-500" size={18}/> 
          <span className="hidden sm:inline">Demandes & Réservations</span>
          <span className="sm:hidden">Demandes</span>
        </motion.h2>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 bg-[#050505]">
        {/* Tabs */}
        <div className="border-b border-white/5 sticky top-0 z-20 bg-[#0a0a0a]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-4 md:px-6 py-4 font-medium transition-colors relative text-sm ${
                activeTab === 'bookings' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar size={16} />
                Réservations Flash
              </span>
              {activeTab === 'bookings' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 md:px-6 py-4 font-medium transition-colors relative text-sm ${
                activeTab === 'projects' ? 'text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                Projets Perso
              </span>
              {activeTab === 'projects' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          {/* Sous-onglets */}
          <div className="flex border-t border-white/5">
            <button
              onClick={() => setViewMode('pending')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                viewMode === 'pending' ? 'text-white bg-white/5' : 'text-zinc-600 hover:text-white'
              }`}
            >
              En attente
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                viewMode === 'history' ? 'text-white bg-white/5' : 'text-zinc-600 hover:text-white'
              }`}
            >
              Historique
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6">
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
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="glass rounded-2xl p-4 md:p-5 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Image du flash */}
                          <div className="w-full md:w-20 h-28 md:h-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                            {booking.flashs?.image_url ? (
                              <ImageSkeleton
                                src={booking.flashs.image_url}
                                alt={`Tatouage ${booking.flashs.title}`}
                                className="w-full h-full"
                                aspectRatio=""
                                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%2318181b' width='400' height='400'/%3E%3C/svg%3E"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-white mb-1 truncate">
                                  {booking.flashs?.title || 'Flash'}
                                </h3>
                                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
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

                            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
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
                              <span className="text-zinc-400">
                                Total: <span className="font-semibold text-white">{Math.round(booking.prix_total / 100)}€</span>
                              </span>
                              <span className="text-zinc-400">
                                Acompte: <span className="font-semibold text-white">{Math.round(booking.deposit_amount / 100)}€</span>
                              </span>
                              {booking.statut_booking === 'confirmed' && booking.statut_paiement === 'deposit_paid' && profile && (
                                <InvoiceButton booking={booking} artist={profile} />
                              )}
                            </div>

                            {/* Actions */}
                            {(booking.statut_booking === 'pending' || booking.statut_paiement === 'pending') && (
                              <div className="flex gap-2 pt-3 border-t border-white/5">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                  disabled={updating === booking.id}
                                  className="flex-1 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-all border border-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
                                  className="flex-1 bg-red-500/10 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="glass rounded-2xl p-4 md:p-5 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-base font-semibold text-white">
                                {project.body_part} • {project.style}
                              </h3>
                              {getStatusBadge(project.statut, 'project')}
                            </div>
                            <p className="text-zinc-500 text-sm mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-zinc-600">
                              <span>Taille: {project.size_cm}cm</span>
                              {project.budget_max && (
                                <span>Budget: {Math.round(project.budget_max / 100)}€</span>
                              )}
                              <span>{project.client_email}</span>
                            </div>
                          </div>
                        </div>

                        {project.ai_technical_notes && (
                          <div className="bg-white/5 rounded-xl p-3 mb-3 border border-white/5">
                            <p className="text-xs text-zinc-500">{project.ai_technical_notes}</p>
                          </div>
                        )}

                        {project.statut === 'pending' && (
                          <div className="flex gap-2 pt-3 border-t border-white/5">
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleProjectStatusUpdate(project.id, 'approved')}
                              disabled={updating === project.id}
                              className="flex-1 bg-emerald-500/10 text-emerald-400 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-all border border-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                              onClick={() => handleProjectStatusUpdate(project.id, 'quoted')}
                              disabled={updating === project.id}
                              className="flex-1 bg-cyan-500/10 text-cyan-400 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-cyan-500/20 transition-all border border-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
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
                              onClick={() => handleProjectStatusUpdate(project.id, 'rejected')}
                              disabled={updating === project.id}
                              className="flex-1 bg-red-500/10 text-red-400 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-all border border-red-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
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

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl flex items-center gap-3 ${
              toast.type === 'success'
                ? 'glass text-emerald-400'
                : 'glass text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <XCircle size={16} />
            )}
            <span className="font-medium text-sm text-white">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
