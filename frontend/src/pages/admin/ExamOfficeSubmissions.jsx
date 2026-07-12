import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { FaArrowLeft, FaEye, FaCheck, FaTimes, FaSpinner, FaClipboardCheck, FaClock, FaCheckCircle, FaTimesCircle, FaFileAlt, FaBook, FaCalculator, FaGraduationCap } from 'react-icons/fa';

const ExamOfficeSubmissions = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [data, setData] = useState({ pending: [], finalized: [], rejected: [], stats: { pending: 0, finalized: 0, rejected: 0 } });
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getExamOfficeSubmissions(activeTab);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminApi.examApprove(id);
      toast.success('Submission finalized!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please enter a rejection reason'); return; }
    setActionLoading(rejectModal.requestId);
    try {
      await adminApi.examReject(rejectModal.requestId, rejectModal.reason);
      toast.success('Submission rejected');
      setRejectModal({ open: false, requestId: null, reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FaClock /> },
    { key: 'finalized', label: 'Finalized', icon: <FaCheckCircle /> },
    { key: 'rejected', label: 'Rejected', icon: <FaTimesCircle /> },
  ];

  const typeConfig = {
    course: { label: 'Course', icon: <FaBook />, color: '#1e293b' },
    grades: { label: 'Grades', icon: <FaGraduationCap />, color: '#0A2A66' },
    ca: { label: 'CA', icon: <FaCalculator />, color: '#475569' },
    exam: { label: 'Exam', icon: <FaFileAlt />, color: '#475569' },
    reference: { label: 'Reference', icon: <FaClipboardCheck />, color: '#475569' },
  };

  const getStepStatus = (step) => {
    if (step.status === 'approved') return { color: '#16a34a', bg: '#f0fdf4', text: 'Approved' };
    if (step.status === 'pending') return { color: '#ca8a04', bg: '#fefce8', text: 'Pending' };
    if (step.status === 'skipped') return { color: '#94a3b8', bg: '#f8fafc', text: 'Skipped' };
    return { color: '#94a3b8', bg: '#f8fafc', text: 'Waiting' };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  const currentList = activeTab === 'pending' ? data.pending : activeTab === 'finalized' ? data.finalized : data.rejected;

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <div>
            <h1>Exam Office Submissions</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Review and process all submissions awaiting final approval
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <div
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, minWidth: '180px',
              background: activeTab === tab.key ? '#0A2A66' : 'var(--card-bg)',
              color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
              padding: '1.25rem 1.5rem',
              borderRadius: '12px',
              border: activeTab === tab.key ? 'none' : '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: activeTab === tab.key ? '0 4px 12px rgba(10,42,102,0.15)' : 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.2rem', opacity: activeTab === tab.key ? 1 : 0.6 }}>{tab.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tab.label}</span>
            </div>
            <span style={{
              fontSize: '1.5rem', fontWeight: 700,
              color: activeTab === tab.key ? '#FFC107' : '#0A2A66',
            }}>
              {data.stats[tab.key] || 0}
            </span>
          </div>
        ))}
      </div>

      <ShakeOnMount>
        <div style={{
          background: 'var(--card-bg)', borderRadius: '14px',
          border: '1px solid var(--border)', overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Creator</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                {activeTab === 'pending' && (
                  <th style={{ padding: '14px 20px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 6 : 5} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <FaCheckCircle style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-muted)' }} />
                      <p style={{ fontSize: '0.95rem', fontWeight: 500 }}>No {activeTab} submissions</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentList.map(req => {
                  const type = typeConfig[req.submission_type] || typeConfig.course;
                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--card-bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.25rem 0.75rem', borderRadius: '6px',
                          fontSize: '0.75rem', fontWeight: 600,
                          background: 'var(--card-bg-hover)', color: type.color,
                          textTransform: 'uppercase', letterSpacing: '0.3px',
                        }}>
                          {type.icon} {type.label}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>
                          {req.course?.course_code || 'N/A'}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                          {req.course?.course_name || ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {req.creator?.full_name || 'N/A'}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                          {req.creator_role?.replace(/_/g, ' ') || ''}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {req.steps?.map((step, i) => {
                            const status = getStepStatus(step);
                            return (
                              <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{
                                  width: '10px', height: '10px', borderRadius: '50%',
                                  background: status.color,
                                  margin: '0 auto 0.25rem',
                                }}></div>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                  {step.level?.toUpperCase()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          HOD → Dean → Exam
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.submitted_at ? new Date(req.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      {activeTab === 'pending' && (
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <Link
                              to={`/admin/submission/${req.id}/view`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.5rem 1rem', borderRadius: '8px',
                                background: 'var(--card-bg-hover)', color: 'var(--text-primary)',
                                textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500,
                                transition: 'all 0.2s', border: '1px solid var(--border)',
                              }}
                            >
                              <FaEye style={{ fontSize: '0.7rem' }} /> View
                            </Link>
                            <button
                              onClick={() => handleApprove(req.id)}
                              disabled={actionLoading === req.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.5rem 1rem', borderRadius: '8px',
                                background: '#16a34a', color: 'white', border: 'none',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                transition: 'all 0.2s', opacity: actionLoading === req.id ? 0.7 : 1,
                              }}
                            >
                              {actionLoading === req.id ? <FaSpinner className="animate-spin" /> : <FaCheck style={{ fontSize: '0.7rem' }} />}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectModal({ open: true, requestId: req.id, reason: '' })}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                padding: '0.5rem 1rem', borderRadius: '8px',
                                background: '#fee2e2', color: '#dc2626', border: 'none',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                                transition: 'all 0.2s',
                              }}
                            >
                              <FaTimes style={{ fontSize: '0.7rem' }} /> Reject
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </ShakeOnMount>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="modal-overlay" onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FaTimesCircle style={{ color: '#dc2626' }} /> Reject Submission
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Provide a reason for rejection. This will be sent to the creator.
            </p>
            <textarea
              rows="4"
              value={rejectModal.reason}
              onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Enter rejection reason..."
              required
              style={{
                width: '100%', padding: '0.75rem', border: '1.5px solid var(--border)',
                borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem',
                resize: 'vertical', marginBottom: '1rem', background: 'var(--input-bg)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="modal-actions">
              <button
                onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px',
                  background: 'var(--card-bg-hover)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal.requestId}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '8px',
                  background: '#dc2626', color: 'white', border: 'none',
                  cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                  opacity: actionLoading === rejectModal.requestId ? 0.7 : 1,
                }}
              >
                {actionLoading === rejectModal.requestId ? 'Rejecting...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamOfficeSubmissions;