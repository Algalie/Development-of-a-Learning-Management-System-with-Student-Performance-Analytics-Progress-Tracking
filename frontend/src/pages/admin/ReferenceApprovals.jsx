import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSyncAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaTrashAlt, FaUndoAlt, FaExclamationTriangle, FaCheck, FaTimes,
  FaSpinner
} from 'react-icons/fa';

const ReferenceApprovals = () => {
  const [data, setData] = useState({ pending_references: [], approved_references: [], rejected_references: [], stats: {} });
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, refId: null, reason: '' });
  const [deleteModal, setDeleteModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getReferenceDashboard({});
      setData({
        pending_references: res.data.pending || [],
        approved_references: res.data.cleared || [],
        rejected_references: [],
        stats: res.data.stats || { pending: 0, approved: 0, rejected: 0, total: 0 },
      });
    } catch (error) {
      toast.error('Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await adminApi.deleteAllReferences();
      toast.success('All references deleted');
      setDeleteModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete references');
    }
  };

  const handleResetAll = async () => {
    try {
      await adminApi.resetAllReferences();
      toast.success('All references reset');
      setResetModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to reset references');
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Enter a reason'); return; }
    try {
      await adminApi.rejectSubmission(rejectModal.refId, rejectModal.reason);
      toast.success('Reference rejected');
      setRejectModal({ open: false, refId: null, reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    }
  };

  const getGradeBadge = (grade) => `grade-badge grade-${grade || 'F'}`;
  const getStatusBadge = (status) => {
    if (status === 'cleared') return <span className="status-badge status-cleared"><FaCheckCircle /> Cleared</span>;
    if (status === 'double_fail') return <span className="status-badge status-double"><FaTimesCircle /> Double Fail</span>;
    return <span className="status-badge status-pending"><FaClock /> Pending</span>;
  };

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FaClock />, data: data.pending_references, count: data.stats.pending },
    { key: 'approved', label: 'Approved', icon: <FaCheckCircle />, data: data.approved_references, count: data.stats.approved },
    { key: 'rejected', label: 'Rejected', icon: <FaTimesCircle />, data: data.rejected_references, count: data.stats.rejected },
  ];

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';
  const shadowSm = 'var(--shadow-sm)';

  if (loading) {
    return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/grade-approvals" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back</Link>
          <div>
            <h1>Reference Grade Approvals</h1>
            <p style={{ color: textSec }}>Manage resit/reference grade submissions</p>
          </div>
        </div>
      </FadeIn>

      <div className="stats-grid">
        {[
          { label: 'Total References', value: data.stats.total, icon: <FaSyncAlt />, color: '#0A2A66', className: 'total' },
          { label: 'Pending', value: data.stats.pending, icon: <FaClock />, color: '#f59e0b', className: 'pending' },
          { label: 'Approved', value: data.stats.approved, icon: <FaCheckCircle />, color: '#10b981', className: 'approved' },
          { label: 'Rejected', value: data.stats.rejected, icon: <FaTimesCircle />, color: '#ef4444', className: 'rejected' },
        ].map((s, i) => (
          <div key={i} className={`stat-card border-left ${s.className}`}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label"><span style={{ color: s.color }}>{s.icon}</span> {s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-danger" onClick={() => setDeleteModal(true)}><FaTrashAlt /> Delete All</button>
        <button className="btn btn-warning" onClick={() => setResetModal(true)}><FaUndoAlt /> Reset All</button>
      </div>

      <div className="tabs">
        {tabs.map(tab => (
          <span key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.icon} {tab.label}
            <span className="count">{tab.count}</span>
          </span>
        ))}
      </div>

      <ShakeOnMount>
        <div style={{
          background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          overflow: 'auto', boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          marginBottom: '1.5rem',
        }}>
          <table>
            <thead>
              <tr>
                <th>Student</th><th>Course</th><th>Original</th><th>Reference</th><th>Display</th>
                {activeTab === 'pending' && <th>Actions</th>}
                {activeTab === 'approved' && <th>Approved By</th>}
                {activeTab === 'rejected' && <th>Reason</th>}
              </tr>
            </thead>
            <tbody>
              {tabs.find(t => t.key === activeTab)?.data?.length === 0 ? (
                <tr><td colSpan={activeTab === 'pending' ? 6 : activeTab === 'approved' ? 6 : 6}>
                  <div className="empty-state"><FaCheckCircle style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }} /><p>No {activeTab} references</p></div>
                </td></tr>
              ) : (
                tabs.find(t => t.key === activeTab)?.data?.map((ref, i) => (
                  <tr key={ref.id || i}>
                    <td><strong style={{ color: '#0A2A66' }}>{ref.student?.student_name || ref.student_name}</strong><br /><small style={{ color: textMuted }}>{ref.student?.student_id || ref.student_id}</small></td>
                    <td><strong style={{ color: '#0A2A66' }}>{ref.course?.course_code || ref.course_code}</strong><br /><small style={{ color: textSec }}>{ref.course?.course_name || ref.course_name}</small></td>
                    <td><span className={getGradeBadge(ref.original_grade)}>{ref.original_grade}</span><br /><small style={{ color: textMuted }}>{ref.original_score?.toFixed(1)}%</small></td>
                    <td><span className={getGradeBadge(ref.reference_grade)}>{ref.reference_grade || '-'}</span></td>
                    <td>{ref.display_grade ? <span className="display-grade"><span className="new-grade">{ref.display_grade.split('/')[0]}</span>/<span className="old-grade">{ref.display_grade.split('/')[1]}</span></span> : '-'}</td>
                    {activeTab === 'pending' && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-sm btn-approve"><FaCheck /> Approve</button>
                          <button className="btn btn-sm btn-reject" onClick={() => setRejectModal({ open: true, refId: ref.id, reason: '' })}><FaTimes /> Reject</button>
                        </div>
                      </td>
                    )}
                    {activeTab === 'approved' && (
                      <td style={{ color: textPri }}>{ref.approved_by?.full_name || 'System'}<br /><small style={{ color: textMuted }}>{ref.approved_at ? new Date(ref.approved_at).toLocaleDateString() : ''}</small></td>
                    )}
                    {activeTab === 'rejected' && (
                      <td style={{ color: '#991b1b' }}>{ref.rejection_reason || '-'}</td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ShakeOnMount>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="modal-overlay" onClick={() => setRejectModal({ open: false, refId: null, reason: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><FaExclamationTriangle style={{ color: '#ef4444', marginRight: '0.4rem' }} /> Reject Reference Grade</h3>
            <p>Please provide a reason for rejection:</p>
            <textarea rows="4" value={rejectModal.reason} onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })} placeholder="Enter rejection reason..." required></textarea>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setRejectModal({ open: false, refId: null, reason: '' })}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject}>Submit Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="modal-overlay" onClick={() => setDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><FaExclamationTriangle style={{ color: '#ef4444', marginRight: '0.4rem' }} /> Delete All References</h3>
            <p>Are you sure you want to delete ALL reference grade records? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteAll}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3><FaUndoAlt style={{ color: '#f59e0b', marginRight: '0.4rem' }} /> Reset All Approvals</h3>
            <p>Reset all reference approvals to pending status? This will require re-approval.</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setResetModal(false)}>Cancel</button>
              <button className="btn btn-warning" onClick={handleResetAll}>Reset All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceApprovals;