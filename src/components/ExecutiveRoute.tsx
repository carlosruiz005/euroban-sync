import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ExecutiveRouteProps {
  children: React.ReactNode;
}

export const ExecutiveRoute = ({ children }: ExecutiveRouteProps) => {
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

  if (!hasRole('executive')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">Solo ejecutivos pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
