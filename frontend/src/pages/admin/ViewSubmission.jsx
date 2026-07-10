import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSpinner, FaInfoCircle, FaChartLine, FaBook,
  FaCheckCircle, FaTimesCircle, FaClock, FaProjectDiagram,
  FaUsers, FaFileAlt
} from 'react-icons/fa';

const ViewSubmission = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSubmission(); }, [id]);

  const fetchSubmission = async () => {
    try {
      const res = await adminApi.viewSubmission(id);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load submission');
    } finally { setLoading(false); }
  };

  const getTypeBadge = (type) => {
    const config = {
      course: { label: 'Course', bg: '#f0f4ff', color: '#0A2A66' },
      ca: { label: 'CA', bg: '#f5f3ff', color: '#7c3aed' },
      exam: { label: 'Exam', bg: '#f0fdf4', color: '#16a34a' },
      reference: { label: 'Reference', bg: '#fef2f2', color: '#dc2626' },
    };
    const c = config[type] || config.course;
    return <span style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', background: c.bg, color: c.color }}>{c.label}</span>;
  };

  const getStatusBadge = (status) => {
    if (status === 'finalized') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> {status?.replace('pending_', '').toUpperCase() || 'Pending'}</span>;
  };

  const getGradeBadge = (grade) => {
    const colors = { A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#ea580c', E: '#7c3aed', F: '#dc2626' };
    const bgs = { A: '#f0fdf4', B: '#eff6ff', C: '#fefce8', D: '#fff7ed', E: '#f5f3ff', F: '#fef2f2' };
    return { color: colors[grade] || '#475569', bg: bgs[grade] || '#f1f5f9' };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading submission...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <FaFileAlt style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: '#0A2A66' }}>Submission Not Found</h3>
          <Link to="/admin/exam-office-submissions" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to Submissions</Link>
        </div>
      </div>
    );
  }

  const { approval_request, course, students } = data;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/exam-office-submissions" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Submissions
          </Link>
          <h1>Submission Details</h1>
        </div>
      </FadeIn>

      <ShakeOnMount>
        {/* Submission Header */}
        <div style={{
          background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
          border: `1px solid ${border}`, boxShadow: shadowSm,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.25rem' }}>
              {approval_request?.submission_type?.toUpperCase()} Submission #{approval_request?.id}
            </h2>
            {course && <p style={{ color: textSec, fontSize: '0.9rem', margin: 0 }}>{course.course_code}: {course.course_name}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {getTypeBadge(approval_request?.submission_type)}
            {getStatusBadge(approval_request?.status)}
          </div>
        </div>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FaInfoCircle style={{ color: '#0A2A66' }} /> Submission Info
            </h3>
            {[
              ['Type', approval_request?.submission_type?.toUpperCase()],
              ['Creator', approval_request?.creator?.full_name || 'N/A'],
              ['Role', approval_request?.creator_role?.replace(/_/g, ' ') || 'N/A'],
              ['Submitted', approval_request?.submitted_at ? new Date(approval_request.submitted_at).toLocaleString() : 'N/A'],
            ].map(([label, value], i) => (
              <div key={i} style={{ display: 'flex', marginBottom: i < 3 ? '0.6rem' : '0', fontSize: '0.85rem' }}>
                <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0A2A66' }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <FaChartLine style={{ color: '#0A2A66' }} /> Status Info
            </h3>
            <div style={{ display: 'flex', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
              <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>Status</span>
              <span style={{ fontWeight: 600, color: '#0A2A66' }}>{approval_request?.status_display || approval_request?.status}</span>
            </div>
            <div style={{ display: 'flex', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
              <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>Level</span>
              <span style={{ fontWeight: 600, color: '#0A2A66', textTransform: 'uppercase' }}>{approval_request?.current_level || 'N/A'}</span>
            </div>
            {approval_request?.finalized_at && (
              <div style={{ display: 'flex', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>Finalized</span>
                <span style={{ fontWeight: 600, color: '#16a34a' }}>{new Date(approval_request.finalized_at).toLocaleString()}</span>
              </div>
            )}
            {approval_request?.rejected_at && (
              <div style={{ display: 'flex', fontSize: '0.85rem' }}>
                <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>Rejected</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>{new Date(approval_request.rejected_at).toLocaleString()}</span>
              </div>
            )}
          </div>

          {course && (
            <div style={{ background: cardBg, borderRadius: '12px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
              <h3 style={{ color: '#0A2A66', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaBook style={{ color: '#0A2A66' }} /> Course Info
              </h3>
              {[
                ['Course', course.course_code],
                ['Name', course.course_name],
                ['Semester', course.semester],
                ['Students', students?.length || 0],
              ].map(([label, value], i) => (
                <div key={i} style={{ display: 'flex', marginBottom: i < 3 ? '0.6rem' : '0', fontSize: '0.85rem' }}>
                  <span style={{ width: '100px', color: textMuted, fontWeight: 500 }}>{label}</span>
                  <span style={{ fontWeight: 600, color: '#0A2A66' }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval Chain */}
        {approval_request?.steps && (
          <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaProjectDiagram style={{ color: '#0A2A66' }} /> Approval Progress
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
              {approval_request.steps.map((step, i) => {
                const isApproved = step.status === 'approved';
                const isPending = step.status === 'pending';
                const isRejected = step.status === 'rejected';
                return (
                  <div key={i} style={{
                    padding: '1.25rem 1rem', borderRadius: '10px',
                    background: isApproved ? '#f0fdf4' : isPending ? '#fefce8' : isRejected ? '#fef2f2' : cardBgHover,
                    border: `1px solid ${isApproved ? '#bbf7d0' : isPending ? '#fde68a' : isRejected ? '#fecaca' : border}`,
                  }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                      {isApproved ? '✅' : isPending ? '⏳' : isRejected ? '❌' : '⏭️'}
                    </div>
                    <div style={{ fontWeight: 700, color: '#0A2A66', fontSize: '0.9rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{step.level}</div>
                    <div style={{ fontSize: '0.8rem', color: isApproved ? '#16a34a' : isPending ? '#ca8a04' : isRejected ? '#dc2626' : textMuted, fontWeight: 600, textTransform: 'capitalize' }}>{step.status}</div>
                    {step.signature && <div style={{ fontSize: '0.7rem', color: textMuted, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${border}` }}>{step.signature}</div>}
                    {step.rejection_reason && <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.5rem' }}>{step.rejection_reason}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Students Table */}
        {students && students.length > 0 && (
          <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm, marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${border}` }}>
              <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                <FaUsers style={{ color: '#0A2A66' }} />
                {approval_request?.submission_type === 'ca' ? 'CA Scores' : approval_request?.submission_type === 'exam' ? 'Exam Results' : 'Student List'}
              </h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={th}>ID</th><th style={th}>Name</th>
                  {['ca', 'exam'].includes(approval_request?.submission_type) && <th style={th}>CA (40)</th>}
                  {approval_request?.submission_type === 'exam' && <><th style={th}>Exam (60)</th><th style={th}>Total</th><th style={th}>Grade</th><th style={th}>GP</th></>}
                  {approval_request?.submission_type === 'reference' && <><th style={th}>Original</th><th style={th}>Reference</th><th style={th}>Display</th></>}
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const ref = course?.reference_grades?.find(r => r.student_id === student.id);
                  const origGrade = ref?.original_grade ? getGradeBadge(ref.original_grade) : null;
                  const refGrade = ref?.reference_grade ? getGradeBadge(ref.reference_grade) : null;
                  return (
                    <tr key={student.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={td}><strong style={{ color: '#0A2A66' }}>{student.student_id}</strong></td>
                      <td style={{ ...td, color: textPri }}>{student.student_name}</td>
                      {['ca', 'exam'].includes(approval_request?.submission_type) && (
                        <td style={{ ...td, fontWeight: 600 }}>{student.continuous_assessment != null ? student.continuous_assessment.toFixed(1) : '—'}</td>
                      )}
                      {approval_request?.submission_type === 'exam' && (
                        <>
                          <td style={{ ...td, fontWeight: 600 }}>{student.exam_score != null ? student.exam_score : '—'}</td>
                          <td style={{ ...td, fontWeight: 700, color: '#0A2A66' }}>{student.total_score != null ? student.total_score.toFixed(1) : '—'}</td>
                          <td style={td}>
                            <span style={{ fontWeight: 700, color: student.grade === 'A' ? '#16a34a' : student.grade === 'B' ? '#2563eb' : student.grade === 'C' ? '#ca8a04' : student.grade === 'D' ? '#ea580c' : student.grade === 'E' ? '#7c3aed' : '#dc2626' }}>{student.grade || '—'}</span>
                          </td>
                          <td style={td}>{student.grade_points != null ? student.grade_points.toFixed(1) : '—'}</td>
                        </>
                      )}
                      {approval_request?.submission_type === 'reference' && (
                        <>
                          <td style={td}>{origGrade && <span style={{ padding: '3px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', background: origGrade.bg, color: origGrade.color }}>{ref.original_grade}</span>}</td>
                          <td style={td}>{refGrade && <span style={{ padding: '3px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', background: refGrade.bg, color: refGrade.color }}>{ref.reference_grade}</span>}</td>
                          <td style={td}>{ref?.display_grade || '—'}</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Back Button */}
        <div style={{ paddingTop: '1rem', borderTop: `1px solid ${border}` }}>
          <Link to="/admin/exam-office-submissions" className="btn btn-outline">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Submissions
          </Link>
        </div>
      </ShakeOnMount>
    </div>
  );
};

const th = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' };
const td = { padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' };

export default ViewSubmission;