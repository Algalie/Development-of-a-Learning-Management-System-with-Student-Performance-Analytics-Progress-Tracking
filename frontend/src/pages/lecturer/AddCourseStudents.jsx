import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';

const AddCourseStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);
  
  // Manual entry state
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [tempStudents, setTempStudents] = useState([]);
  const [checking, setChecking] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState('');

  // Determine if this course level allows auto-enrollment
  const isYear2OrAbove = () => {
    if (!course?.semester) return false;
    const yearPart = course.semester.split(' - ')[0];
    return ['Year 2', 'Year 3', 'Year 4'].includes(yearPart);
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await lecturerApi.viewCourse(id);
      setCourse(res.data.course || res.data);
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/lecturer/courses');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoEnroll = async () => {
    if (!window.confirm('Auto-enroll all qualified students from the previous level? Students who PASSED will be automatically added.')) return;
    setAutoLoading(true);
    try {
      // Use the new auto-enroll endpoint
      const res = await lecturerApi.autoEnrollStudents(id);
      toast.success(res.data?.message || 'Students auto-enrolled!');
      fetchCourse(); // Refresh course data
      setTempStudents([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to auto-enroll');
    } finally {
      setAutoLoading(false);
    }
  };

  const checkStudent = async (sid) => {
    if (!sid.trim()) { setStudentName(''); setAutoFillMsg(''); return; }
    setChecking(true);
    try {
      const res = await lecturerApi.getStudentInfo(sid);
      if (res.data.found) {
        setStudentName(res.data.student_name);
        setAutoFillMsg('Student found!');
      } else {
        setStudentName('');
        setAutoFillMsg('New student - enter name manually');
      }
    } catch (error) {
      setAutoFillMsg('Error checking student');
    } finally {
      setChecking(false);
    }
  };

  const handleStudentIdChange = (e) => {
    const val = e.target.value;
    setStudentId(val);
    if (val.trim().length >= 2) {
      checkStudent(val);
    } else {
      setStudentName('');
      setAutoFillMsg('');
    }
  };

  const addStudent = () => {
    if (!studentId.trim() || !studentName.trim()) {
      toast.error('Please enter both Student ID and Name');
      return;
    }
    if (tempStudents.some(s => s.id === studentId.trim())) {
      toast.error('This student has already been added');
      return;
    }
    setTempStudents([...tempStudents, { id: studentId.trim(), name: studentName.trim() }]);
    setStudentId('');
    setStudentName('');
    setAutoFillMsg('');
  };

  const removeStudent = (index) => {
    setTempStudents(tempStudents.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (tempStudents.length === 0) {
      toast.error('Please add at least one student or use Auto-Enroll');
      return;
    }
    setSaving(true);
    try {
      const data = {
        student_ids: tempStudents.map(s => s.id),
        student_names: tempStudents.map(s => s.name),
      };
      await lecturerApi.addCourseStudents(id, data);
      toast.success(`${tempStudents.length} students added successfully!`);
      navigate(`/lecturer/course/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save students');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <i className="fas fa-spinner loading-spinner"></i>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const existingStudents = course?.students?.length || 0;

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to Course
          </Link>
          <h1>Add Students</h1>
        </div>
      </FadeIn>

      {/* Course Info */}
      <div className="card" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', color: '#0A2A66' }}>
            {course?.course_code}: {course?.course_name}
          </h2>
          <p style={{ color: '#64748b' }}>{course?.semester} | {course?.academic_year}</p>
        </div>
        <div className="badge" style={{
          background: '#FFC107', color: '#0A2A66', padding: '0.5rem 1.2rem',
          borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem'
        }}>
          <i className="fas fa-users"></i> Current: {existingStudents} Students
        </div>
      </div>

      <ShakeOnMount>
        <div className="form-card">
          {/* Auto-Enroll Section */}
          {isYear2OrAbove() && (
            <div style={{
              background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '16px',
              padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', color: '#10b981', marginBottom: '0.5rem' }}>
                <i className="fas fa-magic"></i>
              </div>
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Auto-Enroll Qualified Students
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Students who PASSED the previous level in this department will be automatically enrolled.
                Failed or withdrawn students will be excluded.
              </p>
              <button onClick={handleAutoEnroll} className="btn btn-success btn-lg" disabled={autoLoading}>
                {autoLoading ? (
                  <><i className="fas fa-spinner animate-spin"></i> Enrolling...</>
                ) : (
                  <><i className="fas fa-robot"></i> Auto-Enroll Qualified Students</>
                )}
              </button>
              {existingStudents > 0 && (
                <p style={{ color: '#10b981', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                  <i className="fas fa-check-circle"></i> {existingStudents} students already enrolled
                </p>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>OR ADD MANUALLY</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
          </div>

          {/* Manual Entry */}
          <div className="info-box">
            <p><i className="fas fa-info-circle"></i> Enter Student ID and the name will auto-fill if the student exists in the system.</p>
          </div>

          <div style={{
            background: '#f8fafc', borderRadius: '16px', padding: '1.5rem',
            marginBottom: '1.5rem', border: '1px solid #eef2f6'
          }}>
            <div className="form-row" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label><i className="fas fa-id-card" style={{ color: '#FFC107' }}></i> Student ID</label>
                <input type="text" value={studentId} onChange={handleStudentIdChange} placeholder="e.g., S001" autoComplete="off" />
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', minHeight: '20px' }}>
                  {checking && <span><i className="fas fa-spinner animate-spin"></i> Checking...</span>}
                  {!checking && autoFillMsg && (
                    <span style={{
                      color: autoFillMsg.includes('found') ? '#10b981' :
                             autoFillMsg.includes('Error') ? '#ef4444' : '#f59e0b'
                    }}>
                      <i className={`fas fa-${autoFillMsg.includes('found') ? 'check-circle' : autoFillMsg.includes('Error') ? 'times-circle' : 'exclamation-triangle'}`}></i> {autoFillMsg}
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label><i className="fas fa-user" style={{ color: '#FFC107' }}></i> Full Name</label>
                <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Will auto-fill from ID" />
              </div>
              <button onClick={addStudent} className="btn btn-primary" style={{ height: '48px' }}>
                <i className="fas fa-plus-circle"></i> Add Student
              </button>
            </div>
          </div>

          {/* Students List */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#0A2A66', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <i className="fas fa-list"></i> Students to be Added (<span>{tempStudents.length}</span>)
            </h3>
            {tempStudents.length === 0 ? (
              <div className="empty-state" style={{
                padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0'
              }}>
                <i className="fas fa-user-plus" style={{ fontSize: '2.5rem', color: '#cbd5e1' }}></i>
                <p>No students added yet. Use Auto-Enroll or the form above to add students.</p>
              </div>
            ) : (
              tempStudents.map((student, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: 'white', border: '1px solid #eef2f6', borderRadius: '12px',
                    padding: '0.75rem 1rem', marginBottom: '0.5rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <span style={{ fontWeight: 700, color: '#0A2A66', minWidth: '90px' }}>{student.id}</span>
                    <span style={{ color: '#334155', minWidth: '180px' }}>{student.name}</span>
                  </div>
                  <button onClick={() => removeStudent(i)} className="icon-btn delete" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="fas fa-times-circle" style={{ color: '#ef4444', fontSize: '1.1rem' }}></i>
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Save Button */}
          <div className="form-actions">
            <Link to={`/lecturer/course/${id}`} className="btn btn-secondary">
              <i className="fas fa-times"></i> Cancel
            </Link>
            <button onClick={handleSave} className="btn btn-success" disabled={saving || tempStudents.length === 0}>
              {saving ? <><i className="fas fa-spinner animate-spin"></i> Saving...</> : <><i className="fas fa-save"></i> Save All Students ({tempStudents.length})</>}
            </button>
          </div>
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default AddCourseStudents;