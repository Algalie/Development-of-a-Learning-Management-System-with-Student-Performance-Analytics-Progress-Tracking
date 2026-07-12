import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaEye, FaSpinner, FaBook, 
  FaCalculator, FaFileAlt, FaSyncAlt, FaUser, FaClock, 
  FaUsers, FaCheckCircle, FaSignature, FaEdit, FaUndo,
  FaExclamationTriangle, FaUserPlus, FaBell
} from 'react-icons/fa';

const PendingApprovals = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [data, setData] = useState({ 
    pending_courses: [], pending_grades: [], pending_references: [], 
    pending_grade_edits: [], pending_missing: [] 
  });
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: '' });
  const [signModal, setSignModal] = useState({ open: false, requestId: null, signature: '', type: 'approval' });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await lecturerApi.getPendingApprovals();
      if (res.data) setData(res.data);
    } catch (error) {
      toast.error('Failed to load pending approvals', { duration: 1000 });
    } finally { setLoading(false); }
  };

  // ===== Approval Actions =====
  const handleApproveClick = (requestId) => {
    setSignModal({ open: true, requestId, signature: user?.full_name || '', type: 'approval' });
  };

  const handleApprove = async () => {
    if (!signModal.signature.trim()) { toast.error('Please enter your signature', { duration: 1000 }); return; }
    setActionLoading(signModal.requestId);
    try {
      await lecturerApi.approveSubmission(signModal.requestId, { signature: signModal.signature });
      toast.success('Approved with signature!', { duration: 1000 });
      setSignModal({ open: false, requestId: null, signature: '', type: 'approval' });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Approval failed', { duration: 1000 }); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please enter a reason', { duration: 1000 }); return; }
    setActionLoading(rejectModal.requestId);
    try {
      await lecturerApi.rejectSubmission(rejectModal.requestId, rejectModal.reason);
      toast.success('Rejected', { duration: 1000 });
      setRejectModal({ open: false, requestId: null, reason: '' });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Rejection failed', { duration: 1000 }); }
    finally { setActionLoading(null); }
  };

  // ===== Grade Edit Actions =====
  const handleEditApproveClick = (editId) => {
    setSignModal({ open: true, requestId: editId, signature: user?.full_name || '', type: 'edit' });
  };

  const handleEditApprove = async () => {
    if (!signModal.signature.trim()) { toast.error('Please enter your signature', { duration: 1000 }); return; }
    setActionLoading(signModal.requestId);
    try {
      await lecturerApi.reviewGradeEdit(signModal.requestId, { decision: 'approved', comment: '', signature: signModal.signature });
      toast.success('Grade edit approved!', { duration: 1000 });
      setSignModal({ open: false, requestId: null, signature: '', type: 'edit' });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed', { duration: 1000 }); }
    finally { setActionLoading(null); }
  };

  const handleEditReject = async (editId) => {
    setActionLoading(editId);
    try {
      await lecturerApi.reviewGradeEdit(editId, { decision: 'rejected', comment: 'Rejected', signature: user?.full_name || '' });
      toast.success('Grade edit rejected', { duration: 1000 });
      fetchData();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed', { duration: 1000 }); }
    finally { setActionLoading(null); }
  };

  // ===== Missing Student Actions =====
const handleNotifyLecturer = async (notif) => {
    const msg = notif.message || '';
    // Parse: "Student Name (ID) is missing from COURSE_CODE. Lecturer: Lecturer Name"
    const studentMatch = msg.match(/(.+) \((\d+)\) is missing from (\w+)\. Lecturer: (.+)/);
    
    if (!studentMatch) {
      toast.error('Could not parse notification details');
      return;
    }

    const studentName = studentMatch[1];
    const studentId = studentMatch[2];
    const courseCode = studentMatch[3];

    try {
      await lecturerApi.forwardMissingStudent({
        course_code: courseCode,
        student_name: studentName,
        student_id: studentId,
      });
      toast.success(`Notification sent to lecturer for ${courseCode}!`);
      fetchData(); // Refresh
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to forward notification');
    }
  };

  const tabs = [
    { key: 'courses', label: 'Course', icon: <FaBook />, data: data?.pending_courses || [] },
    { key: 'grades', label: 'Grades', icon: <FaCalculator />, data: data?.pending_grades || [] },
    { key: 'reference', label: 'Reference', icon: <FaSyncAlt />, data: data?.pending_references || [] },
    { key: 'grade_edits', label: 'Grade Edits', icon: <FaEdit />, data: data?.pending_grade_edits || [] },
    { key: 'missing_students', label: 'Missing Students', icon: <FaExclamationTriangle />, data: data?.pending_missing || [] },
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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem' }}><FaSpinner className="loading-spinner" /><p style={{ color: textSec, marginTop: '1rem' }}>Loading...</p></div>
      </div>
    );
  }

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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '8px',
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

      {/* Empty State */}
      {currentData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
          <FaCheckCircle style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
          <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Pending {activeTab.replace(/_/g, ' ')}</h3>
          <p>All items have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* ===== MISSING STUDENTS TAB ===== */}
          {activeTab === 'missing_students' && currentData.map(notif => (
            <motion.div key={notif.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca', boxShadow: shadowSm, padding: '1.25rem 1.5rem', borderLeft: '4px solid #dc2626' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaExclamationTriangle style={{ color: '#dc2626', fontSize: '1.2rem' }} />
                  <span style={{ fontWeight: 700, color: '#991b1b' }}>Missing Student Alert</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: textMuted }}>
                  <FaClock style={{ marginRight: '0.2rem' }} />{notif.created_at ? new Date(notif.created_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              <p style={{ color: '#991b1b', fontSize: '0.9rem', margin: '0.5rem 0', lineHeight: 1.5 }}>{notif.message}</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                <button onClick={() => handleNotifyLecturer(notif)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 1rem', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  <FaBell style={{ fontSize: '0.7rem' }} /> Notify Lecturer
                </button>
              </div>
            </motion.div>
          ))}

          {/* ===== GRADE EDITS ===== */}
          {activeTab === 'grade_edits' && currentData.map(req => (
            <div key={req.id} style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: shadowSm, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#f5f3ff', color: '#7c3aed' }}>Grade Edit</span>
                  <span style={{ marginLeft: '0.75rem', fontWeight: 600, color: '#0A2A66' }}>{req.student_name} ({req.student_id})</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: textMuted }}><FaClock style={{ marginRight: '0.2rem' }} />{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: cardBgHover, borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div><div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Course</div><div style={{ fontWeight: 600, color: textPri, fontSize: '0.85rem' }}>{req.course_code}: {req.course_name}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Field</div><div style={{ fontWeight: 600, color: textPri, fontSize: '0.85rem' }}>{req.requested_field?.replace(/_/g, ' ')}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Current → New</div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}><span style={{ color: '#dc2626' }}>{req.current_value}</span> → <span style={{ color: '#16a34a' }}>{req.new_value}</span></div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Requested By</div><div style={{ fontWeight: 600, color: textPri, fontSize: '0.85rem' }}>{req.requested_by}</div></div>
              </div>
              <div style={{ fontSize: '0.85rem', color: textSec, marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#fefce8', borderRadius: '8px', borderLeft: '3px solid #ca8a04' }}><strong>Reason:</strong> {req.reason}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleEditApproveClick(req.id)} disabled={actionLoading === req.id}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', opacity: actionLoading === req.id ? 0.7 : 1 }}>
                  {actionLoading === req.id ? <FaSpinner className="animate-spin" /> : <FaSignature />} Sign & Approve
                </button>
                <button onClick={() => handleEditReject(req.id)}
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  <FaTimes /> Reject
                </button>
              </div>
            </div>
          ))}

          {/* ===== COURSES / GRADES / REFERENCES ===== */}
          {['courses', 'grades', 'reference'].includes(activeTab) && currentData.map(req => (
            <div key={req.id} style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: shadowSm, padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div><span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: '#f1f5f9', color: textPri }}>{req.submission_type}</span>
                  <span style={{ marginLeft: '0.75rem', fontWeight: 600, color: '#0A2A66' }}>{req.course?.course_code || 'N/A'}: {req.course?.course_name || 'N/A'}</span></div>
                <span style={{ fontSize: '0.8rem', color: textMuted }}><FaClock style={{ marginRight: '0.2rem' }} />{req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: textSec, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                <span><FaUsers style={{ marginRight: '0.2rem', color: textMuted }} />{req.course?.students?.length || 0} students</span>
                <span>By: <strong style={{ color: textPri }}>{req.creator?.full_name || 'N/A'}</strong></span>
                {req.signature && <span style={{ color: '#16a34a' }}><FaSignature /> {req.signature}</span>}
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
                <Link to={`/lecturer/course/${req.submission_id || req.course?.id}`} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: cardBgHover, color: textPri, border: `1px solid ${border}`, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}><FaEye /> Review</Link>
                <button onClick={() => handleApproveClick(req.id)} disabled={actionLoading === req.id} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', opacity: actionLoading === req.id ? 0.7 : 1 }}>{actionLoading === req.id ? <FaSpinner className="animate-spin" /> : <FaSignature />} Sign & Approve</button>
                <button onClick={() => setRejectModal({ open: true, requestId: req.id, reason: '' })} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}><FaTimes /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Signature Modal */}
      <AnimatePresence>
        {signModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}
            onClick={() => setSignModal({ open: false, requestId: null, signature: '', type: 'approval' })}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: cardBg, borderRadius: '20px', padding: '2rem', maxWidth: '420px', width: '90%', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}` }}>
              <FaSignature style={{ fontSize: '2rem', color: '#0A2A66', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>{signModal.type === 'edit' ? 'Sign Grade Edit' : 'Sign Your Approval'}</h3>
              <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Enter your full name as digital signature.</p>
              <input type="text" value={signModal.signature} onChange={e => setSignModal({ ...signModal, signature: e.target.value })} placeholder="Type your full name"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif', marginBottom: '1.5rem', textAlign: 'center' }} />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setSignModal({ open: false, requestId: null, signature: '', type: 'approval' })} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: cardBgHover, border: `1px solid ${border}`, cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button onClick={signModal.type === 'edit' ? handleEditApprove : handleApprove} disabled={actionLoading === signModal.requestId || !signModal.signature.trim()}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', background: '#16a34a', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif', opacity: actionLoading === signModal.requestId ? 0.7 : 1 }}>
                  {actionLoading === signModal.requestId ? 'Processing...' : 'Sign & Approve'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}
            onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: cardBg, borderRadius: '20px', padding: '2rem', maxWidth: '450px', width: '90%', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}` }}>
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Reject Submission</h3>
              <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1rem' }}>Provide a reason for rejection.</p>
              <textarea rows="4" value={rejectModal.reason} onChange={e => setRejectModal({ ...rejectModal, reason: e.target.value })} placeholder="Enter rejection reason..."
                style={{ width: '100%', padding: '0.75rem', border: `1.5px solid ${border}`, borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', resize: 'vertical', marginBottom: '1rem', background: 'var(--input-bg)', color: textPri }} />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: cardBgHover, color: textPri, border: `1px solid ${border}`, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>Cancel</button>
                <button onClick={handleReject} disabled={actionLoading === rejectModal.requestId} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', background: '#dc2626', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', opacity: actionLoading === rejectModal.requestId ? 0.7 : 1 }}>{actionLoading === rejectModal.requestId ? 'Rejecting...' : 'Submit Rejection'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PendingApprovals;