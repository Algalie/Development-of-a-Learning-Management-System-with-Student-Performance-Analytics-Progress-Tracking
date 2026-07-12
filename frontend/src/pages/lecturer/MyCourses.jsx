import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaPlus, FaEye, FaPaperPlane, FaUserPlus, FaRedoAlt,
  FaBookOpen, FaArchive, FaCalendarAlt, FaClock, FaUsers, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaPencilAlt, FaChalkboardTeacher,
  FaCog, FaUserCheck
} from 'react-icons/fa';

const MyCourses = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my-courses');
  const [activeCourses, setActiveCourses] = useState([]);
  const [archivedCourses, setArchivedCourses] = useState([]);
  const [createdCourses, setCreatedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await lecturerApi.getCourses();
      setActiveCourses(res.data.active_courses || []);
      setArchivedCourses(res.data.archived_courses || []);
      setCreatedCourses(res.data.created_courses || []);
    } catch (error) {
      toast.error('Failed to load courses', { duration: 1000 });
    } finally { setLoading(false); }
  };

  const handleSubmit = async (courseId) => {
    if (!window.confirm('Submit this course for approval?')) return;
    try {
      await lecturerApi.submitForApproval('course', courseId);
      toast.success('Course submitted!', { duration: 1000 });
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit', { duration: 1000 });
    }
  };

  const getStatusBadge = (status) => {
    if (!status || status === 'draft') return <span className="badge badge-draft"><FaPencilAlt /> Draft</span>;
    if (status === 'finalized') return <span className="badge badge-approved"><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span className="badge badge-rejected"><FaTimesCircle /> Rejected</span>;
    return <span className="badge badge-pending"><FaClock /> Pending</span>;
  };

  const canCreate = user?.role === 'head_of_department';
  const isHOD = user?.role === 'head_of_department';

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

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  const renderCourseCard = (course, isCreatedOnly = false) => (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: cardBg, borderRadius: '14px', padding: '1.25rem 1.5rem',
        border: `1px solid ${isCreatedOnly ? '#FFC107' : border}`,
        boxShadow: shadowSm, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        borderLeft: isCreatedOnly ? '4px solid #FFC107' : `1px solid ${border}`,
      }}
      whileHover={{ y: -2 }}
    >
      <div style={{ flex: 2, minWidth: '250px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: textMuted, fontWeight: 600, fontFamily: 'monospace' }}>{course.course_code}</span>
          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: cardBgHover, color: textSec }}>{course.program_type}</span>
          {course.course_level && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0f4ff', color: '#0A2A66' }}>{course.course_level}</span>}
          {isCreatedOnly && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04' }}>Created by you</span>}
        </div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.5rem' }}>{course.course_name}</h3>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.8rem', color: textSec }}>
          <span><FaCalendarAlt style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />{course.semester} | {course.academic_year}</span>
          <span><FaClock style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />{course.credit_hours} credits</span>
          <span><FaUsers style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />{course.students_count || course.students?.length || 0} students</span>
          {course.assigned_lecturer && (
            <span style={{ color: isCreatedOnly ? '#ca8a04' : textSec }}>
              <FaChalkboardTeacher style={{ fontSize: '0.7rem', marginRight: '0.3rem' }} />
              {course.assigned_lecturer.full_name}
              {isCreatedOnly && ' (assigned)'}
            </span>
          )}
        </div>
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {getStatusBadge(course.approval_status)}
          {course.ca_max_score && (
            <span style={{ fontSize: '0.7rem', color: textMuted }}>CA: {course.ca_max_score}% / Exam: {course.exam_max_score}%</span>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
        <Link to={`/lecturer/course/${course.id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            background: cardBgHover, color: '#0A2A66', border: `1px solid ${border}`,
            textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
          }}>
          <FaEye /> View
        </Link>
        
        {!isCreatedOnly && course.is_mine !== false && (
          <>
            {(course.approval_status === 'draft' || !course.approval_status) && course.students?.length > 0 && (
              <button onClick={() => handleSubmit(course.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: '#16a34a', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                }}>
                <FaPaperPlane /> Submit
              </button>
            )}
            {(course.approval_status === 'draft' || !course.approval_status) && (!course.students || course.students.length === 0) && (
              <Link to={`/lecturer/course/${course.id}/add-students`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: '#ca8a04', color: 'white', border: 'none',
                  textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                }}>
                <FaUserPlus /> Add Students
              </Link>
            )}
            {course.approval_status === 'rejected' && (
              <button onClick={() => handleSubmit(course.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: '#ca8a04', color: 'white', border: 'none',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                }}>
                <FaRedoAlt /> Resubmit
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link to="/lecturer/dashboard" className="back-btn" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <FaArrowLeft /> Dashboard
            </Link>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66' }}>My Courses</h1>
          </div>
          {canCreate && (
            <Link to="/lecturer/create-course" className="btn btn-primary">
              <FaPlus style={{ marginRight: '0.3rem' }} /> Create New Course
            </Link>
          )}
        </div>
      </FadeIn>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('my-courses')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '8px',
            background: activeTab === 'my-courses' ? '#0A2A66' : 'transparent',
            color: activeTab === 'my-courses' ? 'white' : 'var(--text-primary)',
            border: activeTab === 'my-courses' ? 'none' : `1px solid ${border}`,
            cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
          }}>
          <FaBookOpen /> My Courses
          <span style={{
            background: activeTab === 'my-courses' ? 'rgba(255,255,255,0.2)' : cardBgHover,
            padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
            color: activeTab === 'my-courses' ? 'white' : textSec,
          }}>{activeCourses.length}</span>
        </button>
        
        {isHOD && createdCourses.length > 0 && (
          <button onClick={() => setActiveTab('created')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: activeTab === 'created' ? '#0A2A66' : 'transparent',
              color: activeTab === 'created' ? 'white' : 'var(--text-primary)',
              border: activeTab === 'created' ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
          <FaCog /> Created for Others
          <span style={{
            background: activeTab === 'created' ? 'rgba(255,255,255,0.2)' : cardBgHover,
            padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
            color: activeTab === 'created' ? 'white' : textSec,
          }}>{createdCourses.length}</span>
          </button>
        )}
        
        <button onClick={() => setActiveTab('archived')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.2rem', borderRadius: '8px',
            background: activeTab === 'archived' ? '#0A2A66' : 'transparent',
            color: activeTab === 'archived' ? 'white' : 'var(--text-primary)',
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
          {activeTab === 'my-courses' && (
            activeCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
                <FaBookOpen style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
                <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Active Courses</h3>
                <p>{canCreate ? 'Create a course or wait to be assigned one.' : 'No courses have been assigned to you yet.'}</p>
              </div>
            ) : activeCourses.map(c => renderCourseCard(c))
          )}

          {activeTab === 'created' && createdCourses.map(c => renderCourseCard(c, true))}

          {activeTab === 'archived' && (
            archivedCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
                <FaArchive style={{ fontSize: '2.5rem', marginBottom: '1rem' }} />
                <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Archived Courses</h3>
                <p>Archived courses will appear here.</p>
              </div>
            ) : archivedCourses.map(c => renderCourseCard(c))
          )}
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default MyCourses;