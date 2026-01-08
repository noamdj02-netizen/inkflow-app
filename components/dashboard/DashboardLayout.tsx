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
  Menu, X, Share2
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

const WEEK_DAYS = [
    { day: 'Lun', date: '24' },
    { day: 'Mar', date: '25' },
    { day: 'Mer', date: '26' },
    { day: 'Jeu', date: '27' },
    { day: 'Ven', date: '28' },
    { day: 'Sam', date: '29' },
    { day: 'Dim', date: '30' },
];

const HOURS = Array.from({ length: 11 }, (_, i) => 10 + i); // 10h to 20h

export const DashboardLayout: React.FC = () => {
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const { loading: dataLoading, stats, recentBookings, pendingProjects } = useDashboardData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePostStory = () => {
    alert("🚀 Boom ! Story Instagram publiée : 'Créneau de 3h dispo ce Jeudi aprem (-20%) ! DM pour réserver'.\n\nLe lien de réservation a été ajouté automatiquement.");
  };

  const handleResendWaiver = () => {
    alert('Fonctionnalité bientôt disponible');
      alert("📧 Rappel de décharge envoyé par SMS et Email aux 2 clients.");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarItem = ({ to, icon: Icon, label, count }: { to: string, icon: any, label: string, count?: number }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          isActive
          ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`
      }
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span>{label}</span>
      </div>
      {count && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          count > 0 ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300'
        }`}>
          {count}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans overflow-hidden">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 z-50 md:hidden flex items-center justify-between px-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-2"
        >
          <Menu className="text-white" size={24} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-base font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
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
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 z-50 md:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center transform rotate-3">
                    <LayoutGrid className="text-black" size={18} />
                  </div>
                  <span className="text-xl font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2"
                >
                  <X className="text-slate-400" size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <button
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
                  className="w-full flex items-center gap-3 px-4 py-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400 font-medium hover:bg-amber-400/20 transition-colors"
                >
                  <Share2 size={18} />
                  <span>Partager mon lien</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/dashboard/flashs');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-medium hover:bg-slate-800 transition-colors"
                >
                  <Plus size={18} />
                  <span>Nouveau Flash</span>
                </button>
                <div className="pt-4 border-t border-slate-800 space-y-1">
                  <SidebarItem to="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
                  <SidebarItem to="/dashboard/calendar" icon={Calendar} label="Calendrier" />
                  <SidebarItem to="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
                  <SidebarItem to="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
                  <SidebarItem to="/dashboard/clients" icon={Users} label="Clients & Docs" />
                  <SidebarItem to="/dashboard/finance" icon={PieChart} label="Finance" />
                </div>
                <div className="pt-4 border-t border-slate-800">
                  <SidebarItem 
                    to="/dashboard/settings" 
                    icon={Settings} 
                    label="Paramètres"
                  />
                  <PWAInstallButton onClose={() => setIsMobileMenuOpen(false)} />
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
                    {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div className="text-sm overflow-hidden flex-1">
                    <div className="font-bold truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                    <div className="text-xs text-green-400 flex items-center gap-1">● En ligne</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      {/* COLUMN 1: Left Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 z-20">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            <SidebarItem to="/dashboard/overview" icon={LayoutGrid} label="Dashboard" />
            <SidebarItem to="/dashboard/calendar" icon={Calendar} label="Calendrier" />
            <SidebarItem to="/dashboard/requests" icon={MessageSquare} label="Demandes" count={pendingProjects.length} />
            <SidebarItem to="/dashboard/flashs" icon={Clock} label="Mes Flashs" />
            <SidebarItem to="/dashboard/clients" icon={Users} label="Clients & Docs" />
            <SidebarItem to="/dashboard/finance" icon={PieChart} label="Finance" />
        </div>

        <div className="p-4 border-t border-slate-800">
            <SidebarItem 
              to="/dashboard/settings" 
              icon={Settings} 
              label="Paramètres"
            />
            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 px-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-black">
                        {profile?.nom_studio?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div className="text-sm overflow-hidden flex-1">
                        <div className="font-bold truncate">{profile?.nom_studio || user?.email || 'Artiste'}</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">● En ligne</div>
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                    <LogOut size={18} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
      </aside>

      {/* CENTER & RIGHT CONTENT WRAPPER */}
      <main className="flex-1 flex overflow-hidden relative pb-16 md:pb-0 pt-14 md:pt-0">
        
        {/* COLUMN 2: Central Main View (Dynamic Content via Outlet) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
            {/* Le contenu dynamique sera injecté ici via <Outlet /> */}
            <Outlet />
        </div>

        {/* COLUMN 3: Right Sidebar (Actionable Widgets) - Visible uniquement sur overview */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col overflow-y-auto flex-shrink-0 hidden xl:flex">
            {/* Widget 1: Financial Performance */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Performance</h3>
                    <button className="text-slate-500 hover:text-white"><MoreVertical size={16}/></button>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <div>
                            <div className="text-3xl font-black text-white">
                                {dataLoading ? '...' : `${stats.totalRevenue.toFixed(2)} €`}
                            </div>
                            <div className="text-xs text-green-400 font-bold flex items-center gap-1">
                                <ArrowUpRight size={12}/> Revenus totaux
                            </div>
                        </div>
                        <div className="p-2 bg-amber-400/10 rounded-lg text-amber-400">
                            <DollarSign size={20}/>
                        </div>
                    </div>
                    <div className="h-16 -mx-4 -mb-4 opacity-30">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={REVENUE_DATA}>
                                <defs>
                                    <linearGradient id="colorRevenueSmall" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.5}/>
                                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#fbbf24" strokeWidth={2} fill="url(#colorRevenueSmall)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-slate-400">
                            {stats.upcomingBookings} RDV à venir • {stats.totalFlashs} Flashs
                        </span>
                    </div>
                </div>
            </div>

            {/* Widget 2: Urgent Tasks */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        À Faire <span className={`${pendingProjects.length > 0 ? 'bg-red-500' : 'bg-slate-600'} text-white text-[10px] px-1.5 rounded-full`}>
                            {pendingProjects.length}
                        </span>
                    </h3>
                </div>
                <div className="space-y-3">
                    {dataLoading ? (
                        <div className="text-center py-4">
                            <Loader2 className="animate-spin text-amber-400 mx-auto" size={20} />
                        </div>
                    ) : pendingProjects.length === 0 ? (
                        <div className="text-center py-4 text-slate-500 text-sm">
                            Aucun projet en attente
                        </div>
                    ) : (
                        pendingProjects.slice(0, 3).map((project) => (
                            <div
                                key={project.id}
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-500 transition-colors group cursor-pointer"
                            >
                                <div className="mt-0.5 w-4 h-4 rounded border border-slate-500 flex items-center justify-center group-hover:border-amber-400 transition-colors"></div>
                                <div>
                                    <div className="text-sm font-bold text-slate-200">
                                        {project.body_part} • {project.style}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {project.client_email} • {new Date(project.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                            
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div className="flex items-start gap-3 mb-3">
                            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <div>
                                <div className="text-sm font-bold text-red-200">2 Décharges Manquantes</div>
                                <div className="text-xs text-red-300/70">Pour les RDV de demain</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => alert('Fonctionnalité bientôt disponible')}
                            className="w-full py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg transition-colors border border-red-500/20"
                        >
                            Renvoyer Rappel SMS
                        </button>
                    </div>
                </div>
            </div>

            {/* Widget 3: Activity Feed */}
            <div className="p-6 flex-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Activité Récente</h3>
                <div className="space-y-6 relative">
                    <div className="absolute top-2 left-2 bottom-0 w-px bg-slate-800"></div>
                    
                    <div className="relative pl-6">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-green-500"></div>
                        <div className="text-xs text-slate-500 mb-0.5">À l'instant</div>
                        <div className="text-sm text-slate-300"><span className="font-bold text-white">Julie M.</span> a réservé le Flash <span className="text-amber-400">#42</span>.</div>
                    </div>

                    <div className="relative pl-6">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-purple-500"></div>
                        <div className="text-xs text-slate-500 mb-0.5">Il y a 15 min</div>
                        <div className="text-sm text-slate-300">Virement Stripe de <span className="font-bold text-white">350€</span> reçu.</div>
                    </div>

                    <div className="relative pl-6">
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-slate-600"></div>
                        <div className="text-xs text-slate-500 mb-0.5">Il y a 2h</div>
                        <div className="text-sm text-slate-300">Nouvelle demande de projet perso reçue.</div>
                    </div>
                </div>
            </div>

        </aside>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 md:hidden">
        <div className="grid grid-cols-5 h-16">
          <NavLink
            to="/dashboard/overview"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <LayoutGrid size={20} />
            <span className="text-[10px] font-medium">Accueil</span>
          </NavLink>
          <NavLink
            to="/dashboard/calendar"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <Calendar size={20} />
            <span className="text-[10px] font-medium">Agenda</span>
          </NavLink>
          <NavLink
            to="/dashboard/requests"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors relative ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <MessageSquare size={20} />
            {pendingProjects.length > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
            <span className="text-[10px] font-medium">Demandes</span>
          </NavLink>
          <NavLink
            to="/dashboard/flashs"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <Clock size={20} />
            <span className="text-[10px] font-medium">Flashs</span>
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? 'text-amber-400' : 'text-slate-400'
              }`
            }
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

