/**
 * Hook pour récupérer et gérer l'abonnement de l'utilisateur
 */

import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { SubscriptionPlan, SubscriptionStatus } from '../types/prisma-enums';

export interface UserSubscription {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les données d'abonnement depuis Supabase
        // Note: La table 'users' doit avoir les colonnes subscription_plan, subscription_status, etc.
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('stripe_customer_id, stripe_subscription_id, subscription_plan, subscription_status, subscription_current_period_end')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          // Si l'utilisateur n'existe pas dans la table users (ancien système)
          if (fetchError.code === 'PGRST116') {
            setSubscription({
              plan: null,
              status: null,
              stripeCustomerId: null,
              stripeSubscriptionId: null,
              subscriptionCurrentPeriodEnd: null,
            });
            return;
          }
          throw fetchError;
        }

        // Mapper les données Supabase vers notre format
        setSubscription({
          plan: data.subscription_plan as SubscriptionPlan | null,
          status: data.subscription_status as SubscriptionStatus | null,
          stripeCustomerId: data.stripe_customer_id || null,
          stripeSubscriptionId: data.stripe_subscription_id || null,
          subscriptionCurrentPeriodEnd: data.subscription_current_period_end 
            ? new Date(data.subscription_current_period_end) 
            : null,
        });
      } catch (err: any) {
        console.error('Error fetching subscription:', err);
        setError(err.message || 'Erreur lors du chargement de l\'abonnement');
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();

    // Écouter les changements en temps réel
    const subscriptionChannel = supabase
      .channel('user-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      subscriptionChannel.unsubscribe();
    };
  }, [user]);

  return { subscription, loading, error };
};
