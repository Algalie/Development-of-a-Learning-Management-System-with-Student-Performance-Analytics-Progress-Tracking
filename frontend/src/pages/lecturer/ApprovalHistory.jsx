import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';

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
    if (action?.includes('approved')) return <span className="badge badge-approved"><i className="fas fa-check-circle"></i> {action.replace(/_/g, ' ')}</span>;
    if (action?.includes('rejected')) return <span className="badge badge-rejected"><i className="fas fa-times-circle"></i> {action.replace(/_/g, ' ')}</span>;
    if (action?.includes('submitted')) return <span className="badge badge-pending"><i className="fas fa-clock"></i> {action.replace(/_/g, ' ')}</span>;
    return <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3' }}><i className="fas fa-cog"></i> {action?.replace(/_/g, ' ') || 'Unknown'}</span>;
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
    return <div className="dashboard-container"><div className="loading-container"><i className="fas fa-spinner loading-spinner"></i><p>Loading history...</p></div></div>;
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/course-approvals" className="back-btn"><i className="fas fa-arrow-left"></i> Back to Approvals</Link>
          <div>
            <h1>Approval History</h1>
            <p>Complete audit trail of all course approval actions</p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total Actions', value: stats.total, icon: 'fa-list' },
          { label: 'Approvals', value: stats.approved, icon: 'fa-check-circle' },
          { label: 'Rejections', value: stats.rejected, icon: 'fa-times-circle' },
          { label: 'Submissions', value: stats.submitted, icon: 'fa-paper-plane' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label"><i className={`fas ${s.icon}`} style={{ color: 'var(--gold)' }}></i> {s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-section">
        <div className="filter-grid">
          <div className="form-group">
            <label><i className="fas fa-search"></i> Search</label>
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Course code, name, or approver..." />
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-outline" onClick={() => { setFilter('all'); setSearchTerm(''); }}>
            <i className="fas fa-redo-alt"></i> Reset
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <i className="fas fa-download"></i> Export CSV
          </button>
        </div>
      </div>

      {/* Timeline Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--border-light)', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All', icon: 'fa-globe' },
          { key: 'today', label: 'Today', icon: 'fa-calendar-day' },
          { key: 'week', label: 'This Week', icon: 'fa-calendar-week' },
          { key: 'month', label: 'This Month', icon: 'fa-calendar-alt' },
        ].map(chip => (
          <span
            key={chip.key}
            className={`tab ${filter === chip.key ? 'active' : ''}`}
            onClick={() => setFilter(chip.key)}
            style={{ cursor: 'pointer' }}
          >
            <i className={`fas ${chip.icon}`}></i> {chip.label}
          </span>
        ))}
      </div>

      <ShakeOnMount>
        {/* Timeline */}
        <div className="card">
          {filteredHistory.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-history"></i>
              <h3>No History Found</h3>
              <p>There are no approval history records to display.</p>
            </div>
          ) : (
            <div className="timeline">
              {filteredHistory.map((entry, i) => (
                <motion.div key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="timeline-item">
                  <div className={`timeline-dot ${getDotClass(entry.action)}`}></div>
                  <div className="timeline-content">
                    <div className="timeline-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {getActionBadge(entry.action)}
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <i className="fas fa-clock"></i> {entry.performed_at ? new Date(entry.performed_at).toLocaleTimeString() : ''}
                      </span>
                    </div>

                    <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                      {entry.course?.course_code} - {entry.course?.course_name}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <span><i className="fas fa-layer-group" style={{ color: 'var(--gold)' }}></i> Level: <strong>{entry.level?.toUpperCase()}</strong></span>
                      {entry.performed_by ? (
                        <span><i className="fas fa-user" style={{ color: 'var(--gold)' }}></i> By: <strong>{entry.performed_by.full_name}</strong></span>
                      ) : (
                        <span><i className="fas fa-user-shield" style={{ color: 'var(--gold)' }}></i> By: <strong>System Admin</strong></span>
                      )}
                    </div>

                    {entry.details && (
                      <div style={{ fontSize: '0.9rem', color: '#475569', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)', lineHeight: 1.5 }}>
                        {entry.details}
                      </div>
                    )}

                    {entry.action === 'approved' && entry.level !== 'system' && (
                      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'white', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--navy)', border: '1px solid var(--border)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fas fa-signature" style={{ color: 'var(--gold)' }}></i>
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
          <button className="page-btn"><i className="fas fa-chevron-left"></i></button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <button className="page-btn">3</button>
          <button className="page-btn"><i className="fas fa-chevron-right"></i></button>
        </div>
      )}
    </div>
  );
};

export default ApprovalHistory;