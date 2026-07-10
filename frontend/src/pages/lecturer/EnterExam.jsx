import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { FaArrowLeft, FaSave, FaPaperPlane, FaSpinner, FaCalculator, FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const EnterExam = () => {
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
    } catch (error) { toast.error('Failed to load course'); navigate('/lecturer/courses'); }
    finally { setLoading(false); }
  };

  const calcGrade = (total) => {
    if (total >= 75) return { grade: 'A', points: 5.0 };
    if (total >= 65) return { grade: 'B', points: 4.0 };
    if (total >= 50) return { grade: 'C', points: 3.0 };
    if (total >= 40) return { grade: 'D', points: 2.0 };
    if (total >= 30) return { grade: 'E', points: 1.0 };
    return { grade: 'F', points: 0.0 };
  };

  const updateStudent = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const exam = parseFloat(document.querySelector(`input[name="exam_${studentId}"]`)?.value) || 0;
        const ca = s.continuous_assessment || 0;
        const total = ca + Math.min(exam, 60);
        const { grade, points } = calcGrade(total);
        return { ...s, exam_score: exam, total_score: total, grade, grade_points: points };
      }
      return s;
    }));
  };

  const handleExamInput = (studentId) => {
    const input = document.querySelector(`input[name="exam_${studentId}"]`);
    if (!input) return;
    let val = parseFloat(input.value);
    if (isNaN(val)) return;
    if (val > 60) { toast.error('Exam score cannot exceed 60 marks'); input.value = 60; }
    if (val < 0) { input.value = 0; }
    updateStudent(studentId);
  };

  const calculateAll = () => {
    setStudents(prev => prev.map(s => {
      const exam = parseFloat(document.querySelector(`input[name="exam_${s.id}"]`)?.value) || s.exam_score || 0;
      const ca = s.continuous_assessment || 0;
      const total = ca + Math.min(exam, 60);
      const { grade, points } = calcGrade(total);
      return { ...s, exam_score: exam, total_score: total, grade, grade_points: points };
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {};
      students.forEach(s => { data[`exam_${s.id}`] = s.exam_score || 0; });
      await lecturerApi.enterExamGrades(id, data);
      toast.success('Exam grades saved!');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleSubmit = async () => {
    try { 
      await lecturerApi.submitForApproval('exam', id); 
      toast.success('Exam submitted!'); 
      navigate(`/lecturer/course/${id}`); 
    }
    catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to submit'); 
    }
  };

  if (loading) return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '5rem' }}><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1200px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course</Link>
          <h1>Enter Exam Grades</h1>
        </div>
      </FadeIn>

      <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#0A2A66', fontWeight: 600 }}>{course?.course_code}: {course?.course_name}</h2>
          <p style={{ color: textSec, fontSize: '0.85rem' }}>{course?.semester} | {course?.academic_year} | {course?.credit_hours} Credits</p>
        </div>
        <div style={{ background: cardBgHover, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>{students.length}</div>
          <div style={{ fontSize: '0.7rem', color: textSec, fontWeight: 500 }}>Students</div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {[{ g: 'A', r: '75-100', p: '5.0', c: '#16a34a' },{ g: 'B', r: '65-74', p: '4.0', c: '#2563eb' },{ g: 'C', r: '50-64', p: '3.0', c: '#ca8a04' },{ g: 'D', r: '40-49', p: '2.0', c: '#ea580c' },{ g: 'E', r: '30-39', p: '1.0 REF', c: '#7c3aed' },{ g: 'F', r: '0-29', p: '0.0 REF', c: '#dc2626' }].map((g, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: textPri, fontWeight: 500 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: g.c }}></div>{g.g} ({g.r}) · {g.p}
          </div>
        ))}
      </div>

      <ShakeOnMount>
        <form onSubmit={handleSave}>
          <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm, marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={th}>Student</th><th style={th}>CA (40)</th><th style={th}>Exam (60)</th><th style={th}>Total (100)</th><th style={th}>Grade</th><th style={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => {
                  const isRef = ['E', 'F'].includes(student.grade);
                  return (
                    <tr key={student.id} style={{ borderBottom: `1px solid ${border}`, background: isRef ? 'var(--warning-bg)' : cardBg }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66' }}>{student.student_name}</div>
                        <div style={{ fontSize: '0.8rem', color: textSec }}>{student.student_id}</div>
                        {isRef && <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', marginTop: '3px', display: 'inline-block' }}>REFERENCE</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textPri }}>{student.continuous_assessment != null ? student.continuous_assessment.toFixed(1) : '0.0'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <input type="number" className="grade-input exam-input" name={`exam_${student.id}`} defaultValue={student.exam_score || ''} min="0" max="60" step="0.5" onBlur={e => handleExamInput(student.id)} onChange={() => updateStudent(student.id)} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#0A2A66' }}>{student.total_score != null ? student.total_score.toFixed(1) : '0.0'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: student.grade === 'A' ? '#16a34a' : student.grade === 'B' ? '#2563eb' : student.grade === 'C' ? '#ca8a04' : student.grade === 'D' ? '#ea580c' : student.grade === 'E' ? '#7c3aed' : '#dc2626' }}>{student.grade || '—'}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {isRef && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.5rem', fontSize: '0.75rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FaExclamationTriangle style={{ color: '#dc2626' }} /> REFERENCE REQUIRED
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={calculateAll}><FaCalculator style={{ marginRight: '0.3rem' }} /> Preview Grades</button>
            <Link to={`/lecturer/course/${id}`} className="btn btn-outline btn-sm"><FaTimes style={{ marginRight: '0.3rem' }} /> Cancel</Link>
            <button type="submit" className="btn btn-success btn-sm" disabled={saving}>{saving ? <FaSpinner className="animate-spin" /> : <FaSave style={{ marginRight: '0.3rem' }} />} Save Grades</button>
          </div>
        </form>
        {students.some(s => s.exam_score != null) && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button onClick={handleSubmit} className="btn btn-success btn-sm"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit Exam for Approval</button>
          </div>
        )}
      </ShakeOnMount>
    </div>
  );
};

const th = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' };

export default EnterExam;