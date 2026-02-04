/**
 * Hook pour récupérer et gérer l'abonnement de l'utilisateur
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';
import { SubscriptionPlan, SubscriptionStatus } from '../types/prisma-enums';

export interface UserSubscription {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('stripe_customer_id, stripe_subscription_id, subscription_plan, subscription_status, subscription_current_period_end, trial_ends_at')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setSubscription({
            plan: null,
            status: null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionCurrentPeriodEnd: null,
            trialEndsAt: null,
          });
          return;
        }
        throw fetchError;
      }

      setSubscription({
        plan: data.subscription_plan as SubscriptionPlan | null,
        status: data.subscription_status as SubscriptionStatus | null,
        stripeCustomerId: data.stripe_customer_id || null,
        stripeSubscriptionId: data.stripe_subscription_id || null,
        subscriptionCurrentPeriodEnd: data.subscription_current_period_end
          ? new Date(data.subscription_current_period_end)
          : null,
        trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
      });
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message || 'Erreur lors du chargement de l\'abonnement');
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    fetchSubscription();
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
  }, [user, fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
};
