import React, { useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Calendar, DollarSign, Users, MessageSquare, 
  FileSignature, PieChart, LayoutGrid, Settings, 
  Search, Bell, MoreVertical, CheckCircle, XCircle, 
  Megaphone, Clock, MapPin, ChevronRight, FileText,
  AlertTriangle, ArrowUpRight, Instagram, Plus,
  Save, Palette, CreditCard, Smartphone, Shield, Mail, LogOut, Loader2,
  Menu, X, Share2, Sparkles
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useArtistProfile } from '../../contexts/ArtistProfileContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { PWAInstallPrompt, PWAInstallButton } from '../PWAInstallPrompt';

// Mock Data for Revenue Sparkline
const REVENUE_DATA = [
  { name: 'Lun', value: 1200 },
  { name: 'Mar', value: 2100 },
  { name: 'Mer', value: 1800 },
  { name: 'Jeu', value: 2400 },
  { name: 'Ven', value: 3200 },
  { name: 'Sam', value: 4250 },
  { name: 'Dim', value: 4250 },
];

export const DashboardLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const { loading: dataLoading, stats, recentBookings, pendingProjects } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Sidebar Item with elegant styling
  const SidebarItem = ({ to, icon: Icon, label, count }: { to: string, icon: any, label: string, count?: number }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive
          ? 'bg-white/10 text-white border-l-2 border-white font-semibold' 
          : 'text-zinc-500 hover:text-white hover:bg-white/5'
        }`
      }
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
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-16 glass z-50 md:hidden flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-display font-bold tracking-tight text-white">
            INK<span className="text-zinc-500">FLOW</span>
          </span>
        </div>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white">
          {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/5 z-50 md:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="text-xl font-display font-bold tracking-tight text-white">
                  INK<span className="text-zinc-500">FLOW</span>
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    if (!profile?.slug_profil || typeof window === 'undefined') return;
                    const url = `${window.location.origin}/p/${profile.slug_profil}`;
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
                  className="w-full flex items-center gap-3 px-4 py-3 glass rounded-xl text-zinc-300 font-medium hover:bg-white/10 transition-colors"
                >
                  <Share2 size={18} />
                  <span>Partager mon lien</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate('/dashboard/flashs');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white text-black rounded-xl font-semibold hover:bg-zinc-100 transition-colors"
                >
                  <Plus size={18} />
                  <span>Nouveau Flash</span>
                </motion.button>
                <div className="pt-4 border-t border-white/5 space-y-1">
                  <SidebarItem to="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
                  <SidebarItem to="/dashboard/calendar" icon={Calendar} label="Calendrier" />
                  <SidebarItem to="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
                  <SidebarItem to="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
                  <SidebarItem to="/dashboard/clients" icon={Users} label="Clients & Docs" />
                  <SidebarItem to="/dashboard/finance" icon={PieChart} label="Finance" />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <SidebarItem to="/dashboard/settings" icon={Settings} label="Paramètres" />
                  <PWAInstallButton onClose={() => setIsMobileMenuOpen(false)} />
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 glass p-3 rounded-xl">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                    {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="text-sm overflow-hidden flex-1">
                    <div className="font-semibold truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                    <div className="text-xs text-emerald-400 flex items-center gap-1">● En ligne</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* COLUMN 1: Left Navigation Sidebar */}
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 hidden md:flex flex-col flex-shrink-0 z-20">
        <div className="p-6 border-b border-white/5">
          <span className="text-xl font-display font-bold tracking-tight text-white">
            INK<span className="text-zinc-500">FLOW</span>
          </span>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem to="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
          <SidebarItem to="/dashboard/calendar" icon={Calendar} label="Calendrier" />
          <SidebarItem to="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
          <SidebarItem to="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
          <SidebarItem to="/dashboard/clients" icon={Users} label="Clients & Docs" />
          <SidebarItem to="/dashboard/finance" icon={PieChart} label="Finance" />
        </div>

        <div className="p-4 border-t border-white/5">
          <SidebarItem to="/dashboard/settings" icon={Settings} label="Paramètres" />
          <div className="mt-4 space-y-3">
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
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* CENTER & RIGHT CONTENT WRAPPER */}
      <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0 pt-16 md:pt-0">
        
        {/* COLUMN 2: Central Main View (Dynamic Content via Outlet) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505]">
          <Outlet />
        </div>

        {/* COLUMN 3: Right Sidebar (Actionable Widgets) */}
        <aside className="w-80 bg-[#0a0a0a] border-l border-white/5 flex flex-col overflow-y-auto flex-shrink-0 hidden xl:flex">
          {/* Widget 1: Financial Performance */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Performance</h3>
              <button className="text-zinc-600 hover:text-white transition-colors"><MoreVertical size={16}/></button>
            </div>
            <div className="glass rounded-2xl p-5 relative overflow-hidden">
              <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                  <div className="text-3xl font-display font-bold text-white">
                    {dataLoading ? '...' : `${stats.totalRevenue.toFixed(0)}€`}
                  </div>
                  <div className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                    <ArrowUpRight size={12}/> Revenus totaux
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <DollarSign size={20} className="text-zinc-400"/>
                </div>
              </div>
              <div className="h-16 -mx-5 -mb-5 opacity-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={REVENUE_DATA}>
                    <defs>
                      <linearGradient id="colorRevenueSmall" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={1.5} fill="url(#colorRevenueSmall)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-xs text-zinc-500">
                  {stats.upcomingBookings} RDV à venir • {stats.totalFlashs} Flashs
                </span>
              </div>
            </div>
          </div>

          {/* Widget 2: Urgent Tasks */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                À Faire 
                {pendingProjects.length > 0 && (
                  <span className="bg-white text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pendingProjects.length}
                  </span>
                )}
              </h3>
            </div>
            <div className="space-y-3">
              {dataLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="animate-spin text-zinc-500 mx-auto" size={20} />
                </div>
              ) : pendingProjects.length === 0 ? (
                <div className="text-center py-4 text-zinc-600 text-sm">
                  Aucun projet en attente
                </div>
              ) : (
                pendingProjects.slice(0, 3).map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-start gap-3 p-3 rounded-xl glass hover:bg-white/10 transition-colors group cursor-pointer"
                  >
                    <div className="mt-0.5 w-4 h-4 rounded border border-zinc-600 flex items-center justify-center group-hover:border-white transition-colors"></div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {project.body_part} • {project.style}
                      </div>
                      <div className="text-xs text-zinc-600">
                        {project.client_email} • {new Date(project.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
                    
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-400">2 Décharges Manquantes</div>
                    <div className="text-xs text-amber-400/70">Pour les RDV de demain</div>
                  </div>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => alert('Fonctionnalité bientôt disponible')}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg transition-colors"
                >
                  Renvoyer Rappel SMS
                </motion.button>
              </div>
            </div>
          </div>

          {/* Widget 3: Activity Feed */}
          <div className="p-6 flex-1">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Activité Récente</h3>
            <div className="space-y-6 relative">
              <div className="absolute top-2 left-2 bottom-0 w-px bg-white/5"></div>
              
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="relative pl-6"
              >
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-emerald-400"></div>
                <div className="text-xs text-zinc-600 mb-0.5">À l'instant</div>
                <div className="text-sm text-zinc-400"><span className="font-semibold text-white">Julie M.</span> a réservé le Flash <span className="text-white">#42</span>.</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative pl-6"
              >
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-white"></div>
                <div className="text-xs text-zinc-600 mb-0.5">Il y a 15 min</div>
                <div className="text-sm text-zinc-400">Virement Stripe de <span className="font-semibold text-white">350€</span> reçu.</div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="relative pl-6"
              >
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-[#0a0a0a] border-2 border-zinc-700"></div>
                <div className="text-xs text-zinc-600 mb-0.5">Il y a 2h</div>
                <div className="text-sm text-zinc-400">Nouvelle demande de projet perso reçue.</div>
              </motion.div>
            </div>
          </div>
        </aside>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 glass z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {[
            { to: '/dashboard/overview', icon: LayoutGrid, label: 'Accueil' },
            { to: '/dashboard/calendar', icon: Calendar, label: 'Agenda' },
            { to: '/dashboard/requests', icon: MessageSquare, label: 'Demandes', badge: pendingProjects.length },
            { to: '/dashboard/flashs', icon: Clock, label: 'Flashs' },
            { to: '/dashboard/settings', icon: Settings, label: 'Profil' },
          ].map((item) => (
            <motion.div key={item.to} whileTap={{ scale: 0.9 }}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 h-full transition-colors relative ${
                    isActive ? 'text-white' : 'text-zinc-600'
                  }`
                }
              >
                <item.icon size={20} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute top-2 right-1/2 translate-x-3 w-2 h-2 bg-white rounded-full"></span>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </nav>
    </div>
  );
};
