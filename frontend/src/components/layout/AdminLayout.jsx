import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TopBar from './TopBar';
import PageTransition from '../animations/PageTransition';
import { getToken } from '../../utils/auth';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const token = getToken();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <i className="fas fa-spinner loading-spinner"></i>
        <p style={{ color: '#64748b' }}>Loading application...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // ✅ Only redirect if user is loaded AND is definitely NOT admin
  const isAdmin = user?.user_type === 'admin' || user?.role === 'admin' || user?.role === 'super_admin';
  
  if (user && !isAdmin && user.user_type !== 'admin') {
    return <Navigate to="/lecturer/dashboard" replace />;
  }

  // If user hasn't loaded yet but token exists, allow through
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc' }}>
      <TopBar />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </div>
  );
};

export default AdminLayout;