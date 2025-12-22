import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin_master' | 'admin' | 'recrutador';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nt-light/10 to-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-nt-light" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role if required
  if (requiredRole) {
    if (requiredRole === 'admin_master' && role !== 'admin_master') {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole === 'admin' && role !== 'admin' && role !== 'admin_master') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
