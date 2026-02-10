import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  Image,
  Users,
  Wallet,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  ExternalLink,
  X,
  Menu,
  Clock,
  FileText,
  CreditCard,
  Loader2,
  CheckCheck,
  Sparkles,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { PWAInstallPrompt } from '../PWAInstallPrompt';
import { supabase } from '../../services/supabase';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/overview', gradient: 'from-violet-500 to-purple-500' },
  { icon: Calendar, label: 'Calendrier', path: '/dashboard/calendar', gradient: 'from-blue-500 to-cyan-500' },
  { icon: MessageSquare, label: 'Demandes', path: '/dashboard/requests', gradient: 'from-pink-500 to-rose-500', badgeKey: 'pending' },
  { icon: Image, label: 'Flashs', path: '/dashboard/flashs', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Users, label: 'Clients', path: '/dashboard/clients', gradient: 'from-orange-500 to-amber-500' },
  { icon: Wallet, label: 'Finance', path: '/dashboard/finance', gradient: 'from-green-500 to-emerald-500' },
  { icon: Settings, label: 'Paramètres', path: '/dashboard/settings', gradient: 'from-slate-500 to-gray-500' },
];

interface Notification {
  id: string;
  type: 'booking' | 'project' | 'payment' | 'reminder';
  title: string;
  description: string;
  time: string;
  read: boolean;
}

interface SearchResult {
  id: string;
  category: 'clients' | 'flashs' | 'reservations' | 'settings';
  title: string;
  subtitle: string;
  path: string;
}

const settingsLinks: SearchResult[] = [
  { id: 'settings-general', category: 'settings', title: 'Paramètres généraux', subtitle: 'Profil, studio, informations', path: '/dashboard/settings' },
  { id: 'settings-payments', category: 'settings', title: 'Paiements', subtitle: 'Stripe, tarifs, acomptes', path: '/dashboard/settings?tab=payments' },
  { id: 'settings-care', category: 'settings', title: 'Soins post-tattoo', subtitle: 'Consignes de soin', path: '/dashboard/settings?tab=care' },
];

