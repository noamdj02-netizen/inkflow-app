import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Euro, Calendar, User, Mail, Phone, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/supabase';

type Booking = Database['public']['Tables']['bookings']['Row'] & {
  flashs?: {
    title: string;
    image_url: string;
    prix: number;
  } | null;
};

type Project = Database['public']['Tables']['projects']['Row'];

export const DashboardRequests: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'projects'>('bookings');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer les bookings avec jointure sur flashs
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          flashs (
            title,
            image_url,
            prix
          )
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        console.log('Bookings data:', bookingsData);
        setBookings(bookingsData || []);
      }

      // Récupérer les projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      } else {
        console.log('Projects data:', projectsData);
        setProjects(projectsData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: 'confirmed' | 'rejected') => {
    if (!user) return;

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

      // Mise à jour immédiate de l'état local
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      
      // Afficher un toast de succès
      setToast({ 
        message: newStatus === 'confirmed' ? 'Réservation acceptée !' : 'Réservation refusée.', 
        type: 'success' 
      });
      setTimeout(() => setToast(null), 3000);

      // Rafraîchir la liste pour avoir les données à jour
      await fetchData();
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      setToast({ message: `Erreur: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const handleProjectStatusUpdate = async (projectId: string, newStatus: 'approved' | 'rejected' | 'quoted') => {
    if (!user) return;

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

      // Mise à jour immédiate de l'état local
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Afficher un toast de succès
      const messages = {
        approved: 'Projet approuvé !',
        rejected: 'Projet refusé.',
        quoted: 'Devis envoyé !',
      };
      setToast({ message: messages[newStatus], type: 'success' });
      setTimeout(() => setToast(null), 3000);

      // Rafraîchir la liste pour avoir les données à jour
      await fetchData();
    } catch (err: any) {
      console.error('Error updating project status:', err);
      setToast({ message: `Erreur: ${err.message}`, type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string, type: 'booking' | 'project') => {
    const badges = {
      booking: {
        pending: { icon: Clock, color: 'yellow', text: 'En attente' },
        confirmed: { icon: CheckCircle, color: 'green', text: 'Confirmé' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        completed: { icon: CheckCircle, color: 'blue', text: 'Terminé' },
        cancelled: { icon: XCircle, color: 'gray', text: 'Annulé' },
        no_show: { icon: AlertCircle, color: 'orange', text: 'No-show' },
      },
      project: {
        pending: { icon: Clock, color: 'yellow', text: 'En attente' },
        approved: { icon: CheckCircle, color: 'green', text: 'Approuvé' },
        rejected: { icon: XCircle, color: 'red', text: 'Refusé' },
        quoted: { icon: AlertCircle, color: 'blue', text: 'Devis envoyé' },
      },
    };

    const statusMap = type === 'booking' ? badges.booking : badges.project;
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = badge.icon;

    const colorClasses = {
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      gray: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${colorClasses[badge.color as keyof typeof colorClasses]}`}>
        <Icon size={14} />
        <span>{badge.text}</span>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <MessageSquare className="text-amber-400" size={20}/> 
            Demandes & Réservations
          </h2>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Tabs */}
        <div className="border-b border-slate-800 sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md">
          <div className="flex">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-bold transition-colors relative text-sm md:text-base ${
                activeTab === 'bookings'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Calendar size={18} />
                Réservations Flash
                {bookings.filter(b => b.statut_booking === 'pending' || b.statut_paiement === 'pending').length > 0 && (
                  <span className="bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {bookings.filter(b => b.statut_booking === 'pending' || b.statut_paiement === 'pending').length}
                  </span>
                )}
              </span>
              {activeTab === 'bookings' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 font-bold transition-colors relative text-sm md:text-base ${
                activeTab === 'projects'
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageSquare size={18} />
                Projets Perso
                {projects.filter(p => p.statut === 'pending').length > 0 && (
                  <span className="bg-amber-400 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                    {projects.filter(p => p.statut === 'pending').length}
                  </span>
                )}
              </span>
              {activeTab === 'projects' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-amber-400" size={32} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'bookings' ? (
                <motion.div
                  key="bookings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {bookings.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                      <Calendar className="text-slate-600 mx-auto mb-4" size={48} />
                      <p className="text-slate-400">Aucune réservation pour le moment</p>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 md:p-6 hover:border-slate-500 transition-colors w-full"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Image du flash */}
                          <div className="w-full md:w-20 h-32 md:h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-700">
                            {booking.flashs?.image_url ? (
                              <img
                                src={booking.flashs.image_url}
                                alt={booking.flashs.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%231e293b" width="400" height="400"/%3E%3Ctext fill="%23475569" font-family="sans-serif" font-size="24" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>

                          {/* Infos */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-bold text-white mb-1">
                                  {booking.flashs?.title || 'Flash'}
                                </h3>
                                <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-2">
                                  <span className="flex items-center gap-1">
                                    <User size={14} /> {booking.client_name || 'Non renseigné'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Mail size={14} /> {booking.client_email}
                                  </span>
                                  {booking.client_phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone size={14} /> {booking.client_phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <Calendar size={14} />
                                  <span>{formatDate(booking.date_debut)}</span>
                                  <span className="text-slate-600">•</span>
                                  <Clock size={14} />
                                  <span>{booking.duree_minutes} min</span>
                                </div>
                              </div>
                              {getStatusBadge(booking.statut_booking, 'booking')}
                            </div>

                            {/* Prix et acompte */}
                            <div className="flex items-center gap-4 mb-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Euro size={16} className="text-slate-400" />
                                <span className="text-slate-300">
                                  Total: <span className="font-bold text-white">{Math.round(booking.prix_total / 100)}€</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">Acompte:</span>
                                <span className="font-bold text-amber-400">{Math.round(booking.deposit_amount / 100)}€</span>
                                <span className="text-slate-500">({booking.deposit_percentage}%)</span>
                              </div>
                              <div className="ml-auto">
                                {getStatusBadge(booking.statut_paiement, 'booking')}
                              </div>
                            </div>

                            {/* Actions */}
                            {(booking.statut_booking === 'pending' || booking.statut_paiement === 'pending') && (
                              <div className="flex gap-2 pt-4 border-t border-slate-700">
                                <button
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'confirmed')}
                                  disabled={updating === booking.id}
                                  className="flex-1 bg-green-500/20 text-green-400 px-4 py-3 md:py-2 rounded-lg font-bold hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  {updating === booking.id ? (
                                    <Loader2 className="animate-spin" size={16} />
                                  ) : (
                                    <>
                                      <CheckCircle size={16} />
                                      Accepter
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleBookingStatusUpdate(booking.id, 'rejected')}
                                  disabled={updating === booking.id}
                                  className="flex-1 bg-red-500/20 text-red-400 px-4 py-3 md:py-2 rounded-lg font-bold hover:bg-red-500/30 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                                >
                                  {updating === booking.id ? (
                                    <Loader2 className="animate-spin" size={16} />
                                  ) : (
                                    <>
                                      <XCircle size={16} />
                                      Refuser
                                    </>
                                  )}
                                </button>
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {projects.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
                      <MessageSquare className="text-slate-600 mx-auto mb-4" size={48} />
                      <p className="text-slate-400">Aucun projet personnalisé pour le moment</p>
                    </div>
                  ) : (
                    projects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-500 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">
                                {project.body_part} • {project.style}
                              </h3>
                              {getStatusBadge(project.statut, 'project')}
                            </div>
                            <p className="text-slate-400 text-sm mb-3">{project.description}</p>
                            <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-3">
                              <span>Taille: {project.size_cm}cm</span>
                              {project.budget_max && (
                                <span>Budget: {Math.round(project.budget_max / 100)}€</span>
                              )}
                              <span>Client: {project.client_email}</span>
                              {project.client_name && <span>Nom: {project.client_name}</span>}
                              {project.ai_price_range && (
                                <span className="text-amber-400">Estimation IA: {project.ai_price_range}</span>
                              )}
                            </div>
                            {project.ai_technical_notes && (
                              <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                                <p className="text-xs text-slate-400">{project.ai_technical_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {project.statut === 'pending' && (
                          <div className="flex gap-2 pt-4 border-t border-slate-700">
                            <button
                              onClick={() => handleProjectStatusUpdate(project.id, 'approved')}
                              disabled={updating === project.id}
                              className="flex-1 bg-green-500/20 text-green-400 px-4 py-3 md:py-2 rounded-lg font-bold hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  <CheckCircle size={16} />
                                  Approuver
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleProjectStatusUpdate(project.id, 'quoted')}
                              disabled={updating === project.id}
                              className="flex-1 bg-blue-500/20 text-blue-400 px-4 py-3 md:py-2 rounded-lg font-bold hover:bg-blue-500/30 transition-colors border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  <AlertCircle size={16} />
                                  Envoyer Devis
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleProjectStatusUpdate(project.id, 'rejected')}
                              disabled={updating === project.id}
                              className="flex-1 bg-red-500/20 text-red-400 px-4 py-3 md:py-2 rounded-lg font-bold hover:bg-red-500/30 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
                            >
                              {updating === project.id ? (
                                <Loader2 className="animate-spin" size={16} />
                              ) : (
                                <>
                                  <XCircle size={16} />
                                  Refuser
                                </>
                              )}
                            </button>
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
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
            <span className="font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
