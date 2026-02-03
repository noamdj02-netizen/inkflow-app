/**
 * Composant de protection des routes basé sur l'abonnement
 * 
 * Redirige vers /subscribe si l'utilisateur n'a pas d'abonnement actif
 */

import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { hasActiveSubscription } from '../lib/permissions';
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

  // Mémoriser le rendu pour éviter les re-renders inutiles
  const content = useMemo(() => {
    // Attendre que l'authentification soit vérifiée
    if (authLoading) {
      return <LoadingSkeleton />;
    }

    // Si non authentifié, rediriger vers login
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Attendre que l'abonnement soit chargé
    if (subscriptionLoading) {
      return <LoadingSkeleton />;
    }

    // Vérifier si l'utilisateur a un abonnement actif
    if (!subscription || !hasActiveSubscription(subscription)) {
      return <Navigate to="/subscribe" replace />;
    }

    return <>{children}</>;
  }, [authLoading, subscriptionLoading, user, subscription, children]);

  return content;
};
