// import DashboardBookings from '../../../components/dashboard/DashboardBookings';
export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#050505] p-8">
      <h1 className="mb-8 text-3xl font-bold text-white">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Statistiques */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Revenus */}
            <div className="rounded-lg border border-[#262626] bg-[#121212] p-6 transition-colors hover:bg-[#1a1a1a]">
              <h3 className="text-sm font-medium text-neutral-400">Revenus du mois</h3>
              <p className="mt-2 text-3xl font-bold text-white">0,00 €</p>
              <p className="mt-1 text-xs text-neutral-500">Aucune transaction</p>
            </div>

            {/* Réservations */}
            <div className="rounded-lg border border-[#262626] bg-[#121212] p-6 transition-colors hover:bg-[#1a1a1a]">
              <h3 className="text-sm font-medium text-neutral-400">Réservations</h3>
              <p className="mt-2 text-3xl font-bold text-white">0</p>
              <p className="mt-1 text-xs text-neutral-500">Ce mois-ci</p>
            </div>

            {/* Clients */}
            <div className="rounded-lg border border-[#262626] bg-[#121212] p-6 transition-colors hover:bg-[#1a1a1a]">
              <h3 className="text-sm font-medium text-neutral-400">Clients actifs</h3>
              <p className="mt-2 text-3xl font-bold text-white">0</p>
              <p className="mt-1 text-xs text-neutral-500">Total</p>
            </div>
          </div>
        </div>
        
        {/* Agenda */}
        <div className="lg:col-span-1">
          <DashboardBookings />
        </div>
      </div>
    </div>
  );
}