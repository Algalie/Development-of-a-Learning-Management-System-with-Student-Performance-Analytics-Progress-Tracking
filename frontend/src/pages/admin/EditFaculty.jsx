import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaUniversity, FaQrcode, FaAlignLeft, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

const EditFaculty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  useEffect(() => {
    fetchFaculty();
  }, [id]);

  const fetchFaculty = async () => {
    try {
      const res = await adminApi.getFaculties();
      const faculties = res.data.faculties || res.data || [];
      const faculty = faculties.find(f => f.id === parseInt(id));
      if (!faculty) { toast.error('Faculty not found'); navigate('/admin/faculty-management'); return; }
      setForm({ name: faculty.name, code: faculty.code, description: faculty.description || '' });
    } catch (error) {
      toast.error('Failed to load faculty');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.editFaculty(id, form);
      toast.success('Faculty updated!');
      navigate('/admin/faculty-management');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update faculty');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/faculty-management" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back</Link>
          <h1>Edit Faculty</h1>
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
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><FaUniversity style={{ color: '#FFC107' }} /> Faculty Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FaQrcode style={{ color: '#FFC107' }} /> Faculty Code</label>
              <input type="text" name="code" value={form.code} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label><FaAlignLeft style={{ color: '#FFC107' }} /> Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3"></textarea>
            </div>
            <div className="form-actions">
              <Link to="/admin/faculty-management" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Updating...</> : <><FaSave /> Update Faculty</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default EditFaculty;