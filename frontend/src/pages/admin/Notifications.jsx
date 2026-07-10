import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaBell, FaBellSlash, FaArrowLeft, FaClock, FaPaperPlane, 
  FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTrophy,
  FaSpinner
} from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await adminApi.getNotifications();
      const data = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    const icons = {
      submission: { icon: <FaPaperPlane />, bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
      approval_progress: { icon: <FaCheckCircle />, bg: '#f0fdf4', color: '#10b981', border: '#bbf7d0' },
      finalized: { icon: <FaTrophy />, bg: '#fef3c7', color: '#f59e0b', border: '#fcd34d' },
      rejection: { icon: <FaTimesCircle />, bg: '#fef2f2', color: '#ef4444', border: '#fecaca' },
      info: { icon: <FaInfoCircle />, bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    };
    return icons[type] || icons.info;
  };

  const timeAgo = (date) => {
    if (!date) return '';
    const diff = (new Date() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '750px' }}>
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '750px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.6rem' }}>
            <FaBell style={{ color: '#FFC107' }} />
            Notifications
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white', padding: '0.2rem 0.7rem',
                borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600
              }}>
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>
      </FadeIn>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div style={{
            background: cardBg, borderRadius: 'var(--radius-xl)', padding: '3rem',
            boxShadow: 'var(--shadow-sm)', border: `1px solid ${border}`,
            textAlign: 'center',
          }}>
            <FaBellSlash style={{ fontSize: '3rem', color: textMuted, marginBottom: '1rem' }} />
            <h3 style={{ color: '#0A2A66' }}>No Notifications</h3>
            <p style={{ color: textMuted }}>You're all caught up! New notifications will appear here.</p>
          </div>
        ) : (
          notifications.map((notif, i) => {
            const iconData = getIcon(notif.notification_type);
            return (
              <motion.div
                key={notif.id || i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  background: notif.is_read ? cardBg : cardBg,
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  border: `1px solid ${notif.is_read ? border : iconData.border}`,
                  borderLeft: notif.is_read ? `1px solid ${border}` : `4px solid ${iconData.color}`,
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  transition: 'all 0.3s ease',
                  boxShadow: notif.is_read ? 'var(--shadow-sm)' : 'var(--shadow-md)',
                  background: notif.is_read ? cardBg : 'var(--blue-bg)',
                }}
                whileHover={{ x: 4 }}
              >
                <div style={{
                  minWidth: '44px', height: '44px',
                  borderRadius: '12px',
                  background: iconData.bg,
                  border: `1px solid ${iconData.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', color: iconData.color, flexShrink: 0
                }}>
                  {iconData.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 700, color: '#0A2A66', marginBottom: '0.3rem',
                    fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}>
                    {notif.title}
                    {!notif.is_read && (
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: iconData.color, display: 'inline-block'
                      }}></span>
                    )}
                  </div>
                  <div style={{ color: textSec, fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {notif.message}
                  </div>
                  <div style={{
                    fontSize: '0.75rem', color: textMuted, marginTop: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.3rem'
                  }}>
                    <FaClock style={{ fontSize: '0.65rem' }} />
                    {timeAgo(notif.created_at)}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;