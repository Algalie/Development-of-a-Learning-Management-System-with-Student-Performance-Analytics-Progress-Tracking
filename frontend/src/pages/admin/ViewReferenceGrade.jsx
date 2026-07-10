import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaEye, FaSyncAlt, FaArrowRight, FaBook, FaUserGraduate, FaSpinner 
} from 'react-icons/fa';

const ViewReferenceGrade = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminApi.viewReferenceGrade(id);
        setData(res.data);
      } catch (error) {
        toast.error('Failed to load reference grade');
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
    return <div className="dashboard-container"><div className="empty-state"><h3>Reference Not Found</h3></div></div>;
  }

  const { course, reference, student } = data;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const shadowMd = 'var(--shadow-md)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textPri = 'var(--text-primary)';
  const textMuted = 'var(--text-muted)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '950px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/grade-approvals" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Grade Approvals</Link>
          <h1>Reference Grade Details</h1>
        </div>
      </FadeIn>

      <div style={{
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
        borderRadius: 'var(--radius-lg)', padding: '1rem 1.5rem', marginBottom: '1.5rem',
        color: 'var(--blue-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <FaEye style={{ fontSize: '1.5rem', color: '#3b82f6' }} />
        <div><strong>View Only:</strong> You are viewing reference details. Approval is handled by HOD, Dean, and Exam Office.</div>
      </div>

      <ShakeOnMount>
        {/* Reference Header */}
        <div style={{
          background: cardBg, borderRadius: 'var(--radius-3xl)', padding: '2rem', marginBottom: '1.5rem',
          boxShadow: shadowMd, border: `1px solid ${borderLight}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.7rem', color: '#0A2A66', fontWeight: 700, marginBottom: '0.3rem' }}>
              {course?.course_code}: {course?.course_name}
            </h2>
            <p style={{ color: textSec, fontSize: '0.95rem' }}>
              Student: {student?.student_name} ({student?.student_id})
            </p>
          </div>
          <div style={{
            background: 'var(--purple-bg)', color: 'var(--purple-text)', padding: '0.5rem 1.5rem',
            borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem', border: '1px solid var(--purple-border)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <FaSyncAlt /> REF-{reference?.id}
          </div>
        </div>

        {/* Grade Comparison */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem',
          marginBottom: '1.5rem', flexWrap: 'wrap',
        }}>
          <div style={{
            background: cardBg, borderRadius: 'var(--radius-xl)', padding: '2rem',
            textAlign: 'center', flex: 1, minWidth: '180px',
            boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          }}>
            <div style={{ fontSize: '0.85rem', color: textSec, textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Original Grade</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#dc2626' }}>{reference?.original_grade}</div>
            <div style={{ fontSize: '0.9rem', color: textMuted, marginTop: '0.5rem' }}>{reference?.original_score?.toFixed(1)}%</div>
          </div>
          <div style={{ fontSize: '1.5rem', color: '#FFC107' }}>
            <FaArrowRight />
          </div>
          <div style={{
            background: cardBg, borderRadius: 'var(--radius-xl)', padding: '2rem',
            textAlign: 'center', flex: 1, minWidth: '180px',
            boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          }}>
            <div style={{ fontSize: '0.85rem', color: textSec, textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem' }}>Reference Grade</div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: '#16a34a' }}>{reference?.reference_grade}</div>
            <div style={{ fontSize: '0.9rem', color: textMuted, marginTop: '0.5rem' }}>{reference?.reference_score?.toFixed(1)}%</div>
          </div>
        </div>

        {/* Display Banner */}
        {reference?.display_grade && (
          <div style={{
            background: 'linear-gradient(135deg, #0A2A66, #0d3b8c)',
            borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.5rem',
            textAlign: 'center', color: 'white',
          }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Display Format</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              <span style={{ color: '#10b981' }}>{reference.display_grade.split('/')[0]}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 0.5rem' }}>/</span>
              <span style={{ color: '#ef4444' }}>{reference.display_grade.split('/')[1]}</span>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaBook style={{ color: '#FFC107' }} /> Course Info
            </h3>
            {[
              ['Course', course?.course_code],
              ['Lecturer', course?.created_by?.full_name],
              ['Semester', course?.semester],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 2 ? `1px solid ${border}` : 'none' }}>
                <span style={{ color: textSec, fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: textPri, fontWeight: 500, fontSize: '0.85rem' }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaUserGraduate style={{ color: '#FFC107' }} /> Student Info
            </h3>
            {[
              ['ID', student?.student_id],
              ['Name', student?.student_name],
              ['Status', reference?.reference_status],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 2 ? `1px solid ${border}` : 'none' }}>
                <span style={{ color: textSec, fontSize: '0.85rem' }}>{label}</span>
                <span style={{ color: textPri, fontWeight: 500, fontSize: '0.85rem', textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <Link to="/admin/grade-approvals" className="btn btn-outline"><FaArrowLeft /> Back to Grade Approvals</Link>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default ViewReferenceGrade;