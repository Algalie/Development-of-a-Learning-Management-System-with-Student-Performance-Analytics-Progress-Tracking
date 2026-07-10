import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaEye, FaSpinner, FaBook, FaCheckCircle, 
  FaTimesCircle, FaClock, FaPencilAlt
} from 'react-icons/fa';

const CourseApprovals = () => {
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ total_courses: 0, pending_hod: 0, pending_dean: 0, pending_exam: 0, finalized: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await adminApi.getCourseApprovals();
      setCourses(res.data.courses || []);
      setStats(res.data.stats || { total_courses: 0, pending_hod: 0, pending_dean: 0, pending_exam: 0, finalized: 0, rejected: 0 });
    } catch (error) {
      toast.error('Failed to load course approvals');
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
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
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <div>
            <h1>Course Approvals</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Monitor all courses and their approval status
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
        <span><strong>View Only:</strong> You are monitoring course approvals. Approval actions are handled by HOD, Dean, and Exam Office.</span>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '1rem', marginBottom: '2rem',
      }}>
        {[
          { label: 'Total Courses', value: stats.total_courses, color: '#0A2A66', bg: '#f0f4ff' },
          { label: 'Pending HOD', value: stats.pending_hod, color: '#ca8a04', bg: '#fefce8' },
          { label: 'Pending Dean', value: stats.pending_dean, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Pending Exam', value: stats.pending_exam, color: '#ea580c', bg: '#fff7ed' },
          { label: 'Finalized', value: stats.finalized, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Rejected', value: stats.rejected, color: '#dc2626', bg: '#fef2f2' },
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

      {/* Courses Table */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border)',
        overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '2px solid var(--border)' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Course</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Program</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Lecturer</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Department</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Students</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Submitted</th>
              <th style={{ padding: '14px 20px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-muted)' }}>
                    <FaBook style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500 }}>No courses found</p>
                  </div>
                </td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--card-bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--card-bg)'}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>{course.course_code}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.15rem' }}>{course.course_name}</div>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{course.program_type}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{course.created_by?.full_name || 'N/A'}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {course.department?.name || <span style={{ color: 'var(--text-muted)' }}>N/A</span>}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <span style={{ background: 'var(--card-bg-hover)', padding: '3px 10px', borderRadius: '6px', fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {course.students?.length || 0}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>{getStatusBadge(course.approval_status)}</td>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {course.created_at ? new Date(course.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <Link
                      to={`/admin/course/${course.id}/view`}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseApprovals;