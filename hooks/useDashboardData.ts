import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import type { Booking, Project, Flash } from '../types/supabase';

export const useDashboardData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingProjects: 0,
    upcomingBookings: 0,
    totalFlashs: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Récupérer les statistiques
      const [bookingsData, projectsData, flashsData, revenueData] = await Promise.all([
        // Bookings à venir
        supabase
          .from('bookings')
          .select('*')
          .eq('artist_id', user.id)
          .gte('date_debut', new Date().toISOString())
          .order('date_debut', { ascending: true })
          .limit(10),

        // Projets en attente
        supabase
          .from('projects')
          .select('*')
          .eq('artist_id', user.id)
          .eq('statut', 'pending')
          .order('created_at', { ascending: false }),

        // Total flashs
        supabase
          .from('flashs')
          .select('*', { count: 'exact', head: true })
          .eq('artist_id', user.id),

        // Revenus (depuis les transactions Stripe)
        supabase
          .from('stripe_transactions')
          .select('amount')
          .eq('artist_id', user.id)
          .eq('status', 'succeeded'),
      ]);

      // Calculer les statistiques
      const totalRevenue = revenueData.data?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const pendingProjects = projectsData.data?.length || 0;
      const upcomingBookings = bookingsData.data?.length || 0;
      const totalFlashs = flashsData.count || 0;

      setStats({
        totalRevenue: totalRevenue / 100, // Convertir centimes -> euros
        pendingProjects,
        upcomingBookings,
        totalFlashs,
      });

      setRecentBookings(bookingsData.data || []);
      setPendingProjects(projectsData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    stats,
    recentBookings,
    pendingProjects,
    refresh: fetchDashboardData,
  };
};

