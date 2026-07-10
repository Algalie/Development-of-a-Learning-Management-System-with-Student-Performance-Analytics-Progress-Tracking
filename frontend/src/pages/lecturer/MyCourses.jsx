import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaPlus, FaEye, FaPaperPlane, FaUserPlus, FaRedoAlt,
  FaBookOpen, FaArchive, FaCalendarAlt, FaClock, FaUsers, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaPencilAlt
} from 'react-icons/fa';

const MyCourses = () => {
  const [activeTab, setActiveTab] = useState('active');
  const [activeCourses, setActiveCourses] = useState([]);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await lecturerApi.getCourses();
      setActiveCourses(res.data.active_courses || []);
      setArchivedCourses(res.data.archived_courses || []);
    } catch (error) {
      toast.error('Failed to load courses');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (courseId) => {
    if (!window.confirm('Submit this course for approval?')) return;
    try {
      await lecturerApi.submitForApproval('course', courseId);
      toast.success('Course submitted for approval!');
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
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
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading courses...</p>
        </div>
      </div>
    );
  }

  const currentCourses = activeTab === 'active' ? activeCourses : archivedCourses;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Link to="/lecturer/dashboard" className="back-btn">
                <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66' }}>My Courses</h1>
          </div>
          <Link to="/lecturer/create-course" className="btn btn-primary">
            <FaPlus style={{ marginRight: '0.3rem' }} /> Create New Course
          </Link>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
        <button onClick={() => setActiveTab('active')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '8px',
            background: activeTab === 'active' ? '#0A2A66' : 'transparent',
            color: activeTab === 'active' ? 'white' : textPri,
            border: activeTab === 'active' ? 'none' : `1px solid ${border}`,
            cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          }}>
          <FaBookOpen /> Active
          <span style={{
            background: activeTab === 'active' ? 'rgba(255,255,255,0.2)' : cardBgHover,
            padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
            color: activeTab === 'active' ? 'white' : textSec,
          }}>{activeCourses.length}</span>
        </button>
        <button onClick={() => setActiveTab('archived')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '8px',
            background: activeTab === 'archived' ? '#0A2A66' : 'transparent',
            color: activeTab === 'archived' ? 'white' : textPri,
            border: activeTab === 'archived' ? 'none' : `1px solid ${border}`,
            cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          }}>
          <FaArchive /> Archived
          <span style={{
            background: activeTab === 'archived' ? 'rgba(255,255,255,0.2)' : cardBgHover,
            padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
            color: activeTab === 'archived' ? 'white' : textSec,
          }}>{archivedCourses.length}</span>
        </button>
      </div>

      <ShakeOnMount>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {currentCourses.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem', background: cardBg,
              borderRadius: '12px', border: `1px solid ${border}`, color: textMuted,
            }}>
              <FaBookOpen style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>
                No {activeTab === 'active' ? 'Active' : 'Archived'} Courses
              </h3>
              <p style={{ marginBottom: activeTab === 'active' ? '1.5rem' : '0' }}>
                {activeTab === 'active' ? 'Create your first course to get started.' : 'Archived courses will appear here.'}
              </p>
              {activeTab === 'active' && (
                <Link to="/lecturer/create-course" className="btn btn-primary">
                  <FaPlus style={{ marginRight: '0.3rem' }} /> Create Course
                </Link>
              )}
            </div>
          ) : (
            currentCourses.map(course => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: cardBg,
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  border: `1px solid ${border}`,
                  boxShadow: shadowSm,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'all 0.2s',
                }}
                whileHover={{ borderColor: '#94a3b8' }}
              >
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: textMuted, fontWeight: 500, fontFamily: 'monospace' }}>{course.course_code}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: cardBgHover, color: textSec, border: `1px solid ${border}` }}>{course.program_type}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.5rem' }}>{course.course_name}</h3>
                  <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', color: textSec, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FaCalendarAlt style={{ color: textMuted, fontSize: '0.7rem' }} /> {course.semester} | {course.academic_year}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: textSec, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FaClock style={{ color: textMuted, fontSize: '0.7rem' }} /> {course.credit_hours} credits
                    </span>
                    <span style={{ fontSize: '0.8rem', color: textSec, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FaUsers style={{ color: textMuted, fontSize: '0.7rem' }} /> {course.students_count || course.students?.length || 0} students
                    </span>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>{getStatusBadge(course.approval_status)}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                  <Link to={`/lecturer/course/${course.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.5rem 1rem', borderRadius: '8px',
                      background: cardBgHover, color: '#0A2A66', border: `1px solid ${border}`,
                      textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                      transition: 'all 0.2s',
                    }}>
                    <FaEye style={{ fontSize: '0.7rem' }} /> View
                  </Link>
                  {activeTab === 'active' && (
                    <>
                      {course.approval_status === 'draft' && course.students?.length > 0 && (
                        <button onClick={() => handleSubmit(course.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            background: '#16a34a', color: 'white', border: 'none',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                          }}>
                          <FaPaperPlane style={{ fontSize: '0.7rem' }} /> Submit
                        </button>
                      )}
                      {course.approval_status === 'draft' && (!course.students || course.students.length === 0) && (
                        <Link to={`/lecturer/course/${course.id}/add-students`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            background: '#ca8a04', color: 'white', border: 'none',
                            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                            transition: 'all 0.2s',
                          }}>
                          <FaUserPlus style={{ fontSize: '0.7rem' }} /> Add Students
                        </Link>
                      )}
                      {course.approval_status === 'rejected' && (
                        <button onClick={() => handleSubmit(course.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.5rem 1rem', borderRadius: '8px',
                            background: '#ca8a04', color: 'white', border: 'none',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                          }}>
                          <FaRedoAlt style={{ fontSize: '0.7rem' }} /> Resubmit
                        </button>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default MyCourses;