'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, MessageSquare, PieChart, LayoutGrid, Settings,
  Clock, Plus, LogOut, Menu, X, Share2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { prefetchDashboard } from '../../hooks/useDashboardSWR';
import { DashboardAppearanceProvider } from '../../contexts/DashboardAppearanceContext';
import { PWAInstallPrompt, PWAInstallButton } from '../PWAInstallPrompt';
import { ThemeToggle } from '../ThemeToggle';
import { WidgetStation } from './station/WidgetStation';
import { DashboardContentFallback } from './DashboardContentFallback';

interface DashboardLayoutNextProps {
  children: React.ReactNode;
}

/** Design system INKFLOW : fond #f8fafc, cartes #fff + shadow, primaire #6366f1, texte #1e293b / #64748b */
const DashboardLayoutInner: React.FC<DashboardLayoutNextProps> = ({ children }) => {
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const router = useRouter();
  const pathname = usePathname();
  const { pendingProjects } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    if (user?.id) prefetchDashboard(user.id);
  }, [user?.id]);

  React.useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const SidebarItem = ({
    href,
    icon: Icon,
    label,
    count,
  }: { href: string; icon: React.ElementType; label: string; count?: number }) => {
    const isActive = pathname === href || pathname?.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`w-full flex items-center justify-between px-4 min-h-[44px] rounded-xl text-sm font-medium transition-all duration-300 active:scale-[0.98] touch-manipulation ${
          isActive
            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-dash-primary border-l-2 border-dash-primary font-semibold'
            : 'text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} strokeWidth={1.8} />
          <span>{label}</span>
        </div>
        {count != null && count > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
            {count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden relative transition-colors duration-300">
      <PWAInstallPrompt />

      {/* Mobile Header — Soft UI: bg-card + shadow en Light, border en Dark */}
      <header className="fixed top-0 left-0 right-0 z-50 md:hidden flex items-center justify-between px-2 h-14 border-b border-border bg-card shadow-soft-light dark:shadow-soft-dark header-safe safe-area-top transition-colors duration-300">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMobileMenuOpen(true)}
          className="touch-target flex items-center justify-center -ml-1 text-foreground-muted hover:text-foreground rounded-xl hover:bg-background/50 active:scale-95 transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu size={24} />
        </motion.button>
        <span className="text-lg font-bold tracking-tight text-foreground">
          INK<span className="text-primary">FLOW</span>
        </span>
        <div className="flex items-center gap-1">
          <div className="touch-target flex items-center justify-center">
            <ThemeToggle size="sm" variant="ghost" />
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0 touch-target">
            {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </header>

      {/* Mobile Drawer — fond clair */}
      <AnimatePresence mode="wait">
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-card border-r border-border z-[70] md:hidden flex flex-col shadow-soft-light dark:shadow-soft-dark safe-area-top transition-colors duration-300"
            >
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <span className="text-lg font-bold tracking-tight text-foreground">
                  INK<span className="text-primary">FLOW</span>
                </span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background/50"
                  aria-label="Fermer le menu"
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!profile?.slug_profil || typeof window === 'undefined') return;
                    const url = `${window.location.origin}/${profile.slug_profil}`;
                    try {
                      if (typeof navigator !== 'undefined' && navigator.share) {
                        await navigator.share({
                          title: `${profile.nom_studio} - InkFlow`,
                          text: 'Découvrez mes flashs disponibles',
                          url,
                        });
                      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(url);
                        alert('Lien copié !');
                      }
                    } catch {
                      if (typeof navigator !== 'undefined' && navigator.clipboard) {
                        await navigator.clipboard.writeText(url);
                        alert('Lien copié !');
                      }
                    }
                    setIsMobileMenuOpen(false);
                  }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground-muted font-medium hover:bg-background/50 border border-border text-sm transition-colors duration-300"
                  >
                    <Share2 size={18} />
                    <span>Partager mon lien</span>
                  </motion.button>
                  <Link
                    href="/dashboard/flashs"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-4 min-h-[44px] bg-primary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm active:scale-[0.98] touch-manipulation"
                  >
                  <Plus size={18} />
                  <span>Nouveau Flash</span>
                </Link>
                <div className="pt-4 border-t border-border space-y-1">
                  <SidebarItem href="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
                  <SidebarItem href="/dashboard/calendar" icon={Calendar} label="Calendrier" />
                  <SidebarItem href="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
                  <SidebarItem href="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
                  <SidebarItem href="/dashboard/clients" icon={Users} label="Clients & Docs" />
                  <SidebarItem href="/dashboard/finance" icon={PieChart} label="Finance" />
                </div>
                <div className="pt-4 border-t border-border space-y-2">
                  <SidebarItem href="/dashboard/settings" icon={Settings} label="Paramètres" />
                  <PWAInstallButton variant="prominent" onClose={() => setIsMobileMenuOpen(false)} />
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 min-h-[44px] rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background/50 transition-colors duration-300 active:scale-[0.98] touch-manipulation"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-border shrink-0">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/30 border border-border">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="text-sm overflow-hidden flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                    <div className="text-xs text-dash-success flex items-center gap-1">● En ligne</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Sidebar Desktop — Soft UI: bg-card flottant sur bg-background */}
      <aside className="relative z-10 w-64 bg-card border-r border-border hidden md:flex flex-col flex-shrink-0 shadow-soft-light dark:shadow-soft-dark transition-colors duration-300">
        <div className="p-6 border-b border-border">
          <span className="text-xl font-bold tracking-tight text-foreground">
            INK<span className="text-primary">FLOW</span>
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
        <div className="p-4 border-t border-border">
          <SidebarItem href="/dashboard/settings" icon={Settings} label="Paramètres" />
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground-muted">Thème</span>
              <ThemeToggle size="sm" variant="outline" />
            </div>
            <PWAInstallButton variant="prominent" />
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/30 border border-border">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-sm overflow-hidden flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                <div className="text-xs text-dash-success">● En ligne</div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 min-h-[44px] rounded-xl text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background/50 transition-colors duration-300 active:scale-[0.98] touch-manipulation"
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
        className="relative z-10 flex-1 flex min-w-0 overflow-hidden main-below-header md:pt-0 pb-[calc(4rem+max(1rem,env(safe-area-inset-bottom,0px)))] md:pb-0 bg-background transition-colors duration-300"
        role="main"
      >
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pt-0">
          <Suspense fallback={<DashboardContentFallback />}>
            {children}
          </Suspense>
        </div>
        <WidgetStation />
      </main>

      {/* Mobile Bottom Navigation — Zone pouce, safe area iPhone */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border shadow-soft-light dark:shadow-soft-dark footer-safe safe-area-bottom transition-colors duration-300">
        <div className="grid grid-cols-5 min-h-[56px]">
          {[
            { href: '/dashboard/overview', icon: LayoutGrid, label: 'Accueil' },
            { href: '/dashboard/calendar', icon: Calendar, label: 'Agenda' },
            { href: '/dashboard/requests', icon: MessageSquare, label: 'Demandes', badge: pendingProjects.length },
            { href: '/dashboard/flashs', icon: Clock, label: 'Flashs' },
            { href: '/dashboard/settings', icon: Settings, label: 'Profil' },
          ].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <motion.div key={item.href} whileTap={{ scale: 0.95 }} className="flex">
                <Link
                  href={item.href}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[56px] min-w-0 touch-manipulation active:scale-95 transition-colors relative px-1 ${
                    isActive ? 'text-primary' : 'text-foreground-muted'
                  }`}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.2 : 1.8} className="shrink-0" />
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute top-2 right-1/2 translate-x-4 w-2 h-2 bg-primary rounded-full" />
                  )}
                  <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
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
