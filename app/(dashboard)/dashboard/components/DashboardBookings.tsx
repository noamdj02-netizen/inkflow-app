export default function DashboardBookings() {
    return (
      <div className="rounded-lg border border-[#262626] bg-[#121212] p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Agenda</h2>
        
        <div className="space-y-3">
          {/* Exemple de réservation */}
          <div className="rounded-md border border-[#1a1a1a] bg-[#0a0a0a] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Aucune réservation</p>
                <p className="text-sm text-neutral-400">
                  Les prochaines réservations apparaîtront ici
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }