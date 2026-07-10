import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaDoorOpen, FaQrcode, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

const AddDepartment = () => {
  const { facultyId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [faculty, setFaculty] = useState(null);
  const [form, setForm] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchFaculty();
  }, [facultyId]);

  const fetchFaculty = async () => {
    try {
      const res = await adminApi.getFaculties();
      const faculties = res.data.faculties || res.data || [];
      const found = faculties.find(f => f.id === parseInt(facultyId));
      setFaculty(found || { name: 'Unknown Faculty', code: 'N/A' });
    } catch (error) {
      toast.error('Failed to load faculty');
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.addDepartment(facultyId, form);
      toast.success(`Department ${form.name} added!`);
      navigate('/admin/faculty-management');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/faculty-management" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back</Link>
          <h1>Add Department</h1>
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
              {faculty?.name || 'Loading...'}
            </p>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Code: {faculty?.code || '...'}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FaDoorOpen style={{ color: '#FFC107' }} /> Department Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Computer Science" required />
            </div>
            <div className="form-group">
              <label><FaQrcode style={{ color: '#FFC107' }} /> Department Code</label>
              <input type="text" name="code" value={form.code} onChange={handleChange} placeholder="e.g., CS" required />
            </div>
            <div className="form-actions">
              <Link to="/admin/faculty-management" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Department</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddDepartment;