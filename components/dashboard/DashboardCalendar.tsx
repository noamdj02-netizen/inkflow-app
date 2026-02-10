import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  DollarSign,
  Edit,
  Trash2,
  X,
  Loader2,
  Zap,
  FileText,
  Phone,
  Mail,
  CalendarDays,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { supabase } from '../../services/supabase';
import { toast } from 'sonner';
import type { Booking, Flash } from '../../types/supabase';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9h - 20h
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
const PREP_MINUTES = 30;

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1h', value: 60 },
  { label: '1h30', value: 90 },
  { label: '2h', value: 120 },
  { label: '2h30', value: 150 },
  { label: '3h', value: 180 },
  { label: '4h', value: 240 },
  { label: '5h', value: 300 },
  { label: '6h', value: 360 },
];

function toAppointment(b: Booking, index: number) {
  const start = b.date_debut ? new Date(b.date_debut) : null;
  const end = b.date_fin ? new Date(b.date_fin) : null;
  const durationMinutes = start && end ? (end.getTime() - start.getTime()) / 60000 : 60;
  const durationHours = Math.max(0.5, durationMinutes / 60);
  const dateStr = start ? start.toISOString().split('T')[0] : '';
  const timeStr = start ? start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
  return {
    id: b.id,
    date: dateStr,
    time: timeStr,
    duration: Math.round(durationHours * 10) / 10,
    durationMinutes: Math.round(durationMinutes),
    client: b.client_name || '—',
    project: 'RDV',
    amount: b.prix_total != null ? b.prix_total / 100 : 0,
    color: COLORS[index % COLORS.length],
    booking: b,
  };
}

type Appointment = ReturnType<typeof toAppointment>;

export const DashboardCalendar: React.FC = () => {
  const { theme } = useDashboardTheme();
  const { recentBookings, loading, refresh } = useDashboardData();
  const { user } = useAuth();
  const { profile } = useArtistProfile();
  const isDark = theme === 'dark';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  // --- Formulaire nouveau RDV ---
  const [formClientName, setFormClientName] = useState('');
  const [formClientEmail, setFormClientEmail] = useState('');
  const [formClientPhone, setFormClientPhone] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('09:00');
  const [formDuration, setFormDuration] = useState(60);
  const [formPrice, setFormPrice] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formFlashId, setFormFlashId] = useState<string | null>(null);
  const [availableFlashs, setAvailableFlashs] = useState<Flash[]>([]);
  const [saving, setSaving] = useState(false);

  // --- Charger les flashs disponibles ---
  const fetchAvailableFlashs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('flashs')
      .select('*')
      .eq('artist_id', user.id)
      .eq('statut', 'available')
      .order('title');
    if (data) setAvailableFlashs(data);
  }, [user]);

  useEffect(() => {
    if (showNewAppointment) fetchAvailableFlashs();
  }, [showNewAppointment, fetchAvailableFlashs]);

  // --- Auto-fill depuis flash sélectionné ---
  useEffect(() => {
    if (formFlashId) {
      const flash = availableFlashs.find((f) => f.id === formFlashId);
      if (flash) {
        setFormPrice(String(flash.prix / 100));
        // Trouver la durée la plus proche dans les options
        const closest = DURATION_OPTIONS.reduce((prev, curr) =>
          Math.abs(curr.value - flash.duree_minutes) < Math.abs(prev.value - flash.duree_minutes) ? curr : prev
        );
        setFormDuration(closest.value);
      }
    }
  }, [formFlashId, availableFlashs]);

  // --- Ouvrir le modal avec date/heure pré-remplie ---
  const openNewAppointment = useCallback((date?: Date, hour?: number) => {
    const d = date || new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setFormDate(dateStr);
    setFormTime(hour != null ? `${String(hour).padStart(2, '0')}:00` : '09:00');
    setFormClientName('');
    setFormClientEmail('');
    setFormClientPhone('');
    setFormDuration(60);
    setFormPrice('');
    setFormNotes('');
    setFormFlashId(null);
    setShowNewAppointment(true);
  }, []);

  // --- Sauvegarder le RDV ---
  const handleSaveAppointment = async () => {
    if (!user) return;
    if (!formClientName.trim() || !formClientEmail.trim() || !formDate || !formTime) {
      toast.error('Veuillez remplir les champs obligatoires (nom, email, date, heure).');
      return;
    }

    const prixCentimes = Math.round(parseFloat(formPrice || '0') * 100);
    if (prixCentimes < 0) {
      toast.error('Le prix ne peut pas être négatif.');
      return;
    }

    const depositPercentage = profile?.deposit_percentage ?? 30;
    const depositAmount = Math.round(prixCentimes * (depositPercentage / 100));

    const dateDebut = new Date(`${formDate}T${formTime}:00`);
    const dateFin = new Date(dateDebut.getTime() + formDuration * 60 * 1000);

    setSaving(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        artist_id: user.id,
        client_name: formClientName.trim(),
        client_email: formClientEmail.trim(),
        client_phone: formClientPhone.trim() || null,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        duree_minutes: formDuration,
        prix_total: prixCentimes,
        deposit_amount: depositAmount,
        deposit_percentage: depositPercentage,
        statut_booking: 'confirmed',
        statut_paiement: 'pending',
        flash_id: formFlashId || null,
      });

      if (error) throw error;

      toast.success('Rendez-vous créé avec succès !');
      setShowNewAppointment(false);
      refresh();
    } catch (err: any) {
      console.error('Erreur création RDV:', err);
      toast.error(err.message || 'Erreur lors de la création du rendez-vous.');
    } finally {
      setSaving(false);
    }
  };

  const appointments = useMemo(
    () => recentBookings.map((b, i) => toAppointment(b, i)),
    [recentBookings]
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getWeekDays = (baseDate?: Date) => {
    const base = baseDate ? new Date(baseDate) : new Date(selectedDate);
    const start = new Date(base);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter((apt) => apt.date === dateStr);
  };

  const weekDays = useMemo(() => getWeekDays(view === 'week' ? currentDate : undefined), [view, currentDate, selectedDate]);
  const days = view === 'month' ? getDaysInMonth(currentDate) : weekDays;

  const formatEuro = (n: number) => `€${n.toFixed(0)}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 rounded-2xl animate-pulse bg-white/10" />
        <div className="rounded-2xl p-6 h-96 animate-pulse bg-white/10" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Calendrier
          </h1>
          <p className="text-gray-500 mt-1">Gérez vos rendez-vous et sessions</p>
        </div>

        <button
          onClick={() => openNewAppointment()}
          className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Nouveau RDV
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${
          isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() - 1);
                else d.setDate(d.getDate() - 7);
                setCurrentDate(d);
                if (view === 'day') setSelectedDate(d);
              }}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft size={20} />
            </button>

            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={() => {
                const d = new Date(currentDate);
                if (view === 'month') d.setMonth(d.getMonth() + 1);
                else d.setDate(d.getDate() + 7);
                setCurrentDate(d);
                if (view === 'day') setSelectedDate(d);
              }}
              className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => {
                const now = new Date();
                setCurrentDate(now);
                setSelectedDate(now);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              Aujourd'hui
            </button>
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  view === v
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>

        {view === 'week' && (
          <div>
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div />
              {weekDays.map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                  </div>
                  <div
                    className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center font-medium ${
                      isToday(day) ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' : isDark ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-8 gap-2">
              {HOURS.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="text-xs text-gray-500 py-8 text-right pr-2">{hour}:00</div>
                  {weekDays.map((day, dayIndex) => {
                    const dayAppointments = getAppointmentsForDate(day);
                    const hourAppointments = dayAppointments.filter((apt) => {
                      const aptHour = parseInt(apt.time.split(':')[0], 10);
                      return aptHour === hour;
                    });
                    // Prep time: does an appointment starting at hour+1 (or within the next hour) need prep shown here?
                    const prepAppointments = dayAppointments.filter((apt) => {
                      const [h, m] = apt.time.split(':').map(Number);
                      const aptStartMin = h * 60 + m;
                      const slotStartMin = hour * 60;
                      const slotEndMin = slotStartMin + 60;
                      const prepStartMin = aptStartMin - PREP_MINUTES;
                      return prepStartMin >= slotStartMin && prepStartMin < slotEndMin && aptStartMin !== slotStartMin;
                    });

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => openNewAppointment(day, hour)}
                        className={`relative min-h-[80px] rounded-lg border ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors cursor-pointer`}
                      >
                        {/* Prep time indicator */}
                        {prepAppointments.map((apt) => {
                          const [h, m] = apt.time.split(':').map(Number);
                          const aptStartMin = h * 60 + m;
                          const prepStartMin = aptStartMin - PREP_MINUTES;
                          const slotStartMin = hour * 60;
                          const offsetPx = ((prepStartMin - slotStartMin) / 60) * 80;
                          return (
                            <div
                              key={`prep-${apt.id}`}
                              className="absolute left-1 right-1 rounded-md border-2 border-dashed flex items-center justify-center text-[10px]"
                              style={{
                                top: `${offsetPx + 4}px`,
                                height: `${(PREP_MINUTES / 60) * 80 - 4}px`,
                                borderColor: apt.color,
                                backgroundColor: `${apt.color}15`,
                                color: apt.color,
                              }}
                            >
                              Prépa {PREP_MINUTES}min
                            </div>
                          );
                        })}
                        {hourAppointments.map((apt) => (
                          <motion.div
                            key={apt.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-1 rounded-lg p-2 text-white text-xs z-10"
                            style={{
                              backgroundColor: apt.color,
                              height: `${Math.max(apt.duration * 26, 40)}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-medium truncate">{apt.client}</div>
                            <div className="text-white/80 truncate">{apt.project}</div>
                            <div className="mt-1 text-white/60">{apt.duration}h</div>
                          </motion.div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {view === 'day' && (
          <div>
            <div className="text-center mb-4">
              <div className="text-sm text-gray-500 mb-1">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(d);
                    setCurrentDate(d);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => {
                    const d = new Date(selectedDate);
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(d);
                    setCurrentDate(d);
                  }}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md">
              {HOURS.map((hour) => {
                const allDayApts = getAppointmentsForDate(selectedDate);
                const dayAppointments = allDayApts.filter((apt) => {
                  const aptHour = parseInt(apt.time.split(':')[0], 10);
                  return aptHour === hour;
                });
                // Prep time: appointments starting in the next slot that need prep shown here
                const prepAppointments = allDayApts.filter((apt) => {
                  const [h, m] = apt.time.split(':').map(Number);
                  const aptStartMin = h * 60 + m;
                  const slotStartMin = hour * 60;
                  const slotEndMin = slotStartMin + 60;
                  const prepStartMin = aptStartMin - PREP_MINUTES;
                  return prepStartMin >= slotStartMin && prepStartMin < slotEndMin && aptStartMin !== slotStartMin;
                });
                return (
                  <React.Fragment key={hour}>
                    <div className="text-xs text-gray-500 py-4 text-right pr-2">{hour}:00</div>
                    <div
                      onClick={() => openNewAppointment(selectedDate, hour)}
                      className={`relative min-h-[60px] rounded-lg border cursor-pointer ${
                        isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } transition-colors`}
                    >
                      {/* Prep time indicator */}
                      {prepAppointments.map((apt) => {
                        const [h, m] = apt.time.split(':').map(Number);
                        const aptStartMin = h * 60 + m;
                        const prepStartMin = aptStartMin - PREP_MINUTES;
                        const slotStartMin = hour * 60;
                        const offsetPx = ((prepStartMin - slotStartMin) / 60) * 60;
                        return (
                          <div
                            key={`prep-${apt.id}`}
                            className="absolute left-1 right-1 rounded-md border-2 border-dashed flex items-center justify-center text-[10px]"
                            style={{
                              top: `${offsetPx + 4}px`,
                              height: `${(PREP_MINUTES / 60) * 60 - 4}px`,
                              borderColor: apt.color,
                              backgroundColor: `${apt.color}15`,
                              color: apt.color,
                            }}
                          >
                            Prépa {PREP_MINUTES}min
                          </div>
                        );
                      })}
                      {dayAppointments.map((apt) => (
                        <motion.div
                          key={apt.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-1 rounded-lg p-2 text-white text-xs z-10"
                          style={{
                            backgroundColor: apt.color,
                            height: `${Math.max(apt.duration * 26, 40)}px`,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="font-medium truncate">{apt.client}</div>
                          <div className="text-white/80 truncate">{apt.project} • {apt.duration}h</div>
                        </motion.div>
                      ))}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {view === 'month' && (
          <div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div key={day} className="text-center text-xs text-gray-500 uppercase tracking-wider py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayAppointments = day ? getAppointmentsForDate(day) : [];
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-lg p-2 ${
                      day
                        ? isDark
                          ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        : ''
                    } transition-colors cursor-pointer`}
                    onClick={() => {
                      if (day) {
                        setSelectedDate(day);
                        openNewAppointment(day);
                      }
                    }}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isToday(day)
                              ? 'w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center'
                              : isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 2).map((apt) => (
                            <div
                              key={apt.id}
                              className="text-xs px-1.5 py-0.5 rounded truncate text-white"
                              style={{ backgroundColor: apt.color }}
                            >
                              {apt.time}
                            </div>
                          ))}
                          {dayAppointments.length > 2 && (
                            <div className="text-xs text-gray-500">+{dayAppointments.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`rounded-2xl p-6 ${
          isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
        }`}
      >
        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Prochains Rendez-vous
        </h3>

        <div className="space-y-3">
          {appointments.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Aucun rendez-vous à venir.</p>
          ) : (
            appointments.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-1 h-16 rounded-full shrink-0" style={{ backgroundColor: apt.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-gray-500 shrink-0" />
                      <span className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {apt.client}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">{apt.project}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        {apt.date} {apt.time} • {apt.duration}h
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {formatEuro(apt.amount)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}>
                    <Edit size={16} className="text-gray-500" />
                  </button>
                  <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-red-500/10' : 'hover:bg-red-50'}`}>
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {showNewAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowNewAppointment(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-white/10">
                <div>
                  <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <CalendarDays className="inline-block mr-2 -mt-1" size={22} />
                    Nouveau rendez-vous
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Créer un rendez-vous manuellement</p>
                </div>
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Flash sélection */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Zap size={14} className="inline mr-1 -mt-0.5" />
                    Flash (optionnel)
                  </label>
                  <select
                    value={formFlashId || ''}
                    onChange={(e) => setFormFlashId(e.target.value || null)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  >
                    <option value="">— Aucun flash —</option>
                    {availableFlashs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title} — {(f.prix / 100).toFixed(0)}€ — {f.duree_minutes}min
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nom client */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <User size={14} className="inline mr-1 -mt-0.5" />
                    Nom du client <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="Jean Dupont"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                {/* Email client */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Mail size={14} className="inline mr-1 -mt-0.5" />
                    Email du client <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={formClientEmail}
                    onChange={(e) => setFormClientEmail(e.target.value)}
                    placeholder="client@email.com"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                {/* Téléphone client */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone size={14} className="inline mr-1 -mt-0.5" />
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formClientPhone}
                    onChange={(e) => setFormClientPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                {/* Date + Heure */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500'
                      } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Heure <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500'
                      } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                    />
                  </div>
                </div>

                {/* Durée + Prix */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Clock size={14} className="inline mr-1 -mt-0.5" />
                      Durée
                    </label>
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-violet-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500'
                      } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                    >
                      {DURATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <DollarSign size={14} className="inline mr-1 -mt-0.5" />
                      Prix (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="150"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                          : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                      } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                    />
                  </div>
                </div>

                {/* Acompte info */}
                {formPrice && parseFloat(formPrice) > 0 && (
                  <div className={`text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-violet-500/10 text-violet-300' : 'bg-violet-50 text-violet-600'}`}>
                    Acompte : {((profile?.deposit_percentage ?? 30))}% = {((parseFloat(formPrice) * (profile?.deposit_percentage ?? 30)) / 100).toFixed(2)}€
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <FileText size={14} className="inline mr-1 -mt-0.5" />
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={3}
                    placeholder="Détails supplémentaires, zone du corps, style..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors resize-none ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowNewAppointment(false)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveAppointment}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Créer le rendez-vous
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
