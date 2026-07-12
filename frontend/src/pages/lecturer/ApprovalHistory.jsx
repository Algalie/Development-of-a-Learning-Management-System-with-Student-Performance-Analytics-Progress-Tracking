import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaPaperPlane, FaCheckCircle, FaTimesCircle, FaClock,
  FaSpinner, FaHistory, FaEye, FaEdit, FaUndo
} from 'react-icons/fa';

const ApprovalHistory = () => {
  const [data, setData] = useState({ 
    my_submissions: [], 
    my_approvals: [], 
    my_edit_requests: [], 
    my_edit_reviews: [] 
  });
  const [activeTab, setActiveTab] = useState('submissions');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await lecturerApi.getMyApprovalHistory();
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load history', { duration: 1000 });
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    if (status === 'finalized') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    if (status === 'approved') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Approved</span>;
    if (status === 'applied') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Applied</span>;
    if (status === 'pending_hod') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending HOD</span>;
    if (status === 'pending_dean') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending Dean</span>;
    if (status === 'pending_exam') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending Exam</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> {status}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  const submissions = data.my_submissions || [];
  const approvals = data.my_approvals || [];
  const editRequests = data.my_edit_requests || [];
  const editReviews = data.my_edit_reviews || [];

  const tabs = [
    { key: 'submissions', label: 'My Submissions', icon: <FaPaperPlane />, count: submissions.length },
    { key: 'approvals', label: 'My Approvals', icon: <FaCheckCircle />, count: approvals.length },
    { key: 'edit_requests', label: 'Grade Edit Requests', icon: <FaEdit />, count: editRequests.length },
    { key: 'edit_reviews', label: 'Grade Edit Reviews', icon: <FaUndo />, count: editReviews.length },
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/lecturer/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <h1>Approval History</h1>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
              border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
            <span style={{
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover,
              padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
              color: activeTab === tab.key ? 'white' : textSec,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <ShakeOnMount>
        {/* ==================== MY SUBMISSIONS ==================== */}
        {activeTab === 'submissions' && (
          submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
              <FaPaperPlane style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66' }}>No Submissions Yet</h3>
              <p>Your submitted courses and grades will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {submissions.map(req => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: cardBg, borderRadius: '12px', padding: '1.25rem 1.5rem',
                    border: `1px solid ${border}`, boxShadow: shadowSm,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                  }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#0A2A66' }}>{req.submission_type}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div style={{ fontWeight: 600, color: '#0A2A66' }}>{req.course?.course_code}: {req.course?.course_name}</div>
                    <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.25rem' }}>
                      Submitted: {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'N/A'}
                      {req.finalized_at && ` • Finalized: ${new Date(req.finalized_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Link to={`/lecturer/course/${req.submission_id || req.course?.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                      background: cardBgHover, color: '#0A2A66', border: `1px solid ${border}`,
                      textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                    }}><FaEye /> View Course</Link>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* ==================== MY APPROVALS ==================== */}
        {activeTab === 'approvals' && (
          approvals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
              <FaCheckCircle style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66' }}>No Approvals Yet</h3>
              <p>Your approvals/rejections will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {approvals.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: cardBg, borderRadius: '12px', padding: '1.25rem 1.5rem',
                    border: `1px solid ${border}`, boxShadow: shadowSm,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
                  }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: '#0A2A66' }}>{item.request?.submission_type}</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                        background: item.step?.status === 'approved' ? '#f0fdf4' : '#fef2f2',
                        color: item.step?.status === 'approved' ? '#16a34a' : '#dc2626',
                      }}>{item.step?.status === 'approved' ? 'Approved' : 'Rejected'}</span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#0A2A66' }}>{item.request?.course?.course_code}: {item.request?.course?.course_name}</div>
                    <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.25rem' }}>
                      By: {item.request?.creator?.full_name} • {item.step?.approved_at ? new Date(item.step.approved_at).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* ==================== GRADE EDIT REQUESTS I MADE ==================== */}
        {activeTab === 'edit_requests' && (
          editRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
              <FaEdit style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66' }}>No Grade Edit Requests</h3>
              <p>Your grade edit requests will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {editRequests.map(req => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem 1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed' }}>Grade Edit</span>
                    {getStatusBadge(req.status)}
                  </div>
                  <div style={{ fontWeight: 600, color: '#0A2A66' }}>{req.student_name} ({req.student_id}) — {req.course_code}: {req.course_name}</div>
                  <div style={{ fontSize: '0.85rem', color: textSec, marginTop: '0.25rem' }}>
                    Field: <strong>{req.requested_field?.replace(/_/g, ' ')}</strong> | {' '}
                    {req.current_value} → <strong style={{ color: '#16a34a' }}>{req.new_value}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.25rem' }}>Reason: {req.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.25rem' }}>
                    Requested: {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}

        {/* ==================== GRADE EDIT REVIEWS I MADE ==================== */}
        {activeTab === 'edit_reviews' && (
          editReviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
              <FaUndo style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66' }}>No Grade Edit Reviews</h3>
              <p>Grade edits you've reviewed will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {editReviews.map(req => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem 1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: '#f5f3ff', color: '#7c3aed' }}>Grade Edit</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                      background: req.hod_decision === 'approved' || req.dean_decision === 'approved' ? '#f0fdf4' : '#fef2f2',
                      color: req.hod_decision === 'approved' || req.dean_decision === 'approved' ? '#16a34a' : '#dc2626',
                    }}>
                      {req.hod_decision === 'approved' || req.dean_decision === 'approved' ? 'Approved' : req.dean_decision === 'rejected' || req.hod_decision === 'rejected' ? 'Rejected' : 'Reviewed'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, color: '#0A2A66' }}>{req.student_name} ({req.student_id}) — {req.course_code}: {req.course_name}</div>
                  <div style={{ fontSize: '0.85rem', color: textSec, marginTop: '0.25rem' }}>
                    Field: <strong>{req.requested_field?.replace(/_/g, ' ')}</strong> | {' '}
                    {req.current_value} → <strong>{req.new_value}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: textMuted, marginTop: '0.25rem' }}>Reason: {req.reason}</div>
                  {req.hod_signature && <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>HOD Signature: {req.hod_signature}</div>}
                  {req.dean_signature && <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '0.25rem' }}>Dean Signature: {req.dean_signature}</div>}
                  <div style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.25rem' }}>
                    Reviewed: {req.hod_reviewed_at ? new Date(req.hod_reviewed_at).toLocaleDateString() : req.dean_reviewed_at ? new Date(req.dean_reviewed_at).toLocaleDateString() : 'N/A'}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </ShakeOnMount>
    </div>
  );
};

export default ApprovalHistory;