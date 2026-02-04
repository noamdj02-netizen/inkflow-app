/**
 * Composant Sélecteur de Créneau - Interface optimale pour choisir un créneau disponible
 * Utilisé dans l'interface publique de réservation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
// Utilitaires de date natifs (remplacement de date-fns)
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
}

function parseISO(dateString: string): Date {
  return new Date(dateString);
}

function formatDate(date: Date, formatStr: string, locale?: { code: string }): string {
  const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  const daysFull = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const monthsFull = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  if (formatStr === "EEEE d MMMM 'à' HH:mm") {
    const dayName = daysFull[date.getDay()];
    const monthName = monthsFull[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${dayName} ${date.getDate()} ${monthName} à ${hours}:${minutes}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  if (formatStr === 'HH:mm') {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  if (formatStr.includes('EEE') && formatStr.includes('d') && formatStr.includes('MMM')) {
    // Format: "EEE d MMM" -> "lun 10 fév"
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    return `${dayName} ${date.getDate()} ${monthName}`;
  }
  return date.toLocaleDateString('fr-FR');
}

export type Creneau = {
  id: string;
  debut: Date;
  fin: Date;
  disponible: boolean;
  raisonIndisponible?: string;
};

export type CreneauSelectorProps = {
  tatoueurId: string;
  duree: number; // en minutes
  onCreneauSelect: (creneau: Creneau) => void;
  dateMin?: Date; // Date minimum pour la sélection
  dateMax?: Date; // Date maximum pour la sélection
  className?: string;
};

export const CreneauSelector: React.FC<CreneauSelectorProps> = ({
  tatoueurId,
  duree,
  onCreneauSelect,
  dateMin,
  dateMax,
  className = '',
}) => {
  const [creneauxDisponibles, setCreneaux] = useState<Creneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCreneau, setSelectedCreneau] = useState<Creneau | null>(null);

  useEffect(() => {
    if (!tatoueurId || !duree) return;

    setLoading(true);
    setError(null);

    const startDate = dateMin || new Date();
    const endDate = dateMax || addDays(new Date(), 30);

    fetch(`/api/creneaux?tatoueur=${tatoueurId}&duree=${duree}&debut=${startDate.toISOString()}&fin=${endDate.toISOString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement des créneaux');
        return res.json();
      })
      .then((data: { creneaux: Creneau[] }) => {
        const creneaux = data.creneaux.map((c) => ({
          ...c,
          debut: new Date(c.debut),
          fin: new Date(c.fin),
        }));
        setCreneaux(creneaux);
      })
      .catch((err) => {
        setError(err.message || 'Impossible de charger les créneaux');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tatoueurId, duree, dateMin, dateMax]);

  // Grouper les créneaux par date
  const creneauxParDate = creneauxDisponibles.reduce<Record<string, Creneau[]>>((acc, creneau) => {
    const dateKey = formatDate(creneau.debut, 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(creneau);
    return acc;
  }, {});

  const dates = Object.keys(creneauxParDate)
    .sort()
    .map((d) => parseISO(d))
    .filter((d) => d >= (dateMin || new Date()));

  const creneauxDuJour = selectedDate
    ? creneauxParDate[formatDate(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  const handleCreneauClick = (creneau: Creneau) => {
    if (!creneau.disponible) return;
    setSelectedCreneau(creneau);
    onCreneauSelect(creneau);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className="animate-spin text-amber-400" size={32} />
        <span className="ml-3 text-zinc-400">Chargement des créneaux disponibles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`glass rounded-xl p-6 text-center ${className}`}>
        <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
        <p className="text-red-400 mb-2">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className={`glass rounded-xl p-6 text-center ${className}`}>
        <Calendar className="text-zinc-500 mx-auto mb-3" size={32} />
        <p className="text-zinc-400">Aucun créneau disponible pour cette période.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sélection de la date */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar size={16} />
          Choisissez une date
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {dates.map((date) => {
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const creneauxCount = creneauxParDate[formatDate(date, 'yyyy-MM-dd')]?.length || 0;
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative p-3 rounded-xl border transition-all
                  ${isSelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-white'
                    : 'bg-white/5 border-white/10 hover:border-white/30 text-zinc-300'
                  }
                  ${isToday ? 'ring-2 ring-amber-400/30' : ''}
                `}
              >
                <div className="text-xs text-zinc-500 mb-1">
                  {formatDate(date, 'EEE d MMM', { code: 'fr' }).split(' ')[0]}
                </div>
                <div className="text-lg font-bold">
                  {date.getDate()}
                </div>
                <div className="text-xs text-zinc-500 mt-1">
                  {formatDate(date, 'EEE d MMM', { code: 'fr' }).split(' ')[2]}
                </div>
                {creneauxCount > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sélection de l'heure */}
      {selectedDate && creneauxDuJour.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={16} />
            Choisissez une heure
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            <AnimatePresence mode="popLayout">
              {creneauxDuJour.map((creneau) => {
                const isSelected = selectedCreneau?.id === creneau.id;
                const heure = formatDate(creneau.debut, 'HH:mm');

                return (
                  <motion.button
                    key={creneau.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleCreneauClick(creneau)}
                    disabled={!creneau.disponible}
                    className={`
                      relative p-3 rounded-xl border transition-all
                      ${isSelected
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : creneau.disponible
                        ? 'bg-white/5 border-white/10 hover:border-white/30 text-zinc-300 hover:bg-white/10'
                        : 'bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed'
                      }
                    `}
                    title={creneau.raisonIndisponible}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isSelected && <CheckCircle size={16} />}
                      <span className="font-semibold">{heure}</span>
                    </div>
                    {!creneau.disponible && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-px bg-red-400/50 rotate-12" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {selectedDate && creneauxDuJour.length === 0 && (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-zinc-400">Aucun créneau disponible pour cette date.</p>
          <button
            onClick={() => setSelectedDate(null)}
            className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
          >
            Choisir une autre date
          </button>
        </div>
      )}

      {selectedCreneau && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4 border border-amber-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Créneau sélectionné</p>
              <p className="text-lg font-semibold text-white">
                {formatDate(selectedCreneau.debut, "EEEE d MMMM 'à' HH:mm")}
              </p>
              <p className="text-sm text-zinc-500">
                Durée : {Math.floor(duree / 60)}h{duree % 60 > 0 ? `${duree % 60}min` : ''}
              </p>
            </div>
            <CheckCircle className="text-amber-400" size={24} />
          </div>
        </motion.div>
      )}
    </div>
  );
};
