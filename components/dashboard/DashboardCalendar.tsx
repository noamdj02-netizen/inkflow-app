import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, X, User, Mail, Phone, Clock, CheckCircle, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/supabase';
import { Skeleton } from '../common/Skeleton';
import { ImageSkeleton } from '../common/ImageSkeleton';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type Booking = BookingRow & {
  flashs?: {
    title: string;
    image_url: string;
    prix: number;
  } | null;
  projects?: {
    body_part: string;
    style: string;
    description: string;
  } | null;
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  booking: Booking;
  type: 'flash' | 'project';
}

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, isOpen, onClose, onStatusUpdate }) => {
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: 'completed' | 'cancelled' | 'no_show') => {
    if (!event || !user) return;

    setUpdating(true);
    try {
      const { error } = await (supabase as any)
        .from('bookings')
        .update({
          statut_booking: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.booking.id)
        .eq('artist_id', user.id);

      if (error) throw error;
      onStatusUpdate();
      onClose();
    } catch (err) {
      console.error('Error updating booking status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen || !event) return null;

  const { booking } = event;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              {event.type === 'flash' && booking.flashs?.image_url && (
                <ImageSkeleton
                  src={booking.flashs.image_url}
                  alt={booking.flashs.title}
                  className="w-20 h-20 rounded-xl border border-white/10"
                  aspectRatio=""
                  fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%2318181b' width='400' height='400'/%3E%3C/svg%3E"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-display font-bold text-white mb-1">
                  {event.type === 'flash' 
                    ? booking.flashs?.title || 'Flash'
                    : `${booking.projects?.body_part} • ${booking.projects?.style}`
                  }
                </h3>
                <p className="text-zinc-500 text-sm">
                  {event.type === 'flash' ? 'Réservation Flash' : 'Projet Personnalisé'}
                </p>
              </div>
            </div>
          </div>

          {/* Infos Client */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="text-zinc-500" size={18} />
              <span className="text-zinc-300">
                <span className="font-semibold text-white">{booking.client_name || 'Non renseigné'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="text-zinc-500" size={18} />
              <span className="text-zinc-400">{booking.client_email}</span>
            </div>
            {booking.client_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-zinc-500" size={18} />
                <span className="text-zinc-400">{booking.client_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="text-zinc-500" size={18} />
              <span className="text-zinc-400">
                {new Date(booking.date_debut).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })} - {new Date(booking.date_fin).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="text-zinc-500" size={18} />
              <span className="text-zinc-400">Durée: {booking.duree_minutes} minutes</span>
            </div>
          </div>

          {/* Prix */}
          <div className="glass rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-500 text-sm">Prix total</span>
              <span className="text-white font-bold text-lg">{Math.round(booking.prix_total / 100)}€</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-500 text-sm">Acompte</span>
              <span className="text-brand-purple font-bold">{Math.round(booking.deposit_amount / 100)}€</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-zinc-500 text-sm">Statut paiement</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                booking.statut_paiement === 'pending' ? 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20' :
                booking.statut_paiement === 'deposit_paid' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20' :
                booking.statut_paiement === 'fully_paid' ? 'bg-brand-mint/10 text-brand-mint border-brand-mint/20' :
                'bg-brand-pink/10 text-brand-pink border-brand-pink/20'
              }`}>
                {booking.statut_paiement === 'pending' ? 'En attente' :
                 booking.statut_paiement === 'deposit_paid' ? 'Acompte payé' :
                 booking.statut_paiement === 'fully_paid' ? 'Payé' : 'Échoué'}
              </span>
            </div>
          </div>

          {/* Actions */}
          {booking.statut_booking === 'confirmed' && (
            <div className="space-y-2">
              <p className="text-sm text-zinc-500 mb-3">Marquer comme :</p>
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="w-full bg-brand-mint/10 text-brand-mint px-4 py-3 rounded-xl font-medium hover:bg-brand-mint/20 transition-colors border border-brand-mint/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Terminé
                  </>
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate('no_show')}
                disabled={updating}
                className="w-full bg-brand-yellow/10 text-brand-yellow px-4 py-3 rounded-xl font-medium hover:bg-brand-yellow/20 transition-colors border border-brand-yellow/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <AlertCircle size={18} />
                    No-show
                  </>
                )}
              </button>
              <button
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
                className="w-full bg-brand-pink/10 text-brand-pink px-4 py-3 rounded-xl font-medium hover:bg-brand-pink/20 transition-colors border border-brand-pink/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <XCircle size={18} />
                    Annulé
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

export const DashboardCalendar: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const width = window.innerWidth || 0;
      setIsMobile(width < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Optimisé: sélectionner uniquement les champs nécessaires pour le calendrier
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          client_email,
          date_debut,
          date_fin,
          duree_minutes,
          prix_total,
          flash_id,
          project_id,
          flashs (
            title,
            image_url,
            prix
          ),
          projects (
            body_part,
            style,
            description
          )
        `)
        .eq('artist_id', user.id)
        .eq('statut_booking', 'confirmed')
        .order('date_debut', { ascending: true });

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        const calendarEvents: CalendarEvent[] = ((data || []) as Booking[]).map((booking) => {
          const start = new Date(booking.date_debut);
          const end = new Date(booking.date_fin);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return null;
          }
          
          const title = booking.flash_id
            ? `${booking.client_name || 'Client'} • ${booking.flashs?.title || 'Flash'}`
            : `${booking.client_name || 'Client'} • ${booking.projects?.body_part || 'Projet'}`;

          return {
            id: booking.id,
            title,
            start,
            end,
            booking,
            type: (booking.flash_id ? 'flash' : 'project') as 'flash' | 'project',
          };
        }).filter((e): e is CalendarEvent => e !== null);

        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleStatusUpdate = () => {
    fetchBookings();
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const hours = Array.from({ length: 11 }, (_, i) => 10 + i);

  const getEventStyle = (event: CalendarEvent, dayIndex: number) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const weekDays = getWeekDays();
    const day = weekDays[dayIndex];
    
    if (start.toDateString() !== day.toDateString()) {
      return null;
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    return {
      startHour,
      duration,
    };
  };

  const weekDays = getWeekDays();

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      {/* Header */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 glass rounded-xl flex items-center justify-center">
                <Calendar className="text-brand-purple" size={20} />
              </div>
              Calendrier
            </h1>
            <div className="flex items-center gap-1 glass rounded-xl p-1">
              <button
                onClick={() => {
                  const prevWeek = new Date(currentWeek);
                  prevWeek.setDate(prevWeek.getDate() - 7);
                  setCurrentWeek(prevWeek);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-1 text-zinc-300 text-sm font-medium min-w-[150px] text-center">
                {weekDays[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  const nextWeek = new Date(currentWeek);
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setCurrentWeek(nextWeek);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white glass rounded-lg hover:bg-white/10 transition-colors"
            >
              Aujourd'hui
            </button>
          </div>
          <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-200 transition-colors">
            <Plus size={16}/> Nouveau RDV
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative pb-20 md:pb-6">
        {loading ? (
          isMobile ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-3 w-16 ml-auto" />
                      <Skeleton className="h-4 w-20 ml-auto" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 min-w-[800px] overflow-hidden">
              <div className="grid grid-cols-8 border-b border-white/5 bg-[#0a0a0a]">
                <div className="p-4 border-r border-white/5">
                  <Skeleton className="h-3 w-12 mx-auto" />
                </div>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className={`p-4 text-center border-r border-white/5 ${i === 6 ? 'border-r-0' : ''}`}>
                    <Skeleton className="h-3 w-10 mx-auto mb-2" />
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  </div>
                ))}
              </div>
              <div className="space-y-0">
                {Array.from({ length: 6 }).map((_, row) => (
                  <div key={row} className="grid grid-cols-8 border-b border-white/5 h-24">
                    <div className="border-r border-white/5 p-2">
                      <Skeleton className="h-3 w-10 ml-auto mt-2" />
                    </div>
                    {Array.from({ length: 7 }).map((_, col) => (
                      <div
                        key={col}
                        className={`border-r border-white/5 ${col === 6 ? 'border-r-0' : ''} relative`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : isMobile ? (
          /* Mobile List View */
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl">
                <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="text-zinc-600" size={28} />
                </div>
                <p className="text-lg font-medium text-white">Aucun rendez-vous</p>
                <p className="text-sm mt-2 text-zinc-500">Vos rendez-vous confirmés apparaîtront ici</p>
              </div>
            ) : (
              events.map((event) => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleEventClick(event)}
                    className={`glass rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors ${
                      event.type === 'flash'
                        ? 'border-l-4 border-l-brand-purple'
                        : 'border-l-4 border-l-brand-cyan'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className={`text-xs font-medium mb-1 ${
                          event.type === 'flash' ? 'text-brand-purple' : 'text-brand-cyan'
                        }`}>
                          {event.type === 'flash' ? '⚡ Flash' : '🎨 Projet'}
                        </div>
                        <div className="text-white font-semibold">
                          {event.booking?.flashs?.title || event.booking?.projects?.body_part || 'Rendez-vous'}
                        </div>
                        <div className="text-zinc-500 text-sm">{event.booking?.client_name || 'Client'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 mb-1">
                          {start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-sm font-semibold text-white">
                          {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    {event.booking?.flashs?.prix && (
                      <div className="text-sm font-medium text-brand-mint">
                        {Math.round(event.booking.flashs.prix / 100).toLocaleString('fr-FR')}€
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/5 min-w-[800px] overflow-hidden">
            {/* Calendar Header Row */}
            <div className="grid grid-cols-8 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10">
              <div className="p-4 border-r border-white/5 text-center text-xs font-medium text-zinc-600">
                GMT+1
              </div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`p-4 text-center border-r border-white/5 ${i === 6 ? 'border-r-0' : ''}`}>
                    <div className="text-xs text-zinc-600 uppercase mb-1 font-medium">
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-black w-8 h-8 rounded-full bg-white flex items-center justify-center mx-auto' : 'text-white'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Body */}
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-white/5 h-24">
                  <div className="border-r border-white/5 p-2 text-right">
                    <span className="text-xs text-zinc-600 font-mono -translate-y-1/2 block">{hour}:00</span>
                  </div>
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`border-r border-white/5 ${dayIndex === 6 ? 'border-r-0' : ''} relative group hover:bg-white/[0.02] transition-colors`}
                    >
                      {events
                        .filter(event => {
                          const eventStart = new Date(event.start);
                          return eventStart.toDateString() === day.toDateString();
                        })
                        .map((event) => {
                          const style = getEventStyle(event, dayIndex);
                          if (!style) return null;

                          const start = new Date(event.start);
                          const end = new Date(event.end);

                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => handleEventClick(event)}
                              className={`absolute left-1 right-1 rounded-lg p-2 border cursor-pointer hover:scale-[1.02] transition-transform z-10 flex flex-col justify-between ${
                                event.type === 'flash'
                                  ? 'bg-brand-purple text-white border-brand-purple/50'
                                  : 'bg-[#0a0a0a] border-white/10 border-l-4 border-l-brand-cyan'
                              }`}
                              style={{
                                top: `${((style.startHour - 10) / 11) * 100}%`,
                                height: `${(style.duration / 11) * 100}%`,
                              }}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-[10px] font-bold uppercase ${event.type === 'flash' ? 'text-white/80' : 'text-brand-cyan'}`}>
                                    {event.type === 'flash' ? '⚡ Flash' : '🎨 Projet'}
                                  </span>
                                  <CheckCircle size={12} className={event.type === 'flash' ? 'text-white/50' : 'text-zinc-600'} />
                                </div>
                                <div className={`text-xs font-semibold leading-tight ${event.type === 'flash' ? 'text-white' : 'text-white'}`}>
                                  {event.booking.flashs?.title || `${event.booking.projects?.body_part}`}
                                </div>
                                <div className={`text-[10px] ${event.type === 'flash' ? 'text-white/70' : 'text-zinc-500'}`}>
                                  {event.booking.client_name || 'Client'}
                                </div>
                              </div>
                              <div className={`text-[10px] font-mono ${event.type === 'flash' ? 'text-white/70' : 'text-zinc-500'}`}>
                                {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </motion.div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <EventModal
            event={selectedEvent}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setTimeout(() => setSelectedEvent(null), 300);
            }}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
