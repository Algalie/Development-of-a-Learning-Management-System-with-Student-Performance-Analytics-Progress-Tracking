import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaSignature,
  FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaUndo,
  FaExclamationTriangle, FaEdit, FaEye, FaHistory
} from 'react-icons/fa';

const GradeEditRequests = () => {
  const [data, setData] = useState({ pending: [], all: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending_exam');
  const [signModal, setSignModal] = useState({ open: false, requestId: null, signature: '', apply: true });
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null });
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getGradeEditRequests();
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load grade edit requests', { duration: 1000 });
    } finally { setLoading(false); }
  };

  const handleActivate = async () => {
    if (!signModal.signature.trim()) {
      toast.error('Please enter your signature', { duration: 1000 });
      return;
    }
    setActionLoading(signModal.requestId);
    try {
      await adminApi.activateGradeEdit(signModal.requestId, {
        signature: signModal.signature,
        apply_edit: signModal.apply,
        reject: false,
      });
      toast.success('Grade edit approved & applied!', { duration: 1000 });
      setSignModal({ open: false, requestId: null, signature: '', apply: true });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed', { duration: 1000 });
    } finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    setActionLoading(rejectModal.requestId);
    try {
      await adminApi.activateGradeEdit(rejectModal.requestId, {
        signature: 'Admin - Exam Office',
        apply_edit: false,
        reject: true,
      });
      toast.success('Grade edit rejected', { duration: 1000 });
      setRejectModal({ open: false, requestId: null });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed', { duration: 1000 });
    } finally { setActionLoading(null); }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Approved</span>;
    if (status === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    if (status === 'applied') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Applied</span>;
    if (status === 'pending_exam') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending Exam Office</span>;
    if (status === 'pending_hod') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f5f3ff', color: '#7c3aed', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending HOD</span>;
    if (status === 'pending_dean') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending Dean</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading grade edit requests...</p>
        </div>
      </div>
    );
  }

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  const tabs = [
    { key: 'pending_exam', label: 'Pending My Review', icon: <FaClock />, count: data.stats?.pending_exam || 0 },
    { key: 'all', label: 'All Requests', icon: <FaHistory />, count: (data.all || []).length },
  ];

  const currentList = activeTab === 'pending_exam' ? (data.pending || []) : (data.all || []);

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <div>
            <h1>Grade Edit Requests</h1>
            <p style={{ color: textSec, fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Review and process grade edit requests from lecturers
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending Exam Office', value: data.stats?.pending_exam || 0, color: '#ca8a04', bg: '#fefce8', icon: <FaClock /> },
          { label: 'Pending HOD', value: data.stats?.pending_hod || 0, color: '#7c3aed', bg: '#f5f3ff', icon: <FaClock /> },
          { label: 'Pending Dean', value: data.stats?.pending_dean || 0, color: '#ca8a04', bg: '#fefce8', icon: <FaClock /> },
          { label: 'Approved/Applied', value: (data.stats?.approved || 0) + (data.stats?.applied || 0), color: '#16a34a', bg: '#f0fdf4', icon: <FaCheckCircle /> },
        ].map((item, i) => (
          <div key={i} style={{
            background: cardBg, borderRadius: '12px', padding: '1.25rem',
            border: `1px solid ${border}`, boxShadow: shadowSm, textAlign: 'center',
          }}>
            <div style={{ color: item.color, fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: '0.75rem', color: textSec, fontWeight: 500 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : textPri,
              border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
            <span style={{
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover,
              padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
              color: activeTab === tab.key ? 'white' : textSec,
            }}>{tab.count}</span>
          </button>
        ))}
      </div>

      <ShakeOnMount>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentList.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem', background: cardBg,
              borderRadius: '12px', border: `1px solid ${border}`, color: textMuted,
            }}>
              <FaCheckCircle style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Grade Edit Requests</h3>
              <p>All requests have been processed.</p>
            </div>
          ) : (
            currentList.map(req => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: cardBg, borderRadius: '12px', padding: '1.25rem 1.5rem',
                  border: `1px solid ${border}`, boxShadow: shadowSm,
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.95rem' }}>
                      {req.student_name} ({req.student_id})
                    </span>
                    <span style={{ marginLeft: '0.75rem', color: textSec, fontSize: '0.85rem' }}>
                      {req.course_code}: {req.course_name}
                    </span>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem', background: cardBgHover, borderRadius: '8px', padding: '0.75rem 1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Field to Edit</div>
                    <div style={{ fontWeight: 600, color: textPri }}>{req.requested_field?.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Current Value</div>
                    <div style={{ fontWeight: 600, color: '#dc2626' }}>{req.current_value}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>New Value</div>
                    <div style={{ fontWeight: 600, color: '#16a34a' }}>{req.new_value}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase' }}>Requested By</div>
                    <div style={{ fontWeight: 600, color: textPri }}><FaUser style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />{req.requested_by}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: textSec, marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: '#fefce8', borderRadius: '8px', borderLeft: '3px solid #ca8a04' }}>
                  <strong>Reason:</strong> {req.reason}
                </div>

                {/* Approval Trail */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem', color: textMuted, flexWrap: 'wrap' }}>
                  {req.hod_reviewed && (
                    <span style={{ color: req.hod_decision === 'approved' ? '#16a34a' : '#dc2626' }}>
                      HOD: {req.hod_decision} {req.hod_signature && `— ${req.hod_signature}`}
                    </span>
                  )}
                  {req.dean_reviewed && (
                    <span style={{ color: req.dean_decision === 'approved' ? '#16a34a' : '#dc2626' }}>
                      Dean: {req.dean_decision} {req.dean_signature && `— ${req.dean_signature}`}
                    </span>
                  )}
                  {!req.hod_reviewed && !req.dean_reviewed && (
                    <span>Awaiting HOD review</span>
                  )}
                </div>

                {/* Actions for Pending Exam Office */}
                {req.status === 'pending_exam' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSignModal({ open: true, requestId: req.id, signature: '', apply: true })}
                      disabled={actionLoading === req.id}
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.3rem', padding: '0.5rem', borderRadius: '8px',
                        background: '#16a34a', color: 'white', border: 'none',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                        fontFamily: 'Inter, sans-serif', opacity: actionLoading === req.id ? 0.7 : 1,
                      }}>
                      {actionLoading === req.id ? <FaSpinner className="animate-spin" /> : <FaSignature />} Sign & Activate Edit
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, requestId: req.id })}
                      style={{
                        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.3rem', padding: '0.5rem', borderRadius: '8px',
                        background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                        fontFamily: 'Inter, sans-serif',
                      }}>
                      <FaTimes /> Reject Request
                    </button>
                  </div>
                )}

                {/* Show if already processed */}
                {req.status === 'approved' && req.edit_applied && (
                  <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a', fontSize: '0.85rem', fontWeight: 500, textAlign: 'center' }}>
                    <FaCheckCircle style={{ marginRight: '0.3rem' }} /> Edit applied — {req.exam_signature}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </ShakeOnMount>

      {/* Signature Modal */}
      <AnimatePresence>
        {signModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)',
            }}
            onClick={() => setSignModal({ open: false, requestId: null, signature: '', apply: true })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: cardBg, borderRadius: '20px', padding: '2rem',
                maxWidth: '420px', width: '90%', textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}`,
              }}
            >
              <FaSignature style={{ fontSize: '2rem', color: '#0A2A66', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Sign & Activate Grade Edit</h3>
              <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Enter your signature to approve and apply this grade edit.
              </p>
              <input
                type="text"
                value={signModal.signature}
                onChange={e => setSignModal({ ...signModal, signature: e.target.value })}
                placeholder="Type your full name"
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '10px',
                  border: `1.5px solid ${border}`, fontSize: '0.9rem',
                  fontFamily: 'Inter, sans-serif', marginBottom: '1.5rem', textAlign: 'center',
                }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setSignModal({ open: false, requestId: null, signature: '', apply: true })}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                    background: cardBgHover, border: `1px solid ${border}`,
                    cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                  }}
                >Cancel</button>
                <button
                  onClick={handleActivate}
                  disabled={actionLoading === signModal.requestId || !signModal.signature.trim()}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                    background: '#16a34a', color: 'white', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    opacity: actionLoading === signModal.requestId ? 0.7 : 1,
                  }}
                >
                  {actionLoading === signModal.requestId ? 'Activating...' : 'Sign & Activate'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)',
            }}
            onClick={() => setRejectModal({ open: false, requestId: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: cardBg, borderRadius: '20px', padding: '2rem',
                maxWidth: '420px', width: '90%', textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}`,
              }}
            >
              <FaExclamationTriangle style={{ fontSize: '2rem', color: '#dc2626', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Reject Grade Edit?</h3>
              <p style={{ color: textSec, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                This will reject the lecturer's request to edit this grade.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => setRejectModal({ open: false, requestId: null })}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                    background: cardBgHover, border: `1px solid ${border}`,
                    cursor: 'pointer', fontWeight: 500, fontFamily: 'Inter, sans-serif',
                  }}
                >Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === rejectModal.requestId}
                  style={{
                    flex: 1, padding: '0.7rem', borderRadius: '10px',
                    background: '#dc2626', color: 'white', border: 'none',
                    cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    opacity: actionLoading === rejectModal.requestId ? 0.7 : 1,
                  }}
                >
                  {actionLoading === rejectModal.requestId ? 'Rejecting...' : 'Reject'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GradeEditRequests;