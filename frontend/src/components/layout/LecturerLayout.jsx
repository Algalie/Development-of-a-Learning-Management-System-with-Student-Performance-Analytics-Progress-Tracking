import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import TopBar from './TopBar';
import PageTransition from '../animations/PageTransition';
import { getToken } from '../../utils/auth';

const LecturerLayout = () => {
  const { user, loading } = useAuth();
  const token = getToken();

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <i className="fas fa-spinner loading-spinner"></i>
        <p style={{ color: '#64748b' }}>Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/lecturer/login" replace />;
  }

  // ✅ Only redirect if user is loaded AND is definitely admin
  const isAdmin = user?.user_type === 'admin' || user?.role === 'admin' || user?.role === 'super_admin';
  
  if (user && isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc' }}>
      <TopBar />
      <PageTransition>
        <Outlet />
      </PageTransition>
    </div>
  );
};

export default LecturerLayout;