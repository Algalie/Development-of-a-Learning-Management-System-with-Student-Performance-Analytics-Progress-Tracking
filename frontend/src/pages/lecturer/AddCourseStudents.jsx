import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaUserPlus, FaSpinner, FaTimes, FaTrash,
  FaFileUpload, FaRobot, FaFilter, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaUsers, FaDownload, FaCloudUploadAlt,
  FaIdCard, FaSearch, FaList, FaCheck
} from 'react-icons/fa';

const AddCourseStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMethod, setActiveMethod] = useState('manual');
  
  // Student list
  const [tempStudents, setTempStudents] = useState([]);
  
  // Manual entry
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [checking, setChecking] = useState(false);
  
  // CSV
  const [csvFileName, setCsvFileName] = useState('');
  
  // Results
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const isYear1Sem1 = course?.course_level === 'Year 1' && course?.course_semester_num === 1;
  const needsFilter = !isYear1Sem1;

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      setCourse(res.data.course || res.data);
    } catch (error) {
      toast.error('Failed to load course', { duration: 1000 });
      navigate('/lecturer/courses');
    } finally { setLoading(false); }
  };

  // ===== VALIDATE STUDENT ID =====
  const validateStudentId = (sid) => {
    if (!sid || !/^\d+$/.test(sid)) {
      return { valid: false, error: 'Student ID must contain numbers only' };
    }
    if (tempStudents.some(s => s.id === sid)) {
      return { valid: false, error: 'Student already in list' };
    }
    return { valid: true };
  };

  // ===== CHECK STUDENT =====
  const checkStudent = async (sid) => {
    if (!sid || !/^\d+$/.test(sid)) return;
    setChecking(true);
    try {
      const res = await lecturerApi.getStudentInfo(sid);
      if (res.data.found) setStudentName(res.data.student_name);
    } catch (error) { /* ignore */ }
    finally { setChecking(false); }
  };

  // ===== ADD MANUAL STUDENT =====
  const addManualStudent = () => {
    const validation = validateStudentId(studentId.trim());
    if (!validation.valid) {
      toast.error(validation.error, { duration: 1000 });
      return;
    }
    if (!studentName.trim()) {
      toast.error('Please enter student name', { duration: 1000 });
      return;
    }
    setTempStudents([...tempStudents, { id: studentId.trim(), name: studentName.trim() }]);
    setStudentId('');
    setStudentName('');
  };

  // ===== HANDLE CSV UPLOAD =====
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV must have header + data rows', { duration: 1000 });
        return;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const idIndex = headers.findIndex(h => h === 'student_id' || h === 'id');
      const nameIndex = headers.findIndex(h => h === 'student_name' || h === 'name');

      if (idIndex === -1) {
        toast.error('CSV must have "student_id" or "id" column', { duration: 1000 });
        return;
      }

      const newStudents = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
        const sid = cols[idIndex];
        const name = nameIndex !== -1 ? cols[nameIndex] : `Student ${sid}`;

        if (!sid) continue;
        if (!/^\d+$/.test(sid)) {
          errors.push(`Row ${i + 1}: Invalid ID "${sid}"`);
          continue;
        }
        if (tempStudents.some(s => s.id === sid) || newStudents.some(s => s.id === sid)) continue;

        newStudents.push({ id: sid, name: name || `Student ${sid}` });
      }

      if (errors.length > 0) {
        errors.forEach(err => toast.error(err, { duration: 2000 }));
      }

      if (newStudents.length > 0) {
        setTempStudents([...tempStudents, ...newStudents]);
        toast.success(`${newStudents.length} students loaded`, { duration: 1000 });
      } else {
        toast.error('No valid students found in CSV', { duration: 1000 });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ===== REMOVE STUDENT =====
  const removeStudent = (index) => {
    setTempStudents(tempStudents.filter((_, i) => i !== index));
  };

  // ===== SAVE STUDENTS =====
  const handleSave = async () => {
    if (tempStudents.length === 0) {
      toast.error('Add at least one student', { duration: 1000 });
      return;
    }
    setSaving(true);
    try {
      const res = await lecturerApi.addCourseStudents(id, {
        method: activeMethod === 'auto' ? 'auto' : 'manual',
        student_ids: tempStudents.map(s => s.id),
        student_names: tempStudents.map(s => s.name),
        apply_filter: needsFilter,
      });
      
      setResults(res.data);
      setShowResults(true);
      toast.success(res.data?.message || 'Students added!', { duration: 1000 });
      
      if (res.data?.disqualified?.length === 0) {
        setTimeout(() => navigate(`/lecturer/course/${id}`), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed', { duration: 1000 });
    } finally { setSaving(false); }
  };

  // ===== AUTO ENROLL =====
  const handleAutoEnroll = async () => {
    setSaving(true);
    try {
      const res = await lecturerApi.autoEnrollStudents(id);
      toast.success(res.data?.message || 'Students auto-enrolled!', { duration: 1000 });
      setTimeout(() => navigate(`/lecturer/course/${id}`), 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed', { duration: 1000 });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '950px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course
          </Link>
          <h1>Add Students</h1>
        </div>
      </FadeIn>

      {/* Course Info Bar */}
      <div style={{
        background: cardBg, borderRadius: '14px', padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem', border: `1px solid ${border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', color: '#0A2A66', fontWeight: 600, margin: 0 }}>
            {course?.course_code}: {course?.course_name}
          </h2>
          <p style={{ color: textSec, fontSize: '0.85rem', margin: '4px 0 0' }}>
            {course?.semester} | {course?.academic_year} | {course?.course_level}
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1.2rem', borderRadius: '24px',
          background: '#f0f4ff', color: '#0A2A66', fontWeight: 600, fontSize: '0.9rem',
        }}>
          <FaUsers /> {course?.students?.length || 0} enrolled
        </div>
      </div>

      {/* Results Modal */}
      {showResults && results && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)',
        }} onClick={() => { setShowResults(false); navigate(`/lecturer/course/${id}`); }}>
          <div style={{
            background: cardBg, borderRadius: '20px', padding: '2rem',
            maxWidth: '500px', width: '90%', textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: `1px solid ${border}`,
          }} onClick={e => e.stopPropagation()}>
            <FaCheckCircle style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '1rem' }} />
            <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Students Added!</h3>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', margin: '1rem 0' }}>
              <div><div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>{results.added || 0}</div><div style={{ fontSize: '0.8rem', color: textSec }}>Added</div></div>
              <div><div style={{ fontSize: '2rem', fontWeight: 700, color: '#ca8a04' }}>{results.skipped || 0}</div><div style={{ fontSize: '0.8rem', color: textSec }}>Skipped</div></div>
              <div><div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{results.total_disqualified || 0}</div><div style={{ fontSize: '0.8rem', color: textSec }}>Disqualified</div></div>
            </div>
            {results.disqualified?.length > 0 && (
              <div style={{ textAlign: 'left', marginTop: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                {results.disqualified.map((d, i) => (
                  <div key={i} style={{ fontSize: '0.85rem', color: '#dc2626', padding: '0.3rem 0' }}>
                    ❌ {d.student_id} — {d.reason}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { setShowResults(false); navigate(`/lecturer/course/${id}`); }}
              className="btn btn-primary" style={{ marginTop: '1rem' }}>
              OK
            </button>
          </div>
        </div>
      )}

      {/* Method Tabs */}
      <div style={{
        display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
        background: cardBgHover, borderRadius: '12px', padding: '4px',
        border: `1px solid ${border}`,
      }}>
        {[
          { key: 'manual', icon: <FaIdCard />, label: 'Manual Entry' },
          { key: 'csv', icon: <FaFileUpload />, label: 'CSV Upload' },
          { key: 'auto', icon: <FaRobot />, label: 'Auto Enroll' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveMethod(tab.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.7rem 1rem', borderRadius: '10px',
              background: activeMethod === tab.key ? '#0A2A66' : 'transparent',
              color: activeMethod === tab.key ? 'white' : textSec,
              border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* MANUAL ENTRY */}
      {activeMethod === 'manual' && (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', border: `1px solid ${border}`, marginBottom: '1rem' }}>
          <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>
            <FaIdCard style={{ marginRight: '0.4rem' }} /> Enter Student Details
          </h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec, marginBottom: '0.3rem', display: 'block' }}>Student ID *</label>
              <input
                type="text" value={studentId}
                onChange={e => { setStudentId(e.target.value); if (e.target.value.length >= 3) checkStudent(e.target.value); }}
                onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }}
                placeholder="Numbers only, e.g., 12345"
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ flex: 2, minWidth: '200px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec, marginBottom: '0.3rem', display: 'block' }}>
                Full Name * {checking && <FaSpinner className="animate-spin" style={{ fontSize: '0.7rem' }} />}
              </label>
              <input
                type="text" value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder="Student full name"
                style={{ width: '100%', padding: '0.65rem 0.9rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.9rem' }}
              />
            </div>
            <button onClick={addManualStudent} className="btn btn-primary"
              style={{ height: '42px', padding: '0 1.5rem', borderRadius: '10px', fontWeight: 600 }}>
              <FaUserPlus style={{ marginRight: '0.3rem' }} /> Add
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: textMuted, marginTop: '0.5rem' }}>
            Student ID accepts numbers only. Name will auto-fill if student exists.
          </p>
        </div>
      )}

      {/* CSV UPLOAD */}
      {activeMethod === 'csv' && (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '2rem', border: `1px solid ${border}`, marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#f0f4ff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem', color: '#0A2A66', fontSize: '1.5rem',
          }}>
            <FaFileUpload />
          </div>
          <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload CSV File</h3>
          <p style={{ color: textSec, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            CSV must have columns: <code style={{ background: cardBgHover, padding: '2px 6px', borderRadius: '4px' }}>student_id</code>, <code style={{ background: cardBgHover, padding: '2px 6px', borderRadius: '4px' }}>student_name</code>
          </p>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" style={{ padding: '0.7rem 2rem' }}>
            <FaDownload style={{ marginRight: '0.4rem' }} /> Choose CSV File
          </button>
          {csvFileName && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 500 }}>
              <FaCheck style={{ marginRight: '0.3rem' }} /> {csvFileName}
            </p>
          )}
        </div>
      )}

      {/* AUTO ENROLL */}
      {activeMethod === 'auto' && (
        <div style={{ background: cardBg, borderRadius: '14px', padding: '2rem', border: `1px solid ${border}`, marginBottom: '1rem', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: '#f0fdf4', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1rem', color: '#16a34a', fontSize: '1.5rem',
          }}>
            <FaRobot />
          </div>
          <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Auto-Enroll Students</h3>
          <p style={{ color: textSec, fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {isYear1Sem1
              ? 'Year 1 Semester 1: All new students will be enrolled.'
              : 'Students who PASSED the previous level will be automatically enrolled. Failed/withdrawn students are excluded.'
            }
          </p>
          <button onClick={handleAutoEnroll} disabled={saving} className="btn btn-success" style={{ padding: '0.7rem 2rem' }}>
            {saving ? <FaSpinner className="animate-spin" /> : <FaRobot style={{ marginRight: '0.4rem' }} />}
            {saving ? 'Enrolling...' : 'Auto-Enroll Now'}
          </button>
        </div>
      )}

      {/* Student List & Actions (Manual + CSV) */}
      {activeMethod !== 'auto' && (
        <>
          {/* Student Count Bar */}
          {tempStudents.length > 0 && (
            <div style={{
              background: cardBg, borderRadius: '12px', padding: '0.9rem 1.25rem',
              marginBottom: '1rem', border: `1px solid ${border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, color: '#0A2A66', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaList /> {tempStudents.length} student{tempStudents.length > 1 ? 's' : ''} in list
              </span>
              <span style={{ fontSize: '0.8rem', color: textMuted }}>
                {needsFilter ? 'Filter will be applied on save' : 'All students will be added'}
              </span>
            </div>
          )}

          {/* Student Cards */}
          {tempStudents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
              {tempStudents.map((student, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  style={{
                    background: 'white', borderRadius: '10px', padding: '0.7rem 1rem',
                    border: `1px solid ${border}`, display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#0A2A66', fontFamily: 'monospace', fontSize: '0.9rem' }}>{student.id}</span>
                    <span style={{ color: '#334155', fontSize: '0.9rem' }}>{student.name}</span>
                  </div>
                  <button onClick={() => removeStudent(i)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', borderRadius: '6px' }}>
                    <FaTrash style={{ fontSize: '0.85rem' }} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Link to={`/lecturer/course/${id}`} className="btn btn-outline btn-sm">
              <FaTimes style={{ marginRight: '0.3rem' }} /> Cancel
            </Link>
            <button onClick={handleSave} className="btn btn-success btn-sm" disabled={saving || tempStudents.length === 0}>
              {saving ? <FaSpinner className="animate-spin" /> : <FaUserPlus style={{ marginRight: '0.3rem' }} />}
              {saving ? 'Saving...' : `Save ${tempStudents.length} Student${tempStudents.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddCourseStudents;