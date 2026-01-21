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

      // Récupérer les statistiques (optimisé: sélectionner uniquement les champs nécessaires)
      const [bookingsData, projectsData, flashsData, revenueData] = await Promise.all([
        // Bookings à venir (seulement les champs utilisés dans le composant)
        supabase
          .from('bookings')
          .select('id,client_name,date_debut,date_fin,prix_total,statut_booking,statut_paiement,flash_id,project_id')
          .eq('artist_id', user.id)
          .gte('date_debut', new Date().toISOString())
          .order('date_debut', { ascending: true })
          .limit(10),

        // Projets en attente (seulement les champs essentiels)
        supabase
          .from('projects')
          .select('id,client_name,body_part,style,description,statut,created_at,budget_max')
          .eq('artist_id', user.id)
          .in('statut', ['inquiry', 'pending'])
          .order('created_at', { ascending: false }),

        // Total flashs (count only, pas besoin de données)
        supabase
          .from('flashs')
          .select('id', { count: 'exact', head: true })
          .eq('artist_id', user.id),

        // Revenus (seulement amount)
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

