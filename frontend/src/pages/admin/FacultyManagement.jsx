import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { FaArrowLeft, FaPlus, FaUniversity, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

const FacultyManagement = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFaculties(); }, []);

  const fetchFaculties = async () => {
    try {
      const res = await adminApi.getFaculties();
      setFaculties(res.data.faculties || res.data || []);
    } catch (error) {
      toast.error('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFaculty = async (id, name) => {
    if (!window.confirm(`Delete faculty "${name}" and all its departments?`)) return;
    try {
      await adminApi.deleteFaculty(id);
      toast.success('Faculty deleted');
      fetchFaculties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot delete faculty');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      await adminApi.deleteDepartment(id);
      toast.success('Department deleted');
      fetchFaculties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot delete department');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading faculties...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header-with-actions">
          <div className="header-left">
            <Link to="/admin/dashboard" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard</Link>
            <h1>Faculty Management</h1>
          </div>
          <Link to="/admin/add-faculty" className="btn btn-primary"><FaPlus /> Add Faculty</Link>
        </div>
      </FadeIn>

      <ShakeOnMount>
        <div className="faculty-grid">
          {faculties.length === 0 ? (
            <div className="empty-state">
              <FaUniversity style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }} />
              <h3>No Faculties Added Yet</h3>
              <p>Click the "Add Faculty" button to create your first faculty.</p>
            </div>
          ) : (
            faculties.map(faculty => (
              <motion.div key={faculty.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'var(--card-bg)', borderRadius: 'var(--radius-2xl)', padding: '1.5rem',
                  boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
                  transition: 'all 0.3s',
                }}
              >
                <div className="faculty-header">
                  <h3 style={{ color: 'var(--text-primary)' }}>{faculty.name}</h3>
                  <span className="faculty-code">{faculty.code}</span>
                </div>
                <div className="faculty-description" style={{ color: 'var(--text-secondary)' }}>
                  {faculty.description || 'No description provided'}
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    color: '#0A2A66', fontSize: '0.9rem', marginBottom: '0.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    Departments ({faculty.departments?.length || 0})
                    <Link to={`/admin/add-department/${faculty.id}`} className="btn btn-sm btn-primary" style={{ fontSize: '0.75rem' }}>
                      <FaPlus /> Add
                    </Link>
                  </h4>
                  <ul className="departments-list">
                    {faculty.departments && faculty.departments.length > 0 ? (
                      faculty.departments.map(dept => (
                        <li key={dept.id} className="department-item" style={{
                          background: 'var(--card-bg-hover)', borderColor: 'var(--border)',
                        }}>
                          <div>
                            <span className="department-name" style={{ color: 'var(--text-primary)' }}>{dept.name}</span><br />
                            <span className="department-code" style={{ color: 'var(--text-secondary)' }}>{dept.code}</span>
                          </div>
                          <div className="department-actions">
                            <Link to={`/admin/edit-department/${dept.id}`} className="icon-btn edit"><FaEdit /></Link>
                            <button onClick={() => handleDeleteDepartment(dept.id)} className="icon-btn delete"><FaTrash /></button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li style={{ color: 'var(--text-secondary)', padding: '0.5rem' }}>No departments yet</li>
                    )}
                  </ul>
                </div>
                <div className="faculty-actions" style={{ borderTopColor: 'var(--border)' }}>
                  <Link to={`/admin/edit-faculty/${faculty.id}`} className="btn-action btn-edit"><FaEdit /> Edit</Link>
                  <button onClick={() => handleDeleteFaculty(faculty.id, faculty.name)} className="btn-action btn-delete"><FaTrash /> Delete</button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default FacultyManagement;