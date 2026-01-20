import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Skeleton de chargement réutilisable (mémorisé pour éviter les re-renders)
const LoadingSkeleton = React.memo(() => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="animate-spin text-amber-400 mx-auto mb-4" size={48} />
      <p className="text-slate-400">Vérification de l'authentification...</p>
    </div>
  </div>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mémoriser le rendu pour éviter les re-renders inutiles
  const content = useMemo(() => {
    if (loading) {
      return <LoadingSkeleton />;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  }, [loading, user, children]);

  return content;
};

