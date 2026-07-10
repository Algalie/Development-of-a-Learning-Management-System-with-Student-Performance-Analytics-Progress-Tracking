import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaCheck, FaTimes, FaEye, FaSpinner, FaBook, FaCalculator, FaFileAlt, FaSyncAlt, FaUser, FaClock, FaUsers, FaCheckCircle } from 'react-icons/fa';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [data, setData] = useState({ pending_courses: [], pending_ca: [], pending_exam: [], pending_references: [] });
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await lecturerApi.getPendingApprovals(activeTab);
      if (res.data) setData(res.data);
    } catch (error) {
      console.error('Failed to load:', error);
      toast.error('Failed to load pending approvals');
    } finally { setLoading(false); }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await lecturerApi.approveSubmission(requestId);
      toast.success('Approved!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please enter a reason'); return; }
    setActionLoading(rejectModal.requestId);
    try {
      await lecturerApi.rejectSubmission(rejectModal.requestId, rejectModal.reason);
      toast.success('Rejected');
      setRejectModal({ open: false, requestId: null, reason: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally { setActionLoading(null); }
  };

  const tabs = [
    { key: 'courses', label: 'Course', icon: <FaBook />, data: data?.pending_courses || [] },
    { key: 'ca', label: 'CA', icon: <FaCalculator />, data: data?.pending_ca || [] },
    { key: 'exam', label: 'Exam', icon: <FaFileAlt />, data: data?.pending_exam || [] },
    { key: 'reference', label: 'Reference', icon: <FaSyncAlt />, data: data?.pending_references || [] },
  ];

  const roleLabel = user?.role === 'head_of_department' ? 'Head of Department' : user?.role === 'dean' ? 'Dean' : 'Exam Officer';
  const currentData = tabs.find(t => t.key === activeTab)?.data || [];

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/lecturer/dashboard" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard</Link>
          <h1>Pending Approvals</h1>
        </div>
      </FadeIn>

      <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', color: '#854d0e', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <FaUser /> {roleLabel} — Reviewing submissions awaiting your approval.
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : textPri,
              border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
            <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover, padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, color: activeTab === tab.key ? 'white' : textSec }}>{tab.data.length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: textSec, marginTop: '1rem' }}>Loading pending approvals...</p>
        </div>
      ) : currentData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
          <FaCheckCircle style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Pending Approvals</h3>
          <p>All {activeTab} submissions have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentData.map(req => (
            <div key={req.id} style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: shadowSm, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: textPri }}>{req.submission_type}</span>
                  <span style={{ marginLeft: '0.75rem', fontWeight: 600, color: '#0A2A66' }}>{req.course?.course_code || 'N/A'}: {req.course?.course_name || 'N/A'}</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: textMuted }}><FaClock style={{ marginRight: '0.2rem' }} />{req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: textSec, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span><FaUsers style={{ marginRight: '0.2rem', color: textMuted }} />{req.course?.students?.length || 0} students</span>
                <span><FaClock style={{ marginRight: '0.2rem', color: textMuted }} />{req.course?.semester} | {req.course?.academic_year}</span>
                <span>By: <strong style={{ color: textPri }}>{req.creator?.full_name || 'N/A'}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: cardBgHover, borderRadius: '8px', padding: '0.5rem' }}>
                {req.steps?.map((step, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', margin: '0 auto 0.25rem', background: step.status === 'approved' ? '#16a34a' : step.status === 'pending' ? '#ca8a04' : textMuted }}></div>
                    <span style={{ fontSize: '0.65rem', color: textMuted, fontWeight: 600 }}>{step.level?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to={`/lecturer/course/${req.submission_id || req.course?.id}`}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: cardBgHover, color: textPri, border: `1px solid ${border}`, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>
                  <FaEye /> Review
                </Link>
                <button onClick={() => handleApprove(req.id)} disabled={actionLoading === req.id}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', opacity: actionLoading === req.id ? 0.7 : 1 }}>
                  {actionLoading === req.id ? <FaSpinner className="animate-spin" /> : <FaCheck />} Approve
                </button>
                <button onClick={() => setRejectModal({ open: true, requestId: req.id, reason: '' })}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectModal.open && (
        <div className="modal-overlay" onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Reject Submission</h3>
            <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1rem' }}>Provide a reason for rejection.</p>
            <textarea rows="4" value={rejectModal.reason} onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })} placeholder="Enter rejection reason..." required
              style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${border}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', resize: 'vertical', marginBottom: '1rem', background: 'var(--input-bg)', color: textPri }} />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: cardBgHover, color: textPri, border: `1px solid ${border}`, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
              <button onClick={handleReject} disabled={actionLoading === rejectModal.requestId}
                style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', opacity: actionLoading === rejectModal.requestId ? 0.7 : 1 }}>
                {actionLoading === rejectModal.requestId ? 'Rejecting...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;