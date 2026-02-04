import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PieChart, DollarSign, TrendingUp, CreditCard, 
  ArrowUpRight, Download, Filter,
  Loader2, ExternalLink, Receipt, Wallet, BarChart3,
  User, Calendar, ChevronRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Skeleton } from '../common/Skeleton';

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
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, prix_total, deposit_amount, statut_paiement, created_at, client_name, flashs(title)')
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalRevenue = bookings?.reduce((sum, b) => {
        if (b.statut_paiement === 'deposit_paid' || b.statut_paiement === 'completed') {
          return sum + (b.deposit_amount || 0);
        }
        return sum;
      }, 0) || 0;

      const monthlyBookings = bookings?.filter(b => 
        new Date(b.created_at) >= startOfMonth
      ) || [];

      const monthlyRevenue = monthlyBookings.reduce((sum, b) => {
        if (b.statut_paiement === 'deposit_paid' || b.statut_paiement === 'completed') {
          return sum + (b.deposit_amount || 0);
        }
        return sum;
      }, 0);

      const pendingPayouts = bookings?.reduce((sum, b) => {
        if (b.statut_paiement === 'pending') {
          return sum + (b.deposit_amount || 0);
        }
        return sum;
      }, 0) || 0;

      setStats({
        totalRevenue,
        monthlyRevenue,
        pendingPayouts,
        totalTransactions: bookings?.length || 0,
      });

      const txns: Transaction[] = (bookings || []).slice(0, 10).map(b => ({
        id: b.id,
        date: b.created_at,
        description: b.flashs?.title ? `Réservation Flash: ${b.flashs.title}` : 'Réservation',
        amount: b.deposit_amount || 0,
        type: 'income' as const,
        status: b.statut_paiement === 'deposit_paid' ? 'completed' : 
                b.statut_paiement === 'pending' ? 'pending' : 'completed',
        client: b.client_name || undefined,
      }));

      setTransactions(txns);
    } catch (err) {
      console.error('Error fetching finance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-brand-mint/10 text-brand-mint border-brand-mint/20',
      pending: 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20',
      failed: 'bg-brand-pink/10 text-brand-pink border-brand-pink/20',
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
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
        <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-3 sm:py-4 flex-shrink-0">
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

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-20 md:pb-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl md:rounded-2xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-4 w-12 hidden md:block" />
                </div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-28" />
              </div>
            ))}
          </div>

          <div className="bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="p-4 md:p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5">
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
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0">
      {/* Header - Mobile Responsive */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-6 py-4 md:py-5 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 glass rounded-xl flex items-center justify-center">
                <PieChart className="text-brand-purple" size={18} />
              </div>
              Finance
            </h1>
            <p className="text-zinc-500 text-xs md:text-sm mt-1 hidden md:block">Suivez vos revenus et transactions Stripe</p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <a 
              href="https://dashboard.stripe.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 glass rounded-xl text-xs md:text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px]"
            >
              <ExternalLink size={16} />
              <span className="hidden sm:inline">Dashboard</span> Stripe
            </a>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 bg-white text-black rounded-xl text-xs md:text-sm font-semibold hover:bg-zinc-200 transition-colors min-h-[44px]">
              <Download size={16} />
              Exporter
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-2 md:pt-3 pb-20 md:pb-6">
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
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-mint/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Wallet className="text-brand-mint" size={18} />
              </div>
              <div className="hidden md:flex items-center gap-1 text-brand-mint text-sm font-medium">
                <ArrowUpRight size={16} />
                +12%
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] md:text-sm mb-1">Revenus totaux</p>
            <p className="text-lg md:text-2xl font-display font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
          </motion.div>

          {/* Monthly Revenue */}
          <motion.div 
            variants={fadeInUp}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-purple/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <BarChart3 className="text-brand-purple" size={18} />
              </div>
              <div className="hidden md:flex items-center gap-1 text-brand-purple text-sm font-medium">
                <TrendingUp size={16} />
                Ce mois
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] md:text-sm mb-1">Ce mois</p>
            <p className="text-lg md:text-2xl font-display font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</p>
          </motion.div>

          {/* Pending Payouts */}
          <motion.div 
            variants={fadeInUp}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-yellow/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <CreditCard className="text-brand-yellow" size={18} />
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] md:text-sm mb-1">En attente</p>
            <p className="text-lg md:text-2xl font-display font-bold text-white">{formatCurrency(stats.pendingPayouts)}</p>
          </motion.div>

          {/* Total Transactions */}
          <motion.div 
            variants={fadeInUp}
            className="glass rounded-xl md:rounded-2xl p-4 md:p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-brand-cyan/10 rounded-lg md:rounded-xl flex items-center justify-center">
                <Receipt className="text-brand-cyan" size={18} />
              </div>
            </div>
            <p className="text-zinc-500 text-[10px] md:text-sm mb-1">Transactions</p>
            <p className="text-lg md:text-2xl font-display font-bold text-white">{stats.totalTransactions}</p>
          </motion.div>
        </motion.div>

        {/* Transactions Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0a0a0a] rounded-xl md:rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm md:text-base">Transactions</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 glass rounded-lg text-xs md:text-sm text-zinc-400 hover:text-white transition-colors min-h-[36px]">
              <Filter size={14} />
              <span className="hidden sm:inline">Filtrer</span>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 glass rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="text-zinc-600" size={24} />
              </div>
              <p className="text-white font-medium mb-1 text-sm md:text-base">Aucune transaction</p>
              <p className="text-zinc-500 text-xs md:text-sm">Vos transactions apparaîtront ici</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/5">
                {transactions.map((txn, index) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="p-4 hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate mb-1">
                          {txn.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
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
                          txn.type === 'income' ? 'text-brand-mint' : 
                          txn.type === 'refund' ? 'text-brand-pink' : 'text-zinc-500'
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
                    <tr className="bg-[#0a0a0a]">
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        Montant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((txn, index) => (
                      <motion.tr 
                        key={txn.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-white">{txn.description}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {txn.client || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(txn.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`text-sm font-semibold ${
                            txn.type === 'income' ? 'text-brand-mint' : 
                            txn.type === 'refund' ? 'text-brand-pink' : 'text-zinc-500'
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
