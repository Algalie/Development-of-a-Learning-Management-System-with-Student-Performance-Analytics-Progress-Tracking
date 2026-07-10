import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaRedoAlt, FaDownload, FaGlobe,
  FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaList,
  FaCheckCircle, FaTimesCircle, FaClock, FaPaperPlane,
  FaHistory, FaLayerGroup, FaUser, FaSignature, FaSpinner,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

const ApprovalHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await adminApi.getApprovalHistory();
      setHistory(res.data.history || res.data || []);
    } catch (error) {
      toast.error('Failed to load approval history');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    let filtered = history;
    
    if (filter === 'today') {
      const today = new Date().toDateString();
      filtered = filtered.filter(h => new Date(h.performed_at).toDateString() === today);
    } else if (filter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(h => new Date(h.performed_at) >= weekAgo);
    } else if (filter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(h => new Date(h.performed_at) >= monthAgo);
    }

    if (searchTerm) {
      filtered = filtered.filter(h => 
        h.course?.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.course?.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.performed_by?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getActionBadge = (action) => {
    if (action?.includes('approved')) return <span className="badge badge-approved"><FaCheckCircle /> {action.replace(/_/g, ' ')}</span>;
    if (action?.includes('rejected')) return <span className="badge badge-rejected"><FaTimesCircle /> {action.replace(/_/g, ' ')}</span>;
    if (action?.includes('submitted')) return <span className="badge badge-pending"><FaClock /> {action.replace(/_/g, ' ')}</span>;
    return <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}>⚙ {action?.replace(/_/g, ' ') || 'Unknown'}</span>;
  };

  const getDotClass = (action) => {
    if (action?.includes('approved')) return 'approved';
    if (action?.includes('rejected')) return 'rejected';
    if (action?.includes('submitted')) return 'pending';
    return 'system';
  };

  const filteredHistory = getFilteredHistory();

  const stats = {
    total: history.length,
    approved: history.filter(h => h.action?.includes('approved')).length,
    rejected: history.filter(h => h.action?.includes('rejected')).length,
    submitted: history.filter(h => h.action?.includes('submitted')).length,
  };

  const handleExport = () => {
    const headers = ['Date', 'Time', 'Action', 'Level', 'Course', 'Performed By', 'Details'];
    const rows = filteredHistory.map(h => [
      h.performed_at ? new Date(h.performed_at).toLocaleDateString() : '',
      h.performed_at ? new Date(h.performed_at).toLocaleTimeString() : '',
      h.action || '',
      h.level || '',
      `${h.course?.course_code || ''} - ${h.course?.course_name || ''}`,
      h.performed_by?.full_name || 'System',
      h.details || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approval_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading history...</p></div></div>;
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/course-approvals" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Approvals</Link>
          <div>
            <h1>Approval History</h1>
            <p>Complete audit trail of all course approval actions</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Actions', value: stats.total, icon: <FaList /> },
          { label: 'Approvals', value: stats.approved, icon: <FaCheckCircle /> },
          { label: 'Rejections', value: stats.rejected, icon: <FaTimesCircle /> },
          { label: 'Submissions', value: stats.submitted, icon: <FaPaperPlane /> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label"><span style={{ color: '#FFC107' }}>{s.icon}</span> {s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-xl)', padding: '1.5rem',
        marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
      }}>
        <div className="filter-grid">
          <div className="form-group">
            <label><FaSearch style={{ color: '#FFC107' }} /> Search</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Course code, name, or approver..." />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-outline" onClick={() => { setFilter('all'); setSearchTerm(''); }}>
            <FaRedoAlt /> Reset
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Timeline Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-light)', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', icon: <FaGlobe /> },
          { key: 'today', label: 'Today', icon: <FaCalendarDay /> },
          { key: 'week', label: 'This Week', icon: <FaCalendarWeek /> },
          { key: 'month', label: 'This Month', icon: <FaCalendarAlt /> },
        ].map(chip => (
          <span
            key={chip.key}
            className={`tab ${filter === chip.key ? 'active' : ''}`}
            onClick={() => setFilter(chip.key)}
            style={{ cursor: 'pointer' }}
          >
            {chip.icon} {chip.label}
          </span>
        ))}
      </div>

      <ShakeOnMount>
        {/* Timeline */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
        }}>
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <FaHistory style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }} />
              <h3>No History Found</h3>
              <p>There are no approval history records to display.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {filteredHistory.map((entry, i) => (
                <motion.div key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  style={{
                    display: 'flex', gap: '1rem', padding: '1.2rem 0',
                    borderBottom: i < filteredHistory.length - 1 ? '1px solid var(--border-light)' : 'none',
                    position: 'relative',
                  }}>
                  <div style={{
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: getDotClass(entry.action) === 'approved' ? '#10b981' :
                               getDotClass(entry.action) === 'rejected' ? '#ef4444' :
                               getDotClass(entry.action) === 'pending' ? '#f59e0b' : '#94a3b8',
                    marginTop: '0.3rem', flexShrink: 0,
                    boxShadow: `0 0 0 4px ${
                      getDotClass(entry.action) === 'approved' ? 'rgba(16,185,129,0.15)' :
                      getDotClass(entry.action) === 'rejected' ? 'rgba(239,68,68,0.15)' :
                      getDotClass(entry.action) === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)'
                    }`,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {getActionBadge(entry.action)}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <FaClock style={{ fontSize: '0.7rem' }} /> {entry.performed_at ? new Date(entry.performed_at).toLocaleTimeString() : ''}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, color: '#0A2A66', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      {entry.course?.course_code} - {entry.course?.course_name}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span><FaLayerGroup style={{ color: '#FFC107', fontSize: '0.7rem' }} /> Level: <strong style={{ color: 'var(--text-primary)' }}>{entry.level?.toUpperCase()}</strong></span>
                      {entry.performed_by ? (
                        <span><FaUser style={{ color: '#FFC107', fontSize: '0.7rem' }} /> By: <strong style={{ color: 'var(--text-primary)' }}>{entry.performed_by.full_name}</strong></span>
                      ) : (
                        <span>👤 By: <strong style={{ color: 'var(--text-primary)' }}>System Admin</strong></span>
                      )}
                    </div>

                    {entry.details && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', lineHeight: 1.5 }}>
                        {entry.details}
                      </div>
                    )}

                    {entry.action === 'approved' && entry.level !== 'system' && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.6rem 0.8rem',
                        background: 'var(--card-bg-hover)', borderRadius: '10px',
                        fontSize: '0.85rem', color: '#0A2A66',
                        border: '1px solid var(--border)', fontWeight: 500,
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                      }}>
                        <FaSignature style={{ color: '#FFC107' }} />
                        {entry.performed_by ? `${entry.performed_by.full_name} (${entry.performed_by.lecturer_id})` : 'Admin Signature'}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </ShakeOnMount>

      {/* Pagination */}
      {filteredHistory.length > 10 && (
        <div className="pagination">
          <button className="page-btn"><FaChevronLeft /></button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn"><FaChevronRight /></button>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistory;