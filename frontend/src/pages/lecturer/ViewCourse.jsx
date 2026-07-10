import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaEdit, FaPaperPlane, FaRedoAlt, FaUserPlus, FaArchive,
  FaCalculator, FaGraduationCap, FaSyncAlt, FaTasks, FaUsers, FaClock,
  FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaPencilAlt, FaSpinner,
  FaExclamationTriangle, FaInfoCircle, FaBook
} from 'react-icons/fa';

const ViewCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [caData, setCaData] = useState(null);
  const [examData, setExamData] = useState(null);

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      const data = res.data;
      setCourse(data.course);
      setCaData({
        status: data.ca_status,
        statusText: data.ca_status_text,
        statusClass: data.ca_status_class,
        canEdit: data.can_edit_ca,
        showSubmit: data.show_submit_ca,
      });
      setExamData({
        statusText: data.exam_status_text,
        statusClass: data.exam_status_class,
        caFinalized: data.ca_finalized,
        hasScores: data.has_exam_scores,
        approval: data.exam_approval,
      });
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/lecturer/courses');
    } finally { setLoading(false); }
  };

  const handleSubmitCourse = async () => {
    try {
      await lecturerApi.submitForApproval('course', id);
      toast.success('Course submitted for approval!');
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    }
  };

  const handleSubmitCA = async () => {
    try {
      await lecturerApi.submitForApproval('ca', id);
      toast.success('CA submitted for approval!');
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit CA');
    }
  };

  const handleSubmitExam = async () => {
    try {
      await lecturerApi.submitForApproval('exam', id);
      toast.success('Exam submitted for approval!');
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit exam');
    }
  };

  const handleArchive = async () => {
    try {
      await lecturerApi.archiveCourse(id);
      toast.success('Course archived');
      navigate('/lecturer/courses');
    } catch (error) {
      toast.error('Failed to archive');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'finalized') return <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (status === 'rejected') return <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    if (status && status.startsWith('pending_')) return <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending {status.replace('pending_', '').toUpperCase()}</span>;
    return <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaPencilAlt /> Draft</span>;
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

  if (!course) return null;

  const students = course.students || [];
  const assessments = course.assessments || [];
  const refGrades = course.reference_grades || [];
  const scoredCount = students.filter(s => s.continuous_assessment != null).length;
  const gradedCount = students.filter(s => s.exam_score != null).length;
  const refCount = students.filter(s => ['E', 'F'].includes(s.grade)).length;

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
          <Link to="/lecturer/courses" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Courses
          </Link>
          <h1>Course Details</h1>
        </div>
      </FadeIn>

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
            Created by {course.created_by?.full_name || 'Unknown'} · {course.semester} · {course.academic_year}
          </p>
        </div>
        <div>{getStatusBadge(course.approval_status)}</div>
      </div>

      {/* Submit / Resubmit Box */}
      {course.is_active && (
        <>
          {course.approval_status === 'draft' && students.length > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>Ready for Approval</h3>
                <p style={{ color: textSec, fontSize: '0.85rem', margin: 0 }}>{students.length} student(s) enrolled. Submit this course for review.</p>
              </div>
              <button onClick={handleSubmitCourse} className="btn btn-success"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit for Approval</button>
            </div>
          )}
          {course.approval_status === 'draft' && students.length === 0 && (
            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>Cannot Submit Yet</h3>
                <p style={{ color: '#854d0e', fontSize: '0.85rem', margin: 0 }}>Add students to this course before submitting for approval.</p>
              </div>
              <Link to={`/lecturer/course/${id}/add-students`} className="btn btn-primary"><FaUserPlus style={{ marginRight: '0.3rem' }} /> Add Students</Link>
            </div>
          )}
          {course.approval_status === 'rejected' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>Course Rejected</h3>
                <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>This course was rejected. You can edit and resubmit.</p>
              </div>
              <button onClick={handleSubmitCourse} className="btn btn-warning"><FaRedoAlt style={{ marginRight: '0.3rem' }} /> Resubmit for Approval</button>
            </div>
          )}
        </>
      )}

      {/* Course Approval Progress */}
      {course.course_approval && course.course_approval.steps && (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
          <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaClipboardCheck style={{ color: '#0A2A66' }} /> Course Approval Progress
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            {course.course_approval.steps.map((step, i) => {
              const isApproved = step.status === 'approved';
              const isPending = step.status === 'pending';
              const isRejected = step.status === 'rejected';
              return (
                <div key={i} style={{
                  padding: '1rem', borderRadius: '10px',
                  background: isApproved ? '#f0fdf4' : isPending ? '#fefce8' : isRejected ? '#fef2f2' : cardBgHover,
                  border: `1px solid ${isApproved ? '#bbf7d0' : isPending ? '#fde68a' : isRejected ? '#fecaca' : border}`,
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>
                    {isApproved ? '✅' : isPending ? '⏳' : isRejected ? '❌' : '⏭️'}
                  </div>
                  <div style={{ fontWeight: 700, color: '#0A2A66', fontSize: '0.9rem', textTransform: 'uppercase' }}>{step.level}</div>
                  <div style={{ fontSize: '0.8rem', color: isApproved ? '#16a34a' : isPending ? '#ca8a04' : textSec, fontWeight: 500 }}>
                    {step.status?.charAt(0).toUpperCase() + step.status?.slice(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CA Section */}
      {course.approval_status === 'finalized' ? (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FaCalculator style={{ color: '#0A2A66', fontSize: '1.2rem' }} />
            <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Continuous Assessment (40 marks)</h3>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap', background: cardBgHover, borderRadius: '8px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaTasks style={{ color: '#0A2A66' }} /> Status: <span style={{ fontWeight: 600 }}>{caData?.statusText || 'Not Submitted'}</span>
            </span>
            <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaUsers style={{ color: '#0A2A66' }} /> Scored: <strong>{scoredCount}/{students.length}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {caData?.canEdit && (
              <Link to={`/lecturer/course/${id}/enter-ca`} className="btn btn-primary btn-sm"><FaEdit style={{ marginRight: '0.3rem' }} /> Enter CA Scores</Link>
            )}
            {caData?.showSubmit && (
              <button onClick={handleSubmitCA} className="btn btn-success btn-sm"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit CA for Approval</button>
            )}
            {caData?.status === 'rejected' && (
              <button onClick={handleSubmitCA} className="btn btn-warning btn-sm"><FaRedoAlt style={{ marginRight: '0.3rem' }} /> Resubmit CA</button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', color: 'var(--blue-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaInfoCircle /> CA section available after course is fully approved.
        </div>
      )}

      {/* Exam Section */}
      {examData?.caFinalized ? (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <FaGraduationCap style={{ color: '#0A2A66', fontSize: '1.2rem' }} />
            <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Exam Grades (60 marks)</h3>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap', background: cardBgHover, borderRadius: '8px', padding: '0.75rem 1rem' }}>
            <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaTasks style={{ color: '#0A2A66' }} /> Status: <span style={{ fontWeight: 600 }}>{examData?.statusText || 'Not Submitted'}</span>
            </span>
            <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaUsers style={{ color: '#0A2A66' }} /> Graded: <strong>{gradedCount}/{students.length}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={`/lecturer/course/${id}/enter-exam`} className="btn btn-primary btn-sm"><FaEdit style={{ marginRight: '0.3rem' }} /> Enter Exam Grades</Link>
            {examData?.hasScores && !examData?.approval && (
              <button onClick={handleSubmitExam} className="btn btn-success btn-sm"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit Exam for Approval</button>
            )}
            {examData?.approval?.status === 'rejected' && (
              <button onClick={handleSubmitExam} className="btn btn-warning btn-sm"><FaRedoAlt style={{ marginRight: '0.3rem' }} /> Resubmit Exam</button>
            )}
          </div>
        </div>
      ) : course.approval_status === 'finalized' ? (
        <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', color: 'var(--blue-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaInfoCircle /> Exam section available after CA is fully approved.
        </div>
      ) : null}

      {/* Reference Section */}
      <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <FaSyncAlt style={{ color: '#0A2A66', fontSize: '1.2rem' }} />
          <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Reference Management</h3>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap', background: cardBgHover, borderRadius: '8px', padding: '0.75rem 1rem' }}>
          <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FaExclamationTriangle style={{ color: '#dc2626' }} /> E/F Students: <strong>{refCount}</strong>
          </span>
          <span style={{ fontSize: '0.85rem', color: textPri, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FaCheckCircle style={{ color: '#16a34a' }} /> References: <strong>{refGrades.length}</strong>
          </span>
        </div>
        {refCount > 0 && (
          <Link to={`/lecturer/course/${id}/reference-management`} className="btn btn-warning btn-sm"><FaSyncAlt style={{ marginRight: '0.3rem' }} /> Manage References</Link>
        )}
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: <FaCalendarAlt />, label: 'Semester', value: course.semester },
          { icon: <FaClock />, label: 'Credit Hours', value: course.credit_hours },
          { icon: <FaUsers />, label: 'Students', value: students.length },
          { icon: <FaGraduationCap />, label: 'Program', value: course.program_type },
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
          { key: 'students', label: 'Students', icon: <FaUsers />, count: students.length },
          { key: 'assessments', label: 'Assessments', icon: <FaTasks />, count: assessments.length },
        ].map(tab => (
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
            <span style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover, padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, color: activeTab === tab.key ? 'white' : textSec }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm }}>
          {course.is_editable && (
            <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
              <Link to={`/lecturer/course/${id}/add-students`} className="btn btn-primary btn-sm"><FaUserPlus style={{ marginRight: '0.3rem' }} /> Add Students</Link>
            </div>
          )}
          {students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}>
              <FaUsers style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
              <p>No students enrolled in this course.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={thStyle}>ID</th><th style={thStyle}>Name</th>
                  <th style={thStyle}>Test (20)</th><th style={thStyle}>Assign (10)</th><th style={thStyle}>Attend (10)</th>
                  <th style={thStyle}>CA (40)</th><th style={thStyle}>Exam (60)</th><th style={thStyle}>Total (100)</th>
                  <th style={thStyle}>Grade</th><th style={thStyle}>GP</th><th style={thStyle}>Ref</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const ref = refGrades.find(r => r.student_id === student.id);
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
                  <th style={thStyle}>Name</th><th style={thStyle}>Type</th><th style={thStyle}>Max Score</th><th style={thStyle}>Weight (%)</th>
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

      {/* Archive Button */}
      {course.is_active && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${border}`, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleArchive} className="btn btn-outline btn-sm" style={{ borderColor: '#dc2626', color: '#dc2626' }}>
            <FaArchive style={{ marginRight: '0.3rem' }} /> Archive Course
          </button>
        </div>
      )}
    </div>
  );
};

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.3px' };
const tdStyle = { padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' };

export default ViewCourse;