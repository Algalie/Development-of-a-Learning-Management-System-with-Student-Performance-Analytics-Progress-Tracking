import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaTag, FaList, FaStar, FaBalanceScale, FaTimes, FaSave, FaSpinner,
  FaExclamationTriangle, FaCheckCircle, FaExclamationCircle, FaInfoCircle
} from 'react-icons/fa';

const AddAssessment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ assessment_name: '', assessment_type: '', max_score: '', weight: '' });

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      setCourse(res.data.course || res.data);
      setAssessments(res.data.course?.assessments || []);
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/lecturer/courses');
    } finally { setLoading(false); }
  };

  const totalWeight = assessments.reduce((sum, a) => sum + (a.weight || 0), 0);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newWeight = parseFloat(form.weight) || 0;
    if (totalWeight + newWeight > 40) {
      toast.error(`Total CA weight would be ${totalWeight + newWeight}%. Maximum is 40%.`);
      return;
    }
    setSaving(true);
    try {
      await lecturerApi.addAssessment(id, form);
      toast.success('Assessment added!');
      fetchCourse();
      setForm({ assessment_name: '', assessment_type: '', max_score: '', weight: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add assessment');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course</Link>
          <h1>Add Assessment</h1>
        </div>
      </FadeIn>

      <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
        <h2 style={{ fontSize: '1.3rem', color: '#0A2A66' }}>{course?.course_code}: {course?.course_name}</h2>
        <p style={{ color: textSec }}>{course?.semester} | {course?.academic_year}</p>
      </div>

      <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
        <span style={{ fontWeight: 700, color: '#0A2A66' }}>Total CA Weight: {totalWeight.toFixed(1)}% / 40%</span>
        <span style={{ color: totalWeight < 40 ? '#f59e0b' : totalWeight === 40 ? '#10b981' : '#f59e0b', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          {totalWeight < 40 && <><FaExclamationTriangle /> {(40 - totalWeight).toFixed(1)}% remaining</>}
          {totalWeight === 40 && <><FaCheckCircle /> CA weight complete</>}
          {totalWeight > 40 && <><FaExclamationCircle /> Exceeds 40% by {(totalWeight - 40).toFixed(1)}%</>}
        </span>
      </div>

      {assessments.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Existing Assessments</h4>
          {assessments.map(a => (
            <div key={a.id} style={{ background: cardBgHover, borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${border}` }}>
              <span style={{ fontWeight: 600, color: '#0A2A66' }}>{a.assessment_name}</span>
              <span style={{ color: '#FFC107', fontWeight: 700 }}>{a.weight}%</span>
            </div>
          ))}
        </div>
      )}

      <ShakeOnMount>
        <div style={{ background: cardBg, borderRadius: 'var(--radius-xl)', padding: '2rem', boxShadow: shadowSm, border: `1px solid ${borderLight}` }}>
          <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', borderRadius: 'var(--radius-md)', padding: '1rem 1.2rem', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--blue-text)' }}>
            <FaInfoCircle /> Continuous Assessment total must equal 40%. Exam will be 60%.
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FaTag style={{ color: '#FFC107' }} /> Assessment Name</label>
              <input type="text" name="assessment_name" value={form.assessment_name} onChange={handleChange} placeholder="e.g., Quiz 1, Assignment 1, Midterm" required />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label><FaList style={{ color: '#FFC107' }} /> Assessment Type</label>
                <select name="assessment_type" value={form.assessment_type} onChange={handleChange} required>
                  <option value="">Select Type</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="midterm">Midterm Examination</option>
                  <option value="project">Project</option>
                  <option value="practical">Practical</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label><FaStar style={{ color: '#FFC107' }} /> Maximum Score</label>
                <input type="number" name="max_score" value={form.max_score} onChange={handleChange} min="1" max="100" placeholder="e.g., 20" required />
              </div>
            </div>
            <div className="form-group">
              <label><FaBalanceScale style={{ color: '#FFC107' }} /> Weight (%)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange} min="0" max="40" step="0.5" placeholder="Enter percentage of CA" required />
              <small>This assessment's contribution to the 40% Continuous Assessment</small>
            </div>
            <div className="form-actions">
              <Link to={`/lecturer/course/${id}`} className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><FaSpinner className="animate-spin" /> Adding...</> : <><FaSave /> Add Assessment</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddAssessment;