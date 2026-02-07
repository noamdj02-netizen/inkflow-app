import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, DollarSign, TrendingUp, CreditCard, 
  ArrowUpRight, Download, Filter,
  ExternalLink, Receipt, Wallet, BarChart3,
  User, Calendar
} from 'lucide-react';
import { format, startOfMonth, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../common/Skeleton';
import { ThemeToggle } from '../ThemeToggle';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'fee' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  client?: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export const DashboardFinance: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayouts: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      fetchFinanceData();
    }
  }, [user]);

  const fetchFinanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const now = new Date();
      const monthStart = startOfMonth(now);
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, prix_total, deposit_amount, statut_paiement, created_at, client_name, flashs(title)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalRevenue = bookings?.reduce((sum, b) => {
        const booking = b as any;
        if (booking.statut_paiement === 'deposit_paid' || booking.statut_paiement === 'completed') {
          return sum + (booking.deposit_amount || 0);
        }
        return sum;
      }, 0) || 0;

      const monthlyBookings = bookings?.filter(b => {
        const booking = b as any;
        return isAfter(new Date(booking.created_at), monthStart) || 
               new Date(booking.created_at).getTime() === monthStart.getTime();
      }) || [];

      const monthlyRevenue = monthlyBookings.reduce((sum, b) => {
        const booking = b as any;
        if (booking.statut_paiement === 'deposit_paid' || booking.statut_paiement === 'completed') {
          return sum + (booking.deposit_amount || 0);
        }
        return sum;
      }, 0);

      const pendingPayouts = bookings?.reduce((sum, b) => {
        const booking = b as any;
        if (booking.statut_paiement === 'pending') {
          return sum + (booking.deposit_amount || 0);
        }
        return sum;
      }, 0) || 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        pendingPayouts,
        totalTransactions: bookings?.length || 0,
      });

      const txns: Transaction[] = (bookings || []).slice(0, 10).map(b => {
        const booking = b as any;
        return {
          id: booking.id,
          date: booking.created_at,
          description: booking.flashs?.title ? `Réservation Flash: ${booking.flashs.title}` : 'Réservation',
          amount: booking.deposit_amount || 0,
          type: 'income' as const,
          status: booking.statut_paiement === 'deposit_paid' ? 'completed' : 
                  booking.statut_paiement === 'pending' ? 'pending' : 'completed',
          client: booking.client_name || undefined,
        };
      });

      setTransactions(txns);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'd MMM yyyy', { locale: fr });
  }, []);

  const formatShortDate = useCallback((dateString: string) => {
    return format(new Date(dateString), 'd MMM', { locale: fr });
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const styles = {
      completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      failed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    };
    const labels = {
      completed: 'Payé',
      pending: 'En attente',
      failed: 'Échoué',
    };
    return (
      <span className={`px-2 py-1 text-[10px] md:text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background min-h-0 transition-colors duration-300">
        <header className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56 hidden md:block" />
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="h-[44px] w-40 rounded-xl flex-1 md:flex-none" />
              <Skeleton className="h-[44px] w-32 rounded-xl flex-1 md:flex-none" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-4 w-12 hidden md:block" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>

          <div className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="p-4 md:p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-background/50">
                  <div className="flex-1 min-w-0 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0 transition-colors duration-300">
      {/* Header - Mobile Responsive */}
      <header className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm px-4 md:px-6 py-4 md:py-5 flex-shrink-0 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-display font-bold text-foreground flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center bg-primary/10 dark:bg-primary/20 border border-border">
                  <PieChart className="text-primary" size={18} />
                </div>
                Finance
              </h1>
              <ThemeToggle size="md" variant="outline" />
            </div>
            <p className="text-foreground-muted text-xs md:text-sm mt-1 hidden md:block">Suivez vos revenus et transactions Stripe</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <a 
              href="https://dashboard.stripe.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background transition-colors min-h-[44px] bg-background/50 border border-border"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Dashboard</span> Stripe
            </a>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-semibold hover:opacity-90 transition-colors min-h-[44px]">
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-24 md:pb-6">
        {/* KPI Cards - 2x2 Grid on Mobile */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
        >
          {/* Total Revenue */}
          <motion.div 
            variants={fadeInUp}
            className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Wallet className="text-emerald-600 dark:text-emerald-400" size={18} />
              </div>
              <div className="hidden md:flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <ArrowUpRight size={16} />
                +12%
              </div>
            </div>
            <p className="text-foreground-muted text-[10px] md:text-sm mb-1">Revenus totaux</p>
            <p className="text-lg md:text-2xl font-display font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          </motion.div>

          {/* Monthly Revenue */}
          <motion.div 
            variants={fadeInUp}
            className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <BarChart3 className="text-primary" size={18} />
              </div>
              <div className="hidden md:flex items-center gap-1 text-primary text-sm font-medium">
                <TrendingUp size={16} />
                Ce mois
              </div>
            </div>
            <p className="text-foreground-muted text-[10px] md:text-sm mb-1">Ce mois</p>
            <p className="text-lg md:text-2xl font-display font-bold text-foreground">{formatCurrency(stats.monthlyRevenue)}</p>
          </motion.div>

          {/* Pending Payouts */}
          <motion.div 
            variants={fadeInUp}
            className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <CreditCard className="text-amber-600 dark:text-amber-400" size={18} />
              </div>
            </div>
            <p className="text-foreground-muted text-[10px] md:text-sm mb-1">En attente</p>
            <p className="text-lg md:text-2xl font-display font-bold text-foreground">{formatCurrency(stats.pendingPayouts)}</p>
          </motion.div>

          {/* Total Transactions */}
          <motion.div 
            variants={fadeInUp}
            className="rounded-xl md:rounded-2xl p-4 md:p-6 bg-card border border-border shadow-sm hover:shadow-card-hover transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Receipt className="text-sky-600 dark:text-sky-400" size={18} />
              </div>
            </div>
            <p className="text-foreground-muted text-[10px] md:text-sm mb-1">Transactions</p>
            <p className="text-lg md:text-2xl font-display font-bold text-foreground">{stats.totalTransactions}</p>
          </motion.div>
        </motion.div>

        {/* Transactions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl md:rounded-2xl border border-border overflow-hidden shadow-sm"
        >
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground text-sm md:text-base">Transactions</h3>
            <button className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs md:text-sm text-foreground-muted hover:text-foreground transition-colors min-h-[44px] md:min-h-[36px] bg-background/50 border border-border active:scale-95 touch-manipulation">
              <Filter size={14} />
              <span className="hidden sm:inline">Filtrer</span>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4 bg-background/50 border border-border">
                <DollarSign className="text-foreground-muted" size={24} />
              </div>
              <p className="text-foreground font-medium mb-1 text-sm md:text-base">Aucune transaction</p>
              <p className="text-foreground-muted text-xs md:text-sm">Vos transactions apparaîtront ici</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border">
                {transactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="p-4 min-h-[52px] hover:bg-background/30 active:scale-[0.99] active:bg-background/50 transition-all touch-manipulation"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate mb-1">
                          {txn.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                          {txn.client && (
                            <span className="flex items-center gap-1">
                              <User size={10} />
                              {txn.client}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {formatShortDate(txn.date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`text-sm font-bold ${
                          txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                          txn.type === 'refund' ? 'text-rose-600 dark:text-rose-400' : 'text-foreground-muted'
                        }`}>
                          {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </span>
                        {getStatusBadge(txn.status)}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card">
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-foreground-muted uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.map((txn, index) => (
                      <motion.tr 
                        key={txn.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="hover:bg-background/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-foreground">{txn.description}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground-muted">
                          {txn.client || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(txn.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${
                            txn.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
                            txn.type === 'refund' ? 'text-rose-600 dark:text-rose-400' : 'text-foreground-muted'
                          }`}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
