/**
 * Widget Alertes - Affiche les alertes importantes (acomptes non réglés, confirmations en attente)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../services/supabase';
import useSWR from 'swr';
import { WidgetCard } from '../WidgetCard';

type Alert = {
  id: string;
  type: 'deposit_pending' | 'confirmation_pending' | 'upcoming_booking';
  title: string;
  message: string;
  count: number;
  link?: string;
  priority: 'high' | 'medium' | 'low';
};

async function fetchAlerts(artistId: string): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Acomptes non réglés
  const { data: pendingDeposits, error: depositsError } = await supabase
    .from('bookings')
    .select('id, client_name, date_debut, prix_total, deposit_amount, statut_paiement')
    .eq('artist_id', artistId)
    .eq('statut_paiement', 'pending')
    .eq('statut_booking', 'pending')
    .gte('date_debut', new Date().toISOString())
    .order('date_debut', { ascending: true });

  if (!depositsError && pendingDeposits && pendingDeposits.length > 0) {
    alerts.push({
      id: 'deposit_pending',
      type: 'deposit_pending',
      title: 'Acomptes en attente',
      message: `${pendingDeposits.length} réservation${pendingDeposits.length > 1 ? 's' : ''} en attente de paiement`,
      count: pendingDeposits.length,
      link: '/dashboard/requests',
      priority: 'high',
    });
  }

  // Confirmations en attente (bookings pending)
  const { data: pendingConfirmations, error: confirmationsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('artist_id', artistId)
    .eq('statut_booking', 'pending')
    .gte('date_debut', new Date().toISOString())
    .limit(1);

  if (!confirmationsError && pendingConfirmations && pendingConfirmations.length > 0) {
    alerts.push({
      id: 'confirmation_pending',
      type: 'confirmation_pending',
      title: 'Confirmations en attente',
      message: 'Des réservations nécessitent votre confirmation',
      count: pendingConfirmations.length,
      link: '/dashboard/requests',
      priority: 'medium',
    });
  }

  // Prochains RDV aujourd'hui (rappel)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayBookings, error: todayError } = await supabase
    .from('bookings')
    .select('id, client_name, date_debut')
    .eq('artist_id', artistId)
    .eq('statut_booking', 'confirmed')
    .gte('date_debut', today.toISOString())
    .lt('date_debut', tomorrow.toISOString());

  if (!todayError && todayBookings && todayBookings.length > 0) {
    alerts.push({
      id: 'upcoming_today',
      type: 'upcoming_booking',
      title: 'RDV aujourd\'hui',
      message: `${todayBookings.length} rendez-vous prévu${todayBookings.length > 1 ? 's' : ''} aujourd'hui`,
      count: todayBookings.length,
      link: '/dashboard/calendar',
      priority: 'high',
    });
  }

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export const AlertsWidget: React.FC = () => {
  const { user } = useAuth();
  const { data: alerts = [], error, isLoading } = useSWR(
    user ? ['alerts', user.id] : null,
    () => fetchAlerts(user!.id)
  );

  if (isLoading) {
    return (
      <WidgetCard title="Alertes" icon={AlertTriangle}>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-[#1a1a1a] border border-neutral-800 rounded-md animate-pulse" />
          ))}
        </div>
      </WidgetCard>
    );
  }

  if (error || alerts.length === 0) {
    return (
      <WidgetCard title="Alertes" icon={AlertTriangle}>
        <div className="text-center py-8">
          <CheckCircle className="text-emerald-400 mx-auto mb-2" size={32} />
          <p className="text-neutral-400 text-sm">Aucune alerte</p>
        </div>
      </WidgetCard>
    );
  }

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'deposit_pending':
        return <CreditCard size={18} />;
      case 'confirmation_pending':
        return <Clock size={18} />;
      case 'upcoming_booking':
        return <Clock size={18} />;
      default:
        return <AlertTriangle size={18} />;
    }
  };

  const getColor = (priority: Alert['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'low':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <WidgetCard title="Alertes" icon={AlertTriangle}>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              p-3 rounded-xl border transition-all cursor-pointer hover:bg-white/5
              ${getColor(alert.priority)}
            `}
            onClick={() => alert.link && (window.location.href = alert.link)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 flex-1">
                <div className="mt-0.5">{getIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-0.5">{alert.title}</p>
                  <p className="text-xs opacity-80">{alert.message}</p>
                </div>
              </div>
              {alert.count > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-[#1a1a1a] border border-neutral-800 text-xs font-semibold">
                  {alert.count}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </WidgetCard>
  );
};
