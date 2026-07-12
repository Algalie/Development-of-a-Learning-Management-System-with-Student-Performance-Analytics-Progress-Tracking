import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaIdCard, FaUser, FaEnvelope, FaLock, FaPhone, 
  FaGraduationCap, FaUserTag, FaUniversity, FaSitemap, FaSignature,
  FaTimes, FaSave, FaSpinner, FaInfoCircle 
} from 'react-icons/fa';

const AddLecturer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    lecturer_id: '',
    full_name: '',
    email: '',
    password: '',
    role: 'lecturer',
    phone: '',
    qualification: '',
    faculty_id: '',
    department_id: '',
    signature: '',
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await adminApi.getFaculties();
      setFaculties(res.data.faculties || res.data || []);
    } catch (error) {
      toast.error('Failed to load faculties');
    }
  };

  const loadDepartments = async (facultyId) => {
    if (!facultyId) { setDepartments([]); return; }
    try {
      const res = await adminApi.getDepartments(facultyId);
      setDepartments(res.data.departments || []);
    } catch (error) {
      setDepartments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'faculty_id') {
      loadDepartments(value);
      setForm(prev => ({ ...prev, faculty_id: value, department_id: '' }));
    }
    if (name === 'role') {
      setForm(prev => ({
        ...prev,
        role: value,
        faculty_id: value === 'dean' ? prev.faculty_id : '',
        department_id: value === 'head_of_department' || value === 'lecturer' ? prev.department_id : '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.role === 'dean' && !form.faculty_id) { toast.error('Please select a faculty for the Dean'); return; }
    if ((form.role === 'head_of_department' || form.role === 'lecturer') && !form.department_id) { toast.error('Please select a department'); return; }

    setLoading(true);
    try {
      await adminApi.addLecturer(form);
      toast.success(`Lecturer ${form.full_name} added as ${form.role.replace(/_/g, ' ')}!`);
      navigate('/admin/manage-users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add lecturer');
    } finally {
      setLoading(false);
    }
  };

  const roleDescriptions = {
    lecturer: { info: 'Can create courses, enter grades, and submit for approval. Requires department assignment.', faculty: true, department: true },
    head_of_department: { info: 'Can approve submissions for their department. Cannot approve their own submissions.', faculty: true, department: true },
    dean: { info: 'Can approve submissions for their faculty. Cannot approve their own submissions.', faculty: true, department: false },
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/manage-users" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Users</Link>
          <h1>Add New Lecturer</h1>
        </div>
      </FadeIn>

      <ShakeOnMount>
        <div style={{
          background: 'var(--card-bg)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border-light)',
        }}>
          <div style={{
            background: 'rgba(245,158,11,0.08)',
            borderLeft: '4px solid #FFC107',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
              <FaInfoCircle style={{ color: '#FFC107', marginRight: '0.3rem' }} />
              <strong style={{ color: '#0A2A66' }}>Note:</strong> Create lecturer accounts with appropriate roles. <strong style={{ color: '#0A2A66' }}>Exam Officer is handled by Admin</strong> - you don't need to create a separate Exam Officer lecturer.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label><FaIdCard style={{ color: '#FFC107' }} /> Lecturer ID <span className="required-field"></span></label>
                <input type="text" name="lecturer_id" value={form.lecturer_id} onChange={handleChange} placeholder="e.g., LEC001" required />
                <small>Unique identifier for login</small>
              </div>
              <div className="form-group">
                <label><FaUser style={{ color: '#FFC107' }} /> Full Name <span className="required-field"></span></label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="e.g., Dr. John Doe" required />
              </div>
              <div className="form-group">
                <label><FaEnvelope style={{ color: '#FFC107' }} /> Email Address <span className="required-field"></span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="lecturer@mmtu.edu.sl" required />
              </div>
              <div className="form-group">
                <label><FaLock style={{ color: '#FFC107' }} /> Password <span className="required-field"></span></label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Create a password" required minLength={6} />
                <small>Minimum 6 characters</small>
              </div>
              <div className="form-group">
                <label><FaPhone style={{ color: '#FFC107' }} /> Phone Number</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g., +232 76 123456" />
              </div>
              <div className="form-group">
                <label><FaGraduationCap style={{ color: '#FFC107' }} /> Qualification</label>
                <input type="text" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g., PhD, MSc, BSc" />
              </div>
              
              {/* ========== SIGNATURE FIELD (NEW) ========== */}
              <div className="form-group">
                <label><FaSignature style={{ color: '#FFC107' }} /> Digital Signature</label>
                <input type="text" name="signature" value={form.signature} onChange={handleChange} placeholder="e.g., Dr. John Doe" />
                <small>Used for signing grade submissions and approvals</small>
              </div>
              
              <div className="form-group full-width">
                <label><FaUserTag style={{ color: '#FFC107' }} /> Role <span className="required-field"></span></label>
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="lecturer">Lecturer</option>
                  <option value="head_of_department">Head of Department (HOD)</option>
                  <option value="dean">Dean</option>
                </select>
                {form.role && roleDescriptions[form.role] && (
                  <div style={{
                    background: 'var(--blue-bg)',
                    border: '1px solid var(--blue-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginTop: '0.5rem',
                    fontSize: '0.85rem',
                    color: 'var(--blue-text)',
                  }}>
                    <FaInfoCircle style={{ marginRight: '0.3rem' }} /> {roleDescriptions[form.role].info}
                  </div>
                )}
              </div>
              {(form.role === 'dean' || form.role === 'head_of_department' || form.role === 'lecturer') && (
                <>
                  <div className="form-group">
                    <label><FaUniversity style={{ color: '#FFC107' }} /> Select Faculty {form.role === 'dean' && <span className="required-field"></span>}</label>
                    <select name="faculty_id" value={form.faculty_id} onChange={handleChange} required={form.role === 'dean'}>
                      <option value="">-- Select Faculty --</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                    </select>
                  </div>
                  {(form.role === 'head_of_department' || form.role === 'lecturer') && (
                    <div className="form-group">
                      <label><FaSitemap style={{ color: '#FFC107' }} /> Select Department <span className="required-field"></span></label>
                      <select name="department_id" value={form.department_id} onChange={handleChange} required>
                        <option value="">-- {form.faculty_id ? 'Select Department' : 'First select a faculty'} --</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <small>Required for HOD and Lecturer roles</small>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="form-actions">
              <Link to="/admin/manage-users" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Lecturer</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddLecturer;