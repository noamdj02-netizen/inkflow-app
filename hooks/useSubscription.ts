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

      const row = data as {
        subscription_plan?: string | null;
        subscription_status?: string | null;
        stripe_customer_id?: string | null;
        stripe_subscription_id?: string | null;
        subscription_current_period_end?: string | null;
        trial_ends_at?: string | null;
      };
      setSubscription({
        plan: row.subscription_plan as SubscriptionPlan | null,
        status: row.subscription_status as SubscriptionStatus | null,
        stripeCustomerId: row.stripe_customer_id || null,
        stripeSubscriptionId: row.stripe_subscription_id || null,
        subscriptionCurrentPeriodEnd: row.subscription_current_period_end
          ? new Date(row.subscription_current_period_end)
          : null,
        trialEndsAt: row.trial_ends_at ? new Date(row.trial_ends_at) : null,
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
