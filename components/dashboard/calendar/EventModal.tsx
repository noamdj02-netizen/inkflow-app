'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from './calendar-types';
import type {
  CreateCalendarBookingInput,
  UpdateCalendarBookingInput,
  BookingTypeInput,
  BookingStatusInput,
} from '@/lib/actions/calendar-booking';
import {
  createCalendarBooking,
  updateCalendarBooking,
  deleteCalendarBooking,
} from '@/lib/actions/calendar-booking';

/** Appel server action sans rejet non géré (évite l'overlay Next.js "Failed to fetch"). */
async function runAction(
  fn: () => Promise<{ success: true; id?: string } | { success: false; error: string }>
): Promise<{ success: true; id?: string } | { success: false; error: string }> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error:
        msg === 'Failed to fetch' || msg.includes('fetch')
          ? 'Connexion impossible. Vérifie que le serveur tourne et la base de données est accessible.'
          : msg,
    };
  }
}

const TYPE_OPTIONS: { value: BookingTypeInput; label: string }[] = [
  { value: 'SESSION', label: 'Flash' },
  { value: 'CONSULTATION', label: 'Projet Perso' },
  { value: 'RETOUCHE', label: 'Retouche' },
];

const STATUS_OPTIONS: { value: BookingStatusInput; label: string }[] = [
  { value: 'CONFIRMED', label: 'Confirmé' },
  { value: 'PENDING_PAYMENT', label: 'En attente' },
];

export interface EventModalProps {
  /** En création : event = null et initialDate pour préremplir. En édition : event fourni. */
  event: CalendarEvent | null;
  initialDate?: Date;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function EventModal({
  event,
  initialDate,
  open,
  onClose,
  onSuccess,
}: EventModalProps) {
  const isEdit = !!event;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [type, setType] = useState<BookingTypeInput>('SESSION');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [status, setStatus] = useState<BookingStatusInput>('CONFIRMED');

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (event) {
      setTitle(event.title);
      setClientEmail(event.clientEmail ?? '');
      setType((event.type as BookingTypeInput) ?? 'SESSION');
      setStartDatetime(toLocalISO(event.start));
      setEndDatetime(toLocalISO(event.end));
      setStatus((event.status as BookingStatusInput) ?? 'CONFIRMED');
    } else {
      const start = initialDate
        ? new Date(initialDate)
        : new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date(start);
      end.setHours(10, 0, 0, 0);
      setTitle('');
      setClientEmail('');
      setType('SESSION');
      setStartDatetime(toLocalISO(start));
      setEndDatetime(toLocalISO(end));
      setStatus('CONFIRMED');
    }
  }, [open, event, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const start = new Date(startDatetime);
      const end = new Date(endDatetime);
      if (end <= start) {
        setError('La fin doit être après le début.');
        setSaving(false);
        return;
      }
      if (!title.trim()) {
        setError('Le nom du client est requis.');
        setSaving(false);
        return;
      }

      if (isEdit && event) {
        const payload: UpdateCalendarBookingInput = {
          title: title.trim(),
          type,
          startTime: start,
          endTime: end,
          status,
        };
        if (clientEmail.trim()) payload.clientEmail = clientEmail.trim();
        const result = await runAction(() => updateCalendarBooking(event.id, payload));
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error);
        }
      } else {
        if (!clientEmail.trim()) {
          setError('L\'email du client est requis.');
          setSaving(false);
          return;
        }
        const payload: CreateCalendarBookingInput = {
          title: title.trim(),
          clientEmail: clientEmail.trim(),
          type,
          startTime: start,
          endTime: end,
          status,
        };
        const result = await runAction(() => createCalendarBooking(payload));
        if (result.success) {
          onSuccess();
          onClose();
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(
        message === 'Failed to fetch' || message.includes('fetch')
          ? 'Connexion impossible. Vérifie que le serveur tourne et la base de données est accessible.'
          : message
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !confirm('Supprimer ce rendez-vous ?')) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await runAction(() => deleteCalendarBooking(event.id));
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(
        message === 'Failed to fetch' || message.includes('fetch')
          ? 'Connexion impossible. Vérifie que le serveur tourne et la base de données est accessible.'
          : message
      );
    } finally {
      setDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal
        aria-labelledby="event-modal-title"
      >
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6 mx-4">
          <div className="flex items-center justify-between mb-6">
            <h2
              id="event-modal-title"
              className="text-xl font-display font-bold text-gray-900"
            >
              {isEdit ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du client <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Jean Dupont"
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email du client {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@exemple.fr"
                className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
              />
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour ne pas modifier le client.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de projet
              </label>
              <div className="inline-flex p-1 rounded-2xl bg-gray-100 border border-gray-200">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      type === opt.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Début
                </label>
                <input
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fin
                </label>
                <input
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="inline-flex p-1 rounded-2xl bg-gray-100 border border-gray-200">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                      status === opt.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-300 hover:bg-amber-400 text-amber-950 font-semibold text-sm shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {isEdit ? 'Enregistrer' : 'Créer'}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-red-100 hover:bg-red-200 text-red-700 font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : null}
                  Supprimer
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