const formatRelativeTime = (dateStr: string): string => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Hier';
  return `Il y a ${diffD}j`;
};

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useDashboardTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const { pendingProjects } = useDashboardData();

  // Notification state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Fetch notifications on mount
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      const notifs: Notification[] = [];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
      const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1).toISOString();

      // Pending bookings (last 7 days)
      const { data: pendingBookings } = await supabase
        .from('bookings')
        .select('id, client_name, created_at')
        .eq('artist_id', user.id)
        .eq('statut_booking', 'pending')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10) as { data: { id: string; client_name: string | null; created_at: string }[] | null };

      pendingBookings?.forEach((b) => {
        notifs.push({
          id: `booking-${b.id}`,
          type: 'booking',
          title: 'Nouvelle réservation',
          description: `Nouvelle réservation de ${b.client_name || 'Client'}`,
          time: b.created_at,
          read: false,
        });
      });

      // Pending/inquiry projects (last 7 days)
      const { data: pendingProjectsData } = await supabase
        .from('projects')
        .select('id, client_name, created_at')
        .eq('artist_id', user.id)
        .in('statut', ['inquiry', 'pending'])
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10) as { data: { id: string; client_name: string | null; created_at: string }[] | null };

      pendingProjectsData?.forEach((p) => {
        notifs.push({
          id: `project-${p.id}`,
          type: 'project',
          title: 'Nouvelle demande de projet',
          description: `Nouvelle demande de projet de ${p.client_name || 'Client'}`,
          time: p.created_at,
          read: false,
        });
      });

      // Tomorrow's bookings
      const { data: tomorrowBookings } = await supabase
        .from('bookings')
        .select('id, client_name, date_debut')
        .eq('artist_id', user.id)
        .gte('date_debut', tomorrowStart)
        .lt('date_debut', tomorrowEnd)
        .limit(10) as { data: { id: string; client_name: string | null; date_debut: string }[] | null };

      tomorrowBookings?.forEach((b) => {
        notifs.push({
          id: `reminder-${b.id}`,
          type: 'reminder',
          title: 'Rappel RDV demain',
          description: `RDV demain avec ${b.client_name || 'Client'}`,
          time: b.date_debut,
          read: false,
        });
      });

      // Deposit paid bookings (last 7 days)
      const { data: depositBookings } = await supabase
        .from('bookings')
        .select('id, client_name, created_at')
        .eq('artist_id', user.id)
        .eq('statut_paiement', 'deposit_paid')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(10) as { data: { id: string; client_name: string | null; created_at: string }[] | null };

      depositBookings?.forEach((b) => {
        notifs.push({
          id: `payment-${b.id}`,
          type: 'payment',
          title: 'Acompte reçu',
          description: `Acompte reçu de ${b.client_name || 'Client'}`,
          time: b.created_at,
          read: false,
        });
      });

      // Sort by time desc
      notifs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setNotifications(notifs);
    };
    fetchNotifications();
  }, [user?.id]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    if (notificationsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationsOpen]);

  // Cmd+K / Ctrl+K keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Autofocus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedResultIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Debounced search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !user?.id) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const results: SearchResult[] = [];
    const q = `%${query}%`;

    // Search bookings (clients + reservations)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, client_name, client_email, date_debut')
      .eq('artist_id', user.id)
      .or(`client_name.ilike.${q},client_email.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(5) as { data: { id: string; client_name: string | null; client_email: string; date_debut: string }[] | null };

    const seenClients = new Set<string>();
    bookings?.forEach((b) => {
      const clientKey = b.client_email || b.client_name || b.id;
      if (!seenClients.has(clientKey)) {
        seenClients.add(clientKey);
        results.push({
          id: `client-${b.id}`,
          category: 'clients',
          title: b.client_name || b.client_email,
          subtitle: b.client_email || '',
          path: '/dashboard/clients',
        });
      }
      results.push({
        id: `booking-${b.id}`,
        category: 'reservations',
        title: `Réservation - ${b.client_name || 'Client'}`,
        subtitle: b.date_debut ? new Date(b.date_debut).toLocaleDateString('fr-FR') : '',
        path: '/dashboard/calendar',
      });
    });

    // Search projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, client_name, body_part, style')
      .eq('artist_id', user.id)
      .or(`client_name.ilike.${q},body_part.ilike.${q}`)
      .order('created_at', { ascending: false })
      .limit(5) as { data: { id: string; client_name: string; body_part: string | null; style: string | null }[] | null };

    projects?.forEach((p) => {
      const clientKey = p.client_name;
      if (!seenClients.has(clientKey)) {
        seenClients.add(clientKey);
        results.push({
          id: `project-client-${p.id}`,
          category: 'clients',
          title: p.client_name,
          subtitle: p.body_part || '',
          path: '/dashboard/clients',
        });
      }
    });

    // Search flashs
    const { data: flashs } = await supabase
      .from('flashs')
      .select('id, title')
      .eq('artist_id', user.id)
      .ilike('title', q)
      .order('created_at', { ascending: false })
      .limit(5) as { data: { id: string; title: string }[] | null };

    flashs?.forEach((f) => {
      results.push({
        id: `flash-${f.id}`,
        category: 'flashs',
        title: f.title,
        subtitle: 'Flash tattoo',
        path: '/dashboard/flashs',
      });
    });

    // Filter settings links
    const settingsMatches = settingsLinks.filter(
      (s) => s.title.toLowerCase().includes(query.toLowerCase()) || s.subtitle.toLowerCase().includes(query.toLowerCase())
    );
    results.push(...settingsMatches);

    setSearchResults(results);
    setSelectedResultIndex(0);
    setSearchLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchQuery, performSearch]);

  const handleSearchSelect = (result: SearchResult) => {
    navigate(result.path);
    setSearchOpen(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    const allResults = searchResults;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev + 1) % Math.max(allResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev - 1 + allResults.length) % Math.max(allResults.length, 1));
    } else if (e.key === 'Enter' && allResults[selectedResultIndex]) {
      e.preventDefault();
      handleSearchSelect(allResults[selectedResultIndex]);
    }
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking': return <Calendar size={16} className="text-blue-400" />;
      case 'project': return <FileText size={16} className="text-pink-400" />;
      case 'payment': return <CreditCard size={16} className="text-emerald-400" />;
      case 'reminder': return <Clock size={16} className="text-amber-400" />;
    }
  };

  const getCategoryIcon = (category: SearchResult['category']) => {
    switch (category) {
      case 'clients': return <Users size={16} />;
      case 'flashs': return <Image size={16} />;
      case 'reservations': return <Calendar size={16} />;
      case 'settings': return <Settings size={16} />;
    }
  };

  const getCategoryLabel = (category: SearchResult['category']) => {
    switch (category) {
      case 'clients': return 'Clients';
      case 'flashs': return 'Flashs';
      case 'reservations': return 'Réservations';
      case 'settings': return 'Paramètres';
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.nom_studio || user?.email?.split('@')[0] || 'Pro';
  const displayEmail = user?.email || '';
  const initial = (profile?.nom_studio?.[0] || user?.email?.[0] || 'P').toUpperCase();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f0f23]' : 'bg-gray-50'} transition-colors duration-300`}>
      <PWAInstallPrompt />

      {/* Sidebar Desktop */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? '80px' : '280px' }}
        className={`fixed left-0 top-0 bottom-0 ${
          isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-white border-gray-200'
        } border-r hidden lg:flex flex-col transition-colors duration-300 z-50`}
      >
        <div className={`h-20 flex items-center justify-between px-6 border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <motion.div animate={{ opacity: sidebarCollapsed ? 0 : 1 }} className="flex items-center">
            {!sidebarCollapsed && (
              <div>
                <h1 className={`text-lg font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>INK<span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>FLOW</span></h1>
                <p className="text-xs text-gray-500">Studio Pro</p>
              </div>
            )}
          </motion.div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'} transition-colors`}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const badge = item.badgeKey === 'pending' ? pendingProjects.length : undefined;
            return (
              <NavLink key={item.path} to={item.path} className="block">
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                    isActive
                      ? isDark
                        ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-400'
                        : 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-600'
                      : isDark
                        ? 'text-gray-400 hover:text-white hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b ${item.gradient}`}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <div className={`shrink-0 ${isActive ? 'scale-110' : ''} transition-transform`}>
                    <item.icon size={20} />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                  )}
                  {!sidebarCollapsed && badge !== undefined && badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full">
                      {badge}
                    </span>
                  )}
                </motion.div>
              </NavLink>
            );
          })}
        </nav>

        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'} space-y-3`}>
          {/* Voir ma page publique */}
          {profile?.slug_profil && (
            <a
              href={`/${profile.slug_profil}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                sidebarCollapsed ? 'justify-center' : ''
              } ${
                isDark
                  ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'
                  : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200'
              }`}
            >
              <ExternalLink size={16} className="shrink-0" />
              {!sidebarCollapsed && <span>Voir ma page</span>}
            </a>
          )}

          <div className={`flex items-center gap-3 p-3 rounded-xl ${
            isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
          } transition-colors cursor-pointer`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
              {initial}
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                </div>
                <ChevronDown size={16} className="text-gray-400 shrink-0" />
              </>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`fixed left-0 top-0 bottom-0 w-80 ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'} z-50 lg:hidden overflow-y-auto border-r ${isDark ? 'border-white/5' : 'border-gray-200'}`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <div>
                      <h1 className={`text-lg font-display font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>INK<span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>FLOW</span></h1>
                      <p className="text-xs text-gray-500">Studio Pro</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const badge = item.badgeKey === 'pending' ? pendingProjects.length : undefined;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all ${
                          isActive
                            ? isDark
                              ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-400'
                              : 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-600'
                            : isDark
                              ? 'text-gray-400 hover:bg-white/5'
                              : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={20} />
                        <span className="font-medium text-sm flex-1">{item.label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full">
                            {badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Voir ma page publique (mobile) */}
                {profile?.slug_profil && (
                  <a
                    href={`/${profile.slug_profil}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 mt-6 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isDark
                        ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'
                        : 'bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200'
                    }`}
                  >
                    <ExternalLink size={18} />
                    <span>Voir ma page publique</span>
                  </a>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]'} transition-all duration-300`}>
        <header className={`sticky top-0 z-30 h-20 ${
          isDark ? 'bg-[#0f0f23]/80 border-white/5' : 'bg-white/80 border-gray-200'
        } backdrop-blur-xl border-b`}>
          <div className="h-full px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-lg ${
                  isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Menu size={20} />
              </button>

              <button
                onClick={() => setSearchOpen(true)}
                className={`hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                  isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                } w-80 transition-colors cursor-pointer`}
              >
                <Search size={18} className="text-gray-500" />
                <span className={`text-sm flex-1 text-left ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Rechercher...
                </span>
                <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-white text-gray-500'}`}>
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className={`relative p-2.5 rounded-xl ${
                    isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                  } transition-colors`}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full ring-2 ring-[#0f0f23]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 top-full mt-2 w-96 rounded-2xl shadow-2xl overflow-hidden z-50 ${
                        isDark ? 'bg-[#1a1a2e] border border-white/5' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/10 text-red-400 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className={`flex items-center gap-1 text-xs font-medium ${
                              isDark ? 'text-violet-400 hover:text-violet-300' : 'text-violet-600 hover:text-violet-700'
                            } transition-colors`}
                          >
                            <CheckCheck size={14} />
                            Marquer tout comme lu
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <Bell size={24} className="mx-auto mb-2 text-gray-500 opacity-50" />
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              Aucune notification
                            </p>
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                                !notif.read
                                  ? isDark ? 'bg-violet-500/5' : 'bg-violet-50/50'
                                  : ''
                              } ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                            >
                              <div className={`mt-0.5 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {getNotificationIcon(notif.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {notif.title}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0" />
                                  )}
                                </div>
                                <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {notif.description}
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  {formatRelativeTime(notif.time)}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl ${
                  isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                } transition-colors`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className={`hidden sm:block w-px h-8 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl ${
                  isDark ? 'hover:bg-red-500/10 text-red-400' : 'hover:bg-red-50 text-red-600'
                } transition-colors`}
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Cmd+K Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#1a1a2e]/95 border border-white/10 backdrop-blur-xl' : 'bg-white/95 border border-gray-200 backdrop-blur-xl'
              }`}
            >
              {/* Search Input */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-white/5' : 'border-gray-100'}`}>
                <Search size={20} className={isDark ? 'text-violet-400' : 'text-violet-500'} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Rechercher clients, flashs, réservations..."
                  className={`flex-1 bg-transparent outline-none text-base ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
                {searchLoading && <Loader2 size={18} className="text-violet-400 animate-spin" />}
                <kbd
                  onClick={() => setSearchOpen(false)}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    isDark ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } transition-colors`}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {!searchQuery.trim() ? (
                  <div className="py-12 text-center">
                    <Sparkles size={24} className={`mx-auto mb-3 ${isDark ? 'text-violet-400/50' : 'text-violet-300'}`} />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Tapez pour rechercher...
                    </p>
                    <div className={`flex items-center justify-center gap-4 mt-4 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      <span>↑↓ Naviguer</span>
                      <span>↵ Sélectionner</span>
                      <span>ESC Fermer</span>
                    </div>
                  </div>
                ) : searchResults.length === 0 && !searchLoading ? (
                  <div className="py-12 text-center">
                    <Search size={24} className="mx-auto mb-2 text-gray-500 opacity-50" />
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Aucun résultat pour « {searchQuery} »
                    </p>
                  </div>
                ) : (
                  (() => {
                    const categories = ['clients', 'flashs', 'reservations', 'settings'] as const;
                    let globalIndex = 0;
                    return categories.map((cat) => {
                      const items = searchResults.filter((r) => r.category === cat);
                      if (items.length === 0) return null;
                      return (
                        <div key={cat}>
                          <div className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider ${
                            isDark ? 'text-gray-500 bg-white/[0.02]' : 'text-gray-400 bg-gray-50/50'
                          }`}>
                            {getCategoryLabel(cat)}
                          </div>
                          {items.map((result) => {
                            const idx = globalIndex++;
                            const isSelected = idx === selectedResultIndex;
                            return (
                              <button
                                key={result.id}
                                onClick={() => handleSearchSelect(result)}
                                onMouseEnter={() => setSelectedResultIndex(idx)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                                  isSelected
                                    ? isDark ? 'bg-violet-500/10' : 'bg-violet-50'
                                    : isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div className={`p-2 rounded-lg ${
                                  isSelected
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {getCategoryIcon(result.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {result.title}
                                  </p>
                                  {result.subtitle && (
                                    <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {result.subtitle}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>↵</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
