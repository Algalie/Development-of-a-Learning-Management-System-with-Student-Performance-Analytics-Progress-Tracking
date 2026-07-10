import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaEye, FaSpinner, FaUserGraduate, FaTasks,
  FaCalendarAlt, FaClock, FaUsers, FaBuilding, FaGraduationCap,
  FaCheckCircle, FaTimesCircle, FaPencilAlt, FaArchive,
  FaClipboardCheck
} from 'react-icons/fa';

const ViewCourse = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await adminApi.viewCourse(id);
      setCourse(res.data.course || res.data);
    } catch (error) {
      toast.error('Failed to load course');
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaPencilAlt /> Draft</span>;
    if (status === 'finalized') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    if (status && status.startsWith('pending_')) return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending {status.replace('pending_', '').toUpperCase()}</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaPencilAlt /> Draft</span>;
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <FaUserGraduate style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: '#0A2A66' }}>Course Not Found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The requested course could not be found.</p>
          <Link to="/admin/course-approvals" className="btn btn-primary">Back to Course Approvals</Link>
        </div>
      </div>
    );
  }

  const students = course.students || [];
  const assessments = course.assessments || [];

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
          <Link to="/admin/course-approvals" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Approvals
          </Link>
          <h1>Course Details</h1>
        </div>
      </FadeIn>

      <div style={{
        background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: '10px',
        padding: '1rem 1.25rem', marginBottom: '1.5rem', color: 'var(--blue-text)',
        fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <FaEye style={{ fontSize: '1.1rem' }} />
        <span><strong>View Only:</strong> You are viewing this course as an administrator. Approval actions are handled by HOD, Dean, and Exam Office.</span>
      </div>

      {/* Course Header */}
      <div style={{
        background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
        border: `1px solid ${border}`, boxShadow: shadowSm,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: textMuted, fontWeight: 500, fontFamily: 'monospace' }}>{course.course_code}</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: cardBgHover, color: textSec, border: `1px solid ${border}` }}>{course.program_type}</span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.3rem' }}>{course.course_name}</h2>
          <p style={{ color: textSec, fontSize: '0.85rem', margin: 0 }}>
            Created by {course.created_by?.full_name || 'Unknown'} · {course.created_at ? new Date(course.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
          </p>
        </div>
        <div>
          {!course.is_active ? (
            <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaArchive /> Archived</span>
          ) : getStatusBadge(course.approval_status)}
        </div>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <FaCalendarAlt />, label: 'Semester', value: course.semester || 'N/A' },
          { icon: <FaClock />, label: 'Credit Hours', value: course.credit_hours || 'N/A' },
          { icon: <FaUsers />, label: 'Students', value: students.length },
          { icon: <FaBuilding />, label: 'Department', value: course.department?.name || course.faculty?.name || 'N/A' },
          { icon: <FaGraduationCap />, label: 'Program', value: course.program_type || 'N/A' },
        ].map((item, i) => (
          <div key={i} style={{ background: cardBg, borderRadius: '10px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
            <div style={{ color: '#0A2A66', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#0A2A66' }}>{item.value}</div>
            <div style={{ fontSize: '0.7rem', color: textMuted, textTransform: 'uppercase', fontWeight: 500, marginTop: '0.2rem' }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Grading Scale */}
      <div style={{ background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1.5rem', border: `1px solid ${border}`, display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { grade: 'A', range: '75-100', pts: '5.0', color: '#16a34a' },
          { grade: 'B', range: '65-74', pts: '4.0', color: '#2563eb' },
          { grade: 'C', range: '50-64', pts: '3.0', color: '#ca8a04' },
          { grade: 'D', range: '40-49', pts: '2.0', color: '#ea580c' },
          { grade: 'E', range: '30-39', pts: '1.0 REF', color: '#7c3aed' },
          { grade: 'F', range: '0-29', pts: '0.0 REF', color: '#dc2626' },
        ].map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: textPri, fontWeight: 500 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: g.color }}></div>
            {g.grade} ({g.range}) · {g.pts}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
        {[
          { key: 'students', label: 'Students', icon: <FaUserGraduate />, count: students.length },
          { key: 'assessments', label: 'Assessments', icon: <FaTasks />, count: assessments.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', borderRadius: '8px', background: activeTab === tab.key ? '#0A2A66' : 'transparent', color: activeTab === tab.key ? 'white' : textPri, border: activeTab === tab.key ? 'none' : `1px solid ${border}`, cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}>
            {tab.icon} {tab.label}
            <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover, padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, color: activeTab === tab.key ? 'white' : textSec }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <ShakeOnMount>
          <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm }}>
            {students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}>
                <FaUserGraduate style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
                <p>No students enrolled in this course.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                    <th style={thStyle}>ID</th><th style={thStyle}>Name</th>
                    <th style={thStyle}>Test</th><th style={thStyle}>Assign</th><th style={thStyle}>Attend</th>
                    <th style={thStyle}>CA</th><th style={thStyle}>Exam</th><th style={thStyle}>Total</th>
                    <th style={thStyle}>Grade</th><th style={thStyle}>GP</th><th style={thStyle}>Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const ref = course.reference_grades?.find(r => r.student_id === student.id);
                    return (
                      <tr key={student.id} style={{ borderBottom: `1px solid ${border}` }}>
                        <td style={tdStyle}><strong style={{ color: '#0A2A66' }}>{student.student_id}</strong></td>
                        <td style={{ ...tdStyle, color: textPri }}>{student.student_name}</td>
                        <td style={tdStyle}>{student.test_score != null ? student.test_score : '—'}</td>
                        <td style={tdStyle}>{student.assignment_score != null ? student.assignment_score : '—'}</td>
                        <td style={tdStyle}>{student.attendance_score != null ? student.attendance_score : '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{student.continuous_assessment != null ? student.continuous_assessment.toFixed(1) : '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{student.exam_score != null ? student.exam_score : '—'}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#0A2A66' }}>{student.total_score != null ? student.total_score.toFixed(1) : '—'}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 700, color: student.grade === 'A' ? '#16a34a' : student.grade === 'B' ? '#2563eb' : student.grade === 'C' ? '#ca8a04' : student.grade === 'D' ? '#ea580c' : student.grade === 'E' ? '#7c3aed' : '#dc2626' }}>{student.grade || '—'}</span>
                        </td>
                        <td style={tdStyle}>{student.grade_points != null ? student.grade_points.toFixed(1) : '—'}</td>
                        <td style={tdStyle}>
                          {ref?.display_grade ? (
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                              <span style={{ color: '#16a34a' }}>{ref.display_grade.split('/')[0]}</span>
                              <span style={{ color: textMuted }}> / </span>
                              <span style={{ color: '#dc2626' }}>{ref.display_grade.split('/')[1]}</span>
                            </span>
                          ) : ['E', 'F'].includes(student.grade) ? (
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}>RESIT</span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </ShakeOnMount>
      )}

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm }}>
          {assessments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}>
              <FaTasks style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
              <p>No assessments added for this course.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={thStyle}>Name</th><th style={thStyle}>Type</th><th style={thStyle}>Max Score</th><th style={thStyle}>Weight</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map(a => (
                  <tr key={a.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={tdStyle}><strong style={{ color: '#0A2A66' }}>{a.assessment_name}</strong></td>
                    <td style={{ ...tdStyle, color: textPri }}>{a.assessment_type?.charAt(0).toUpperCase() + a.assessment_type?.slice(1)}</td>
                    <td style={tdStyle}>{a.max_score}</td>
                    <td style={tdStyle}>{a.weight}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
        <Link to="/admin/course-approvals" className="btn btn-outline">
          <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course Approvals
        </Link>
        <Link to="/admin/exam-office-submissions" className="btn btn-primary">
          <FaClipboardCheck style={{ marginRight: '0.3rem' }} /> Exam Office Submissions
        </Link>
      </div>
    </div>
  );
};

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' };
const tdStyle = { padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' };

export default ViewCourse;