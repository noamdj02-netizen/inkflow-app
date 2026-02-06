'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, DollarSign, Users, MessageSquare, 
  FileSignature, PieChart, LayoutGrid, Settings, 
  Search, Bell, MoreVertical, CheckCircle, XCircle, 
  Megaphone, Clock, MapPin, ChevronRight, FileText,
  AlertTriangle, ArrowUpRight, Instagram, Plus,
  Save, Palette, CreditCard, Smartphone, Shield, Mail, LogOut,
  Menu, X, Share2, Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { prefetchDashboard } from '../../hooks/useDashboardSWR';
import { DashboardAppearanceProvider, useDashboardAppearance } from '../../contexts/DashboardAppearanceContext';
import { PWAInstallPrompt, PWAInstallButton } from '../PWAInstallPrompt';
import { Skeleton } from '../common/Skeleton';
import { WidgetStation } from './station/WidgetStation';
import { DashboardContentFallback } from './DashboardContentFallback';

interface DashboardLayoutNextProps {
  children: React.ReactNode;
}

const DashboardLayoutInner: React.FC<DashboardLayoutNextProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { loading: dataLoading, stats, recentBookings, pendingProjects } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { appearance } = useDashboardAppearance();

  // Prefetch des données critiques au montage (cache SWR, revalidation en arrière-plan)
  React.useEffect(() => {
    if (user?.id) prefetchDashboard(user.id);
  }, [user?.id]);

  // Prevent body scroll when drawer is open
  React.useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Sidebar Item avec Next.js Link
  const SidebarItem = ({ href, icon: Icon, label, count }: { href: string, icon: any, label: string, count?: number }) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive
          ? 'bg-white/10 text-white border-l-2 border-white font-semibold' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{label}</span>
        </div>
        {count && count > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-black">
            {count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-[#02040a] text-white font-sans overflow-hidden relative">
      {/* Background immersif */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[#02040a] hero-bg-grid" />
        <div
          className="absolute w-[520px] h-[520px] rounded-full blur-[150px] transition-opacity duration-300"
          style={{
            top: '-15%',
            left: '-10%',
            background: appearance.glowLeftColor,
            opacity: appearance.glowIntensity,
          }}
        />
        <div
          className="absolute w-[480px] h-[480px] rounded-full blur-[150px] transition-opacity duration-300"
          style={{
            bottom: '-12%',
            right: '-8%',
            background: appearance.glowRightColor,
            opacity: appearance.glowIntensity,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{ background: `rgba(0,0,0,${appearance.overlayOpacity})` }}
        />
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 glass z-50 md:hidden flex items-center justify-between px-4 border-b border-white/5 header-safe">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          aria-label="Ouvrir le menu"
        >
          <Menu size={24} />
        </motion.button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-bold tracking-tight text-white">
            INK<span className="text-zinc-400">FLOW</span>
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 300,
                mass: 0.8
              }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-[#0a0a0a] border-r border-white/10 z-[70] md:hidden flex flex-col shadow-2xl safe-area-top"
            >
              <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-lg md:text-xl font-display font-bold tracking-tight text-white">
                  INK<span className="text-zinc-400">FLOW</span>
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 scrollbar-hide">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      if (!profile?.slug_profil || typeof window === 'undefined') return;
                      const url = `${window.location.origin}/${profile.slug_profil}`;
                      try {
                        if (typeof navigator !== 'undefined' && navigator.share) {
                          await navigator.share({
                            title: `${profile.nom_studio} - InkFlow`,
                            text: `Découvrez mes flashs disponibles`,
                            url: url,
                          });
                        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          await navigator.clipboard.writeText(url);
                          alert('Lien copié !');
                        }
                      } catch (err) {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          await navigator.clipboard.writeText(url);
                          alert('Lien copié !');
                        }
                      }
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 glass rounded-xl text-zinc-300 font-medium hover:bg-white/10 transition-colors text-sm"
                  >
                    <Share2 size={18} />
                    <span>Partager mon lien</span>
                  </motion.button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <Link
                    href="/dashboard/flashs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-100 transition-colors text-sm"
                  >
                    <Plus size={18} />
                    <span>Nouveau Flash</span>
                  </Link>
                </motion.div>
                <div className="pt-4 border-t border-white/5 space-y-1">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                    <SidebarItem href="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                    <SidebarItem href="/dashboard/calendar" icon={Calendar} label="Calendrier" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <SidebarItem href="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                    <SidebarItem href="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <SidebarItem href="/dashboard/clients" icon={Users} label="Clients & Docs" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                    <SidebarItem href="/dashboard/finance" icon={PieChart} label="Finance" />
                  </motion.div>
                </div>
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <SidebarItem href="/dashboard/settings" icon={Settings} label="Paramètres" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                    <PWAInstallButton variant="prominent" onClose={() => setIsMobileMenuOpen(false)} />
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      await handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </motion.button>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="p-4 border-t border-white/5 shrink-0"
              >
                <div className="flex items-center gap-3 px-4 glass p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="text-sm overflow-hidden flex-1 min-w-0">
                    <div className="font-semibold truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">● En ligne</div>
                  </div>
                </div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* Sidebar Desktop */}
      <aside className="relative z-10 w-64 bg-[#0a0a0a]/80 backdrop-blur-sm border-r border-white/5 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5">
          <span className="text-xl font-display font-bold tracking-tight text-white">
            INK<span className="text-zinc-400">FLOW</span>
          </span>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem href="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
          <SidebarItem href="/dashboard/calendar" icon={Calendar} label="Calendrier" />
          <SidebarItem href="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
          <SidebarItem href="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
          <SidebarItem href="/dashboard/clients" icon={Users} label="Clients & Docs" />
          <SidebarItem href="/dashboard/finance" icon={PieChart} label="Finance" />
        </div>

        <div className="p-4 border-t border-white/5">
          <SidebarItem href="/dashboard/settings" icon={Settings} label="Paramètres" />
          <div className="mt-4 space-y-3">
            <PWAInstallButton variant="prominent" />
            <div className="flex items-center gap-3 px-4 glass p-3 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-sm overflow-hidden flex-1">
                <div className="font-semibold truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1">● En ligne</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        id="main-content"
        className="relative z-10 flex-1 flex min-w-0 overflow-hidden main-below-header md:pt-0 pb-[calc(4rem+max(1rem,env(safe-area-inset-bottom,0px)))] md:pb-0"
        role="main"
      >
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-transparent overflow-hidden pt-0">
          <Suspense fallback={<DashboardContentFallback />}>
            {children}
          </Suspense>
        </div>

        <WidgetStation />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass z-50 md:hidden footer-safe">
        <div className="grid grid-cols-5 h-16">
          {[
            { href: '/dashboard/overview', icon: LayoutGrid, label: 'Accueil' },
            { href: '/dashboard/calendar', icon: Calendar, label: 'Agenda' },
            { href: '/dashboard/requests', icon: MessageSquare, label: 'Demandes', badge: pendingProjects.length },
            { href: '/dashboard/flashs', icon: Clock, label: 'Flashs' },
            { href: '/dashboard/settings', icon: Settings, label: 'Profil' },
          ].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <motion.div key={item.href} whileTap={{ scale: 0.9 }}>
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 h-full transition-colors relative ${
                    isActive ? 'text-white' : 'text-zinc-600'
                  }`}
                >
                  <item.icon size={20} />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 bg-white rounded-full"></span>
                  )}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export const DashboardLayoutNext: React.FC<DashboardLayoutNextProps> = ({ children }) => (
  <DashboardAppearanceProvider>
    <DashboardLayoutInner>{children}</DashboardLayoutInner>
  </DashboardAppearanceProvider>
);
