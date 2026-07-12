import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaBook, FaClock, FaCalendarAlt, FaGraduationCap,
  FaSitemap, FaBuilding, FaDoorOpen, FaUniversity, FaExchangeAlt,
  FaPlusCircle, FaSpinner, FaQrcode, FaLayerGroup, FaInfoCircle,
  FaChalkboardTeacher, FaWeightHanging
} from 'react-icons/fa';

const CreateCourse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [deptChoice, setDeptChoice] = useState('');
  const [form, setForm] = useState({
    course_code: '', course_name: '', credit_hours: 3,
    year: '', semester: '', academic_year: '2026/2027', program_type: 'BSc',
    dept_choice: '', final_faculty_id: '', final_department_id: '',
    assigned_lecturer_id: '',
  });

  useEffect(() => {
    if (user?.role !== 'head_of_department') {
      toast.error('Only Head of Department can create courses', { duration: 1000 });
      navigate('/lecturer/dashboard');
      return;
    }
    fetchFaculties();
    fetchLecturers();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await lecturerApi.getFaculties();
      setFaculties(res.data.faculties || res.data || []);
    } catch (error) { console.error('Failed to load faculties'); }
  };

  const fetchLecturers = async () => {
    try {
      const res = await lecturerApi.getAllLecturers();
      const allLecturers = res.data.lecturers || [];
      
      // Find the HOD in the lecturers list to get their department_id
      const hodRecord = allLecturers.find(l => l.id === user?.id);
      const userDeptId = hodRecord?.department_id;
      const userFacultyId = hodRecord?.faculty_id;
      
      console.log('=== DEBUG ===');
      console.log('HOD Name:', user?.full_name);
      console.log('HOD Record from list:', hodRecord);
      console.log('userDeptId:', userDeptId);
      console.log('userFacultyId:', userFacultyId);
      
      // Filter: Show ALL lecturers from same department + Dean + HOD
      const filtered = allLecturers.filter(l => {
        // Same department as HOD
        if (userDeptId && l.department_id === userDeptId) return true;
        // Dean of the same faculty
        if (l.role === 'dean' && userFacultyId && l.faculty_id === userFacultyId) return true;
        // The HOD themselves
        if (l.id === user?.id) return true;
        return false;
      });
      
      console.log('Filtered lecturers:', filtered.length);
      filtered.forEach(l => console.log(`  ✅ ${l.full_name} (${l.role}) - Dept ID: ${l.department_id}`));
      
      if (filtered.length === 0) {
        console.warn('⚠️ No lecturers matched. Showing ALL as fallback.');
        setLecturers(allLecturers);
      } else {
        setLecturers(filtered);
      }
    } catch (error) { console.error('Failed to load lecturers'); }
  };
  
  const loadDepartments = async (facultyId) => {
    if (!facultyId) { setDepartments([]); return; }
    try {
      const res = await lecturerApi.getDepartments(facultyId);
      setDepartments(res.data.departments || []);
    } catch (error) { setDepartments([]); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'dept_choice') setDeptChoice(value);
    if (name === 'final_faculty_id') loadDepartments(value);
  };

  const getCaExamWeights = () => {
    if (form.program_type === 'Diploma') return { ca: 30, exam: 70 };
    return { ca: 40, exam: 60 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course_code || !form.course_name || !form.year || !form.semester || !form.academic_year) {
      toast.error('Please fill all required fields', { duration: 1000 });
      return;
    }
    if (!form.assigned_lecturer_id) {
      toast.error('Please assign a lecturer to this course', { duration: 1000 });
      return;
    }
    setLoading(true);
    try {
      const res = await lecturerApi.createCourse(form);
      toast.success(res.data?.message || 'Course created successfully!', { duration: 1000 });
      navigate('/lecturer/courses');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course', { duration: 1000 });
    } finally { setLoading(false); }
  };

  const weights = getCaExamWeights();
  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '850px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/lecturer/courses" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Courses
          </Link>
          <h1>Create New Course</h1>
        </div>
      </FadeIn>

      <div style={{
        background: cardBg, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem',
        border: `1px solid ${border}`, boxShadow: shadowSm,
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: '#fefce8', color: '#ca8a04',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.9rem',
        }}>HOD</div>
        <div>
          <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.95rem' }}>{user?.full_name}</div>
          <div style={{ color: textSec, fontSize: '0.85rem' }}>
            {user?.department || user?.display_department || 'No department'} · Head of Department
          </div>
        </div>
      </div>

      <ShakeOnMount>
        <div style={{ background: cardBg, borderRadius: '14px', padding: '2rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
          
          <div style={{
            background: '#fefce8', borderLeft: '4px solid #ca8a04',
            borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.5rem',
          }}>
            <h4 style={{ color: '#0A2A66', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FaInfoCircle style={{ color: '#ca8a04' }} /> Course Information
            </h4>
            <p style={{ color: '#854d0e', fontSize: '0.85rem', margin: 0 }}>
              As HOD, you can create courses and assign lecturers from your department.
            </p>
          </div>

          <div style={{
            background: '#f0f4ff', borderRadius: '10px', padding: '1rem 1.25rem',
            marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
            gap: '1rem', border: '1px solid #bfdbfe',
          }}>
            <FaWeightHanging style={{ color: '#0A2A66', fontSize: '1.2rem' }} />
            <div>
              <strong style={{ color: '#0A2A66' }}>
                {form.program_type === 'Diploma' ? 'Diploma' : 'Degree'} Program
              </strong>
              <span style={{ color: textSec, marginLeft: '0.5rem' }}>
                CA: {weights.ca}% | Exam: {weights.exam}%
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaQrcode style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Course Code *
                </label>
                <input type="text" name="course_code" value={form.course_code} onChange={handleChange} placeholder="e.g., CS101" required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaBook style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Course Name *
                </label>
                <input type="text" name="course_name" value={form.course_name} onChange={handleChange} placeholder="e.g., Introduction to Programming" required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaClock style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Credit Hours *
                </label>
                <input type="number" name="credit_hours" value={form.credit_hours} onChange={handleChange} min="1" max="6" required />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaLayerGroup style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Year *
                </label>
                <select name="year" value={form.year} onChange={handleChange} required>
                  <option value="">Select Year</option>
                  <option value="Year 1">Year 1</option>
                  <option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option>
                  <option value="Year 4">Year 4</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaCalendarAlt style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Semester *
                </label>
                <select name="semester" value={form.semester} onChange={handleChange} required>
                  <option value="">Select Semester</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaCalendarAlt style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Academic Year *
                </label>
                <select name="academic_year" value={form.academic_year} onChange={handleChange} required>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaGraduationCap style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Program Type *
                </label>
                <select name="program_type" value={form.program_type} onChange={handleChange} required>
                  <option value="BSc">Bachelor of Science (BSc) — CA 40% / Exam 60%</option>
                  <option value="Diploma">Diploma — CA 30% / Exam 70%</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaChalkboardTeacher style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Assign Lecturer *
                </label>
                <select name="assigned_lecturer_id" value={form.assigned_lecturer_id} onChange={handleChange} required>
                  <option value="">Select Lecturer</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.lecturer_id}) — {l.role === 'head_of_department' ? 'HOD' : l.role === 'dean' ? 'Dean' : l.role === 'exam_officer' ? 'Exam Officer' : 'Lecturer'}
                      {l.department?.name ? ` — ${l.department.name}` : l.faculty?.name ? ` — ${l.faculty.name}` : ''}
                    </option>
                  ))}
                </select>
                <small style={{ color: textSec }}>Lecturers from your department are shown</small>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                  <FaSitemap style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Department / Faculty *
                </label>
                <select name="dept_choice" value={form.dept_choice} onChange={handleChange} required>
                  <option value="">Select Option</option>
                  <option value="default">Use my department</option>
                  <option value="other">Choose another department</option>
                </select>
              </div>

              {deptChoice === 'default' && (
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                    <FaBuilding style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Your Department
                  </label>
                  <input type="text" value={user?.department || user?.display_department || 'Not assigned'} readOnly />
                </div>
              )}

              {deptChoice === 'other' && (
                <div style={{ gridColumn: 'span 2', background: cardBgHover, borderRadius: '10px', padding: '1.25rem', border: `1px dashed ${border}` }}>
                  <h4 style={{ color: '#0A2A66', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FaExchangeAlt style={{ color: '#0A2A66' }} /> Select Different Department
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                        <FaUniversity style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Faculty
                      </label>
                      <select name="final_faculty_id" value={form.final_faculty_id} onChange={handleChange}>
                        <option value="">Select Faculty</option>
                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>
                        <FaDoorOpen style={{ marginRight: '0.3rem', color: '#0A2A66' }} /> Department
                      </label>
                      <select name="final_department_id" value={form.final_department_id} onChange={handleChange}>
                        <option value="">First select a faculty</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: `1px solid ${border}` }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <FaSpinner className="animate-spin" style={{ marginRight: '0.5rem' }} /> : <FaPlusCircle style={{ marginRight: '0.5rem' }} />}
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default CreateCourse;