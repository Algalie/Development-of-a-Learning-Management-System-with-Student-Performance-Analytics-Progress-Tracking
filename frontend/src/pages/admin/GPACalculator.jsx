import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaSpinner, FaCalculator, FaHistory,
  FaExclamationTriangle, FaTimesCircle, FaCheckCircle, FaInfoCircle,
  FaTable, FaUniversity, FaCalendarAlt, FaLayerGroup, FaUsers,
  FaDownload, FaBuilding, FaBell, FaPaperPlane, FaClock
} from 'react-icons/fa';

const GPACalculator = () => {
  // ========== INDIVIDUAL GPA STATE ==========
  const [form, setForm] = useState({ 
    student_id: '', academic_year: '2026/2027', level: '', semester: '' 
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // ========== BLOCK GPA STATE ==========
  const [activeTab, setActiveTab] = useState('individual');
  const [blockForm, setBlockForm] = useState({
    department_id: '', academic_year: '2026/2027', level: '', semester: ''
  });
  const [departments, setDepartments] = useState([]);
  const [blockData, setBlockData] = useState(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockCalculating, setBlockCalculating] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  // ========== INDIVIDUAL GPA ==========
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchGrades = async () => {
    if (!form.student_id || !form.academic_year || !form.level || !form.semester) {
      toast.error('All fields are required'); return;
    }
    setLoading(true); setResult(null); setData(null);
    try {
      const res = await adminApi.getStudentGrades(form);
      setData(res.data);
      if (!res.data.current_grades || res.data.current_grades.length === 0) {
        toast.error('No grades found for this student/semester');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch grades');
    } finally { setLoading(false); }
  };

  const getGradeDisplay = (g) => {
    if (g.has_double_fail) return <span style={{ color: '#ef4444', fontWeight: 700 }}>DOUBLE FAIL</span>;
    if (g.has_cleared_reference && g.display_grade) {
      const [newGrade, oldGrade] = g.display_grade.split('/');
      return <span><span style={{ color: '#16a34a' }}>{newGrade}</span>/<span style={{ color: '#dc2626' }}>{oldGrade}</span></span>;
    }
    if (g.has_pending_reference) return <span style={{ color: '#f59e0b' }}>⏳ Pending Ref</span>;
    return <span className={`grade-badge grade-${g.grade || 'F'}`}>{g.grade || '-'}</span>;
  };

  const calculateAndSave = async () => {
    if (!data || !data.current_grades || data.current_grades.length === 0) {
      toast.error('No grades to calculate'); return;
    }
    if (data.has_double_fail) { toast.error('Cannot calculate - double fail reference exists.'); return; }
    if (data.has_pending_references) { toast.error('Cannot calculate - pending references exist.'); return; }

    let totalCredits = 0, totalPoints = 0;
    const formulaParts = [];
    data.current_grades.forEach(g => {
      const credits = g.effective_credit_hours || g.credit_hours;
      totalCredits += credits;
      totalPoints += credits * g.grade_points;
      formulaParts.push(`${credits}×${g.grade_points.toFixed(1)}`);
    });
    const currentGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    let status;
    if (currentGPA >= 3.0) status = 'PASS';
    else if (currentGPA >= 2.7) status = 'FAIL';
    else status = 'WITHDREW';

    setResult({ gpa: currentGPA, status, totalCredits, totalPoints, formulaParts });
    setCalculating(true);
    try {
      await adminApi.calculateGPA({
        student_id: form.student_id, student_name: data.student_name,
        level: form.level, semester: form.semester, academic_year: form.academic_year,
        grades: data.current_grades, previous_gpas: data.previous_semesters || [],
      });
      toast.success('GPA calculated and saved!');
    } catch (error) { toast.error('GPA calculated but failed to save'); }
    finally { setCalculating(false); }
  };

  // ========== BLOCK GPA ==========
  const loadDepartments = async () => {
    if (departments.length > 0) return;
    try {
      const res = await adminApi.getFaculties();
      const allDepts = [];
      (res.data.faculties || []).forEach(f => {
        (f.departments || []).forEach(d => allDepts.push({ ...d, faculty_name: f.name }));
      });
      setDepartments(allDepts);
    } catch (error) { console.error('Failed to load departments'); }
  };

  const checkDepartment = async () => {
    if (!blockForm.department_id) { toast.error('Please select a department'); return; }
    setBlockLoading(true); setBlockData(null);
    try {
      const res = await adminApi.checkDepartmentCourses(blockForm);
      setBlockData(res.data);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (error) { toast.error(error.response?.data?.error || 'Failed to check department'); }
    finally { setBlockLoading(false); }
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      const readyIds = (blockData?.students || []).filter(s => s.status === 'ready').map(s => s.student_id);
      setSelectedStudents(readyIds);
    }
    setSelectAll(!selectAll);
  };

  const calculateBlock = async () => {
    const toCalculate = selectedStudents.length > 0 ? selectedStudents : 
      (blockData?.students || []).filter(s => s.status === 'ready').map(s => s.student_id);
    if (toCalculate.length === 0) { toast.error('No students to calculate'); return; }

    setBlockCalculating(true);
    try {
      const res = await adminApi.calculateBlockGPA({ ...blockForm, student_ids: toCalculate });
      toast.success(res.data?.message || 'Block GPA calculated!');
      checkDepartment();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
    finally { setBlockCalculating(false); }
  };

  const handleNotifyHOD = async () => {
    setNotifying(true);
    try {
      await adminApi.notifyMissingStudents({
        department_id: blockForm.department_id,
        missing_students: blockData.missing_students,
      });
      toast.success('HOD notified about all missing students!');
    } catch (error) { toast.error('Failed to send notification'); }
    finally { setNotifying(false); }
  };

  const handleNotifyLecturer = async (lecturerId, studentName, studentId, courseCode) => {
    try {
      await adminApi.notifyLecturerMissing({
        lecturer_id: lecturerId,
        student_name: studentName,
        student_id: studentId,
        course_code: courseCode,
      });
      toast.success(`Lecturer notified about ${studentName}`);
    } catch (error) { toast.error('Failed to notify lecturer'); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ready: { bg: '#f0fdf4', color: '#16a34a', icon: <FaCheckCircle />, label: 'Ready' },
      incomplete: { bg: '#fef2f2', color: '#dc2626', icon: <FaTimesCircle />, label: 'Missing Courses' },
      pending_ref: { bg: '#fefce8', color: '#ca8a04', icon: <FaClock />, label: 'Pending Reference' },
      blocked: { bg: '#fdf2f8', color: '#be185d', icon: <FaExclamationTriangle />, label: 'Double Fail' },
      calculated: { bg: '#f0f4ff', color: '#0A2A66', icon: <FaCheckCircle />, label: 'Calculated' },
    };
    const s = styles[status] || styles.incomplete;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: s.bg, color: s.color, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>{s.icon} {s.label}</span>;
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1300px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard</Link>
          <h1>GPA Calculator</h1>
        </div>
      </FadeIn>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
        {[
          { key: 'individual', label: 'Individual GPA', icon: <FaCalculator /> },
          { key: 'block', label: 'Block GPA (Department)', icon: <FaBuilding /> },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : textPri,
              border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== INDIVIDUAL GPA ==================== */}
      {activeTab === 'individual' && (
        <>
          <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ color: '#0A2A66', marginBottom: '1rem' }}><FaSearch style={{ color: '#FFC107', marginRight: '0.4rem' }} />Student Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Student ID *</label>
                <input type="text" name="student_id" value={form.student_id} onChange={handleChange} placeholder="e.g., 7626" />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Academic Year *</label>
                <select name="academic_year" value={form.academic_year} onChange={handleChange}>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Year *</label>
                <select name="level" value={form.level} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Year 1">Year 1</option><option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option><option value="Year 4">Year 4</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Semester *</label>
                <select name="semester" value={form.semester} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={fetchGrades} disabled={loading}>
              {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Retrieve Grades
            </button>
          </div>

          {data && (
            <ShakeOnMount>
              <div style={{ background: '#f0f4ff', border: '1px solid #bfdbfe', padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div><div style={{ fontWeight: 700, color: '#0A2A66', fontSize: '1.1rem' }}>{data.student_name}</div><div style={{ color: textSec, fontSize: '0.85rem' }}>{form.level} - {form.semester} ({form.academic_year})</div></div>
                <span className="badge" style={{ background: '#0A2A66', color: 'white', padding: '0.3rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600 }}>{form.student_id}</span>
              </div>

              {data.has_pending_references && (
                <div className="warning-box" style={{ background: '#fefce8', border: '1px solid #fde68a', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                  <FaExclamationTriangle style={{ color: '#ca8a04' }} /> Pending references for: <strong>{data.pending_reference_courses?.join(', ')}</strong>. Cannot calculate until cleared.
                </div>
              )}
              {data.has_double_fail && (
                <div className="warning-box" style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                  <FaTimesCircle style={{ color: '#be185d' }} /> Double fail in: <strong>{data.double_fail_courses?.join(', ')}</strong>. Cannot calculate.
                </div>
              )}

              <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm, marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: cardBgHover }}><th style={th}>Course Code</th><th style={th}>Course Name</th><th style={th}>Credits</th><th style={th}>Score</th><th style={th}>Grade</th><th style={th}>Points</th></tr></thead>
                  <tbody>
                    {(data.current_grades || []).map((g, i) => (
                      <tr key={i}><td style={td}><strong>{g.course_code}</strong></td><td style={td}>{g.course_name}</td><td style={td}>{g.effective_credit_hours || g.credit_hours}{g.effective_credit_hours !== g.credit_hours && <small style={{ color: '#f59e0b', display: 'block' }}>×2 penalty</small>}</td><td style={td}>{g.score?.toFixed(1)}</td><td style={td}>{getGradeDisplay(g)}</td><td style={td}>{g.grade_points?.toFixed(1)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!data.has_pending_references && !data.has_double_fail && (
                <button className="btn btn-success" onClick={calculateAndSave} disabled={calculating}>
                  {calculating ? <FaSpinner className="animate-spin" /> : <FaCalculator style={{ marginRight: '0.3rem' }} />} Calculate & Save GPA
                </button>
              )}

              {result && (
                <div style={{ marginTop: '1rem', background: result.status === 'PASS' ? '#f0fdf4' : result.status === 'FAIL' ? '#fefce8' : '#fef2f2', borderRadius: '14px', padding: '1.5rem', border: `1px solid ${border}`, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>Semester GPA</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0A2A66' }}>{result.gpa.toFixed(2)}</div>
                  <span style={{ padding: '4px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, background: result.status === 'PASS' ? '#16a34a' : result.status === 'FAIL' ? '#ca8a04' : '#dc2626', color: 'white' }}>{result.status}</span>
                </div>
              )}
            </ShakeOnMount>
          )}
        </>
      )}

      {/* ==================== BLOCK GPA ==================== */}
      {activeTab === 'block' && (
        <>
          <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ color: '#0A2A66', marginBottom: '1rem' }}><FaBuilding style={{ color: '#FFC107', marginRight: '0.4rem' }} />Block GPA — Department Check</h3>
            <p style={{ color: textSec, fontSize: '0.85rem', marginBottom: '1rem' }}>
              Check all students in a department. Detects missing students, pending references, and double fails.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Department *</label>
                <select value={blockForm.department_id} onChange={e => setBlockForm({...blockForm, department_id: e.target.value})} onClick={loadDepartments}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.faculty_name})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Academic Year *</label>
                <select value={blockForm.academic_year} onChange={e => setBlockForm({...blockForm, academic_year: e.target.value})}>
                  <option value="2026/2027">2026/2027</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Year</label>
                <select value={blockForm.level} onChange={e => setBlockForm({...blockForm, level: e.target.value})}>
                  <option value="">All</option>
                  <option value="Year 1">Year 1</option><option value="Year 2">Year 2</option>
                  <option value="Year 3">Year 3</option><option value="Year 4">Year 4</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Semester</label>
                <select value={blockForm.semester} onChange={e => setBlockForm({...blockForm, semester: e.target.value})}>
                  <option value="">All</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              </div>
            </div>
            <button className="btn btn-primary" onClick={checkDepartment} disabled={blockLoading}>
              {blockLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Check Department
            </button>
          </div>

          {blockLoading && (
            <div style={{ textAlign: 'center', padding: '3rem' }}><FaSpinner className="loading-spinner" /><p style={{ color: textSec, marginTop: '1rem' }}>Checking department courses...</p></div>
          )}

          {blockData && (
            <ShakeOnMount>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Students', value: blockData.summary?.total_students || 0, color: '#0A2A66', bg: '#f0f4ff' },
                  { label: 'Ready', value: blockData.summary?.ready_count || 0, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Missing Courses', value: blockData.summary?.incomplete_count || 0, color: '#dc2626', bg: '#fef2f2' },
                  { label: 'Pending Refs', value: blockData.summary?.pending_ref_count || 0, color: '#ca8a04', bg: '#fefce8' },
                  { label: 'Blocked', value: blockData.summary?.blocked_count || 0, color: '#be185d', bg: '#fdf2f8' },
                  { label: 'Calculated', value: blockData.summary?.calculated_count || 0, color: '#0A2A66', bg: '#f0f4ff' },
                ].map((item, i) => (
                  <div key={i} style={{ background: cardBg, borderRadius: '10px', padding: '1rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: '0.7rem', color: textSec, fontWeight: 500 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Missing Students Alert */}
              {blockData.missing_students && blockData.missing_students.length > 0 && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#dc2626', margin: 0 }}><FaExclamationTriangle style={{ marginRight: '0.4rem' }} />Missing Students Detected</h4>
                    <button className="btn btn-warning btn-sm" onClick={handleNotifyHOD} disabled={notifying}>
                      {notifying ? <FaSpinner className="animate-spin" /> : <FaBell style={{ marginRight: '0.3rem' }} />}
                      Notify HOD About All
                    </button>
                  </div>
                  {blockData.missing_students.map((ms, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem', padding: '0.5rem', background: 'white', borderRadius: '6px' }}>
                      <strong>{ms.student_name} ({ms.student_id})</strong> missing from:{' '}
                      {ms.missing_from.map((m, j) => (
                        <span key={j} style={{ display: 'inline-block', marginRight: '0.5rem' }}>
                          {m.course_code} ({m.lecturer})
                          <button 
                            onClick={() => handleNotifyLecturer(m.lecturer_id, ms.student_name, ms.student_id, m.course_code)}
                            style={{ marginLeft: '0.3rem', padding: '2px 8px', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#dc2626' }}>
                            <FaPaperPlane style={{ marginRight: '2px' }} />Notify
                          </button>
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Students Table */}
              <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm, marginBottom: '1rem' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Student Status</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', color: textSec, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /> Select All Ready
                    </label>
                    <button className="btn btn-success btn-sm" onClick={calculateBlock} disabled={blockCalculating}>
                      {blockCalculating ? <FaSpinner className="animate-spin" /> : <FaCalculator style={{ marginRight: '0.3rem' }} />}
                      Calculate Selected ({selectedStudents.length || blockData.summary?.ready_count || 0})
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                        <th style={th}></th>
                        <th style={th}>Student ID</th>
                        <th style={th}>Name</th>
                        <th style={th}>Courses</th>
                        <th style={th}>Missing From</th>
                        <th style={th}>References</th>
                        <th style={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blockData.students && blockData.students.length > 0 ? (
                        blockData.students.map((student, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${border}`, opacity: student.status === 'calculated' ? 0.5 : 1 }}>
                            <td style={td}>
                              {student.status === 'ready' && (
                                <input type="checkbox" checked={selectedStudents.includes(student.student_id)} onChange={() => toggleStudent(student.student_id)} />
                              )}
                            </td>
                            <td style={{ ...td, fontWeight: 600, color: '#0A2A66' }}>{student.student_id}</td>
                            <td style={td}>{student.student_name}</td>
                            <td style={td}>{student.courses?.length || 0} courses</td>
                            <td style={td}>
                              {student.missing_from?.length > 0 ? (
                                <span style={{ color: '#dc2626', fontWeight: 600 }}>{student.missing_from.length} missing</span>
                              ) : <span style={{ color: '#16a34a' }}>✓ Complete</span>}
                            </td>
                            <td style={td}>
                              {student.has_pending_ref && <span style={{ color: '#ca8a04' }}>⏳ Pending</span>}
                              {student.has_double_fail && <span style={{ color: '#be185d' }}>❌ Double Fail</span>}
                              {!student.has_pending_ref && !student.has_double_fail && '—'}
                            </td>
                            <td style={td}>{getStatusBadge(student.status)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: textMuted }}>
                            No students found for this selection
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </ShakeOnMount>
          )}
        </>
      )}
    </div>
  );
};

const th = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' };
const td = { padding: '10px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' };

export default GPACalculator;