import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import type { Booking } from '../../types/supabase';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 9); // 9h - 20h
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

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
  const { recentBookings, loading } = useDashboardData();
  const isDark = theme === 'dark';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);

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
          onClick={() => setShowNewAppointment(true)}
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

                    return (
                      <div
                        key={dayIndex}
                        className={`relative min-h-[80px] rounded-lg border ${
                          isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        } transition-colors cursor-pointer`}
                      >
                        {hourAppointments.map((apt) => (
                          <motion.div
                            key={apt.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-1 rounded-lg p-2 text-white text-xs"
                            style={{
                              backgroundColor: apt.color,
                              height: `${Math.max(apt.duration * 26, 40)}px`,
                            }}
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
                const dayAppointments = getAppointmentsForDate(selectedDate).filter((apt) => {
                  const aptHour = parseInt(apt.time.split(':')[0], 10);
                  return aptHour === hour;
                });
                return (
                  <React.Fragment key={hour}>
                    <div className="text-xs text-gray-500 py-4 text-right pr-2">{hour}:00</div>
                    <div
                      className={`relative min-h-[60px] rounded-lg border ${
                        isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {dayAppointments.map((apt) => (
                        <motion.div
                          key={apt.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute inset-1 rounded-lg p-2 text-white text-xs"
                          style={{
                            backgroundColor: apt.color,
                            height: `${Math.max(apt.duration * 26, 40)}px`,
                          }}
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
                    onClick={() => day && setSelectedDate(day)}
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

      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowNewAppointment(false)}>
          <div
            className={`rounded-2xl p-6 max-w-md w-full ${isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Création de RDV : à brancher sur votre flux de réservation (formulaire ou lien externe).
            </p>
            <button
              onClick={() => setShowNewAppointment(false)}
              className="mt-4 px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
