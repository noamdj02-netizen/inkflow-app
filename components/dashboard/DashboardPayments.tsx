import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  DollarSign,
  Shield,
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
  Receipt,
  Percent,
  Clock,
  ChevronRight,
  Wallet,
  Ban,
  Landmark,
  Info,
  Banknote,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowLeft,
  Euro,
  Calendar,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase';

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Toggle Switch ─── */
function Toggle({
  checked,
  onChange,
  isDark,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-2 ${
        isDark ? 'focus:ring-offset-[#0f0f23]' : 'focus:ring-offset-white'
      } ${checked ? 'bg-violet-500' : isDark ? 'bg-white/10' : 'bg-gray-300'}`}
      role="switch"
      aria-checked={checked}
    >
      <motion.div
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md"
        animate={{ left: checked ? 22 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ─── Card Wrapper ─── */
function GlassCard({
  children,
  isDark,
  className = '',
  glow,
}: {
  children: React.ReactNode;
  isDark: boolean;
  className?: string;
  glow?: 'violet' | 'emerald' | 'amber' | 'red';
}) {
  const glowMap = {
    violet: 'hover:shadow-violet-500/5 hover:border-violet-500/20',
    emerald: 'hover:shadow-emerald-500/5 hover:border-emerald-500/20',
    amber: 'hover:shadow-amber-500/5 hover:border-amber-500/20',
    red: 'hover:shadow-red-500/5 hover:border-red-500/20',
  };
  return (
    <div
      className={`rounded-2xl p-6 md:p-8 transition-all duration-300 ${
        isDark
          ? 'bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/[0.06]'
          : 'bg-white/80 backdrop-blur-xl border border-gray-200/80'
      } ${glow ? `hover:shadow-xl ${glowMap[glow]}` : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  isDark,
  iconBg,
  badge,
  trailing,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  isDark: boolean;
  iconBg: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {badge}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
      {trailing}
    </div>
  );
}

/* ─── Stripe Logo SVG (official wordmark) ─── */
function StripeLogo({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 468 222.5" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
      <path d="M414 113.4c0-25.6-12.4-45.8-36.1-45.8-23.8 0-38.2 20.2-38.2 45.6 0 30.1 17 45.3 41.4 45.3 11.9 0 20.9-2.7 27.7-6.5V132c-6.8 3.4-14.6 5.5-24.5 5.5-9.7 0-18.3-3.4-19.4-15.2h48.9c0-1.3.2-6.5.2-8.9zm-49.4-9.5c0-11.3 6.9-16 13.2-16 6.1 0 12.6 4.7 12.6 16h-25.8zM301.1 67.6c-9.8 0-16.1 4.6-19.6 7.8l-1.3-6.2h-22v116.6l25-5.3.1-28.3c3.6 2.6 8.9 6.3 17.7 6.3 17.9 0 34.2-14.4 34.2-46.1-.1-29-16.6-44.8-34.1-44.8zm-6 68.9c-5.9 0-9.4-2.1-11.8-4.7l-.1-37.1c2.6-2.9 6.2-4.9 11.9-4.9 9.1 0 15.4 10.2 15.4 23.3 0 13.4-6.2 23.4-15.4 23.4zM223.8 61.7l25.1-5.4V36l-25.1 5.3zM223.8 69.3h25.1v87.5h-25.1zM196.9 76.7l-1.6-7.4h-21.6v87.5h25V97.5c5.9-7.7 15.9-6.3 19-5.2v-23c-3.2-1.2-14.9-3.4-20.8 7.4zM146.9 47.6l-24.4 5.2-.1 80.1c0 14.8 11.1 25.7 25.9 25.7 8.2 0 14.2-1.5 17.5-3.3V135c-3.2 1.3-19 5.9-19-8.9V90.6h19V69.3h-19l.1-21.7zM79.3 94.7c0-3.9 3.2-5.4 8.5-5.4 7.6 0 17.2 2.3 24.8 6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6C67.5 67.6 52 78.8 52 97.4c0 28.8 39.7 24.2 39.7 36.6 0 4.6-4 6.1-9.6 6.1-8.3 0-18.9-3.4-27.3-8v23.8c9.3 4 18.7 5.7 27.3 5.7 20.8 0 35.1-10.3 35.1-28.2-.1-31.1-39.9-25.6-39.9-37.7z" />
    </svg>
  );
}

/* ─── Payment Settings interface ─── */
interface PaymentSettings {
  deposit_type: 'percentage' | 'fixed';
  deposit_percentage: number;
  deposit_fixed_amount: number;
  cancellation_policy_enabled: boolean;
  cancellation_hours: number;
  tax_enabled: boolean;
  tax_rate: number;
}

/* ─── Main Component ─── */
export const DashboardPayments: React.FC = () => {
  const { theme } = useDashboardTheme();
  const isDark = theme === 'dark';
  const { profile, updateProfile, refreshProfile } = useArtistProfile();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // State
  const [stripeLoading, setStripeLoading] = useState(false);
  const [depositPercent, setDepositPercent] = useState(profile?.deposit_percentage ?? 30);
  const [nonRefundable, setNonRefundable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Extended payment settings (from artist_payment_settings table)
  const [extSettings, setExtSettings] = useState<PaymentSettings>({
    deposit_type: 'percentage',
    deposit_percentage: profile?.deposit_percentage ?? 30,
    deposit_fixed_amount: 50,
    cancellation_policy_enabled: true,
    cancellation_hours: 48,
    tax_enabled: false,
    tax_rate: 20,
  });
  const [extLoading, setExtLoading] = useState(true);
  const [savingExt, setSavingExt] = useState(false);
  const [savedExt, setSavedExt] = useState(false);

  // Stripe connection status
  const isStripeConnected = profile?.stripe_connected ?? false;
  const isOnboardingComplete = profile?.stripe_onboarding_complete ?? false;
  const stripeAccountId = profile?.stripe_account_id;

  // Handle Stripe callback query params
  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Stripe Connect configuré avec succès !');
      refreshProfile();
    }
    if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Reprenez la configuration de votre compte Stripe.');
    }
    if (searchParams.get('stripe_incomplete') === 'true') {
      toast.warning('La configuration Stripe est incomplète. Veuillez la terminer.');
    }
  }, [searchParams, refreshProfile]);

  // Sync deposit percentage from profile
  useEffect(() => {
    if (profile?.deposit_percentage !== undefined) {
      setDepositPercent(profile.deposit_percentage);
    }
  }, [profile?.deposit_percentage]);

  // Load extended payment settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('artist_payment_settings')
          .select('*')
          .eq('artist_id', user.id)
          .maybeSingle();

        if (data) {
          setExtSettings({
            deposit_type: data.deposit_type || 'percentage',
            deposit_percentage: data.deposit_percentage ?? 30,
            deposit_fixed_amount: data.deposit_fixed_amount ?? 50,
            cancellation_policy_enabled: data.cancellation_policy_enabled ?? true,
            cancellation_hours: data.cancellation_hours ?? 48,
            tax_enabled: data.tax_enabled ?? false,
            tax_rate: data.tax_rate ?? 20,
          });
          setNonRefundable(data.is_deposit_non_refundable ?? false);
          if (data.deposit_type === 'percentage' && data.deposit_percentage !== undefined) {
            setDepositPercent(data.deposit_percentage);
          }
        }
      } catch (e) {
        // Table might not exist yet — that's fine, use defaults
        console.log('Payment settings table not found, using defaults');
      } finally {
        setExtLoading(false);
      }
    })();
  }, [user]);

  // Stripe Connect onboarding
  const handleStripeConnect = useCallback(async () => {
    if (!user) return;
    setStripeLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Session expirée');

      const res = await fetch('/api/stripe-connect-onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur Stripe');

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Impossible de lancer la configuration Stripe');
      setStripeLoading(false);
    }
  }, [user]);

  // Save deposit settings (to artists table)
  const handleSaveDeposit = useCallback(async () => {
    setSaving(true);
    const result = await updateProfile({ deposit_percentage: depositPercent });
    if (result.success) {
      setSaved(true);
      toast.success('Paramètres de paiement enregistrés');
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error(result.error || 'Erreur lors de la sauvegarde');
    }
    setSaving(false);
  }, [depositPercent, updateProfile]);

  // Save extended settings (to artist_payment_settings table)
  const handleSaveExtSettings = useCallback(async () => {
    if (!user) return;
    setSavingExt(true);
    try {
      const { error } = await supabase
        .from('artist_payment_settings')
        .upsert({
          artist_id: user.id,
          deposit_type: extSettings.deposit_type,
          deposit_percentage: extSettings.deposit_type === 'percentage' ? depositPercent : extSettings.deposit_percentage,
          deposit_fixed_amount: extSettings.deposit_fixed_amount,
          is_deposit_non_refundable: nonRefundable,
          cancellation_policy_enabled: extSettings.cancellation_policy_enabled,
          cancellation_hours: extSettings.cancellation_hours,
          tax_enabled: extSettings.tax_enabled,
          tax_rate: extSettings.tax_rate,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also sync deposit to artist profile
      if (extSettings.deposit_type === 'percentage') {
        const profileResult = await updateProfile({ deposit_percentage: depositPercent });
        if (!profileResult.success) {
          console.warn('Profile deposit sync failed:', profileResult.error);
        }
      }

      setSavedExt(true);
      toast.success('Paramètres enregistrés', {
        description: 'Vos préférences de paiement ont été mises à jour.',
      });
      setTimeout(() => setSavedExt(false), 2000);
    } catch (e: any) {
      toast.error('Erreur', {
        description: e.message || 'Impossible de sauvegarder',
      });
    } finally {
      setSavingExt(false);
    }
  }, [user, extSettings, depositPercent, nonRefundable, updateProfile]);

  // Example deposit calculation
  const examplePrice = 250;
  const exampleDeposit = extSettings.deposit_type === 'percentage'
    ? Math.round(examplePrice * (depositPercent / 100))
    : Math.min(extSettings.deposit_fixed_amount, examplePrice);

  // Commission rate based on plan
  const planCommission = profile?.user_plan === 'PRO' || profile?.user_plan === 'STUDIO' ? 0 : profile?.user_plan === 'STARTER' ? 2 : 5;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Link to="/dashboard/settings" className="hover:text-gray-300 transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Paramètres
          </Link>
          <ChevronRight size={14} />
          <span className={isDark ? 'text-white' : 'text-gray-900'}>Paiements</span>
        </div>
        <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Paiements & Facturation
        </h1>
        <p className="text-gray-500 mt-1.5">
          Configurez Stripe, définissez vos politiques d'acompte et gérez vos préférences de paiement.
        </p>
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* ═══════════════════════════════════════════════ */}
        {/* STRIPE CONNECT                                  */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark} glow={isStripeConnected ? 'emerald' : 'violet'}>
            <SectionHeader
              icon={Landmark}
              title="Stripe Connect"
              subtitle="Recevez les acomptes directement sur votre compte bancaire"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-violet-500 to-indigo-600"
              badge={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isStripeConnected && isOnboardingComplete
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : stripeAccountId
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : isDark
                      ? 'bg-white/5 text-gray-400 border border-white/10'
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                  }`}
                >
                  {isStripeConnected && isOnboardingComplete ? (
                    <><CheckCircle2 size={12} /> Connecté</>
                  ) : stripeAccountId ? (
                    <><AlertCircle size={12} /> Incomplet</>
                  ) : (
                    <><XCircle size={12} /> Non connecté</>
                  )}
                </span>
              }
            />

            {isStripeConnected && isOnboardingComplete ? (
              /* ─── Connected State ─── */
              <div className="space-y-4">
                <div className={`rounded-xl p-4 ${
                  isDark ? 'bg-emerald-500/[0.06] border border-emerald-500/10' : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                        Votre compte Stripe est actif
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Les acomptes de vos clients sont versés directement sur votre compte.
                        {stripeAccountId && (
                          <span className={`ml-1 font-mono ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            ({stripeAccountId.slice(0, 12)}...)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Commission InkFlow', value: `${planCommission}%`, icon: Percent, color: planCommission === 0 ? 'text-emerald-400' : 'text-amber-400' },
                    { label: 'Plan actif', value: profile?.user_plan || 'FREE', icon: Shield, color: 'text-violet-400' },
                    { label: 'Frais Stripe', value: '1.5% + 0.25€', icon: CreditCard, color: 'text-gray-400' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className={`rounded-xl p-3 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'}`}
                    >
                      <stat.icon size={14} className={`${stat.color} mb-1.5`} />
                      <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                      <div className="text-[11px] text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://dashboard.stripe.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isDark
                        ? 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    <StripeLogo className="w-10 h-auto" />
                    <span>Dashboard Stripe</span>
                    <ExternalLink size={14} className="text-gray-500" />
                  </a>
                </div>
              </div>
            ) : (
              /* ─── Not Connected State ─── */
              <div className="space-y-5">
                <div className={`rounded-xl p-5 relative overflow-hidden ${
                  isDark ? 'bg-gradient-to-br from-violet-500/[0.08] to-indigo-500/[0.04] border border-violet-500/10' : 'bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200'
                }`}>
                  {/* Decorative grid */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px',
                  }} />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <StripeLogo className={`w-14 h-auto ${isDark ? 'text-white' : 'text-gray-900'}`} />
                      <span className="text-sm text-gray-500">Connect</span>
                    </div>
                    <p className={`text-sm leading-relaxed mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      Connectez votre compte Stripe pour recevoir les acomptes de vos clients en toute sécurité. 
                      La configuration prend moins de 5 minutes.
                    </p>
                    <ul className="space-y-2 mb-5">
                      {[
                        'Virements automatiques sur votre compte bancaire',
                        'Paiements sécurisés par carte (Visa, Mastercard, etc.)',
                        'Tableau de bord Stripe pour le suivi des transactions',
                        'Conformité PCI-DSS sans effort de votre part',
                      ].map((item) => (
                        <li key={item} className="flex items-start gap-2 text-sm">
                          <Check size={14} className="text-violet-400 mt-0.5 shrink-0" />
                          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleStripeConnect}
                      disabled={stripeLoading}
                      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-400 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {stripeLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Landmark size={18} />
                      )}
                      {stripeLoading
                        ? 'Redirection vers Stripe...'
                        : stripeAccountId
                        ? 'Reprendre la configuration'
                        : 'Connecter Stripe'}
                    </button>
                  </div>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: Shield, title: 'Sécurisé', desc: 'Conforme PCI-DSS', color: 'text-violet-400' },
                    { icon: Zap, title: 'Instantané', desc: 'Paiements en temps réel', color: 'text-amber-400' },
                    { icon: CreditCard, title: '1.5% + 0.25€', desc: 'Frais par transaction', color: 'text-emerald-400' },
                  ].map((feat) => (
                    <div key={feat.title} className={`flex items-start gap-3 p-3 rounded-xl ${
                      isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <feat.icon className={`${feat.color} shrink-0`} size={18} />
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{feat.title}</p>
                        <p className="text-xs text-gray-500">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {stripeAccountId && (
                  <div className={`rounded-xl p-3 flex items-center gap-3 ${
                    isDark ? 'bg-amber-500/[0.06] border border-amber-500/10' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    <AlertCircle size={16} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-gray-500">
                      La configuration de votre compte Stripe n'est pas terminée. Cliquez sur le bouton ci-dessus pour la compléter.
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* DEPOSIT POLICY                                  */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark} glow="amber">
            <SectionHeader
              icon={Banknote}
              title="Politique d'acompte"
              subtitle="Définissez le montant d'acompte demandé à la réservation"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-amber-400 to-orange-500"
            />

            <div className="space-y-6">
              {/* Deposit Type Toggle */}
              <div>
                <label className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3 block">
                  Type d'acompte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setExtSettings(prev => ({ ...prev, deposit_type: 'percentage' }))}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      extSettings.deposit_type === 'percentage'
                        ? 'border-violet-500 ' + (isDark ? 'bg-violet-500/10' : 'bg-violet-50')
                        : isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {extSettings.deposit_type === 'percentage' && (
                      <motion.div
                        layoutId="depositType"
                        className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <Percent className={extSettings.deposit_type === 'percentage' ? 'text-violet-400' : 'text-gray-500'} size={20} />
                      <div className="text-left">
                        <p className={`font-semibold ${
                          extSettings.deposit_type === 'percentage'
                            ? isDark ? 'text-white' : 'text-gray-900'
                            : 'text-gray-500'
                        }`}>
                          Pourcentage
                        </p>
                        <p className="text-xs text-gray-500">% du prix total</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExtSettings(prev => ({ ...prev, deposit_type: 'fixed' }))}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      extSettings.deposit_type === 'fixed'
                        ? 'border-violet-500 ' + (isDark ? 'bg-violet-500/10' : 'bg-violet-50')
                        : isDark ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {extSettings.deposit_type === 'fixed' && (
                      <motion.div
                        layoutId="depositType"
                        className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative flex items-center gap-3">
                      <Euro className={extSettings.deposit_type === 'fixed' ? 'text-violet-400' : 'text-gray-500'} size={20} />
                      <div className="text-left">
                        <p className={`font-semibold ${
                          extSettings.deposit_type === 'fixed'
                            ? isDark ? 'text-white' : 'text-gray-900'
                            : 'text-gray-500'
                        }`}>
                          Montant fixe
                        </p>
                        <p className="text-xs text-gray-500">Même prix toujours</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Percentage Slider or Fixed Amount Input */}
              <AnimatePresence mode="wait">
                {extSettings.deposit_type === 'percentage' ? (
                  <motion.div
                    key="percentage"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Pourcentage d'acompte
                      </label>
                      <div className={`px-3 py-1 rounded-lg text-sm font-bold tabular-nums ${
                        isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-900'
                      }`}>
                        {depositPercent}%
                      </div>
                    </div>

                    {/* Custom Range Slider */}
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-runnable-track]:rounded-full
                          [&::-webkit-slider-runnable-track]:h-2
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-white
                          [&::-webkit-slider-thumb]:shadow-lg
                          [&::-webkit-slider-thumb]:shadow-violet-500/30
                          [&::-webkit-slider-thumb]:border-2
                          [&::-webkit-slider-thumb]:border-violet-500
                          [&::-webkit-slider-thumb]:mt-[-6px]
                          [&::-webkit-slider-thumb]:transition-all
                          [&::-webkit-slider-thumb]:duration-200
                          [&::-webkit-slider-thumb]:hover:scale-110
                          [&::-moz-range-thumb]:w-5
                          [&::-moz-range-thumb]:h-5
                          [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-white
                          [&::-moz-range-thumb]:shadow-lg
                          [&::-moz-range-thumb]:border-2
                          [&::-moz-range-thumb]:border-violet-500"
                        style={{
                          background: `linear-gradient(to right, rgb(139, 92, 246) ${depositPercent}%, ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'} ${depositPercent}%)`,
                        }}
                      />
                      {/* Markers */}
                      <div className="flex justify-between mt-1.5 px-0.5">
                        {[0, 25, 50, 75, 100].map((v) => (
                          <span key={v} className="text-[10px] text-gray-500 tabular-nums">{v}%</span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="fixed"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Montant fixe de l'acompte
                    </label>
                    <div className="relative">
                      <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <input
                        type="number"
                        min="10"
                        max="500"
                        step="5"
                        value={extSettings.deposit_fixed_amount}
                        onChange={(e) => setExtSettings(prev => ({ ...prev, deposit_fixed_amount: parseInt(e.target.value) || 0 }))}
                        className={`w-full pl-12 pr-4 py-3 rounded-xl text-lg font-semibold transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/40 ${
                          isDark
                            ? 'bg-white/5 text-white border border-white/[0.06] focus:border-violet-500/40 placeholder-zinc-600'
                            : 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-violet-500 placeholder-gray-400'
                        }`}
                        placeholder="50"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview calculation */}
              <div className={`rounded-xl p-4 ${
                isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <Info size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Exemple de calcul</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{examplePrice}€</div>
                    <div className="text-[11px] text-gray-500">Prix du flash</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-violet-400">{exampleDeposit}€</div>
                    <div className="text-[11px] text-gray-500">Acompte demandé</div>
                  </div>
                  <div>
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{examplePrice - exampleDeposit}€</div>
                    <div className="text-[11px] text-gray-500">Reste à payer</div>
                  </div>
                </div>
              </div>

              {/* Toggle: non-refundable */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <Ban size={18} className="text-gray-500 shrink-0" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Acompte non remboursable
                    </p>
                    <p className="text-xs text-gray-500">
                      Si annulation moins de 48h avant le rendez-vous
                    </p>
                  </div>
                </div>
                <Toggle checked={nonRefundable} onChange={setNonRefundable} isDark={isDark} />
              </div>
              {nonRefundable && (
                <p className="text-xs text-gray-500 italic mt-1 ml-1">
                  Si activé, cette mention apparaîtra sur la page de paiement du client.
                </p>
              )}

              {/* Save */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-gray-500">
                  Les modifications s'appliquent aux prochaines réservations.
                </p>
                <button
                  onClick={handleSaveDeposit}
                  disabled={saving || depositPercent === profile?.deposit_percentage}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                    saved
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/20'
                  }`}
                >
                  {saving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : saved ? (
                    <Check size={16} />
                  ) : (
                    <DollarSign size={16} />
                  )}
                  {saving ? 'Enregistrement...' : saved ? 'Enregistré !' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* CANCELLATION POLICY                             */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark} glow="red">
            <SectionHeader
              icon={AlertCircle}
              title="Politique d'annulation"
              subtitle="Protégez votre temps et vos revenus"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-red-500 to-rose-600"
              trailing={
                <Toggle
                  checked={extSettings.cancellation_policy_enabled}
                  onChange={(v) => setExtSettings(prev => ({ ...prev, cancellation_policy_enabled: v }))}
                  isDark={isDark}
                />
              }
            />

            <AnimatePresence>
              {extSettings.cancellation_policy_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className={`p-4 rounded-xl ${
                    isDark ? 'bg-red-500/[0.06] border border-red-500/10' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Shield className={isDark ? 'text-red-400' : 'text-red-500'} size={18} />
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        L'acompte est <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>non remboursable</span> si le client annule moins de{' '}
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{extSettings.cancellation_hours}h</span> avant le rendez-vous.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className={`text-sm font-medium flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <Calendar size={16} className="text-gray-500" />
                      Délai d'annulation (heures avant RDV)
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[24, 48, 72, 96].map((hours) => (
                        <button
                          key={hours}
                          onClick={() => setExtSettings(prev => ({ ...prev, cancellation_hours: hours }))}
                          className={`py-3 rounded-xl font-semibold transition-all text-sm ${
                            extSettings.cancellation_hours === hours
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/20'
                              : isDark
                                ? 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {hours}h
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* TAX / TVA SETTINGS                              */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark}>
            <SectionHeader
              icon={Percent}
              title="TVA / Taxes"
              subtitle="Appliquer la TVA sur vos factures"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-blue-500 to-cyan-600"
              trailing={
                <Toggle
                  checked={extSettings.tax_enabled}
                  onChange={(v) => setExtSettings(prev => ({ ...prev, tax_enabled: v }))}
                  isDark={isDark}
                />
              }
            />

            <AnimatePresence>
              {extSettings.tax_enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Taux de TVA (%)</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 0, label: '0%' },
                        { value: 5.5, label: '5.5%' },
                        { value: 10, label: '10%' },
                        { value: 20, label: '20%' },
                      ].map((rate) => (
                        <button
                          key={rate.value}
                          onClick={() => setExtSettings(prev => ({ ...prev, tax_rate: rate.value }))}
                          className={`py-3 rounded-xl font-semibold transition-all text-sm ${
                            extSettings.tax_rate === rate.value
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
                              : isDark
                                ? 'bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06]'
                                : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {rate.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">Taux standard en France : 20%. Micro-entrepreneur : 0%.</p>
                  </div>

                  {extSettings.tax_rate > 0 && (
                    <div className={`rounded-xl p-4 ${
                      isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={14} className="text-gray-500" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Aperçu TVA</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{examplePrice}€</div>
                          <div className="text-[11px] text-gray-500">HT</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-400">{(examplePrice * extSettings.tax_rate / 100).toFixed(0)}€</div>
                          <div className="text-[11px] text-gray-500">TVA ({extSettings.tax_rate}%)</div>
                        </div>
                        <div>
                          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{(examplePrice * (1 + extSettings.tax_rate / 100)).toFixed(0)}€</div>
                          <div className="text-[11px] text-gray-500">TTC</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* PAYMENT METHODS                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark} glow="emerald">
            <SectionHeader
              icon={CreditCard}
              title="Moyens de paiement"
              subtitle="Méthodes acceptées via Stripe pour vos clients"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Visa', enabled: true },
                { name: 'Mastercard', enabled: true },
                { name: 'Apple Pay', enabled: true },
                { name: 'Google Pay', enabled: true },
              ].map((method) => (
                <div
                  key={method.name}
                  className={`relative rounded-xl p-4 text-center transition-all duration-200 ${
                    method.enabled
                      ? isDark
                        ? 'bg-emerald-500/[0.06] border border-emerald-500/15'
                        : 'bg-emerald-50 border border-emerald-200'
                      : isDark
                        ? 'bg-white/[0.02] border border-white/[0.06]'
                        : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  {method.enabled && (
                    <div className="absolute top-2 right-2">
                      <Check size={12} className="text-emerald-400" />
                    </div>
                  )}
                  <CreditCard size={20} className={`mx-auto mb-2 ${
                    method.enabled
                      ? 'text-emerald-400'
                      : 'text-gray-500'
                  }`} />
                  <span className={`text-xs font-medium ${
                    method.enabled
                      ? isDark ? 'text-emerald-300' : 'text-emerald-700'
                      : 'text-gray-500'
                  }`}>
                    {method.name}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4 flex items-start gap-1.5">
              <Shield size={12} className="shrink-0 mt-0.5" />
              <span>Tous les paiements sont sécurisés et conformes PCI-DSS via Stripe. Aucune donnée bancaire ne transite par InkFlow.</span>
            </p>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* INVOICING & TAX                                 */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <GlassCard isDark={isDark}>
            <SectionHeader
              icon={Receipt}
              title="Facturation"
              subtitle="Informations apparaissant sur vos reçus et factures"
              isDark={isDark}
              iconBg="bg-gradient-to-br from-slate-500 to-zinc-600"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Nom de l'entreprise</label>
                <input
                  type="text"
                  defaultValue={profile?.nom_studio || ''}
                  placeholder="Mon Studio Tattoo"
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/40 ${
                    isDark
                      ? 'bg-white/5 text-white border border-white/[0.06] focus:border-violet-500/40'
                      : 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-violet-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">SIRET</label>
                <input
                  type="text"
                  placeholder="123 456 789 00012"
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/40 ${
                    isDark
                      ? 'bg-white/5 text-white border border-white/[0.06] focus:border-violet-500/40'
                      : 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-violet-500'
                  }`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-2">Adresse</label>
                <input
                  type="text"
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-200 outline-none focus:ring-2 focus:ring-violet-500/40 ${
                    isDark
                      ? 'bg-white/5 text-white border border-white/[0.06] focus:border-violet-500/40'
                      : 'bg-gray-100 text-gray-900 border border-gray-200 focus:border-violet-500'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-300 active:scale-[0.98]">
                <Receipt size={16} />
                Enregistrer la facturation
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* SAVE ALL EXTENDED SETTINGS                      */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className={`rounded-2xl p-5 flex items-center justify-between gap-4 ${
            isDark ? 'bg-violet-500/[0.06] border border-violet-500/10' : 'bg-violet-50 border border-violet-200'
          }`}>
            <div className="flex items-center gap-3">
              <Info size={16} className="text-violet-400 shrink-0" />
              <p className="text-sm text-gray-500">
                Enregistrez les politiques d'annulation et de TVA.
              </p>
            </div>
            <button
              onClick={handleSaveExtSettings}
              disabled={savingExt}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shrink-0 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                savedExt
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/20'
              }`}
            >
              {savingExt ? (
                <><Loader2 size={16} className="animate-spin" /> Enregistrement...</>
              ) : savedExt ? (
                <><Check size={16} /> Enregistré !</>
              ) : (
                <><Check size={16} /> Tout enregistrer</>
              )}
            </button>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════ */}
        {/* QUICK LINKS                                     */}
        {/* ═══════════════════════════════════════════════ */}
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                icon: Wallet,
                label: 'Voir mes transactions',
                path: '/dashboard/finance',
                color: isDark ? 'text-emerald-400' : 'text-emerald-600',
                bg: isDark ? 'bg-emerald-500/[0.06]' : 'bg-emerald-50',
              },
              {
                icon: Clock,
                label: 'Historique des paiements',
                path: '/dashboard/finance',
                color: isDark ? 'text-violet-400' : 'text-violet-600',
                bg: isDark ? 'bg-violet-500/[0.06]' : 'bg-violet-50',
              },
              {
                icon: Settings,
                label: 'Paramètres généraux',
                path: '/dashboard/settings',
                color: isDark ? 'text-gray-400' : 'text-gray-600',
                bg: isDark ? 'bg-white/[0.03]' : 'bg-gray-50',
              },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group ${link.bg} ${
                  isDark ? 'border border-white/[0.06] hover:border-white/10' : 'border border-gray-200 hover:border-gray-300'
                }`}
              >
                <link.icon size={18} className={link.color} />
                <span className={`text-sm font-medium flex-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {link.label}
                </span>
                <ChevronRight size={16} className="text-gray-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
