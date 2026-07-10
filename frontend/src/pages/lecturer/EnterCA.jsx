import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { FaArrowLeft, FaSave, FaPaperPlane, FaSpinner, FaCheckCircle, FaClock, FaTimes } from 'react-icons/fa';

const EnterCA = () => {
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

  const updateCA = (studentId) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const test = parseFloat(document.querySelector(`input[name="test_${studentId}"]`)?.value) || 0;
        const assignment = parseFloat(document.querySelector(`input[name="assignment_${studentId}"]`)?.value) || 0;
        const attendance = parseFloat(document.querySelector(`input[name="attendance_${studentId}"]`)?.value) || 0;
        const ca = Math.min(test, 20) + Math.min(assignment, 10) + Math.min(attendance, 10);
        return { ...s, test_score: test, assignment_score: assignment, attendance_score: attendance, continuous_assessment: ca };
      }
      return s;
    }));
  };

  const handleScoreInput = (studentId, field, max) => {
    const input = document.querySelector(`input[name="${field}_${studentId}"]`);
    if (!input) return;
    let val = parseFloat(input.value);
    if (isNaN(val)) return;
    if (val > max) { toast.error(`${field} cannot exceed ${max} marks`); input.value = max; }
    if (val < 0) { input.value = 0; }
    updateCA(studentId);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {};
      students.forEach(s => { data[`test_${s.id}`] = s.test_score || 0; data[`assignment_${s.id}`] = s.assignment_score || 0; data[`attendance_${s.id}`] = s.attendance_score || 0; });
      await lecturerApi.enterCA(id, data);
      toast.success('CA scores saved!');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleSubmitCA = async () => {
    try { 
      await lecturerApi.submitForApproval('ca', id); 
      toast.success('CA submitted!'); 
      navigate(`/lecturer/course/${id}`); 
    }
    catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to submit'); 
    }
  };
  
  if (loading) return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '5rem' }}><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;

  const allComplete = students.every(s => s.test_score != null && s.assignment_score != null && s.attendance_score != null);

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
          <h1>Enter Continuous Assessment</h1>
        </div>
      </FadeIn>

      <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#0A2A66', fontWeight: 600 }}>{course?.course_code}: {course?.course_name}</h2>
          <p style={{ color: textSec, fontSize: '0.85rem' }}>{course?.semester} | {course?.academic_year}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#854d0e', fontWeight: 500 }}>CA Total</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>40 Marks</div>
          </div>
          <div style={{ background: cardBgHover, border: `1px solid ${border}`, borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: textSec, fontWeight: 500 }}>Students</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0A2A66' }}>{students.length}</div>
          </div>
        </div>
      </div>

      <div style={{ background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem', marginBottom: '1rem', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-around' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Test</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>20 Marks</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Assignment</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>10 Marks</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.8rem', color: textSec }}>Attendance</div><div style={{ fontWeight: 700, color: '#0A2A66' }}>10 Marks</div></div>
      </div>

      <ShakeOnMount>
        <form onSubmit={handleSave}>
          <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm, marginBottom: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Student ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Test (20)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Assignment (10)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Attendance (10)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>CA Total (40)</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0A2A66' }}>{student.student_id}</td>
                    <td style={{ padding: '10px 14px', color: textPri }}>{student.student_name}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input type="number" className="score-input" name={`test_${student.id}`} defaultValue={student.test_score || ''} min="0" max="20" step="0.5" onBlur={e => handleScoreInput(student.id, 'test', 20)} onChange={() => updateCA(student.id)} />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input type="number" className="score-input" name={`assignment_${student.id}`} defaultValue={student.assignment_score || ''} min="0" max="10" step="0.5" onBlur={e => handleScoreInput(student.id, 'assignment', 10)} onChange={() => updateCA(student.id)} />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <input type="number" className="score-input" name={`attendance_${student.id}`} defaultValue={student.attendance_score || ''} min="0" max="10" step="0.5" onBlur={e => handleScoreInput(student.id, 'attendance', 10)} onChange={() => updateCA(student.id)} />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#0A2A66' }}>{student.continuous_assessment != null ? student.continuous_assessment.toFixed(1) : '0.0'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      {student.test_score != null && student.assignment_score != null && student.attendance_score != null ? (
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Complete</span>
                      ) : (
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Incomplete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link to={`/lecturer/course/${id}`} className="btn btn-outline btn-sm"><FaTimes style={{ marginRight: '0.3rem' }} /> Cancel</Link>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? <FaSpinner className="animate-spin" /> : <FaSave style={{ marginRight: '0.3rem' }} />} Save Scores</button>
          </div>
        </form>
        {allComplete && students.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
            <button onClick={handleSubmitCA} className="btn btn-success btn-sm"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit CA for Approval</button>
          </div>
        )}
      </ShakeOnMount>
    </div>
  );
};

export default EnterCA;