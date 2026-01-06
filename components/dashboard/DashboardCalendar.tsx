import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Loader2, X, User, Mail, Phone, Euro, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      alert(`Erreur: ${err.message}`);
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              {event.type === 'flash' && booking.flashs?.image_url && (
                <img
                  src={booking.flashs.image_url}
                  alt={booking.flashs.title}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-amber-400/30"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  {event.type === 'flash' 
                    ? booking.flashs?.title || 'Flash'
                    : `${booking.projects?.body_part} • ${booking.projects?.style}`
                  }
                </h3>
                <p className="text-slate-400 text-sm">
                  {event.type === 'flash' ? 'Réservation Flash' : 'Projet Personnalisé'}
                </p>
              </div>
            </div>
          </div>

          {/* Infos Client */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="text-slate-400" size={18} />
              <span className="text-slate-300">
                <span className="font-bold text-white">{booking.client_name || 'Non renseigné'}</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="text-slate-400" size={18} />
              <span className="text-slate-300">{booking.client_email}</span>
            </div>
            {booking.client_phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="text-slate-400" size={18} />
                <span className="text-slate-300">{booking.client_phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="text-slate-400" size={18} />
              <span className="text-slate-300">
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
              <Clock className="text-slate-400" size={18} />
              <span className="text-slate-300">Durée: {booking.duree_minutes} minutes</span>
            </div>
          </div>

          {/* Prix */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Prix total</span>
              <span className="text-white font-bold text-lg">{Math.round(booking.prix_total / 100)}€</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Acompte</span>
              <span className="text-amber-400 font-bold">{Math.round(booking.deposit_amount / 100)}€</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
              <span className="text-slate-400 text-sm">Statut paiement</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                booking.statut_paiement === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                booking.statut_paiement === 'deposit_paid' ? 'bg-blue-500/20 text-blue-400' :
                booking.statut_paiement === 'fully_paid' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
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
              <p className="text-sm text-slate-400 mb-3">Marquer comme :</p>
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={updating}
                className="w-full bg-green-500/20 text-green-400 px-4 py-3 rounded-lg font-bold hover:bg-green-500/30 transition-colors border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full bg-orange-500/20 text-orange-400 px-4 py-3 rounded-lg font-bold hover:bg-orange-500/30 transition-colors border border-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="w-full bg-red-500/20 text-red-400 px-4 py-3 rounded-lg font-bold hover:bg-red-500/30 transition-colors border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
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
        console.log('Bookings data:', data);
        setBookings(data || []);
        
        // Transformer en événements
        const calendarEvents: CalendarEvent[] = (data || []).map((booking) => {
          const start = new Date(booking.date_debut);
          const end = new Date(booking.date_fin);
          
          const title = booking.flash_id
            ? `${booking.client_name || 'Client'} • ${booking.flashs?.title || 'Flash'}`
            : `${booking.client_name || 'Client'} • ${booking.projects?.body_part || 'Projet'}`;

          return {
            id: booking.id,
            title,
            start,
            end,
            booking,
            type: booking.flash_id ? 'flash' : 'project',
          };
        });

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

  // Calculer les jours de la semaine
  const getWeekDays = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Obtenir les heures (10h à 20h)
  const hours = Array.from({ length: 11 }, (_, i) => 10 + i);

  // Obtenir les événements pour un jour et une heure donnés
  const getEventsAtSlot = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(day);
      slotEnd.setHours(hour + 1, 0, 0, 0);
      
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  // Calculer la position et la taille d'un événement
  const getEventStyle = (event: CalendarEvent, dayIndex: number) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const weekDays = getWeekDays();
    const day = weekDays[dayIndex];
    
    // Vérifier si l'événement est ce jour
    if (start.toDateString() !== day.toDateString()) {
      return null;
    }

    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const duration = endHour - startHour;

    const top = ((startHour - 10) / 11) * 100;
    const height = (duration / 11) * 100;

    return {
      top: `${top}%`,
      height: `${height}%`,
    };
  };

  const weekDays = getWeekDays();

  return (
    <>
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Calendar className="text-amber-400" size={20}/> 
            Calendrier
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const prevWeek = new Date(currentWeek);
                prevWeek.setDate(prevWeek.getDate() - 7);
                setCurrentWeek(prevWeek);
              }}
              className="px-3 py-1 text-slate-400 hover:text-white text-sm"
            >
              ←
            </button>
            <span className="px-4 py-1 text-slate-300 text-sm">
              {weekDays[0].toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => {
                const nextWeek = new Date(currentWeek);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setCurrentWeek(nextWeek);
              }}
              className="px-3 py-1 text-slate-400 hover:text-white text-sm"
            >
              →
            </button>
            <button
              onClick={() => setCurrentWeek(new Date())}
              className="px-3 py-1 text-xs text-slate-400 hover:text-white"
            >
              Aujourd'hui
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20">
            <Plus size={16}/> Nouveau RDV
          </button>
        </div>
      </header>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-amber-400" size={32} />
          </div>
        ) : (
          <div className="bg-slate-800/20 rounded-2xl border border-slate-800 min-w-[800px]">
            {/* Calendar Header Row */}
            <div className="grid grid-cols-8 border-b border-slate-800 sticky top-0 bg-[#0f172a] z-10">
              <div className="p-4 border-r border-slate-800 text-center text-xs font-bold text-slate-500">
                GMT+1
              </div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`p-4 text-center border-r border-slate-800 ${i === 6 ? 'border-r-0' : ''}`}>
                    <div className="text-xs text-slate-500 uppercase mb-1">
                      {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-amber-400 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto' : 'text-white'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Body */}
            <div className="relative">
              {/* Grid Lines */}
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-slate-800 h-24">
                  <div className="border-r border-slate-800 p-2 text-right">
                    <span className="text-xs text-slate-600 font-mono -translate-y-1/2 block">{hour}:00</span>
                  </div>
                  {weekDays.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`border-r border-slate-800 ${dayIndex === 6 ? 'border-r-0' : ''} relative group hover:bg-white/[0.02] transition-colors`}
                    >
                      {/* Events */}
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
                          const startHour = start.getHours() + start.getMinutes() / 60;
                          const endHour = end.getHours() + end.getMinutes() / 60;
                          const duration = endHour - startHour;

                          return (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={() => handleEventClick(event)}
                              className={`absolute left-1 right-1 rounded-lg p-2 border cursor-pointer hover:scale-[1.02] transition-transform z-10 flex flex-col justify-between ${
                                event.type === 'flash'
                                  ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-400/10'
                                  : 'bg-slate-700 border-slate-600 border-l-4 border-l-blue-400 shadow-lg'
                              }`}
                              style={{
                                top: `${((startHour - 10) / 11) * 100}%`,
                                height: `${(duration / 11) * 100}%`,
                              }}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-xs font-black ${event.type === 'flash' ? 'text-black' : 'text-blue-300'}`}>
                                    {event.type === 'flash' ? '⚡️ FLASH' : '🐉 PROJET'}
                                  </span>
                                  <CheckCircle size={12} className={event.type === 'flash' ? 'text-black/50' : 'text-slate-400'} />
                                </div>
                                <div className={`text-xs font-bold leading-tight ${event.type === 'flash' ? 'text-black' : 'text-white'}`}>
                                  {event.booking.flashs?.title || `${event.booking.projects?.body_part} • ${event.booking.client_name || 'Client'}`}
                                </div>
                              </div>
                              <div className={`text-[10px] font-mono ${event.type === 'flash' ? 'text-black/70' : 'text-slate-400'}`}>
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
    </>
  );
};
