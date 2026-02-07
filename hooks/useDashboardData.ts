/**
 * Dashboard data hook - same API as before, now powered by SWR.
 * Use this in DashboardLayout; widgets use useDashboardSWR hooks directly.
 */

import { useDashboardDataSWR } from './useDashboardSWR';

export const useDashboardData = () => {
  const swr = useDashboardDataSWR();
  return {
    loading: swr.loading,
    stats: swr.stats,
    recentBookings: swr.recentBookings,
    pendingProjects: swr.pendingProjects,
    refresh: swr.refresh,
  };
};
