import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaUserCircle, FaUser, FaEnvelope, FaLock, FaShieldAlt, FaTimes, FaUserPlus, FaSpinner } from 'react-icons/fa';

const AddAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await adminApi.addAdmin(form);
      toast.success(`Admin ${form.full_name} added successfully!`);
      navigate('/admin/manage-users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '700px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/manage-users" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Users
          </Link>
          <h1>Add New Administrator</h1>
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
              <strong style={{ color: '#0A2A66' }}>Note:</strong> Adding a new administrator gives them access to the admin dashboard.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              They will be able to manage users, view submissions, and access system settings.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              <strong style={{ color: '#0A2A66' }}>Super Admin</strong> has full system access. <strong style={{ color: '#0A2A66' }}>Admin</strong> has standard access.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label><FaUserCircle style={{ color: '#FFC107' }} /> Username <span className="required-field"></span></label>
                <input type="text" name="username" value={form.username} onChange={handleChange} placeholder="Enter username" required />
              </div>
              <div className="form-group">
                <label><FaUser style={{ color: '#FFC107' }} /> Full Name <span className="required-field"></span></label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter full name" required />
              </div>
              <div className="form-group">
                <label><FaEnvelope style={{ color: '#FFC107' }} /> Email Address <span className="required-field"></span></label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="admin@university.edu" required />
              </div>
              <div className="form-group">
                <label><FaLock style={{ color: '#FFC107' }} /> Password <span className="required-field"></span></label>
                <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter password" required minLength={6} />
              </div>
              <div className="form-group full-width">
                <label><FaShieldAlt style={{ color: '#FFC107' }} /> Role <span className="required-field"></span></label>
                <select name="role" value={form.role} onChange={handleChange} required>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <Link to="/admin/manage-users" className="btn btn-outline">
                <FaTimes /> Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><FaSpinner className="animate-spin" /> Registering...</> : <><FaUserPlus /> Register Admin</>}
              </button>
            </div>
          </form>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddAdmin;