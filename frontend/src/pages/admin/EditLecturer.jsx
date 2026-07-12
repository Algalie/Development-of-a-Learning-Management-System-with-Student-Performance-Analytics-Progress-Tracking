import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaEdit, FaIdCard, FaUser, FaEnvelope, FaLock, FaPhone,
  FaGraduationCap, FaUserTag, FaUniversity, FaBuilding, FaSitemap, FaSignature,
  FaTimes, FaSave, FaSpinner, FaExclamationTriangle, FaTrash
} from 'react-icons/fa';

const EditLecturer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'lecturer',
    phone: '',
    qualification: '',
    faculty_id: '',
    department_id: '',
    lecturer_id: '',
    signature: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [lecturersRes, facultiesRes] = await Promise.all([
        adminApi.getLecturers(),
        adminApi.getFaculties(),
      ]);
      const lecturers = lecturersRes.data.lecturers || lecturersRes.data || [];
      const lecturer = lecturers.find(l => l.id === parseInt(id));
      
      if (!lecturer) {
        toast.error('Lecturer not found');
        navigate('/admin/manage-users');
        return;
      }

      setFaculties(facultiesRes.data.faculties || facultiesRes.data || []);
      setForm({
        full_name: lecturer.full_name || '',
        email: lecturer.email || '',
        password: '',
        role: lecturer.role || 'lecturer',
        phone: lecturer.phone || '',
        qualification: lecturer.qualification || '',
        faculty_id: lecturer.faculty_id || lecturer.faculty?.id || '',
        department_id: lecturer.department_id || lecturer.department?.id || '',
        lecturer_id: lecturer.lecturer_id || '',
        signature: lecturer.signature || '',
      });

      if (lecturer.department?.faculty_id) {
        loadDepartments(lecturer.department.faculty_id);
      } else if (lecturer.faculty_id) {
        loadDepartments(lecturer.faculty_id);
      }
    } catch (error) {
      toast.error('Failed to load lecturer data');
      navigate('/admin/manage-users');
    } finally {
      setPageLoading(false);
    }
  };

  const loadDepartments = async (facultyId) => {
    if (!facultyId) return;
    try {
      const res = await adminApi.getDepartments(facultyId);
      setDepartments(res.data.departments || []);
    } catch (error) {
      setDepartments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === 'faculty_id') {
      loadDepartments(value);
      setForm(prev => ({ ...prev, department_id: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.role === 'dean' && !form.faculty_id) { toast.error('Please select a faculty'); return; }
    if ((form.role === 'head_of_department' || form.role === 'lecturer') && !form.department_id) { toast.error('Please select a department'); return; }

    setLoading(true);
    try {
      const data = { ...form };
      if (!data.password) delete data.password;
      await adminApi.editLecturer(id, data);
      toast.success('Lecturer updated successfully!');
      navigate('/admin/manage-users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update lecturer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this lecturer? This cannot be undone.')) return;
    try {
      await adminApi.deleteLecturer(id);
      toast.success('Lecturer deleted');
      navigate('/admin/manage-users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (pageLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p>Loading lecturer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '850px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/manage-users" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Users</Link>
          <h1>Edit Lecturer</h1>
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
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0A2A66', margin: '0 0 0.5rem' }}>
              <FaEdit style={{ color: '#FFC107' }} /> Editing: {form.full_name}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
              Lecturer ID: <strong style={{ color: 'var(--text-primary)' }}>{form.lecturer_id}</strong> (cannot be changed)
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0' }}>
              Current Role: <strong style={{ color: 'var(--text-primary)' }}>{form.role.replace(/_/g, ' ')}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label><FaIdCard style={{ color: '#FFC107' }} /> Lecturer ID</label>
                <input type="text" value={form.lecturer_id} readOnly />
              </div>
              <div className="form-group">
                <label><FaUser style={{ color: '#FFC107' }} /> Full Name <span className="required-field"></span></label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label><FaEnvelope style={{ color: '#FFC107' }} /> Email <span className="required-field"></span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label><FaLock style={{ color: '#FFC107' }} /> New Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Leave blank to keep current" />
              </div>
              <div className="form-group">
                <label><FaPhone style={{ color: '#FFC107' }} /> Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label><FaGraduationCap style={{ color: '#FFC107' }} /> Qualification</label>
                <input type="text" name="qualification" value={form.qualification} onChange={handleChange} />
              </div>
              
              {/* ========== SIGNATURE FIELD (NEW) ========== */}
              <div className="form-group">
                <label><FaSignature style={{ color: '#FFC107' }} /> Digital Signature</label>
                <input type="text" name="signature" value={form.signature} onChange={handleChange} placeholder="e.g., Dr. John Doe" />
                <small>Used for signing grade submissions and approvals</small>
              </div>
              
              <div className="form-group">
                <label><FaUserTag style={{ color: '#FFC107' }} /> Role <span className="required-field"></span></label>
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="lecturer">Lecturer</option>
                  <option value="head_of_department">Head of Department</option>
                  <option value="dean">Dean</option>
                </select>
              </div>
              {form.role === 'dean' && (
                <div className="form-group">
                  <label><FaUniversity style={{ color: '#FFC107' }} /> Faculty <span className="required-field"></span></label>
                  <select name="faculty_id" value={form.faculty_id} onChange={handleChange} required>
                    <option value="">-- Select Faculty --</option>
                    {faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                  </select>
                </div>
              )}
              {form.role !== 'dean' && (
                <>
                  <div className="form-group">
                    <label><FaBuilding style={{ color: '#FFC107' }} /> Select Faculty</label>
                    <select name="faculty_id" value={form.faculty_id} onChange={handleChange}>
                      <option value="">-- Select Faculty --</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label><FaSitemap style={{ color: '#FFC107' }} /> Department <span className="required-field"></span></label>
                    <select name="department_id" value={form.department_id} onChange={handleChange} required>
                      <option value="">-- Select Department --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="form-actions">
              <Link to="/admin/manage-users" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaSave /> Update Lecturer</>}
              </button>
            </div>
          </form>

          <div className="danger-zone">
            <h4><FaExclamationTriangle style={{ marginRight: '0.3rem' }} /> Danger Zone</h4>
            <button onClick={handleDelete} className="btn btn-danger">
              <FaTrash /> Delete Lecturer
            </button>
          </div>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default EditLecturer;