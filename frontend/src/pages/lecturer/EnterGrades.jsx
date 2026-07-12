import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSave, FaSpinner, FaCheckCircle, FaClock, FaTimes,
  FaExclamationTriangle, FaCalculator
} from 'react-icons/fa';

const EnterGrades = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      setCourse(res.data.course || res.data);
      setStudents(res.data.course?.students || []);
    } catch (error) { 
      toast.error('Failed to load course', { duration: 1000 }); 
      navigate('/lecturer/courses'); 
    }
    finally { setLoading(false); }
  };

  const caMax = course?.ca_max_score || 40;
  const examMax = course?.exam_max_score || 60;

  // ===== VALIDATE & LIMIT INPUT =====
  const handleNumericInput = (e, max) => {
    const value = e.target.value;
    
    // Remove any non-numeric characters (except decimal point)
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to max value
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && numValue > max) {
      cleaned = max.toString();
    }
    
    e.target.value = cleaned;
  };

  const handleBlur = (e, studentId, field, max) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
      e.target.value = '';
      value = 0;
    }
    if (value > max) {
      e.target.value = max;
      toast.error(`${field.replace('_', ' ')} cannot exceed ${max}`, { duration: 1000 });
    }
    updateStudentScores(studentId);
  };

  const updateStudentScores = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const testInput = document.querySelector(`input[name="test_${studentId}"]`);
        const assignInput = document.querySelector(`input[name="assignment_${studentId}"]`);
        const attendInput = document.querySelector(`input[name="attendance_${studentId}"]`);
        const examInput = document.querySelector(`input[name="exam_${studentId}"]`);

        const test = parseFloat(testInput?.value) || 0;
        const assignment = parseFloat(assignInput?.value) || 0;
        const attendance = parseFloat(attendInput?.value) || 0;
        const exam = parseFloat(examInput?.value) || 0;

        const ca = Math.min(test, 20) + Math.min(assignment, 10) + Math.min(attendance, 10);
        const total = ca + Math.min(exam, examMax);

        let grade = 'F', points = 0.0;
        if (total >= 75) { grade = 'A'; points = 5.0; }
        else if (total >= 65) { grade = 'B'; points = 4.0; }
        else if (total >= 50) { grade = 'C'; points = 3.0; }
        else if (total >= 40) { grade = 'D'; points = 2.0; }
        else if (total >= 30) { grade = 'E'; points = 1.0; }

        return {
          ...s,
          test_score: Math.min(test, 20),
          assignment_score: Math.min(assignment, 10),
          attendance_score: Math.min(attendance, 10),
          continuous_assessment: Math.min(ca, caMax),
          exam_score: Math.min(exam, examMax),
          total_score: total,
          grade,
          grade_points: points,
        };
      }
      return s;
    }));
  };

  const calculateAll = () => {
    setStudents(prev => prev.map(s => {
      const examInput = document.querySelector(`input[name="exam_${s.id}"]`);
      const exam = parseFloat(examInput?.value) || s.exam_score || 0;
      const ca = s.continuous_assessment || 0;
      const total = ca + Math.min(exam, examMax);
      let grade = 'F', points = 0.0;
      if (total >= 75) { grade = 'A'; points = 5.0; }
      else if (total >= 65) { grade = 'B'; points = 4.0; }
      else if (total >= 50) { grade = 'C'; points = 3.0; }
      else if (total >= 40) { grade = 'D'; points = 2.0; }
      else if (total >= 30) { grade = 'E'; points = 1.0; }
      return { ...s, exam_score: Math.min(exam, examMax), total_score: total, grade, grade_points: points };
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {};
      students.forEach(s => {
        data[`test_${s.id}`] = s.test_score || 0;
        data[`assignment_${s.id}`] = s.assignment_score || 0;
        data[`attendance_${s.id}`] = s.attendance_score || 0;
        data[`exam_${s.id}`] = s.exam_score || 0;
      });
      await lecturerApi.enterGrades(id, data);
      toast.success('All grades saved!', { duration: 1000 });
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to save', { duration: 1000 }); 
    }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const allComplete = students.every(s => 
    s.test_score != null && s.assignment_score != null && 
    s.attendance_score != null && s.exam_score != null
  );

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course
          </Link>
          <h1>Enter Grades</h1>
        </div>
      </FadeIn>

      {/* Course Info & Weight Display */}
      <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#0A2A66', fontWeight: 600 }}>{course?.course_code}: {course?.course_name}</h2>
          <p style={{ color: textSec, fontSize: '0.85rem' }}>{course?.semester} | {course?.academic_year} | {course?.program_type}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#854d0e', fontWeight: 500 }}>CA Total</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>{caMax} Marks</div>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 500 }}>Exam Total</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>{examMax} Marks</div>
          </div>
          <div style={{ background: cardBgHover, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textSec, fontWeight: 500 }}>Students</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>{students.length}</div>
          </div>
        </div>
      </div>

      {/* Component Breakdown */}
      <div style={{ background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Test (Max 20)</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>20 Marks</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Assignment (Max 10)</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>10 Marks</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Attendance (Max 10)</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>10 Marks</div></div>
        <div style={{ textAlign: 'center', borderLeft: `2px solid ${border}`, paddingLeft: '1rem' }}><div style={{ fontSize: '0.8rem', color: '#166534' }}>CA Total</div><div style={{ fontWeight: 700, color: '#16a34a' }}>{caMax} Marks</div></div>
        <div style={{ textAlign: 'center', borderLeft: `2px solid ${border}`, paddingLeft: '1rem' }}><div style={{ fontSize: '0.8rem', color: '#166534' }}>Exam (Max {examMax})</div><div style={{ fontWeight: 700, color: '#16a34a' }}>{examMax} Marks</div></div>
      </div>

      {/* Grading Scale */}
      <div style={{ background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {[
          { g: 'A', r: '75-100', p: '5.0', c: '#16a34a' },
          { g: 'B', r: '65-74', p: '4.0', c: '#2563eb' },
          { g: 'C', r: '50-64', p: '3.0', c: '#ca8a04' },
          { g: 'D', r: '40-49', p: '2.0', c: '#ea580c' },
          { g: 'E', r: '30-39', p: '1.0 REF', c: '#7c3aed' },
          { g: 'F', r: '0-29', p: '0.0 REF', c: '#dc2626' },
        ].map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: textPri, fontWeight: 500 }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: g.c }}></div>
            {g.g} ({g.r}) · {g.p}
          </div>
        ))}
      </div>

      <ShakeOnMount>
        <form onSubmit={handleSave}>
          <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm, marginBottom: '1rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={th}>Student</th>
                  <th style={th}>Test (20)</th>
                  <th style={th}>Assign (10)</th>
                  <th style={th}>Attend (10)</th>
                  <th style={th}>CA ({caMax})</th>
                  <th style={th}>Exam ({examMax})</th>
                  <th style={th}>Total</th>
                  <th style={th}>Grade</th>
                  <th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const isRef = ['E', 'F'].includes(student.grade);
                  return (
                    <tr key={student.id} style={{ borderBottom: `1px solid ${border}`, background: isRef ? 'rgba(254,242,242,0.5)' : 'transparent' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{student.student_name}</div>
                        <div style={{ fontSize: '0.75rem', color: textSec }}>{student.student_id}</div>
                        {isRef && <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', marginTop: '2px', display: 'inline-block' }}>REF</span>}
                      </td>
                      
                      {/* Test — Max 20 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="score-input" 
                          name={`test_${student.id}`} 
                          defaultValue={student.test_score || ''} 
                          min="0" 
                          max="20" 
                          step="0.5"
                          onInput={(e) => handleNumericInput(e, 20)}
                          onBlur={(e) => handleBlur(e, student.id, 'test', 20)}
                          onChange={() => updateStudentScores(student.id)}
                          style={{ width: '70px', padding: '6px', borderRadius: '8px', border: `1.5px solid ${border}`, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                      
                      {/* Assignment — Max 10 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="score-input" 
                          name={`assignment_${student.id}`} 
                          defaultValue={student.assignment_score || ''} 
                          min="0" 
                          max="10" 
                          step="0.5"
                          onInput={(e) => handleNumericInput(e, 10)}
                          onBlur={(e) => handleBlur(e, student.id, 'assignment', 10)}
                          onChange={() => updateStudentScores(student.id)}
                          style={{ width: '70px', padding: '6px', borderRadius: '8px', border: `1.5px solid ${border}`, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                      
                      {/* Attendance — Max 10 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="score-input" 
                          name={`attendance_${student.id}`} 
                          defaultValue={student.attendance_score || ''} 
                          min="0" 
                          max="10" 
                          step="0.5"
                          onInput={(e) => handleNumericInput(e, 10)}
                          onBlur={(e) => handleBlur(e, student.id, 'attendance', 10)}
                          onChange={() => updateStudentScores(student.id)}
                          style={{ width: '70px', padding: '6px', borderRadius: '8px', border: `1.5px solid ${border}`, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                      
                      {/* CA Total — Read only */}
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#0A2A66', fontSize: '0.9rem' }}>
                        {student.continuous_assessment != null ? student.continuous_assessment.toFixed(1) : '0.0'}
                      </td>
                      
                      {/* Exam — Max from course */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="grade-input exam-input" 
                          name={`exam_${student.id}`} 
                          defaultValue={student.exam_score || ''} 
                          min="0" 
                          max={examMax} 
                          step="0.5"
                          onInput={(e) => handleNumericInput(e, examMax)}
                          onBlur={(e) => handleBlur(e, student.id, 'exam', examMax)}
                          onChange={() => updateStudentScores(student.id)}
                          style={{ width: '70px', padding: '6px', borderRadius: '8px', border: `1.5px solid ${border}`, textAlign: 'center', fontSize: '0.85rem' }}
                        />
                      </td>
                      
                      {/* Total — Read only */}
                      <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700, color: '#0A2A66', fontSize: '0.9rem' }}>
                        {student.total_score != null ? student.total_score.toFixed(1) : '0.0'}
                      </td>
                      
                      {/* Grade — Auto calculated */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: student.grade === 'A' ? '#16a34a' : student.grade === 'B' ? '#2563eb' : student.grade === 'C' ? '#ca8a04' : student.grade === 'D' ? '#ea580c' : student.grade === 'E' ? '#7c3aed' : '#dc2626' }}>
                          {student.grade || '—'}
                        </span>
                      </td>
                      
                      {/* Status */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {student.test_score != null && student.assignment_score != null && student.attendance_score != null && student.exam_score != null ? (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Complete</span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Incomplete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={calculateAll}>
              <FaCalculator style={{ marginRight: '0.3rem' }} /> Preview All Grades
            </button>
            <Link to={`/lecturer/course/${id}`} className="btn btn-outline btn-sm">
              <FaTimes style={{ marginRight: '0.3rem' }} /> Cancel
            </Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave style={{ marginRight: '0.3rem' }} />}
              {saving ? 'Saving...' : 'Save All Grades'}
            </button>
          </div>
        </form>
      </ShakeOnMount>
    </div>
  );
};

const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.3px' };

export default EnterGrades;