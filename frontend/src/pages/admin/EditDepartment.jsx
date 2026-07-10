import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaUniversity, FaDoorOpen, FaQrcode, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

const EditDepartment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [facultyName, setFacultyName] = useState('');
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const fetchDepartment = async () => {
    try {
      const res = await adminApi.getFaculties();
      const faculties = res.data.faculties || res.data || [];
      for (const f of faculties) {
        const dept = f.departments?.find(d => d.id === parseInt(id));
        if (dept) {
          setForm({ name: dept.name, code: dept.code });
          setFacultyName(f.name);
          return;
        }
      }
      toast.error('Department not found');
      navigate('/admin/faculty-management');
    } catch (error) {
      toast.error('Failed to load department');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.editDepartment(id, form);
      toast.success('Department updated!');
      navigate('/admin/faculty-management');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/faculty-management" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back</Link>
          <h1>Edit Department</h1>
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
            background: 'rgba(255,193,7,0.06)',
            borderLeft: '4px solid #FFC107',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-md)',
          }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>
              <FaUniversity style={{ color: '#FFC107', marginRight: '0.4rem' }} /> {facultyName}
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FaDoorOpen style={{ color: '#FFC107' }} /> Department Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FaQrcode style={{ color: '#FFC107' }} /> Department Code</label>
              <input type="text" name="code" value={form.code} onChange={handleChange} required />
            </div>
            <div className="form-actions">
              <Link to="/admin/faculty-management" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaSave /> Update Department</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default EditDepartment;