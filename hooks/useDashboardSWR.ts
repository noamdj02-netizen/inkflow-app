/**
 * Dashboard data hooks with SWR: cache, revalidation, optimistic UX.
 * - Cache automatique, revalidation en arrière-plan
 * - Données en cache < 1s, pas d'IDs sensibles dans l'URL
 */

import useSWR, { type SWRConfiguration, mutate } from 'swr';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { Booking, Project } from '../types/supabase';

const SWR_OPTIONS: SWRConfiguration = {
  dedupingInterval: 2000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
  keepPreviousData: true,
};

export type DashboardStats = {
  totalRevenue: number;
  pendingProjects: number;
  upcomingBookings: number;
  totalFlashs: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentBookings: Booking[];
  pendingProjects: Project[];
};

async function fetchDashboardData(userId: string): Promise<DashboardData> {
  const [bookingsData, projectsData, flashsData, revenueData] = await Promise.all([
    supabase
      .from('bookings')
      .select('id,client_name,date_debut,date_fin,prix_total,statut_booking,statut_paiement,flash_id,project_id')
      .eq('artist_id', userId)
      .gte('date_debut', new Date().toISOString())
      .order('date_debut', { ascending: true })
      .limit(10),
    supabase
      .from('projects')
      .select('id,client_name,client_email,body_part,style,description,statut,created_at,budget_max')
      .eq('artist_id', userId)
      .in('statut', ['inquiry', 'pending'])
      .order('created_at', { ascending: false }),
    supabase
      .from('flashs')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', userId),
    supabase
      .from('stripe_transactions')
      .select('amount')
      .eq('artist_id', userId)
      .eq('status', 'succeeded'),
  ]);

  const totalRevenue = (revenueData.data as { amount?: number }[] | null)?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const pendingProjects = (projectsData.data?.length || 0);
  const upcomingBookings = bookingsData.data?.length || 0;
  const totalFlashs = flashsData.count || 0;

  return {
    stats: {
      totalRevenue: totalRevenue / 100,
      pendingProjects,
      upcomingBookings,
      totalFlashs,
    },
    recentBookings: (bookingsData.data || []) as Booking[],
    pendingProjects: (projectsData.data || []) as Project[],
  };
}

export function useDashboardDataSWR() {
  const { user } = useAuth();
  const key = user ? ['dashboard', 'data', user.id] : null;
  const { data, error, isLoading, mutate: revalidate } = useSWR<DashboardData>(
    key,
    () => fetchDashboardData(user!.id),
    SWR_OPTIONS
  );

  return {
    loading: isLoading,
    error,
    stats: data?.stats ?? {
      totalRevenue: 0,
      pendingProjects: 0,
      upcomingBookings: 0,
      totalFlashs: 0,
    },
    recentBookings: data?.recentBookings ?? [],
    pendingProjects: data?.pendingProjects ?? [],
    refresh: revalidate,
  };
}

// Next booking (single)
export type NextBooking = {
  id: string;
  client_name: string | null;
  date_debut: string;
  date_fin: string;
  flash_id: string | null;
  project_id: string | null;
  flashs?: { title: string } | null;
  projects?: { body_part: string; style: string } | null;
};

async function fetchNextBooking(userId: string): Promise<NextBooking | null> {
  const now = new Date();
  const { data } = await supabase
    .from('bookings')
    .select(`
      id,client_name,date_debut,date_fin,flash_id,project_id,
      flashs(title),projects(body_part,style)
    `)
    .eq('artist_id', userId)
    .eq('statut_booking', 'confirmed')
    .gte('date_debut', now.toISOString())
    .order('date_debut', { ascending: true })
    .limit(1)
    .maybeSingle();
  return data as NextBooking | null;
}

export function useNextBookingSWR() {
  const { user } = useAuth();
  const key = user ? ['dashboard', 'nextBooking', user.id] : null;
  const { data, error, isLoading, mutate } = useSWR<NextBooking | null>(
    key,
    () => fetchNextBooking(user!.id),
    SWR_OPTIONS
  );
  return { nextBooking: data ?? null, loading: isLoading, error, refresh: mutate };
}

// KPIs
export type KPIData = {
  monthlyRevenue: number;
  upcomingBookings: number;
  pendingRequests: number;
};

async function fetchKPIs(userId: string): Promise<KPIData> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [revenueData, upcomingData, pendingData] = await Promise.all([
    supabase
      .from('bookings')
      .select('prix_total')
      .eq('artist_id', userId)
      .eq('statut_booking', 'confirmed')
      .gte('date_debut', startOfMonth.toISOString()),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', userId)
      .eq('statut_booking', 'confirmed')
      .gte('date_debut', now.toISOString()),
    supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('artist_id', userId)
      .in('statut_booking', ['pending']),
  ]);
  const revenue = ((revenueData.data as { prix_total?: number }[]) || []).reduce(
    (sum, b) => sum + (b.prix_total || 0),
    0
  );
  return {
    monthlyRevenue: revenue / 100,
    upcomingBookings: upcomingData.count ?? 0,
    pendingRequests: pendingData.count ?? 0,
  };
}

export function useKPIsSWR() {
  const { user } = useAuth();
  const key = user ? ['dashboard', 'kpis', user.id] : null;
  const { data, error, isLoading, mutate } = useSWR<KPIData>(
    key,
    () => fetchKPIs(user!.id),
    SWR_OPTIONS
  );
  return {
    kpis: data ?? { monthlyRevenue: 0, upcomingBookings: 0, pendingRequests: 0 },
    loading: isLoading,
    error,
    refresh: mutate,
  };
}

// Revenue chart (6 months)
export type MonthlyRevenue = { month: string; revenue: number };

async function fetchRevenueChart(userId: string): Promise<MonthlyRevenue[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const { data } = await supabase
    .from('bookings')
    .select('prix_total,date_debut')
    .eq('artist_id', userId)
    .eq('statut_booking', 'confirmed')
    .gte('date_debut', sixMonthsAgo.toISOString());

  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyData: Record<string, number> = {};
  ((data as { prix_total?: number; date_debut: string }[]) || []).forEach((b) => {
    const date = new Date(b.date_debut);
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    monthlyData[key] = (monthlyData[key] || 0) + (b.prix_total || 0);
  });

  const result: MonthlyRevenue[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    result.push({
      month: monthNames[date.getMonth()],
      revenue: Math.round((monthlyData[key] || 0) / 100),
    });
  }
  return result;
}

export function useRevenueChartSWR() {
  const { user } = useAuth();
  const key = user ? ['dashboard', 'revenue', user.id] : null;
  const { data, error, isLoading, mutate } = useSWR<MonthlyRevenue[]>(
    key,
    () => fetchRevenueChart(user!.id),
    SWR_OPTIONS
  );
  return { monthlyRevenues: data ?? [], loading: isLoading, error, refresh: mutate };
}

// Recent activity
export type ActivityItem = {
  id: string;
  type: 'booking' | 'project' | 'flash';
  title: string;
  client?: string;
  date: string;
  status?: string;
};

async function fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
  const [bookings, projects, flashs] = await Promise.all([
    supabase
      .from('bookings')
      .select('id,client_name,created_at,statut_booking,flashs(title),projects(body_part)')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('projects')
      .select('id,client_name,created_at,statut,body_part')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .limit(2),
    supabase
      .from('flashs')
      .select('id,title,created_at')
      .eq('artist_id', userId)
      .order('created_at', { ascending: false })
      .limit(2),
  ]);

  const all: ActivityItem[] = [];
  ((bookings.data as any[]) || []).forEach((b) => {
    all.push({
      id: b.id,
      type: 'booking',
      title: b.flashs?.title ? `Réservation Flash: ${b.flashs.title}` : `Projet: ${b.projects?.body_part}`,
      client: b.client_name || 'Client',
      date: b.created_at,
      status: b.statut_booking,
    });
  });
  ((projects.data as any[]) || []).forEach((p) => {
    all.push({
      id: p.id,
      type: 'project',
      title: `Nouveau projet: ${p.body_part}`,
      client: p.client_name || 'Client',
      date: p.created_at,
      status: p.statut,
    });
  });
  ((flashs.data as any[]) || []).forEach((f) => {
    all.push({
      id: f.id,
      type: 'flash',
      title: `Flash créé: ${f.title}`,
      date: f.created_at,
    });
  });
  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return all.slice(0, 5);
}

export function useRecentActivitySWR() {
  const { user } = useAuth();
  const key = user ? ['dashboard', 'activity', user.id] : null;
  const { data, error, isLoading, mutate } = useSWR<ActivityItem[]>(
    key,
    () => fetchRecentActivity(user!.id),
    SWR_OPTIONS
  );
  return { activities: data ?? [], loading: isLoading, error, refresh: mutate };
}

/** Prefetch dashboard data when entering dashboard (call in DashboardLayout mount) */
export function prefetchDashboard(userId: string) {
  mutate(['dashboard', 'data', userId], () => fetchDashboardData(userId));
  mutate(['dashboard', 'nextBooking', userId], () => fetchNextBooking(userId));
  mutate(['dashboard', 'kpis', userId], () => fetchKPIs(userId));
  mutate(['dashboard', 'revenue', userId], () => fetchRevenueChart(userId));
  mutate(['dashboard', 'activity', userId], () => fetchRecentActivity(userId));
}
