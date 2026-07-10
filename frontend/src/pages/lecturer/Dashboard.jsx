import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { 
  FaBookOpen, FaClock, FaUsers, FaBell, FaPlusCircle, FaList,
  FaHistory, FaArrowRight, FaSpinner, FaBook, FaCalculator,
  FaGraduationCap, FaSyncAlt, FaCheckCircle
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await lecturerApi.getDashboardStats();
      setStats(res.data.stats || res.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <FaBookOpen />, value: stats?.active_courses || 0, label: 'Active Courses', bg: '#f0f4ff', color: '#0A2A66' },
    { icon: <FaClock />, value: stats?.total_pending_approvals || 0, label: 'Pending Approvals', bg: '#fefce8', color: '#ca8a04' },
    { icon: <FaUsers />, value: stats?.total_students || 0, label: 'Total Students', bg: '#f0fdf4', color: '#16a34a' },
    { icon: <FaBell />, value: stats?.unread_notifications || 0, label: 'Notifications', bg: '#fef2f2', color: '#dc2626' },
  ];

  const primaryActions = [
    { icon: <FaPlusCircle />, title: 'Create Course', desc: 'Create a new course, select department, and save as draft', link: '/lecturer/create-course' },
    { icon: <FaList />, title: 'My Courses', desc: 'View and manage your existing courses', info: `${stats?.draft_courses || 0} drafts`, link: '/lecturer/courses' },
    { icon: <FaHistory />, title: 'Course History', desc: 'View archived courses from previous semesters', link: '/lecturer/course-history' },
    { icon: <FaBell />, title: 'Notifications', desc: 'View updates on your submissions and approvals', info: stats?.unread_notifications > 0 ? `${stats.unread_notifications} unread` : null, link: '/lecturer/notifications' },
  ];

  const isApprover = user?.role === 'head_of_department' || user?.role === 'dean' || user?.role === 'exam_officer';

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <FadeIn>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.3rem' }}>
              {user?.full_name?.split(' ')[0] || 'Lecturer'}'s Dashboard
            </h1>
            <p style={{ color: textSec, fontSize: '0.95rem' }}>
              {user?.department || 'Department'} · {user?.role?.replace(/_/g, ' ') || 'Lecturer'}
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
              You have <strong>{stats.unread_notifications}</strong> unread notification{stats.unread_notifications > 1 ? 's' : ''}
            </span>
          </div>
          <Link to="/lecturer/notifications" style={{ color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View <FaArrowRight style={{ fontSize: '0.7rem' }} />
          </Link>
        </motion.div>
      )}

      {/* Stats Row */}
      <ShakeOnMount>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem', marginBottom: '2rem',
        }}>
          {statCards.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: cardBg,
                borderRadius: '12px',
                padding: '1.5rem 1.25rem',
                border: `1px solid ${border}`,
                boxShadow: shadowSm,
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: item.bg, color: item.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', margin: '0 auto 0.75rem',
              }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1, marginBottom: '0.3rem' }}>
                {item.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500 }}>
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </ShakeOnMount>

      {/* Primary Actions */}
      <FadeIn delay={0.1}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1rem' }}>
          Quick Actions
        </h2>
      </FadeIn>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {primaryActions.map((action, i) => (
          <FadeIn key={i} delay={0.1 + i * 0.05}>
            <motion.div
              whileHover={{ y: -2 }}
              onClick={() => window.location.href = action.link}
              style={{
                background: cardBg,
                borderRadius: '12px',
                padding: '1.5rem',
                border: `1px solid ${border}`,
                boxShadow: shadowSm,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: cardBgHover, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#0A2A66', fontSize: '1.1rem', marginBottom: '1rem',
              }}>
                {action.icon}
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.4rem' }}>
                {action.title}
              </h3>
              <p style={{ color: textSec, fontSize: '0.82rem', lineHeight: 1.5, flex: 1, margin: 0 }}>
                {action.desc}
              </p>
              {action.info && (
                <span style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 500, marginTop: '0.5rem' }}>
                  {action.info}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', marginTop: '1rem' }}>
                Open <FaArrowRight style={{ fontSize: '0.7rem' }} />
              </div>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {/* Pending Approvals */}
      {isApprover && (
        <>
          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0A2A66' }}>
                Pending Approvals
              </h2>
              <Link to="/lecturer/pending-approvals" style={{ color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                View All <FaArrowRight style={{ fontSize: '0.7rem' }} />
              </Link>
            </div>
          </FadeIn>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem', marginBottom: '2rem',
          }}>
            {[
              { icon: <FaBook />, value: stats?.pending_course_approvals || 0, label: 'Course', bg: '#f0f4ff', color: '#0A2A66', tab: 'courses' },
              { icon: <FaCalculator />, value: stats?.pending_ca_approvals || 0, label: 'CA', bg: '#f5f3ff', color: '#7c3aed', tab: 'ca' },
              { icon: <FaGraduationCap />, value: stats?.pending_exam_approvals || 0, label: 'Exam', bg: '#f0fdf4', color: '#16a34a', tab: 'exam' },
              { icon: <FaSyncAlt />, value: stats?.pending_reference_approvals || 0, label: 'Reference', bg: '#fef2f2', color: '#dc2626', tab: 'reference' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -2 }}
                onClick={() => window.location.href = `/lecturer/pending-approvals?tab=${item.tab}`}
                style={{
                  background: cardBg,
                  borderRadius: '12px',
                  padding: '1.5rem 1.25rem',
                  border: `1px solid ${border}`,
                  boxShadow: shadowSm,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: item.bg, color: item.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', margin: '0 auto 0.75rem',
                }}>
                  {item.icon}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1, marginBottom: '0.3rem' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500 }}>
                  {item.label} Approvals
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${border}`, paddingTop: '1.25rem',
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
        color: textMuted, fontSize: '0.85rem',
      }}>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <FaCheckCircle style={{ color: '#16a34a' }} /> {stats?.active_courses || 0} active courses
        </span>
      </div>
    </div>
  );
};

export default Dashboard;