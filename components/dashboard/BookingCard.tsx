'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, User, Euro, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BookingCardProps {
  booking: {
    id: string;
    type: 'flash' | 'project';
    client_name: string | null;
    client_email: string;
    scheduled_at: string;
    duration_minutes: number;
    acompte_amount: number;
    acompte_paid: boolean;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    cal_com_booking_id: string | null;
    flashs?: { title: string } | null;
  };
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function BookingCard({ booking, onConfirm, onCancel }: BookingCardProps) {
  const scheduledAt = new Date(booking.scheduled_at);
  const isPending = booking.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              booking.type === 'flash' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'bg-cyan-500/20 text-cyan-400'
            }`}>
              {booking.type === 'flash' ? '⚡ Flash' : '🎨 Projet'}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              booking.status === 'confirmed'
                ? 'bg-green-500/20 text-green-400'
                : booking.status === 'pending'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {booking.status === 'confirmed' ? 'Confirmé' : 
               booking.status === 'pending' ? 'En attente' : 
               booking.status === 'cancelled' ? 'Annulé' : 'Terminé'}
            </span>
          </div>
          
          <h3 className="text-lg font-bold mb-1">
            {booking.type === 'flash' 
              ? booking.flashs?.title || 'Flash'
              : 'Projet personnalisé'}
          </h3>
        </div>
        
        {booking.cal_com_booking_id && (
          <a
            href={`https://cal.com/bookings/${booking.cal_com_booking_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-white underline"
          >
            Voir sur Cal.com
          </a>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <User className="text-zinc-500" size={16} />
          <span className="text-zinc-300">
            {booking.client_name || booking.client_email}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="text-zinc-500" size={16} />
          <span className="text-zinc-300">
            {format(scheduledAt, 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <Clock className="text-zinc-500" size={16} />
          <span className="text-zinc-300">
            {format(scheduledAt, 'HH:mm', { locale: fr })} ({booking.duration_minutes} min)
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <Euro className="text-zinc-500" size={16} />
          <span className="text-zinc-300">
            Acompte: {booking.acompte_amount}€ {booking.acompte_paid ? '(Payé)' : '(En attente)'}
          </span>
        </div>
      </div>

      {isPending && (onConfirm || onCancel) && (
        <div className="flex gap-2 pt-4 border-t border-zinc-800">
          {onConfirm && (
            <button
              onClick={() => onConfirm(booking.id)}
              className="flex-1 py-2 px-4 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <CheckCircle size={16} />
              Confirmer
            </button>
          )}
          {onCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="flex-1 py-2 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <XCircle size={16} />
              Annuler
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
