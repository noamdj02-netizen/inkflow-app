import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  Download,
  Filter,
  ExternalLink,
  Receipt,
  Wallet,
  BarChart3,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Settings,
  Plus,
  Trash2,
  FileText,
  Banknote,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'fee' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  client?: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface CashPayment {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  description: string;
  type: 'cash_payment';
}

const EXPENSE_CATEGORIES = [
  'Encres',
  'Aiguilles',
  'Matériel',
  'Loyer',
  'Assurance',
  'Formation',
  'Autre',
] as const;

const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export const DashboardFinance: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useDashboardTheme();
  const { profile } = useArtistProfile();
  const isDark = theme === 'dark';

  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayouts: 0,
    totalTransactions: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: EXPENSE_CATEGORIES[0] as string,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Cash payment state
  const [cashPayments, setCashPayments] = useState<CashPayment[]>([]);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashForm, setCashForm] = useState({
    clientName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    if (user) fetchFinanceData();
  }, [user]);

  // Load expenses & cash payments from localStorage
  useEffect(() => {
    if (!user) return;
    try {
      const storedExpenses = localStorage.getItem(`inkflow-expenses-${user.id}`);
      if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
      const storedCash = localStorage.getItem(`inkflow-cash-payments-${user.id}`);
      if (storedCash) setCashPayments(JSON.parse(storedCash));
    } catch (err) {
      console.error('Error loading local finance data:', err);
    }
  }, [user]);

  // Persist expenses to localStorage
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`inkflow-expenses-${user.id}`, JSON.stringify(expenses));
  }, [expenses, user]);

  // Persist cash payments to localStorage
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(`inkflow-cash-payments-${user.id}`, JSON.stringify(cashPayments));
  }, [cashPayments, user]);

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

      const txns: Transaction[] = (bookings || []).slice(0, 20).map(b => ({
        id: b.id,
        date: b.created_at,
        description: b.flashs?.title ? `Flash: ${b.flashs.title}` : 'Réservation',
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
      maximumFractionDigits: 0,
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

  const revenueChartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const month = monthLabels[d.getMonth()];
      const rev = i === 5 ? stats.totalRevenue : Math.round((stats.totalRevenue * (i + 1)) / 6);
      return { month, revenue: rev / 100 };
    });
  }, [stats.totalRevenue]);

  const filteredTransactions = useMemo(() => {
    if (filterStatus === 'all') return transactions;
    return transactions.filter(t => t.status === filterStatus);
  }, [transactions, filterStatus]);

  // Computed totals
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalCashPayments = useMemo(() => cashPayments.reduce((sum, c) => sum + c.amount, 0), [cashPayments]);
  const netProfit = useMemo(() => (stats.totalRevenue / 100) + (totalCashPayments / 100) - (totalExpenses / 100), [stats.totalRevenue, totalCashPayments, totalExpenses]);

  // Add expense handler
  const handleAddExpense = useCallback(() => {
    const amount = parseFloat(expenseForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (!expenseForm.description.trim()) {
      toast.error('Veuillez entrer une description');
      return;
    }
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      category: expenseForm.category,
      amount: Math.round(amount * 100), // Store in cents
      date: expenseForm.date,
      description: expenseForm.description.trim(),
    };
    setExpenses(prev => [newExpense, ...prev]);
    setExpenseForm({ category: EXPENSE_CATEGORIES[0], amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    setShowExpenseModal(false);
    toast.success('Dépense ajoutée');
  }, [expenseForm]);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success('Dépense supprimée');
  }, []);

  // Add cash payment handler
  const handleAddCashPayment = useCallback(() => {
    const amount = parseFloat(cashForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Veuillez entrer un montant valide');
      return;
    }
    if (!cashForm.clientName.trim()) {
      toast.error('Veuillez entrer le nom du client');
      return;
    }
    const newPayment: CashPayment = {
      id: crypto.randomUUID(),
      clientName: cashForm.clientName.trim(),
      amount: Math.round(amount * 100), // Store in cents
      date: cashForm.date,
      description: cashForm.description.trim(),
      type: 'cash_payment',
    };
    setCashPayments(prev => [newPayment, ...prev]);
    setCashForm({ clientName: '', amount: '', date: new Date().toISOString().split('T')[0], description: '' });
    setShowCashModal(false);
    toast.success('Paiement espèces ajouté');
  }, [cashForm]);

  const handleDeleteCashPayment = useCallback((id: string) => {
    setCashPayments(prev => prev.filter(c => c.id !== id));
    toast.success('Paiement supprimé');
  }, []);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rows: string[][] = [['Date', 'Type', 'Description', 'Montant']];

    // Add transactions (revenue)
    transactions.forEach(txn => {
      rows.push([
        new Date(txn.date).toLocaleDateString('fr-FR'),
        'Revenu',
        txn.description,
        (txn.amount / 100).toFixed(2),
      ]);
    });

    // Add cash payments
    cashPayments.forEach(cp => {
      rows.push([
        new Date(cp.date).toLocaleDateString('fr-FR'),
        'Revenu (espèces)',
        `${cp.clientName} - ${cp.description}`,
        (cp.amount / 100).toFixed(2),
      ]);
    });

    // Add expenses
    expenses.forEach(exp => {
      rows.push([
        new Date(exp.date).toLocaleDateString('fr-FR'),
        'Dépense',
        `[${exp.category}] ${exp.description}`,
        `-${(exp.amount / 100).toFixed(2)}`,
      ]);
    });

    const csvContent = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inkflow-finance-export-${yearMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé');
  }, [transactions, expenses, cashPayments]);

  const formatExpenseAmount = (amountCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  };

  const statsCards = useMemo(() => [
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalRevenue),
      icon: Wallet,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: isDark ? 'from-emerald-500/10 to-teal-600/10' : 'from-emerald-50 to-teal-50',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Ce mois',
      value: formatCurrency(stats.monthlyRevenue),
      icon: BarChart3,
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: isDark ? 'from-violet-500/10 to-purple-600/10' : 'from-violet-50 to-purple-50',
      iconColor: 'text-violet-400',
    },
    {
      title: 'En attente',
      value: formatCurrency(stats.pendingPayouts),
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      bgGradient: isDark ? 'from-amber-500/10 to-orange-500/10' : 'from-amber-50 to-orange-50',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Transactions',
      value: String(stats.totalTransactions),
      icon: Receipt,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: isDark ? 'from-blue-500/10 to-cyan-600/10' : 'from-blue-50 to-cyan-50',
      iconColor: 'text-blue-400',
    },
    {
      title: 'Bénéfice net',
      value: `${netProfit >= 0 ? '+' : ''}${netProfit.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€`,
      icon: TrendingUp,
      gradient: netProfit >= 0 ? 'from-emerald-400 to-green-600' : 'from-red-400 to-rose-600',
      bgGradient: netProfit >= 0
        ? (isDark ? 'from-emerald-500/10 to-green-600/10' : 'from-emerald-50 to-green-50')
        : (isDark ? 'from-red-500/10 to-rose-600/10' : 'from-red-50 to-rose-50'),
      iconColor: netProfit >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ], [stats, isDark, netProfit]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
      completed: {
        label: 'Payé',
        color: isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
        icon: CheckCircle2,
      },
      pending: {
        label: 'En attente',
        color: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600',
        icon: AlertCircle,
      },
      failed: {
        label: 'Échoué',
        color: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600',
        icon: XCircle,
      },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${c.color}`}>
        <Icon size={12} />
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-9 w-48 rounded-lg animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
          <div className={`h-5 w-64 mt-2 rounded animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`rounded-2xl p-6 h-36 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`} />
          ))}
        </div>
        <div className={`rounded-2xl p-6 h-80 animate-pulse ${isDark ? 'bg-[#1a1a2e]' : 'bg-white border border-gray-200'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Finance
          </h1>
          <p className="text-gray-500 mt-1">Suivez vos revenus et transactions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCashModal(true)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <Banknote size={16} />
            Ajouter paiement espèces
          </button>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isDark
                ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <ExternalLink size={16} />
            Stripe
          </a>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/20 transition-all"
          >
            <FileText size={16} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative overflow-hidden rounded-2xl p-6 ${
                isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.bgGradient} rounded-full blur-3xl opacity-50`} />
              <div className="relative">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4`}>
                  <Icon size={22} className="text-white" />
                </div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <h3 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={`xl:col-span-2 rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Évolution du revenu
              </h3>
              <p className="text-sm text-gray-500">6 derniers mois</p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              stats.totalRevenue > 0 ? 'text-emerald-500' : 'text-gray-500'
            }`}>
              {stats.totalRevenue > 0 && <ArrowUpRight size={16} />}
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="financeColorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff08' : '#00000008'} />
              <XAxis
                dataKey="month"
                stroke={isDark ? '#555' : '#999'}
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#555' : '#999'}
                style={{ fontSize: '12px' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#1a1a2e' : '#fff',
                  border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  color: isDark ? '#fff' : '#000',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`${value.toLocaleString('fr-FR')}€`, 'Revenu']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#financeColorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className={`rounded-2xl p-6 ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Résumé
          </h3>

          <div className="space-y-3 mb-6">
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${profile?.stripe_connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="text-sm text-gray-500">Stripe</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.stripe_connected ? 'Connecté' : 'Non connecté'}
              </span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-violet-400" />
                <span className="text-sm text-gray-500">Acompte</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.deposit_percentage ?? 30}%
              </span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm text-gray-500">Plan</span>
              </div>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.user_plan || 'FREE'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Link
              to="/dashboard/settings/payments"
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <Settings size={16} className="text-gray-500" />
              <span className={`text-sm font-medium flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Paramètres paiement
              </span>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
              }`}
            >
              <ExternalLink size={16} className="text-gray-500" />
              <span className={`text-sm font-medium flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Dashboard Stripe
              </span>
              <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className={`rounded-2xl overflow-hidden ${
          isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
        }`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'} flex items-center justify-between`}>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Transactions
          </h3>
          <div className="flex items-center gap-2">
            {(['all', 'completed', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStatus === status
                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-sm'
                    : isDark
                      ? 'text-gray-400 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {status === 'all' ? 'Tout' : status === 'completed' ? 'Payé' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
              isDark ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <DollarSign size={24} className="text-gray-500" />
            </div>
            <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aucune transaction
            </p>
            <p className="text-gray-500 text-sm">
              Vos transactions apparaîtront ici une fois les premiers paiements reçus.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredTransactions.map((txn, index) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.03 }}
                  className={`p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {txn.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
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
                        txn.type === 'income' ? 'text-emerald-500' :
                          txn.type === 'refund' ? 'text-red-500' : 'text-gray-500'
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
                <thead className={isDark ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                  {filteredTransactions.map((txn, index) => (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + index * 0.03 }}
                      className={`transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                    >
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatDate(txn.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {txn.description}
                        </p>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {txn.client || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(txn.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${
                          txn.type === 'income' ? 'text-emerald-500' :
                            txn.type === 'refund' ? 'text-red-500' : 'text-gray-500'
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

      {/* Cash Payments Section */}
      {cashPayments.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-2xl overflow-hidden ${
            isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
          }`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600">
                <Banknote size={18} className="text-white" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Paiements espèces
                </h3>
                <p className="text-xs text-gray-500">
                  Total : {formatExpenseAmount(totalCashPayments)}
                </p>
              </div>
            </div>
          </div>
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
            {cashPayments.map((cp) => (
              <div key={cp.id} className={`flex items-center justify-between px-6 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {cp.clientName}
                    </p>
                    <p className="text-xs text-gray-500">{cp.description} · {formatDate(cp.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-emerald-500">
                    +{formatExpenseAmount(cp.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteCashPayment(cp.id)}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Expenses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className={`rounded-2xl overflow-hidden ${
          isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
        }`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="inline-flex p-2 rounded-lg bg-gradient-to-br from-red-400 to-rose-600">
              <CreditCard size={18} className="text-white" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Dépenses
              </h3>
              <p className="text-xs text-gray-500">
                Total : {formatExpenseAmount(totalExpenses)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-400 to-rose-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-red-500/20 transition-all"
          >
            <Plus size={16} />
            Ajouter une dépense
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
              isDark ? 'bg-white/5' : 'bg-gray-100'
            }`}>
              <Receipt size={24} className="text-gray-500" />
            </div>
            <p className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Aucune dépense
            </p>
            <p className="text-gray-500 text-sm">
              Ajoutez vos dépenses pour suivre votre bénéfice net.
            </p>
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
            {expenses.map((exp) => (
              <div key={exp.id} className={`flex items-center justify-between px-6 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
                    isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {exp.category}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {exp.description}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(exp.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold text-red-500">
                    -{formatExpenseAmount(exp.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(exp.id)}
                    className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showExpenseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowExpenseModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl p-6 ${
                isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Ajouter une dépense
                </h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Catégorie
                  </label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className={isDark ? 'bg-[#1a1a2e]' : ''}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Encres Eternal Ink 30ml"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddExpense}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-400 to-rose-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-red-500/20 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Cash Payment Modal */}
      <AnimatePresence>
        {showCashModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCashModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl p-6 ${
                isDark ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Ajouter paiement espèces
                </h3>
                <button
                  onClick={() => setShowCashModal(false)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nom du client
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={cashForm.clientName}
                    onChange={(e) => setCashForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={cashForm.amount}
                    onChange={(e) => setCashForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={cashForm.date}
                    onChange={(e) => setCashForm(prev => ({ ...prev, date: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tatouage bras complet"
                    value={cashForm.description}
                    onChange={(e) => setCashForm(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm transition-all ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500'
                        : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                    } focus:outline-none focus:ring-2 focus:ring-violet-500/20`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCashModal(false)}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isDark
                      ? 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddCashPayment}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                >
                  Ajouter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
