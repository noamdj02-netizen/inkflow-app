/**
 * Composant de protection des routes basé sur l'abonnement
 * 
 * Redirige vers /subscribe si l'utilisateur n'a pas d'abonnement actif.
 * Si période d'essai dépassée (new Date() > trialEndsAt), met à jour le statut en 'expired' puis redirige.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { hasActiveSubscription } from '../lib/permissions';
import { SubscriptionStatus } from '../types/prisma-enums';
import { Loader2 } from 'lucide-react';

interface SubscriptionProtectedRouteProps {
  children: React.ReactNode;
}

// Skeleton de chargement réutilisable
const LoadingSkeleton = React.memo(() => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
    {/* Animated Background */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
    <div className="text-center relative z-10">
      <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
      <p className="text-slate-400">Vérification de l'abonnement...</p>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

export const SubscriptionProtectedRoute: React.FC<SubscriptionProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [pendingExpire, setPendingExpire] = useState(false);

  // Si période d'essai dépassée : mettre à jour le statut en 'expired' puis rediriger
  useEffect(() => {
    if (authLoading || subscriptionLoading || !user || !subscription) return;
    if (subscription.status !== SubscriptionStatus.trialing || !subscription.trialEndsAt) return;

    const now = new Date();
    const trialEndsAt = subscription.trialEndsAt instanceof Date ? subscription.trialEndsAt : new Date(subscription.trialEndsAt);
    if (now <= trialEndsAt) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/expire-trial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (cancelled) return;
        if (res.ok) setPendingExpire(true);
      } catch (e) {
        if (!cancelled) setPendingExpire(true);
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, subscriptionLoading, user, subscription]);

  const content = useMemo(() => {
    if (authLoading) return <LoadingSkeleton />;
    if (!user) return <Navigate to="/login" replace />;
    if (subscriptionLoading) return <LoadingSkeleton />;

    if (pendingExpire || subscription?.status === SubscriptionStatus.expired) {
      return <Navigate to="/subscribe" replace />;
    }

    if (!subscription || !hasActiveSubscription(subscription)) {
      return <Navigate to="/subscribe" replace />;
    }

    return <>{children}</>;
  }, [authLoading, subscriptionLoading, user, subscription, pendingExpire, children]);

  return content;
};
