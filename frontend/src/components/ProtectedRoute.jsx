import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Shell from './Shell';

export function ProtectedRoute({ children, requireAssessment = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-xl font-extrabold text-[#06304f]/80">
        Loading…
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/mentor');
  const isAdminUser = user?.role === 'mentor' || user?.role === 'admin';

  if (!user) {
    return (
      <Navigate
        to={isAdminPath ? '/mentor-login' : '/login'}
        replace
        state={{ from: location }}
      />
    );
  }

  if (isAdminPath && !isAdminUser) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    requireAssessment &&
    !isAdminUser &&
    user.assessment_score == null &&
    location.pathname !== '/assessment'
  ) {
    return <Navigate to="/assessment" replace />;
  }

  if (isAdminPath) {
    return children || <Outlet />;
  }

  return children || (
    <Shell>
      <Outlet />
    </Shell>
  );
}
