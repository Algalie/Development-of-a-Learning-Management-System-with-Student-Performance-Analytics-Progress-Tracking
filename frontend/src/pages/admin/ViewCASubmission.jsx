import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaEye, FaCalculator, FaInfoCircle, FaChartBar, 
  FaUsers, FaUserSlash, FaSpinner 
} from 'react-icons/fa';

const ViewCASubmission = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.viewCASubmission(id);
        setData(res.data);
      } catch (error) {
        toast.error('Failed to load CA submission');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;
  }

  if (!data) {
    return <div className="dashboard-container"><div className="empty-state"><h3>Submission Not Found</h3></div></div>;
  }

  const { course, approval, students } = data;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textPri = 'var(--text-primary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/grade-approvals" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Grade Approvals</Link>
          <h1>CA Submission Details</h1>
        </div>
      </FadeIn>

      <div style={{
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        color: 'var(--blue-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        boxShadow: '0 2px 8px rgba(59,130,246,0.06)',
      }}>
        <FaEye style={{ fontSize: '1.5rem', color: '#3b82f6' }} />
        <div><strong>View Only:</strong> You are viewing CA submission details. Approval is handled by HOD, Dean, and Exam Office.</div>
      </div>

      <ShakeOnMount>
        {/* Submission Header */}
        <div style={{
          background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          marginBottom: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
              {course?.course_code}: {course?.course_name}
            </h2>
            <p style={{ color: textSec, fontSize: '0.85rem', margin: 0 }}>
              Submitted by {course?.created_by?.full_name}
            </p>
          </div>
          <div style={{
            background: '#7c3aed', color: 'white', padding: '0.4rem 1.2rem',
            borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <FaCalculator /> CA-{approval?.id}
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaInfoCircle style={{ color: '#FFC107' }} /> Submission Info
            </h3>
            {[
              ['Course', course?.course_code],
              ['Lecturer', course?.created_by?.full_name],
              ['Semester', course?.semester],
              ['Status', approval?.get_status_display?.() || approval?.status],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? `1px solid ${border}` : 'none' }}>
                <span style={{ color: textSec, fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: textPri, fontWeight: 500, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaChartBar style={{ color: '#FFC107' }} /> Statistics
            </h3>
            {[
              ['Students', students?.length || 0],
              ['Scored', students?.filter(s => s.continuous_assessment != null).length || 0],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 1 ? `1px solid ${border}` : 'none' }}>
                <span style={{ color: textSec, fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: textPri, fontWeight: 500, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Students Table */}
        <div style={{
          background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          overflow: 'auto', boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FaUsers style={{ color: '#FFC107' }} /> Student CA Scores
          </h3>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Test (20)</th><th>Assign (10)</th><th>Attend (10)</th><th>CA Total (40)</th></tr>
            </thead>
            <tbody>
              {students?.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state"><FaUserSlash style={{ fontSize: '3rem', color: textMuted, marginBottom: '1rem' }} /><p>No students found</p></div></td></tr>
              ) : (
                students?.map(s => (
                  <tr key={s.id}>
                    <td><strong style={{ color: '#0A2A66' }}>{s.student_id}</strong></td>
                    <td style={{ color: textPri }}>{s.student_name}</td>
                    <td style={{ fontWeight: 600, color: textPri }}>{s.test_score != null ? s.test_score : '-'}</td>
                    <td style={{ fontWeight: 600, color: textPri }}>{s.assignment_score != null ? s.assignment_score : '-'}</td>
                    <td style={{ fontWeight: 600, color: textPri }}>{s.attendance_score != null ? s.attendance_score : '-'}</td>
                    <td style={{ fontWeight: 600, color: '#0A2A66' }}>{s.continuous_assessment != null ? s.continuous_assessment.toFixed(1) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <Link to="/admin/grade-approvals" className="btn btn-outline"><FaArrowLeft /> Back to Grade Approvals</Link>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default ViewCASubmission;