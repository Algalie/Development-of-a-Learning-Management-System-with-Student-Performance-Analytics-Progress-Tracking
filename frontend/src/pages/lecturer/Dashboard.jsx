import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { 
  FaBookOpen, FaClock, FaUsers, FaBell, FaPlusCircle, FaList,
  FaHistory, FaArrowRight, FaSpinner, FaBook, FaCalculator,
  FaGraduationCap, FaSyncAlt, FaCheckCircle, FaExchangeAlt,
  FaUserShield, FaChalkboardTeacher, FaTimes
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    return sessionStorage.getItem('active_role') || 'lecturer';
  });

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (user && stats) {
      const hasMultipleRoles = user?.role === 'head_of_department' || user?.role === 'dean';
      const popupAlreadyShown = sessionStorage.getItem('role_popup_shown');
      
      // ✅ Always show popup if it hasn't been shown this session
      if (hasMultipleRoles && popupAlreadyShown !== 'true') {
        setTimeout(() => {
          setShowRoleModal(true);
        }, 800);
        sessionStorage.setItem('role_popup_shown', 'true');
      }
    }
  }, [user, stats]);

  const handleRoleChoice = (choice) => {
    sessionStorage.setItem('active_role', choice);
    setActiveRole(choice);
    setShowRoleModal(false);
    
    if (choice === 'hod') {
      toast.success('Switched to HOD Dashboard', { duration: 1000 });
    } else if (choice === 'dean') {
      toast.success('Switched to Dean Dashboard', { duration: 1000 });
    } else {
      toast.success('Welcome to your Dashboard', { duration: 1000 });
    }
  };

  const fetchStats = async () => {
    try {
      const res = await lecturerApi.getDashboardStats();
      setStats(res.data.stats || res.data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally { 
      setLoading(false); 
    }
  };

  const isApprover = (user?.role === 'head_of_department' || user?.role === 'dean' || user?.role === 'exam_officer') 
    && activeRole !== 'lecturer';
  
  const canCreateCourses = user?.role === 'head_of_department' && activeRole !== 'lecturer';
  const isHodOrDean = user?.role === 'head_of_department' || user?.role === 'dean';
  const isOrdinaryLecturer = user?.role === 'lecturer';

  if (loading) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FaSpinner className="loading-spinner" style={{ fontSize: '1.5rem' }} />
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: <FaBookOpen />, value: stats?.active_courses || 0, label: 'Active Courses', bg: '#f0f4ff', color: '#0A2A66' },
    { icon: <FaClock />, value: isApprover ? (stats?.total_pending_approvals || 0) : (stats?.my_pending_submissions || 0), label: isApprover ? 'Pending Approvals' : 'My Pending', bg: '#fefce8', color: '#ca8a04' },
    { icon: <FaUsers />, value: stats?.total_students || 0, label: 'Total Students', bg: '#f0fdf4', color: '#16a34a' },
    { icon: <FaBell />, value: stats?.unread_notifications || 0, label: 'Notifications', bg: '#fef2f2', color: '#dc2626' },
  ];

  const primaryActions = [
    ...(canCreateCourses ? [{ icon: <FaPlusCircle />, title: 'Create Course', desc: 'Create a new course, assign lecturer, and set curriculum', link: '/lecturer/create-course' }] : []),
    { icon: <FaList />, title: 'My Courses', desc: 'View and manage your assigned courses', info: `${stats?.draft_courses || 0} drafts`, link: '/lecturer/courses' },
    { icon: <FaHistory />, title: 'Approval History', desc: 'View your past submissions and approvals', link: '/lecturer/approval-history' },
    { icon: <FaHistory />, title: 'Course History', desc: 'View archived courses from previous semesters', link: '/lecturer/course-history' },
    { icon: <FaBell />, title: 'Notifications', desc: 'View updates on your submissions and approvals', info: stats?.unread_notifications > 0 ? `${stats.unread_notifications} unread` : null, link: '/lecturer/notifications' },
  ];

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      
      <AnimatePresence>
        {showRoleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: cardBg, borderRadius: '24px', padding: '2.5rem 2rem',
                maxWidth: '480px', width: '90%', textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                border: `1px solid ${border}`,
              }}
            >
              <div style={{
                width: '72px', height: '72px', borderRadius: '20px',
                background: 'rgba(10,42,102,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.2rem', fontSize: '2rem',
              }}>
                <FaExchangeAlt style={{ color: '#0A2A66' }} />
              </div>
              
              <h2 style={{ color: '#0A2A66', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Choose Your Dashboard
              </h2>
              <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1.8rem', lineHeight: 1.5 }}>
                You have access to multiple roles. Which dashboard would you like to use?
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => handleRoleChoice('lecturer')}
                  style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: `2px solid ${border}`, background: cardBgHover, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2A66', fontSize: '1.1rem' }}><FaChalkboardTeacher /></div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.95rem' }}>Lecturer Dashboard</div>
                    <div style={{ color: textSec, fontSize: '0.8rem' }}>Manage courses, enter grades, view students</div>
                  </div>
                  <FaArrowRight style={{ marginLeft: 'auto', color: textMuted }} />
                </button>

                {user?.role === 'head_of_department' && (
                  <button onClick={() => handleRoleChoice('hod')}
                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '2px solid #FFC107', background: '#fefce8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04', fontSize: '1.1rem' }}><FaUserShield /></div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.95rem' }}>HOD Dashboard</div>
                      <div style={{ color: '#854d0e', fontSize: '0.8rem' }}>Create courses, approve submissions, manage department</div>
                    </div>
                    <FaArrowRight style={{ marginLeft: 'auto', color: '#ca8a04' }} />
                  </button>
                )}

                {user?.role === 'dean' && (
                  <button onClick={() => handleRoleChoice('dean')}
                    style={{ width: '100%', padding: '1rem', borderRadius: '14px', border: '2px solid #7c3aed', background: '#f5f3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', fontSize: '1.1rem' }}><FaUserShield /></div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.95rem' }}>Dean Dashboard</div>
                      <div style={{ color: '#6d28d9', fontSize: '0.8rem' }}>Approve submissions, manage faculty, oversight</div>
                    </div>
                    <FaArrowRight style={{ marginLeft: 'auto', color: '#7c3aed' }} />
                  </button>
                )}
              </div>

              <button onClick={() => handleRoleChoice('lecturer')}
                style={{ marginTop: '1rem', background: 'none', border: 'none', color: textMuted, cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                <FaTimes style={{ marginRight: '0.3rem', fontSize: '0.7rem' }} /> Continue as Lecturer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FadeIn>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.3rem' }}>
              {isOrdinaryLecturer ? `${user?.full_name?.split(' ')[0] || 'Lecturer'}'s Dashboard`
                : activeRole === 'hod' ? "HOD's Dashboard" 
                : activeRole === 'dean' ? "Dean's Dashboard" 
                : `${user?.full_name?.split(' ')[0] || 'Lecturer'}'s Dashboard`}
            </h1>
            <p style={{ color: textSec, fontSize: '0.95rem' }}>
              {user?.department || user?.display_department || 'Department'} · {user?.role?.replace(/_/g, ' ') || 'Lecturer'}
              {activeRole !== 'lecturer' && !isOrdinaryLecturer && (
                <span style={{ marginLeft: '0.5rem', color: '#FFC107', fontWeight: 600 }}>({activeRole.toUpperCase()} Mode)</span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {isHodOrDean && (
              <button onClick={() => setShowRoleModal(true)}
                style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: cardBgHover, border: `1px solid ${border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 500, color: '#0A2A66', fontFamily: 'Inter, sans-serif' }}>
                <FaExchangeAlt /> Switch Role
              </button>
            )}
            <DarkModeToggle />
          </div>
        </div>
      </FadeIn>

      {stats?.unread_notifications > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.9rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FaBell style={{ color: '#ca8a04', fontSize: '1.1rem' }} />
            <span style={{ color: '#854d0e', fontSize: '0.9rem' }}>You have <strong>{stats.unread_notifications}</strong> unread notification{stats.unread_notifications > 1 ? 's' : ''}</span>
          </div>
          <Link to="/lecturer/notifications" style={{ color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>View <FaArrowRight style={{ fontSize: '0.7rem' }} /></Link>
        </motion.div>
      )}

      <ShakeOnMount>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map((item, index) => (
            <motion.div key={index} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem 1.25rem', border: `1px solid ${border}`, boxShadow: shadowSm, textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto 0.75rem' }}>{item.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1, marginBottom: '0.3rem' }}>{item.value}</div>
              <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500 }}>{item.label}</div>
            </motion.div>
          ))}
        </div>
      </ShakeOnMount>

      <FadeIn delay={0.1}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1rem' }}>Quick Actions</h2>
      </FadeIn>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${primaryActions.length}, 1fr)`, gap: '1rem', marginBottom: '2rem' }}>
        {primaryActions.map((action, i) => (
          <FadeIn key={i} delay={0.1 + i * 0.05}>
            <motion.div whileHover={{ y: -2 }} onClick={() => navigate(action.link)}
              style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm, cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cardBgHover, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A2A66', fontSize: '1.1rem', marginBottom: '1rem' }}>{action.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.4rem' }}>{action.title}</h3>
              <p style={{ color: textSec, fontSize: '0.82rem', lineHeight: 1.5, flex: 1, margin: 0 }}>{action.desc}</p>
              {action.info && <span style={{ fontSize: '0.75rem', color: textMuted, fontWeight: 500, marginTop: '0.5rem' }}>{action.info}</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', marginTop: '1rem' }}>Open <FaArrowRight style={{ fontSize: '0.7rem' }} /></div>
            </motion.div>
          </FadeIn>
        ))}
      </div>

      {isApprover && (
        <>
          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#0A2A66' }}>Pending Approvals</h2>
              <Link to="/lecturer/pending-approvals" style={{ color: '#0A2A66', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>View All <FaArrowRight style={{ fontSize: '0.7rem' }} /></Link>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: <FaBook />, value: stats?.pending_course_approvals || 0, label: 'Course', bg: '#f0f4ff', color: '#0A2A66', tab: 'courses' },
              { icon: <FaCalculator />, value: stats?.pending_grade_approvals || 0, label: 'Grades', bg: '#f5f3ff', color: '#7c3aed', tab: 'grades' },
              { icon: <FaGraduationCap />, value: (stats?.pending_exam_approvals || 0), label: 'Exam (Legacy)', bg: '#f0fdf4', color: '#16a34a', tab: 'exam' },
              { icon: <FaSyncAlt />, value: stats?.pending_reference_approvals || 0, label: 'Reference', bg: '#fef2f2', color: '#dc2626', tab: 'reference' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} whileHover={{ y: -2 }}
                onClick={() => navigate(`/lecturer/pending-approvals?tab=${item.tab}`)}
                style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem 1.25rem', border: `1px solid ${border}`, boxShadow: shadowSm, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto 0.75rem' }}>{item.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1, marginBottom: '0.3rem' }}>{item.value}</div>
                <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500 }}>{item.label} Approvals</div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', color: textMuted, fontSize: '0.85rem' }}>
        <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle style={{ color: '#16a34a' }} /> {stats?.active_courses || 0} active courses</span>
      </div>
    </div>
  );
};

export default Dashboard;