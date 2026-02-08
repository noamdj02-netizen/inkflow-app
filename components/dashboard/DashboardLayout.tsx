import React, { useState, useEffect } from 'react';
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
  Zap,
  X,
  Menu,
} from 'lucide-react';
import { useDashboardTheme } from '../../contexts/DashboardThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { PWAInstallPrompt } from '../PWAInstallPrompt';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard/overview', gradient: 'from-violet-500 to-purple-500' },
  { icon: Calendar, label: 'Calendrier', path: '/dashboard/calendar', gradient: 'from-blue-500 to-cyan-500' },
  { icon: MessageSquare, label: 'Demandes', path: '/dashboard/requests', gradient: 'from-pink-500 to-rose-500', badgeKey: 'pending' },
  { icon: Image, label: 'Flashs', path: '/dashboard/flashs', gradient: 'from-emerald-500 to-teal-500' },
  { icon: Users, label: 'Clients', path: '/dashboard/clients', gradient: 'from-orange-500 to-amber-500' },
  { icon: Wallet, label: 'Finance', path: '/dashboard/finance', gradient: 'from-green-500 to-emerald-500' },
  { icon: Settings, label: 'Paramètres', path: '/dashboard/settings', gradient: 'from-slate-500 to-gray-500' },
];

export const DashboardLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useDashboardTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const { pendingProjects } = useDashboardData();

  const isDark = theme === 'dark';

  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
          <motion.div animate={{ opacity: sidebarCollapsed ? 0 : 1 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap size={20} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>InkFlow</h1>
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

        <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Zap size={20} className="text-white" />
                    </div>
                    <div>
                      <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>InkFlow</h1>
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

              <div className={`hidden md:flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                isDark ? 'bg-white/5' : 'bg-gray-100'
              } w-80`}>
                <Search size={18} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className={`bg-transparent outline-none w-full text-sm ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
                <kbd className={`px-2 py-1 text-xs rounded ${isDark ? 'bg-white/10 text-gray-400' : 'bg-white text-gray-500'}`}>
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className={`relative p-2.5 rounded-xl ${
                isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
              } transition-colors`}>
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0f0f23]" />
              </button>

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
    </div>
  );
};
