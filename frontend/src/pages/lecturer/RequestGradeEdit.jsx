import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaPaperPlane, FaSpinner, FaExclamationTriangle,
  FaUserGraduate, FaBook, FaEdit
} from 'react-icons/fa';

const RequestGradeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [form, setForm] = useState({
    course_student_id: '',
    requested_field: '',
    current_value: '',
    new_value: '',
    reason: '',
  });

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      setCourse(res.data.course || res.data);
    } catch (error) {
      toast.error('Failed to load course', { duration: 1000 });
      navigate('/lecturer/courses');
    } finally { setLoading(false); }
  };

  const handleStudentSelect = (studentId) => {
    const student = course?.students?.find(s => s.id === parseInt(studentId));
    setSelectedStudent(studentId);
    setForm({
      course_student_id: studentId,
      requested_field: '',
      current_value: '',
      new_value: '',
      reason: '',
    });
  };

  const handleFieldSelect = (field) => {
    const student = course?.students?.find(s => s.id === parseInt(selectedStudent));
    let currentVal = '';
    
    if (student) {
      switch(field) {
        case 'test_score': currentVal = student.test_score; break;
        case 'assignment_score': currentVal = student.assignment_score; break;
        case 'attendance_score': currentVal = student.attendance_score; break;
        case 'exam_score': currentVal = student.exam_score; break;
        default: currentVal = '';
      }
    }
    
    setForm({
      ...form,
      requested_field: field,
      current_value: currentVal,
      new_value: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.course_student_id || !form.requested_field || !form.reason) {
      toast.error('Please fill all required fields', { duration: 1000 });
      return;
    }
    
    if (form.new_value === '' || form.new_value === null) {
      toast.error('Please enter the new value', { duration: 1000 });
      return;
    }

    setSubmitting(true);
    try {
      await lecturerApi.requestGradeEdit({
        course_student_id: parseInt(form.course_student_id),
        requested_field: form.requested_field,
        current_value: parseFloat(form.current_value) || 0,
        new_value: parseFloat(form.new_value),
        reason: form.reason,
      });
      toast.success('Grade edit request submitted! It will be reviewed by HOD.', { duration: 1000 });
      navigate(`/lecturer/course/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request', { duration: 1000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const students = course?.students || [];
  const selectedStudentData = students.find(s => s.id === parseInt(selectedStudent));
  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course
          </Link>
          <h1>Request Grade Edit</h1>
        </div>
      </FadeIn>

      {/* Info Banner */}
      <div style={{
        background: '#fefce8', borderLeft: '4px solid #ca8a04',
        borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      }}>
        <FaExclamationTriangle style={{ color: '#ca8a04', marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 600, color: '#854d0e', marginBottom: '0.25rem' }}>Grade Edit Request</div>
          <p style={{ color: '#854d0e', fontSize: '0.85rem', margin: 0 }}>
            Use this form to request a correction to a student's grade after finalization.
            The request will go to HOD → Dean → Exam Office for approval.
          </p>
        </div>
      </div>

      <ShakeOnMount>
        <div style={{ background: cardBg, borderRadius: '14px', padding: '2rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
          
          {/* Course Info */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${border}` }}>
            <h2 style={{ fontSize: '1.1rem', color: '#0A2A66', fontWeight: 600 }}>
              {course?.course_code}: {course?.course_name}
            </h2>
            <p style={{ color: textSec, fontSize: '0.85rem' }}>{course?.semester} | {course?.academic_year}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Select Student */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0A2A66', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <FaUserGraduate /> Select Student *
              </label>
              <select 
                value={selectedStudent} 
                onChange={(e) => handleStudentSelect(e.target.value)}
                required
                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem' }}
              >
                <option value="">-- Select Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.student_name} ({s.student_id}) — Grade: {s.grade} | Total: {s.total_score}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Current Grades */}
            {selectedStudentData && (
              <div style={{ 
                background: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem',
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center',
                border: `1px solid ${border}`,
              }}>
                <div><div style={{ fontSize: '0.7rem', color: textMuted }}>Test</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>{selectedStudentData.test_score ?? '—'}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted }}>Assignment</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>{selectedStudentData.assignment_score ?? '—'}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted }}>Attendance</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>{selectedStudentData.attendance_score ?? '—'}</div></div>
                <div><div style={{ fontSize: '0.7rem', color: textMuted }}>Exam</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>{selectedStudentData.exam_score ?? '—'}</div></div>
              </div>
            )}

            {/* Select Field to Edit */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0A2A66', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <FaEdit /> Field to Edit *
              </label>
              <select 
                value={form.requested_field} 
                onChange={(e) => handleFieldSelect(e.target.value)}
                required
                disabled={!selectedStudent}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem' }}
              >
                <option value="">-- Select Field --</option>
                <option value="test_score">Test Score</option>
                <option value="assignment_score">Assignment Score</option>
                <option value="attendance_score">Attendance Score</option>
                <option value="exam_score">Exam Score</option>
              </select>
            </div>

            {/* Current & New Value */}
            {form.requested_field && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Current Value</label>
                  <input type="text" value={form.current_value} readOnly 
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem', background: '#f1f5f9' }} />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>New Value *</label>
                  <input 
                    type="number" 
                    value={form.new_value} 
                    onChange={(e) => setForm({ ...form, new_value: e.target.value })}
                    step="0.5"
                    required
                    placeholder="Enter new value"
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem' }} />
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0A2A66', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <FaBook /> Reason for Edit *
              </label>
              <textarea
                rows="4"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why this grade needs to be corrected..."
                required
                style={{ width: '100%', padding: '0.7rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem', resize: 'vertical' }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link to={`/lecturer/course/${id}`} className="btn btn-outline btn-sm">
                Cancel
              </Link>
              <button type="submit" className="btn btn-warning btn-sm" disabled={submitting}>
                {submitting ? <FaSpinner className="animate-spin" /> : <FaPaperPlane style={{ marginRight: '0.3rem' }} />}
                {submitting ? 'Submitting...' : 'Submit Edit Request'}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default RequestGradeEdit;