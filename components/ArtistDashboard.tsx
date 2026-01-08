import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Calendar, DollarSign, Users, MessageSquare, 
  PieChart, LayoutGrid, Settings, 
  MoreVertical, CheckCircle, 
  Megaphone, Clock, 
  AlertTriangle, ArrowUpRight, Instagram, Plus,
  Save, Palette, CreditCard, Smartphone, Shield, Mail, LogOut, Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useArtistProfile } from '../contexts/ArtistProfileContext';
import { FlashManagement } from './FlashManagement';
import { useDashboardData } from '../hooks/useDashboardData';

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

// --- SUB-COMPONENT: SETTINGS VIEW ---
const SettingsView = () => {
    const [deposit, setDeposit] = useState(30);
    const [accentColor, setAccentColor] = useState('gold');
    const [toggles, setToggles] = useState({
        nonRefundable: true,
        acceptFlash: true,
        acceptCustom: true,
        aftercare: true,
        smsReminder: true
    });

    const toggle = (key: keyof typeof toggles) => {
        setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const ColorDot = ({ color, hex, selected }: { color: string, hex: string, selected: boolean }) => (
        <button 
            onClick={() => setAccentColor(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${selected ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
            style={{ backgroundColor: hex }}
        />
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-1">Configuration du Studio</h2>
                    <p className="text-slate-400">Gérez votre marque, vos règles financières et vos automatisations.</p>
                </div>
                <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-amber-400 transition-colors shadow-lg">
                    <Save size={18} /> Enregistrer
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CARD A: Identité & Branding */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                            <Palette size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Identité & Branding</h3>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                        <div className="w-20 h-20 rounded-full bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center cursor-pointer hover:border-amber-400 hover:text-amber-400 transition-all text-slate-400">
                            <span className="text-xs font-bold">Logo</span>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du Studio</label>
                            <input type="text" defaultValue="Zonett Ink" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-400 font-bold" />
                        </div>
                    </div>

                    <div className="mb-6">
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Couleur d'accentuation (Page Booking)</label>
                         <div className="flex gap-4">
                            <ColorDot color="gold" hex="#fbbf24" selected={accentColor === 'gold'} />
                            <ColorDot color="red" hex="#ef4444" selected={accentColor === 'red'} />
                            <ColorDot color="blue" hex="#3b82f6" selected={accentColor === 'blue'} />
                            <ColorDot color="green" hex="#22c55e" selected={accentColor === 'green'} />
                            <ColorDot color="purple" hex="#a855f7" selected={accentColor === 'purple'} />
                         </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bio Instagram (Courte)</label>
                        <textarea rows={2} defaultValue="Tatoueur Lyon • Fineline & Blackwork • Agenda Ouvert 👇" className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:border-amber-400 text-sm" />
                    </div>
                </div>

                {/* CARD B: Règles Financières */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400">
                            <CreditCard size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Règles Financières</h3>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-end mb-4">
                            <label className="text-sm font-bold text-slate-300">Politique d'Acompte</label>
                            <span className="text-2xl font-black text-amber-400">{deposit}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="10"
                            value={deposit}
                            onChange={(e) => setDeposit(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <div className="flex justify-between text-xs text-slate-500 mt-2 font-mono">
                            <span>0% (Risqué)</span>
                            <span>30% (Standard)</span>
                            <span>50% (Sécure)</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-slate-700 rounded text-slate-400"><Shield size={16}/></div>
                            <span className="text-sm font-medium text-white">Acompte non-remboursable</span>
                        </div>
                         <button 
                            onClick={() => toggle('nonRefundable')}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${toggles.nonRefundable ? 'bg-green-500' : 'bg-slate-600'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${toggles.nonRefundable ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                     <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="font-bold text-white text-lg tracking-tight">stripe</div>
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-bold rounded border border-green-500/20">Connecté</span>
                        </div>
                        <CheckCircle className="text-green-500" size={20} />
                    </div>
                </div>

                {/* CARD C: Préférences Booking */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                            <LayoutGrid size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Filtres & Disponibilités</h3>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                             <span className="text-sm font-medium text-white">Accepter les Flashs</span>
                             <button onClick={() => toggle('acceptFlash')} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${toggles.acceptFlash ? 'bg-amber-400' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${toggles.acceptFlash ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700">
                             <span className="text-sm font-medium text-white">Accepter les Projets Perso</span>
                             <button onClick={() => toggle('acceptCustom')} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${toggles.acceptCustom ? 'bg-amber-400' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${toggles.acceptCustom ? 'translate-x-5' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prix Min. / Séance</label>
                             <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input type="number" defaultValue={150} className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-4 py-2 text-white font-mono focus:border-amber-400 focus:outline-none" />
                             </div>
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taille Min. (cm)</label>
                             <div className="relative">
                                <input type="number" defaultValue={5} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:border-amber-400 focus:outline-none" />
                             </div>
                        </div>
                    </div>
                </div>

                {/* CARD D: Automatisation */}
                <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
                     <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                            <Megaphone size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Réponses Auto</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                <Mail className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <div className="text-sm font-bold text-white">Instructions soins post-séance</div>
                                    <div className="text-xs text-slate-500 max-w-[200px]">Envoyer le PDF de soins automatiquement après le RDV.</div>
                                </div>
                            </div>
                             <button onClick={() => toggle('aftercare')} className={`w-12 h-6 rounded-full p-1 transition-colors ${toggles.aftercare ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${toggles.aftercare ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                         <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                                <Smartphone className="text-slate-400 mt-1" size={18} />
                                <div>
                                    <div className="text-sm font-bold text-white">Rappel SMS (24h avant)</div>
                                    <div className="text-xs text-slate-500 max-w-[200px]">Réduit les No-Shows de 80%.</div>
                                </div>
                            </div>
                             <button onClick={() => toggle('smsReminder')} className={`w-12 h-6 rounded-full p-1 transition-colors ${toggles.smsReminder ? 'bg-green-500' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${toggles.smsReminder ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export const ArtistDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { signOut, user } = useAuth();
  const { profile } = useArtistProfile();
  const navigate = useNavigate();
  const { loading: dataLoading, stats, recentBookings, pendingProjects } = useDashboardData();
  
  const handlePostStory = () => {
    alert("🚀 Boom ! Story Instagram publiée : 'Créneau de 3h dispo ce Jeudi aprem (-20%) ! DM pour réserver'.\n\nLe lien de réservation a été ajouté automatiquement.");
  };

  const handleResendWaiver = () => {
      alert("📧 Rappel de décharge envoyé par SMS et Email aux 2 clients.");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarItem = ({ id, icon: Icon, label, count, active, onClick }: { id: string, icon: any, label: string, count?: number, active?: boolean, onClick?: () => void }) => {
    const handleClick = () => {
      if (onClick) {
        onClick();
      } else {
        setActiveTab(id);
      }
    };

    return (
      <button 
        onClick={handleClick}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
          active || activeTab === id 
          ? 'bg-amber-400 text-black font-bold shadow-[0_0_15px_rgba(251,191,36,0.2)]' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{label}</span>
        </div>
        {count && (
          <span className={`${active || activeTab === id ? 'bg-black text-amber-400' : 'bg-slate-800 text-slate-300'} text-xs font-bold px-2 py-0.5 rounded-full`}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans overflow-hidden">
      
      {/* COLUMN 1: Left Navigation Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col flex-shrink-0 z-20">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter text-white">INK<span className="text-amber-400">FLOW</span></span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            <SidebarItem id="dashboard" icon={LayoutGrid} label="Dashboard" />
            <SidebarItem id="calendar" icon={Calendar} label="Calendrier" />
            <SidebarItem id="requests" icon={MessageSquare} label="Demandes" count={2} />
            <SidebarItem id="flashs" icon={Clock} label="Mes Flashs" />
            <SidebarItem id="crm" icon={Users} label="Clients & Docs" />
            <SidebarItem id="finance" icon={PieChart} label="Finance" />
        </div>

        <div className="p-4 border-t border-slate-800">
            <SidebarItem 
              id="settings" 
              icon={Settings} 
              label="Paramètres" 
              onClick={() => navigate('/settings')}
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
      <main className="flex-1 flex overflow-hidden relative">
        
        {/* Render Settings View if Active, otherwise render Dashboard/Calendar */}
        {activeTab === 'settings' ? (
             <div className="flex-1 overflow-y-auto bg-slate-900/30">
                 <SettingsView />
             </div>
        ) : activeTab === 'flashs' ? (
             <div className="flex-1 overflow-y-auto bg-slate-900/30 p-6">
                 <FlashManagement />
             </div>
        ) : (
            <>
                {/* COLUMN 2: Central Main View (The Smart Calendar) */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-900/30">
                    {/* Header */}
                    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <Calendar className="text-amber-400" size={20}/> 
                                Agenda <span className="text-slate-500 font-normal">| Janvier 2026</span>
                            </h2>
                            <div className="flex bg-slate-800 rounded-lg p-1">
                                <button className="px-3 py-1 bg-slate-700 text-white text-xs font-bold rounded shadow-sm">Semaine</button>
                                <button className="px-3 py-1 text-slate-400 text-xs font-medium hover:text-white">Mois</button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-300 shadow-lg shadow-amber-400/20">
                                <Plus size={16}/> Nouveau RDV
                            </button>
                        </div>
                    </header>

                    {/* Calendar Grid */}
                    <div className="flex-1 overflow-y-auto p-6 relative">
                        <div className="bg-slate-800/20 rounded-2xl border border-slate-800 min-w-[800px]">
                            {/* Calendar Header Row */}
                            <div className="grid grid-cols-8 border-b border-slate-800 sticky top-0 bg-[#0f172a] z-10">
                                <div className="p-4 border-r border-slate-800 text-center text-xs font-bold text-slate-500">
                                    GMT+1
                                </div>
                                {WEEK_DAYS.map((d, i) => (
                                    <div key={i} className={`p-4 text-center border-r border-slate-800 ${i === 6 ? 'border-r-0' : ''}`}>
                                        <div className="text-xs text-slate-500 uppercase mb-1">{d.day}</div>
                                        <div className={`text-lg font-bold ${i === 3 ? 'text-amber-400 w-8 h-8 rounded-full bg-amber-400/10 flex items-center justify-center mx-auto' : 'text-white'}`}>{d.date}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Body */}
                            <div className="relative">
                                {/* Grid Lines */}
                                {HOURS.map((hour) => (
                                    <div key={hour} className="grid grid-cols-8 border-b border-slate-800 h-24">
                                        <div className="border-r border-slate-800 p-2 text-right">
                                            <span className="text-xs text-slate-600 font-mono -translate-y-1/2 block">{hour}:00</span>
                                        </div>
                                        {[...Array(7)].map((_, i) => (
                                            <div key={i} className={`border-r border-slate-800 ${i === 6 ? 'border-r-0' : ''} relative group hover:bg-white/[0.02] transition-colors`}>
                                                {/* Hover Add Button */}
                                                <button className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Plus className="text-slate-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {/* EVENT 1: Flash Tattoo (Tuesday 14h) */}
                                <div 
                                    className="absolute bg-amber-400 rounded-lg p-2 border border-amber-300 shadow-lg shadow-amber-400/10 cursor-pointer hover:scale-[1.02] transition-transform z-10 flex flex-col justify-between"
                                    style={{ top: 'calc(4 * 6rem + 2px)', left: 'calc(200% / 8 + 2px)', width: 'calc(100% / 8 - 5px)', height: 'calc(2rem * 2.5)' }} // Starts at 14h (index 4), Tuesday (col 2)
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-black text-black">⚡️ FLASH</span>
                                            <CheckCircle size={12} className="text-black/50" />
                                        </div>
                                        <div className="text-xs font-bold text-black leading-tight mt-1">Dague • Sarah L.</div>
                                    </div>
                                    <div className="text-[10px] font-mono text-black/70">14:00 - 16:30</div>
                                </div>

                                {/* EVENT 2: Custom Project (Wednesday 10h) */}
                                <div 
                                    className="absolute bg-slate-700 rounded-lg p-2 border border-slate-600 border-l-4 border-l-blue-400 shadow-lg cursor-pointer hover:bg-slate-600 transition-colors z-10 flex flex-col justify-between"
                                    style={{ top: '2px', left: 'calc(300% / 8 + 2px)', width: 'calc(100% / 8 - 5px)', height: 'calc(6rem * 4)' }} // Starts at 10h (index 0), Wednesday (col 3), 4h long
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold text-blue-300">🐉 PROJET PERSO</span>
                                            <div className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-green-400 border border-green-400/20">Acompte OK</div>
                                        </div>
                                        <div className="text-xs font-bold text-white leading-tight mt-2">Bras Complet • Marc D.</div>
                                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">Dragon style japonais avec fleurs de cerisier...</div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                        <Clock size={10} /> 10:00 - 14:00
                                    </div>
                                </div>

                                {/* THE GAP FILLER (Thursday 15h) */}
                                <div 
                                    className="absolute z-10"
                                    style={{ top: 'calc(5 * 6rem + 2px)', left: 'calc(400% / 8 + 2px)', width: 'calc(100% / 8 - 5px)', height: 'calc(6rem * 3)' }} // Starts at 15h (index 5), Thursday (col 4), 3h long
                                >
                                    <div className="w-full h-full border-2 border-dashed border-amber-500/30 bg-amber-500/5 rounded-xl flex flex-col items-center justify-center text-center p-2 gap-2 group hover:bg-amber-500/10 hover:border-amber-500/60 transition-all cursor-pointer relative overflow-hidden" onClick={handlePostStory}>
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/0 to-amber-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Instagram size={16} className="text-amber-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-amber-400 mb-0.5">CRÉNEAU LIBRE</div>
                                            <div className="text-[10px] text-slate-400 group-hover:text-amber-200">15:00 - 18:00</div>
                                        </div>
                                        <button className="bg-amber-400 text-black text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-1">
                                            Poster Story <ArrowUpRight size={10}/>
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: Right Sidebar (Actionable Widgets) */}
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
                                    onClick={handleResendWaiver}
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
            </>
        )}
      </main>
    </div>
  );
};