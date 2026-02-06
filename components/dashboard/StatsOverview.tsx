'use client';

import { Euro, Calendar, Clock } from 'lucide-react';

interface StatsOverviewProps {
  bookings: Array<{
    acompte_amount: number;
    acompte_paid: boolean;
    scheduled_at: string;
    status: string;
  }>;
}

export function StatsOverview({ bookings }: StatsOverviewProps) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Revenus du mois (acomptes payés)
  const monthlyRevenue = bookings
    .filter((b) => b.acompte_paid && b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.acompte_amount), 0);

  // RDV à venir (7 jours)
  const upcomingBookings = bookings.filter((b) => {
    const scheduledAt = new Date(b.scheduled_at);
    return scheduledAt >= now && scheduledAt <= sevenDaysFromNow && b.status === 'confirmed';
  }).length;

  // Réservations en attente
  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Euro className="text-green-400" size={20} />
          <h3 className="text-sm font-medium text-zinc-400">Revenus du mois</h3>
        </div>
        <p className="text-3xl font-bold text-white">{monthlyRevenue.toFixed(2)}€</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-400" size={20} />
          <h3 className="text-sm font-medium text-zinc-400">RDV à venir (7j)</h3>
        </div>
        <p className="text-3xl font-bold text-white">{upcomingBookings}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Clock className="text-yellow-400" size={20} />
          <h3 className="text-sm font-medium text-zinc-400">En attente</h3>
        </div>
        <p className="text-3xl font-bold text-white">{pendingBookings}</p>
      </div>
    </div>
  );
}
