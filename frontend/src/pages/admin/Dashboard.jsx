import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { 
  FaUserShield, FaChalkboardTeacher, FaUsers, FaBuilding, FaSitemap, FaClock,
  FaClipboardCheck, FaBook, FaChartLine, FaSyncAlt, FaUsersCog, FaCalculator,
  FaFileAlt, FaExclamationTriangle, FaBell, FaArrowRight,
  FaCheckCircle, FaTimesCircle, FaSpinner, FaSun, FaMoon, FaCloudSun,
  FaChartPie, FaEdit, FaSync
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => { fetchStats(true); }, []);

  // ✅ Live auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await adminApi.getDashboardStats();
      setStats(response.data.stats || response.data);
      setLastUpdate(new Date());
    } catch (error) {
      if (showLoading) toast.error('Failed to load dashboard stats');
    } finally { 
      if (showLoading) setLoading(false); 
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.95rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const greetingIcon = hour < 12 ? <FaSun style={{ color: '#f59e0b' }} /> : hour < 17 ? <FaCloudSun style={{ color: '#f59e0b' }} /> : <FaMoon style={{ color: '#6366f1' }} />;
  const firstName = user?.full_name?.split(' ')[0] || 'Admin';

  const statCards = [
    { icon: <FaUserShield />, value: stats?.total_admins || 0, label: 'Administrators', bg: '#f0f4ff', color: '#0A2A66', shadow: '0 2px 8px rgba(10,42,102,0.08)' },
    { icon: <FaChalkboardTeacher />, value: stats?.total_lecturers || 0, label: 'Lecturers', bg: '#f0fdf4', color: '#16a34a', shadow: '0 2px 8px rgba(16,185,129,0.08)' },
    { icon: <FaUsers />, value: stats?.total_students || 0, label: 'Students', bg: '#f5f3ff', color: '#7c3aed', shadow: '0 2px 8px rgba(124,58,237,0.08)' },
    { icon: <FaBuilding />, value: stats?.total_faculties || 0, label: 'Faculties', bg: '#fefce8', color: '#ca8a04', shadow: '0 2px 8px rgba(202,138,4,0.08)' },
    { icon: <FaSitemap />, value: stats?.total_departments || 0, label: 'Departments', bg: '#fff7ed', color: '#ea580c', shadow: '0 2px 8px rgba(234,88,12,0.08)' },
    { icon: <FaClock />, value: stats?.pending_at_exam || 0, label: 'Pending Approvals', bg: '#fef2f2', color: '#dc2626', shadow: '0 2px 8px rgba(220,38,38,0.08)' },
  ];

  const mainActions = [
    {
      title: 'Exam Office Submissions',
      desc: 'Review and process all submissions awaiting final approval.',
      icon: <FaClipboardCheck />,
      stats: [
        { label: 'Pending', value: stats?.pending_at_exam || 0 },
        { label: 'Finalized Today', value: stats?.finalized_today || 0 },
        { label: 'Rejected', value: stats?.rejected_count || 0 },
      ],
      link: '/admin/exam-office-submissions',
    },
    {
      title: 'Course Approvals',
      desc: 'Monitor all course submissions and track their approval progress.',
      icon: <FaBook />,
      stats: [
        { label: 'Total Courses', value: stats?.total_courses || 0 },
        { label: 'Pending', value: stats?.pending_courses_at_exam || 0 },
        { label: 'Finalized', value: stats?.finalized_count || 0 },
      ],
      link: '/admin/course-approvals',
    },
    {
      title: 'Grade Approvals',
      desc: 'Track CA, exam, and combined grade submissions.',
      icon: <FaChartLine />,
      stats: [
        { label: 'Pending Grades', value: stats?.pending_grades_at_exam || 0 },
        { label: 'Cleared Refs', value: stats?.cleared_references || 0 },
        { label: 'Double Fails', value: stats?.double_failures || 0 },
      ],
      link: '/admin/grade-approvals',
    },
    {
      title: 'Reference Management',
      desc: 'Query student references by ID, manage pending and cleared.',
      icon: <FaSyncAlt />,
      stats: [
        { label: 'Pending', value: stats?.pending_ref_status || 0 },
        { label: 'Cleared', value: stats?.cleared_references || 0 },
        { label: 'Double Fail', value: stats?.double_failures || 0 },
      ],
      link: '/admin/reference-management',
    },
  ];

  const secondaryActions = [
    { title: 'User & Faculty Management', desc: 'Manage admins, lecturers, faculties and departments', icon: <FaUsersCog />, link: '/admin/manage-users' },
    { title: 'Grade Edit Requests', desc: 'Review and process lecturer grade edit requests', icon: <FaEdit />, link: '/admin/grade-edit-requests' },
    { title: 'GPA Calculator', desc: 'Calculate student GPA with reference tracking', icon: <FaCalculator />, link: '/admin/gpa-calculator' },
    { title: 'Transcript Management', desc: 'View student academic history and generate transcripts', icon: <FaFileAlt />, link: '/admin/transcript' },
    { title: 'Failure & Withdrawal History', desc: 'Search and view failure, withdrawal records', icon: <FaExclamationTriangle />, link: '/admin/failure-history' },
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      
      {/* Header */}
      <FadeIn>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {greetingIcon}
              <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66', margin: 0 }}>
                {greeting}, {firstName}
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Overview of your university management system
              <span style={{ marginLeft: '0.75rem', fontSize: '0.7rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <FaSync style={{ fontSize: '0.6rem' }} /> Live — real-time updates
              </span>
            </p>
          </div>
          <DarkModeToggle />
        </div>
      </FadeIn>

      {/* Notification Alert */}
      {stats?.unread_notifications > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px',
            padding: '0.9rem 1.25rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaBell style={{ color: '#ca8a04', fontSize: '1.1rem' }} />
            <span style={{ color: '#854d0e', fontSize: '0.9rem' }}>
              <strong>{stats.unread_notifications}</strong> unread notification{stats.unread_notifications > 1 ? 's' : ''} waiting
            </span>
          </div>
          <Link to="/admin/notifications" style={{ color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
            View all <FaArrowRight style={{ fontSize: '0.7rem' }} />
          </Link>
        </motion.div>
      )}

      {/* Stats Row */}
      <ShakeOnMount>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              style={{ 
                background: 'var(--card-bg)', 
                borderRadius: '14px', 
                padding: '1.5rem 1.25rem', 
                border: '2px solid var(--border)', 
                boxShadow: item.shadow,
                textAlign: 'center',
              }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', margin: '0 auto 0.75rem', border: `2px solid ${item.color}20` }}>{item.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0A2A66', lineHeight: 1, marginBottom: '0.3rem' }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</div>
            </motion.div>
          ))}
        </div>
      </ShakeOnMount>

      {/* Primary Actions */}
      <FadeIn delay={0.1}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0A2A66', marginBottom: '1rem' }}>Primary Actions</h2>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {mainActions.map((action, i) => (
          <FadeIn key={i} delay={0.1 + i * 0.06}>
            <motion.div whileHover={{ y: -3 }} onClick={() => navigate(action.link)}
              style={{ 
                background: 'var(--card-bg)', 
                borderRadius: '14px', 
                padding: '1.5rem', 
                border: '2px solid var(--border)', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
              }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0f4ff', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2A66', fontSize: '1.2rem', flexShrink: 0 }}>{action.icon}</div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.25rem' }}>{action.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{action.desc}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                {action.stats.map((s, j) => (
                  <div key={j} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0A2A66' }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0A2A66', fontWeight: 700, fontSize: '0.85rem' }}>Open {action.title} <FaArrowRight style={{ fontSize: '0.7rem' }} /></div>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {/* Analytics Card */}
      <FadeIn delay={0.15}>
        <motion.div whileHover={{ y: -3 }} onClick={() => navigate('/admin/analytics')}
          style={{ background: 'linear-gradient(135deg, #0A2A66, #1e40af)', borderRadius: '18px', padding: '2rem', marginBottom: '2rem', cursor: 'pointer', boxShadow: '0 8px 30px rgba(10,42,102,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,193,7,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: 'rgba(255,193,7,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', color: '#FFC107', flexShrink: 0 }}><FaChartPie /></div>
            <div style={{ flex: 1 }}>
              <h3 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>Analytics Dashboard</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>View comprehensive charts, real-time statistics, and system performance metrics.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFC107', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', position: 'relative', zIndex: 1 }}>Open Analytics <FaArrowRight /></div>
          </div>
        </motion.div>
      </FadeIn>

      {/* Management Tools */}
      <FadeIn delay={0.2}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0A2A66', marginBottom: '1rem' }}>Management Tools</h2>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {secondaryActions.map((action, i) => (
          <FadeIn key={i} delay={0.2 + i * 0.05}>
            <motion.div whileHover={{ y: -3 }} onClick={() => navigate(action.link)}
              style={{ 
                background: 'var(--card-bg)', 
                borderRadius: '14px', 
                padding: '1.5rem', 
                border: '2px solid var(--border)', 
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)', 
                cursor: 'pointer', 
                transition: 'all 0.2s ease', 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
              }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#f0f4ff', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2A66', fontSize: '1.2rem', marginBottom: '1rem' }}>{action.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.4rem' }}>{action.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5, flex: 1, margin: 0 }}>{action.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0A2A66', fontWeight: 700, fontSize: '0.85rem', marginTop: '1rem' }}>Open <FaArrowRight style={{ fontSize: '0.7rem' }} /></div>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle style={{ color: '#16a34a' }} /> {stats?.finalized_today || 0} finalized today</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle style={{ color: '#dc2626' }} /> {stats?.rejected_count || 0} rejected</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;