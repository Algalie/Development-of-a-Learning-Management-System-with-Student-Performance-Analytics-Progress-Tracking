import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaEye, FaSpinner, FaCalculator, FaFileAlt, FaSyncAlt,
  FaCheckCircle, FaTimesCircle, FaClock, FaGraduationCap
} from 'react-icons/fa';

const GradeApprovals = () => {
  const [data, setData] = useState({ 
    grades_approvals: [], ca_approvals: [], exam_approvals: [], reference_approvals: [], 
    rejected_approvals: [], stats: {} 
  });
  const [activeTab, setActiveTab] = useState('grades');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getGradeApprovals();
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load grade approvals');
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    if (status === 'finalized') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> {status?.replace('pending_', '').toUpperCase() || 'Pending'}</span>;
  };

  const tabs = [
    { key: 'grades', label: 'Grades (Combined)', icon: <FaGraduationCap />, data: data.grades_approvals || [], typeClass: 'type-grades' },
    { key: 'ca', label: 'CA (Legacy)', icon: <FaCalculator />, data: data.ca_approvals || [], typeClass: 'type-ca' },
    { key: 'exam', label: 'Exam (Legacy)', icon: <FaFileAlt />, data: data.exam_approvals || [], typeClass: 'type-exam' },
    { key: 'reference', label: 'Reference', icon: <FaSyncAlt />, data: data.reference_approvals || [], typeClass: 'type-reference' },
    { key: 'rejected', label: 'Rejected', icon: <FaTimesCircle />, data: data.rejected_approvals || [], typeClass: '' },
  ];

  const typeConfig = {
    grades: { label: 'Grades', color: '#0A2A66', bg: '#f0f4ff' },
    ca: { label: 'CA', color: '#7c3aed', bg: '#f5f3ff' },
    exam: { label: 'Exam', color: '#16a34a', bg: '#f0fdf4' },
    reference: { label: 'Reference', color: '#dc2626', bg: '#fef2f2' },
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading grade approvals...</p>
        </div>
      </div>
    );
  }

  const currentTab = tabs.find(t => t.key === activeTab);
  const currentData = currentTab?.data || [];

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <div>
            <h1>Grade Approvals</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Monitor all grade submissions
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Monitor Note */}
      <div style={{
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: '10px',
        padding: '1rem 1.25rem', marginBottom: '1.5rem', color: 'var(--blue-text)',
        fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <FaEye style={{ fontSize: '1.1rem' }} />
        <span><strong>View Only:</strong> You are monitoring grade submissions. Approval actions are handled by HOD, Dean, and Exam Office.</span>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {[
          { label: 'Pending Grades', value: data.stats?.pending_grades || 0, color: '#0A2A66', bg: '#f0f4ff' },
          { label: 'Pending CA', value: data.stats?.pending_ca || 0, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Pending Exam', value: data.stats?.pending_exam || 0, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Pending Refs', value: data.stats?.pending_references || 0, color: '#dc2626', bg: '#fef2f2' },
          { label: 'Approved Grades', value: data.stats?.approved_grades || 0, color: '#0A2A66', bg: '#f0f4ff' },
          { label: 'Approved CA', value: data.stats?.approved_ca || 0, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Approved Exam', value: data.stats?.approved_exam || 0, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Rejected', value: data.stats?.rejected || 0, color: '#dc2626', bg: '#fef2f2' },
        ].map((item, i) => (
          <div key={i} style={{
            background: 'var(--card-bg)', borderRadius: '12px', padding: '1.5rem 1.25rem',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color, lineHeight: 1, marginBottom: '0.3rem' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem', flexWrap: 'wrap',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
              border: activeTab === tab.key ? 'none' : '1px solid var(--border)',
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
            <span style={{
              background: activeTab === tab.key ? 'rgba(255,255,255,0.15)' : 'var(--card-bg-hover)',
              padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
              color: activeTab === tab.key ? 'white' : 'var(--text-secondary)',
            }}>
              {tab.data.length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '2px solid var(--border)' }}>
              {activeTab === 'rejected' && (
                <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Type</th>
              )}
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Course</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Creator</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Submitted</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'rejected' ? 6 : 5} style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <FaCheckCircle style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500 }}>No {activeTab} submissions found</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map(req => {
                const type = typeConfig[req.submission_type];
                return (
                  <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--card-bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}>
                    {activeTab === 'rejected' && (
                      <td style={{ padding: '14px 20px' }}>
                        {type && (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: type.bg, color: type.color }}>
                            {type.label}
                          </span>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>{req.course?.course_code || 'N/A'}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>{req.course?.course_name || ''}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{req.creator?.full_name || 'N/A'}</td>
                    <td style={{ padding: '14px 20px' }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <Link
                        to={`/admin/submission/${req.id}/view`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.4rem 0.9rem', borderRadius: '6px',
                          background: 'var(--card-bg-hover)', color: 'var(--text-primary)',
                          border: '1px solid var(--border)', textDecoration: 'none',
                          fontSize: '0.8rem', fontWeight: 500,
                        }}
                      >
                        <FaEye style={{ fontSize: '0.7rem' }} /> View
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GradeApprovals;