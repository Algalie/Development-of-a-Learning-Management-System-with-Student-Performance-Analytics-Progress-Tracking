import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaTimes, FaSpinner, FaIdCard, FaUserGraduate,
  FaClock, FaCheckCircle, FaTimesCircle, FaSyncAlt, FaFilter, FaRedoAlt,
  FaBuilding, FaCalendarAlt, FaCalculator, FaExclamationTriangle
} from 'react-icons/fa';

const ReferenceManagement = () => {
  const [studentId, setStudentId] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [references, setReferences] = useState([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [activeTab, setActiveTab] = useState('pending');
  const [dashboardData, setDashboardData] = useState({
    pending: [], cleared: [], double: [],
    stats: { pending: 0, cleared: 0, double_fail: 0, total: 0 }
  });
  const [dashLoading, setDashLoading] = useState(true);

  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ faculty: '', dept: '', year: '', semester: '' });

  useEffect(() => {
    fetchDashboardData();
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const res = await adminApi.getFaculties();
      setFaculties(res.data.faculties || res.data || []);
    } catch (error) { console.error('Failed to load faculties'); }
  };

  const loadDepartments = async (facultyId) => {
    if (!facultyId) { setDepartments([]); return; }
    try {
      const res = await adminApi.getDepartments(facultyId);
      setDepartments(res.data.departments || []);
    } catch (error) { setDepartments([]); }
  };

  const fetchDashboardData = async (filterParams = null) => {
    try {
      const params = filterParams || {};
      const res = await adminApi.getReferenceDashboard(params);
      setDashboardData(res.data);
    } catch (error) {
      toast.error('Failed to load references');
    } finally {
      setDashLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) { toast.error('Please enter a student ID'); return; }
    setQueryLoading(true);
    setSearched(true);
    try {
      const res = await adminApi.getReferences(studentId);
      setStudentInfo(res.data.student_info || null);
      setReferences(res.data.references || []);
      if (!res.data.student_info) toast.error('Student not found');
    } catch (error) {
      toast.error('Failed to fetch references');
      setStudentInfo(null); setReferences([]);
    } finally {
      setQueryLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    if (status === 'cleared') return { icon: <FaCheckCircle />, label: 'Cleared', color: '#16a34a', bg: '#f0fdf4' };
    if (status === 'double_fail') return { icon: <FaTimesCircle />, label: 'Double Fail', color: '#dc2626', bg: '#fef2f2' };
    return { icon: <FaClock />, label: 'Pending', color: '#ca8a04', bg: '#fefce8' };
  };

  const getGradeDisplay = (grade) => {
    const colors = { A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#ea580c', E: '#7c3aed', F: '#dc2626' };
    const bgs = { A: '#f0fdf4', B: '#eff6ff', C: '#fefce8', D: '#fff7ed', E: '#f5f3ff', F: '#fef2f2' };
    return { color: colors[grade] || '#475569', bg: bgs[grade] || '#f1f5f9' };
  };

  const tabs = [
    { key: 'pending', label: 'Pending', icon: <FaClock />, data: dashboardData.pending || [], count: dashboardData.stats.pending },
    { key: 'cleared', label: 'Cleared', icon: <FaCheckCircle />, data: dashboardData.cleared || [], count: dashboardData.stats.cleared },
    { key: 'double', label: 'Double Fail', icon: <FaTimesCircle />, data: dashboardData.double || [], count: dashboardData.stats.double_fail },
  ];

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <h1>Reference Management</h1>
        </div>
      </FadeIn>

      {/* ==================== QUERY BY STUDENT ID ==================== */}
      <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaIdCard style={{ color: '#0A2A66' }} /> Search Student References
        </h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Student ID</label>
            <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={queryLoading} style={{ height: '44px' }}>
            {queryLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Search
          </button>
          <button type="button" className="btn btn-outline" onClick={() => { setStudentId(''); setStudentInfo(null); setReferences([]); setSearched(false); }} style={{ height: '44px' }}>
            <FaTimes /> Clear
          </button>
        </form>

        {/* Query Results */}
        {studentInfo && (
          <ShakeOnMount>
            <div style={{ marginTop: '1.5rem', borderTop: `1px solid ${border}`, paddingTop: '1.5rem' }}>
              {references.some(r => r.reference_status === 'pending') && (
                <div style={{
                  background: '#fefce8', borderLeft: '4px solid #ca8a04',
                  padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1rem',
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                }}>
                  <FaExclamationTriangle style={{ color: '#ca8a04', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#854d0e', marginBottom: '0.25rem' }}>Pending References</div>
                    <p style={{ color: '#854d0e', fontSize: '0.85rem', margin: 0 }}>This student has pending reference(s). GPA calculation is blocked until resolved.</p>
                  </div>
                </div>
              )}

              <div style={{ background: cardBgHover, borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${border}` }}>
                <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FaUserGraduate style={{ color: '#0A2A66' }} /> Student Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.6rem' }}>
                  {[
                    { label: 'Student ID', value: studentInfo.id },
                    { label: 'Name', value: studentInfo.name },
                    { label: 'Program', value: studentInfo.program || 'N/A' },
                    { label: 'Department', value: studentInfo.department || 'N/A' },
                    { label: 'Level', value: studentInfo.level || 'N/A' },
                    { label: 'Semester', value: studentInfo.semester || 'N/A' },
                    { label: 'Academic Year', value: studentInfo.academic_year || 'N/A' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500, color: textSec, minWidth: '90px' }}>{item.label}:</span>
                      <span style={{ color: textPri, fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {references.length > 0 && (
                <div style={{ border: `1px solid ${border}`, borderRadius: '10px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Course</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Year</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Semester</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Original</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Reference</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Display</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {references.map((ref, i) => {
                        const origGrade = getGradeDisplay(ref.original_grade);
                        const refGrade = ref.reference_grade ? getGradeDisplay(ref.reference_grade) : null;
                        const status = getStatusDisplay(ref.reference_status);
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, color: '#0A2A66' }}>{ref.course_code}</div>
                              <div style={{ fontSize: '0.8rem', color: textSec }}>{ref.course_name}</div>
                            </td>
                            <td style={{ padding: '12px 16px', color: textPri, fontSize: '0.85rem' }}>{ref.academic_year}</td>
                            <td style={{ padding: '12px 16px', color: textPri, fontSize: '0.85rem' }}>{ref.semester}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', background: origGrade.bg, color: origGrade.color, fontWeight: 600, fontSize: '0.8rem' }}>{ref.original_grade}</span>
                              <span style={{ fontSize: '0.75rem', color: textMuted, marginLeft: '0.3rem' }}>({ref.original_score != null ? ref.original_score.toFixed(1) : 'N/A'}%)</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {ref.reference_grade ? (
                                <>
                                  <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', background: refGrade.bg, color: refGrade.color, fontWeight: 600, fontSize: '0.8rem' }}>{ref.reference_grade}</span>
                                  <span style={{ fontSize: '0.75rem', color: textMuted, marginLeft: '0.3rem' }}>({ref.reference_score != null ? ref.reference_score.toFixed(1) : 'N/A'}%)</span>
                                </>
                              ) : (
                                <span style={{ color: textMuted, fontSize: '0.85rem' }}>Not entered</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {ref.display_grade ? (
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                  <span style={{ color: '#16a34a' }}>{ref.display_grade.split('/')[0]}</span>
                                  <span style={{ color: textMuted }}> / </span>
                                  <span style={{ color: '#dc2626' }}>{ref.display_grade.split('/')[1]}</span>
                                </span>
                              ) : (
                                <span style={{ color: textMuted }}>—</span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: status.bg, color: status.color, fontWeight: 500, fontSize: '0.8rem' }}>
                                {status.icon} {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ShakeOnMount>
        )}

        {searched && !studentInfo && !queryLoading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: textMuted, marginTop: '1rem' }}>
            <FaUserGraduate style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
            <p>Student not found. Please check the ID and try again.</p>
          </div>
        )}
      </div>

      {/* ==================== REFERENCE DASHBOARD ==================== */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaSyncAlt style={{ color: '#0A2A66' }} /> Reference Dashboard
        </h2>
      </div>

      {/* Filters */}
      <div style={{ background: cardBg, borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}><FaBuilding style={{ marginRight: '0.3rem' }} />Faculty</label>
            <select value={filters.faculty} onChange={e => { setFilters({ ...filters, faculty: e.target.value, dept: '' }); loadDepartments(e.target.value); }}>
              <option value="">All Faculties</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Department</label>
            <select value={filters.dept} onChange={e => setFilters({ ...filters, dept: e.target.value })}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}><FaCalendarAlt style={{ marginRight: '0.3rem' }} />Academic Year</label>
            <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}>
              <option value="">All Years</option>
              <option>2026/2027</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Semester</label>
            <select value={filters.semester} onChange={e => setFilters({ ...filters, semester: e.target.value })}>
              <option value="">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={() => { const reset = { faculty: '', dept: '', year: '', semester: '' }; setFilters(reset); setDepartments([]); setDashLoading(true); fetchDashboardData(reset); }}>
            <FaRedoAlt /> Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => { setDashLoading(true); fetchDashboardData(filters); }}>
            <FaFilter /> Apply Filters
          </button>
        </div>
      </div>

      {/* Dashboard Stats & Tabs */}
      {!dashLoading && (
        <>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.2rem', borderRadius: '8px',
                  background: activeTab === tab.key ? '#0A2A66' : 'transparent',
                  color: activeTab === tab.key ? 'white' : textPri,
                  border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
                  cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                  transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.icon} {tab.label}
                <span style={{
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover,
                  padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                  color: activeTab === tab.key ? 'white' : textSec,
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <ShakeOnMount>
            <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm }}>
              {tabs.find(t => t.key === activeTab)?.data?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}>
                  <FaCheckCircle style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 500 }}>No {activeTab} references found</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Student ID</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Student Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Course</th>
                      {activeTab === 'pending' && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Original Grade</th>}
                      {activeTab === 'cleared' && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Display Grade</th>}
                      {activeTab === 'double' && <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Display Grade</th>}
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabs.find(t => t.key === activeTab)?.data?.map((ref, i) => {
                      const status = getStatusDisplay(ref.reference_status || ref.status);
                      const origGrade = ref.original_grade ? getGradeDisplay(ref.original_grade) : null;
                      return (
                        <tr key={ref.id || i} style={{ borderBottom: `1px solid ${border}` }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>
                            {ref.student?.student_id || ref.student_id_num || ref.student_id || 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px', color: textPri, fontSize: '0.85rem' }}>
                            {ref.student?.student_name || ref.student_name || 'N/A'}
                          </td>
                          <td style={{ padding: '12px 16px', color: textPri, fontSize: '0.85rem' }}>
                            {ref.course_code || ref.course?.course_code || 'N/A'}
                            <div style={{ fontSize: '0.75rem', color: textMuted }}>{ref.course_name || ref.course?.course_name || ''}</div>
                          </td>
                          {activeTab === 'pending' && (
                            <td style={{ padding: '12px 16px' }}>
                              {origGrade && (
                                <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', background: origGrade.bg, color: origGrade.color, fontWeight: 600, fontSize: '0.8rem' }}>{ref.original_grade}</span>
                              )}
                            </td>
                          )}
                          {(activeTab === 'cleared' || activeTab === 'double') && (
                            <td style={{ padding: '12px 16px' }}>
                              {ref.display_grade ? (
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  <span style={{ color: '#16a34a' }}>{ref.display_grade.split('/')[0]}</span>
                                  <span style={{ color: textMuted }}> / </span>
                                  <span style={{ color: '#dc2626' }}>{ref.display_grade.split('/')[1]}</span>
                                </span>
                              ) : '—'}
                            </td>
                          )}
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: status.bg, color: status.color, fontWeight: 500, fontSize: '0.8rem' }}>
                              {status.icon} {status.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <Link to="/admin/gpa-calculator" style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.4rem 0.8rem', borderRadius: '6px',
                              background: cardBgHover, color: textPri,
                              textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500,
                              border: `1px solid ${border}`,
                            }}>
                              <FaCalculator style={{ fontSize: '0.7rem' }} /> Calculate
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </ShakeOnMount>
        </>
      )}

      {dashLoading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: textSec, marginTop: '1rem' }}>Loading references...</p>
        </div>
      )}
    </div>
  );
};

export default ReferenceManagement;