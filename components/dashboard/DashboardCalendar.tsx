'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, isFuture } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import { BookingCard } from './BookingCard';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type Booking = BookingRow & {
  flashs?: {
    title: string;
    image_url: string;
    prix: number;
  } | null;
};

export const DashboardCalendar: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const supabase = useMemo(() => createClient(), []);

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateFilter = format(selectedDate, 'yyyy-MM-dd');
      const selectQuery = `
        *,
        flashs (
          title,
          image_url,
          prix
        )
      `;

      // Exécuter les deux requêtes en parallèle pour améliorer les performances
      const [confirmedResult, pendingResult] = await Promise.all([
        supabase
          .from('bookings')
          .select(selectQuery)
          .eq('artist_id', user.id)
          .eq('status', 'CONFIRMED')
          .eq('deposit_paid', true)
          .gte('scheduled_at', dateFilter)
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('bookings')
          .select(selectQuery)
          .eq('artist_id', user.id)
          .eq('status', 'PENDING_PAYMENT')
          .gte('scheduled_at', dateFilter)
          .order('scheduled_at', { ascending: true })
      ]);

      if (confirmedResult.error) throw confirmedResult.error;
      if (pendingResult.error) {
        console.warn('Error loading pending bookings:', pendingResult.error);
      }

      // Combiner les deux listes
      setBookings([
        ...(confirmedResult.data || []),
        ...(pendingResult.data || [])
      ]);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  }, [supabase, selectedDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleConfirm = useCallback(async (bookingId: string) => {
    try {
      const updateData: any = { 
        status: 'confirmed',
        confirmed_by_artist_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Réservation confirmée');
      loadBookings();
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Erreur lors de la confirmation');
    }
  }, [supabase, loadBookings]);

  const handleCancel = useCallback(async (bookingId: string) => {
    try {
      const updateData: any = { 
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };
      const { error } = await (supabase as any)
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
      toast.success('Réservation annulée');
      loadBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Erreur lors de l\'annulation');
    }
  }, [supabase, loadBookings]);

  // Filtrer les bookings confirmés (avec acompte payé) pour les dates futures
  const upcomingBookings = useMemo(() => bookings.filter(b => {
    const booking = b as any;
    const bookingDate = new Date(booking.scheduled_at || booking.startTime);
    return isFuture(bookingDate) && booking.status === 'CONFIRMED' && booking.deposit_paid === true;
  }), [bookings]);

  // Filtrer les bookings en attente de paiement
  const pendingBookings = useMemo(() => bookings.filter(b => {
    const booking = b as any;
    const bookingDate = new Date(booking.scheduled_at || booking.startTime);
    return isFuture(bookingDate) && booking.status === 'PENDING_PAYMENT';
  }), [bookings]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="text-amber-400" size={32} />
            Calendrier
          </h1>
          <p className="text-slate-400">
            Gérez vos réservations et votre planning
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-zinc-900/50 rounded-lg p-6 animate-pulse"
              >
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-4" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {pendingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="text-amber-400" size={20} />
                  En attente de paiement ({pendingBookings.length})
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  Ces réservations sont en attente de paiement de l'acompte.
                  Elles apparaîtront dans "Prochains rendez-vous" une fois l'acompte payé.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking as any}
                      onConfirm={() => handleConfirm(booking.id)}
                      onCancel={() => handleCancel(booking.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-400" size={20} />
                Prochains rendez-vous ({upcomingBookings.length})
              </h2>
              {upcomingBookings.length === 0 ? (
                <div className="bg-zinc-900/50 rounded-lg p-8 text-center">
                  <Calendar className="mx-auto mb-4 text-slate-600" size={48} />
                  <p className="text-slate-400">Aucun rendez-vous à venir</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking as any}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
