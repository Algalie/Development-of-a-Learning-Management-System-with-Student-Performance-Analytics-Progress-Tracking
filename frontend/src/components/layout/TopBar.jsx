import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { 
  FaSignOutAlt, FaBell
} from 'react-icons/fa';

const TopBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleConfig = {
    admin: { label: 'Admin', color: '#3b82f6', bg: '#dbeafe' },
    super_admin: { label: 'Super Admin', color: '#f59e0b', bg: '#fef3c7' },
    lecturer: { label: 'Lecturer', color: '#10b981', bg: '#d1fae5' },
    head_of_department: { label: 'HOD', color: '#7c3aed', bg: '#ede9fe' },
    dean: { label: 'Dean', color: '#f59e0b', bg: '#fef3c7' },
    exam_officer: { label: 'Exam Officer', color: '#ef4444', bg: '#fee2e2' },
  };

  const role = roleConfig[user?.role] || roleConfig.lecturer;
  const initials = (user?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Check by role - super_admin and admin both get admin dashboard
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/lecturer/dashboard';
  const notifPath = isAdmin ? '/admin/notifications' : '/lecturer/notifications';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {/* Left Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div 
          onClick={() => navigate(dashboardPath)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          title="Go to Dashboard"
        >
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #0A2A66, #1e40af)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '1.1rem', fontWeight: 700,
            boxShadow: '0 4px 12px rgba(10,42,102,0.2)',
          }}>
            M
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1.2 }}>MMTU</div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', lineHeight: 1 }}>GPA Portal</div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => navigate(notifPath)}
          style={{
            width: '38px', height: '38px', borderRadius: '10px',
            border: '1px solid #e2e8f0', background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', fontSize: '0.95rem',
            transition: 'all 0.2s',
          }}
          title="Notifications"
        >
          <FaBell />
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.4rem 0.8rem', borderRadius: '12px',
          background: '#f8fafc', border: '1px solid #e2e8f0',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: role.bg, color: role.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem',
          }}>
            {initials}
          </div>

          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0A2A66' }}>
              {user?.full_name || 'User'}
            </div>
            <span style={{ fontSize: '0.65rem', color: role.color, fontWeight: 600 }}>
              {role.label}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '38px', height: '38px', borderRadius: '10px',
            border: '1px solid #fee2e2', background: '#fef2f2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
          title="Logout"
        >
          <FaSignOutAlt />
        </button>
      </div>
    </motion.header>
  );
};

export default TopBar;