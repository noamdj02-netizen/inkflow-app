import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Skeleton de chargement réutilisable (mémorisé pour éviter les re-renders)
const LoadingSkeleton = React.memo(() => (
  <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
    {/* Animated Background */}
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
    <div className="text-center relative z-10">
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

