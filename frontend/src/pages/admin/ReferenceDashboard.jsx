import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaBuilding, FaDoorOpen, FaCalendarAlt, FaCalendar,
  FaRedoAlt, FaFilter, FaClock, FaCheckCircle, FaTimesCircle,
  FaCalculator, FaSpinner
} from 'react-icons/fa';

const ReferenceDashboard = () => {
  const [data, setData] = useState({ pending: [], cleared: [], double: [], stats: { pending: 0, cleared: 0, double_fail: 0 } });
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ faculty: '', dept: '', year: '', semester: '' });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => { fetchData(); fetchFaculties(); }, []);

  const fetchFaculties = async () => {
    try {
      const res = await adminApi.getFaculties();
      setFaculties(res.data.faculties || res.data || []);
    } catch (error) {}
  };

  const fetchData = async () => {
    try {
      const res = await adminApi.getReferenceDashboard(filters);
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load references');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async (facultyId) => {
    if (!facultyId) { setDepartments([]); return; }
    try {
      const res = await adminApi.getDepartments(facultyId);
      setDepartments(res.data.departments || []);
    } catch (error) { setDepartments([]); }
  };

  const getStatusBadge = (status) => {
    if (status === 'cleared') return <span className="status-badge status-cleared"><FaCheckCircle /> Cleared</span>;
    if (status === 'double_fail') return <span className="status-badge status-double"><FaTimesCircle /> Double Fail</span>;
    return <span className="status-badge status-pending"><FaClock /> Pending</span>;
  };

  const getGradeBadge = (grade) => `grade-badge grade-${grade || 'F'}`;

  if (loading) {
    return <div className="dashboard-container"><div className="loading-container"><FaSpinner className="loading-spinner" /><p>Loading references...</p></div></div>;
  }

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FaClock />, data: data.pending || [], count: data.stats.pending },
    { key: 'cleared', label: 'Cleared', icon: <FaCheckCircle />, data: data.cleared || [], count: data.stats.cleared },
    { key: 'double', label: 'Double Fail', icon: <FaTimesCircle />, data: data.double || [], count: data.stats.double_fail },
  ];

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const shadowSm = 'var(--shadow-sm)';

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard</Link>
          <h1>Reference Dashboard</h1>
        </div>
      </FadeIn>

      {/* Filters */}
      <div style={{
        background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
        marginBottom: '1.5rem', boxShadow: shadowSm, border: `1px solid ${borderLight}`,
      }}>
        <div className="filter-grid">
          <div className="form-group">
            <label><FaBuilding style={{ color: '#FFC107' }} /> Faculty</label>
            <select value={filters.faculty} onChange={e => { setFilters({ ...filters, faculty: e.target.value, dept: '' }); loadDepartments(e.target.value); }}>
              <option value="">All Faculties</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><FaDoorOpen style={{ color: '#FFC107' }} /> Department</label>
            <select value={filters.dept} onChange={e => setFilters({ ...filters, dept: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label><FaCalendarAlt style={{ color: '#FFC107' }} /> Academic Year</label>
            <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
              <option value="">All Years</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>
          <div className="form-group">
            <label><FaCalendar style={{ color: '#FFC107' }} /> Semester</label>
            <select value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button className="btn btn-outline" onClick={() => { setFilters({ faculty: '', dept: '', year: '', semester: '' }); setDepartments([]); }}>
            <FaRedoAlt /> Reset
          </button>
          <button className="btn btn-primary" onClick={fetchData}>
            <FaFilter /> Apply Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Pending', value: data.stats.pending, color: '#f59e0b', icon: <FaClock />, className: 'pending' },
          { label: 'Cleared', value: data.stats.cleared, color: '#10b981', icon: <FaCheckCircle />, className: 'cleared' },
          { label: 'Double Fail', value: data.stats.double_fail, color: '#ef4444', icon: <FaTimesCircle />, className: 'double' },
        ].map((stat, i) => (
          <div key={i} className={`stat-card border-left ${stat.className}`}>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label"><span style={{ color: stat.color }}>{stat.icon}</span> {stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => (
          <span key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.icon} {tab.label}
            <span className="count">{tab.count}</span>
          </span>
        ))}
      </div>

      <ShakeOnMount>
        <div style={{
          background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
          overflow: 'auto', boxShadow: shadowSm, border: `1px solid ${borderLight}`,
          marginBottom: '1.5rem',
        }}>
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Student Name</th><th>Course</th>
                {activeTab === 'pending' && <th>Original Grade</th>}
                {activeTab !== 'pending' && <th>Display Grade</th>}
                {activeTab === 'cleared' && <th>Credit Hours</th>}
                <th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tabs.find(t => t.key === activeTab)?.data?.length === 0 ? (
                <tr><td colSpan={activeTab === 'cleared' ? 7 : activeTab === 'pending' ? 6 : 5}>
                  <div className="empty-state"><FaCheckCircle style={{ color: '#10b981', fontSize: '3rem', marginBottom: '1rem' }} /><p>No {activeTab} references</p></div>
                </td></tr>
              ) : (
                tabs.find(t => t.key === activeTab)?.data?.map((ref, i) => (
                  <tr key={i}>
                    <td><strong style={{ color: '#0A2A66' }}>{ref.student?.student_id || ref.student_id}</strong></td>
                    <td style={{ color: 'var(--text-primary)' }}>{ref.student?.student_name || ref.student_name}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{ref.course?.course_code || ref.course_code} - {ref.course?.course_name || ref.course_name}</td>
                    {activeTab === 'pending' && <td><span className={getGradeBadge(ref.original_grade)}>{ref.original_grade}</span></td>}
                    {activeTab !== 'pending' && ref.display_grade && (
                      <td><span className="display-grade"><span className="new-grade">{ref.display_grade.split('/')[0]}</span>/<span className="old-grade">{ref.display_grade.split('/')[1]}</span></span></td>
                    )}
                    {activeTab === 'cleared' && (
                      <td style={{ color: 'var(--text-primary)' }}>{ref.original_credit_hours} → <strong style={{ color: '#f59e0b' }}>{ref.effective_credit_hours || ref.original_credit_hours * 2}</strong><br /><small style={{ color: '#f59e0b' }}>(penalty applied)</small></td>
                    )}
                    <td>{getStatusBadge(ref.reference_status || ref.status)}</td>
                    <td>
                      <Link to={`/admin/gpa-calculator`} className="btn btn-sm btn-primary">
                        <FaCalculator /> Calculate
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default ReferenceDashboard;