import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaUniversity, FaQrcode, FaAlignLeft, FaTimes, FaSave, FaSpinner } from 'react-icons/fa';

const AddFaculty = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminApi.addFaculty(form);
      toast.success(`Faculty ${form.name} added!`);
      navigate('/admin/faculty-management');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/faculty-management" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back</Link>
          <h1>Add New Faculty</h1>
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
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g., Faculty of Pure and Applied Sciences" required />
            </div>
            <div className="form-group">
              <label><FaQrcode style={{ color: '#FFC107' }} /> Faculty Code</label>
              <input type="text" name="code" value={form.code} onChange={handleChange} placeholder="e.g., FPAS" required />
            </div>
            <div className="form-group">
              <label><FaAlignLeft style={{ color: '#FFC107' }} /> Description (Optional)</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Enter faculty description"></textarea>
            </div>
            <div className="form-actions">
              <Link to="/admin/faculty-management" className="btn btn-outline"><FaTimes /> Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaSave /> Create Faculty</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddFaculty;