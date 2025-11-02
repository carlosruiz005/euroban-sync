import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface NonClientRouteProps {
  children: React.ReactNode;
}

export const NonClientRoute = ({ children }: NonClientRouteProps) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (hasRole('client')) {
    return <Navigate to="/upload" replace />;
  }

  return <>{children}</>;
};
