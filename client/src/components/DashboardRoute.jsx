import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardRoute({ children }) {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Must be logged in AND be admin or restaurant role
  if (!isLoggedIn || !['admin', 'restaurant'].includes(user?.role)) {
    return <Navigate to="/dashboard/login" replace />;
  }

  return children;
}