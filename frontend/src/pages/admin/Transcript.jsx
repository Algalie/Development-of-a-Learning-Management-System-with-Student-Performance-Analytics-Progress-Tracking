import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaRedoAlt, FaSpinner, FaUserGraduate,
  FaBuilding, FaUsers, FaChevronDown, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaFileAlt,
  FaSave, FaTimes, FaPrint, FaShieldAlt, FaUniversity, FaCalendarAlt,
  FaSyncAlt, FaIdCard, FaBookOpen, FaBarcode, FaClock,
  FaToggleOn, FaToggleOff, FaBan, FaLock
} from 'react-icons/fa';
import Barcode from 'react-barcode';
import logo from '../../assets/images/logo.png';

const Transcript = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [departments, setDepartments] = useState([]);
  const [deptFilters, setDeptFilters] = useState({ dept_id: '', program: '', level: '', academic_year: '' });
  const [deptData, setDeptData] = useState(null);
  const [deptLoading, setDeptLoading] = useState(false);

  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptId, setTranscriptId] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState('');

  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [showVerifyTranscript, setShowVerifyTranscript] = useState(false);
  const [verifyTranscriptData, setVerifyTranscriptData] = useState(null);

  // Override mode for demo/testing
  const [overrideMode, setOverrideMode] = useState(false);

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  const loadDepartments = async () => {
    if (departments.length > 0) return;
    try {
      const res = await adminApi.getFaculties();
      const allDepts = [];
      const faculties = res.data.faculties || res.data || [];
      faculties.forEach(f => {
        (f.departments || []).forEach(d => {
          allDepts.push({ ...d, faculty_name: f.name });
        });
      });
      setDepartments(allDepts);
    } catch (error) { console.error('Failed to load departments'); }
  };

  const fetchTranscript = async () => {
    if (!studentId.trim()) { toast.error('Please enter a student ID'); return; }
    setLoading(true); setSearched(true); setStudentData(null);
    try {
      const res = await adminApi.getTranscript(studentId);
      setStudentData(res.data.student_data || null);
      setStudentName(res.data.student_name || '');
      if (!res.data.student_data) toast.error('No records found');
    } catch (error) {
      toast.error('Failed to fetch transcript');
      setStudentData(null);
    } finally { setLoading(false); }
  };

  const queryDepartment = async () => {
    if (!deptFilters.dept_id) { toast.error('Please select a department'); return; }
    setDeptLoading(true); setDeptData(null);
    try {
      const res = await adminApi.getDepartmentStudents(deptFilters);
      setDeptData(res.data);
    } catch (error) { toast.error('Failed to query department'); }
    finally { setDeptLoading(false); }
  };

  const resetDepartmentQuery = () => {
    setDeptFilters({ dept_id: '', program: '', level: '', academic_year: '' });
    setDeptData(null);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PASS: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
      FAIL: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
      WITHDREW: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
      DOUBLE_FAIL: { bg: '#fdf2f8', color: '#be185d', border: '#fbcfe8' },
    };
    const s = styles[status] || { bg: cardBgHover, color: textSec, border: border };
    return (
      <span style={{
        padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem',
        fontWeight: 700, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`, letterSpacing: '0.5px',
      }}>
        {status === 'DOUBLE_FAIL' ? 'DOUBLE FAIL' : status || 'Pending'}
      </span>
    );
  };

  const getLetterGrade = (gpa) => {
    if (gpa == null) return 'N/A';
    if (gpa >= 4.5) return 'A';
    if (gpa >= 3.5) return 'B';
    if (gpa >= 2.5) return 'C';
    if (gpa >= 2.0) return 'D';
    if (gpa >= 1.0) return 'E';
    return 'F';
  };

  const getGradeColor = (grade) => {
    const colors = { 'A': '#059669', 'B': '#2563eb', 'C': '#d97706', 'D': '#ea580c', 'E': '#dc2626', 'F': '#991b1b' };
    return colors[grade] || textSec;
  };

  const getGradeBg = (grade) => {
    const bgs = { 'A': '#ecfdf5', 'B': '#eff6ff', 'C': '#fffbeb', 'D': '#fff7ed', 'E': '#fef2f2', 'F': '#fef2f2' };
    return bgs[grade] || cardBgHover;
  };

  const getRemark = (gpa) => {
    if (gpa == null) return '';
    if (gpa >= 4.5) return 'First Class Honours';
    if (gpa >= 3.5) return 'Second Class Upper';
    if (gpa >= 2.5) return 'Second Class Lower';
    if (gpa >= 2.0) return 'Pass';
    if (gpa >= 1.0) return 'Marginal Pass';
    return 'Fail';
  };

  const calculateCGPA = () => {
    if (!studentData || studentData.length === 0) return 0;
    const yearMap = {};
    studentData.forEach(sem => {
      const year = sem.academic_year;
      if (!yearMap[year]) { yearMap[year] = { sem1: null, sem2: null }; }
      if (sem.semester && sem.semester.includes('Semester 1')) { yearMap[year].sem1 = sem.gpa; }
      else if (sem.semester && sem.semester.includes('Semester 2')) { yearMap[year].sem2 = sem.gpa; }
    });
    const years = Object.keys(yearMap).sort();
    const semester2GPAs = years.map(year => yearMap[year].sem2).filter(gpa => gpa != null);
    if (semester2GPAs.length === 0) return 0;
    return semester2GPAs.reduce((sum, gpa) => sum + gpa, 0) / semester2GPAs.length;
  };

  const getTotalCourses = () => {
    if (!studentData) return 0;
    return studentData.reduce((acc, sem) => acc + (sem.courses?.length || 0), 0);
  };

  const getTotalCredits = () => {
    if (!studentData) return 0;
    return studentData.reduce((acc, sem) => acc + (sem.courses || []).reduce((a, c) => a + (c.credit_hours || 0), 0), 0);
  };

  const getProgramType = () => {
    if (!studentData || studentData.length === 0) return 'N/A';
    const deptInfo = deptData?.students?.find(s => s.student_id === studentId);
    return deptInfo?.program || 'BSc';
  };

  const getEffectiveGrade = (course) => {
    if (course.has_reference && course.reference_display) {
      const parts = course.reference_display.split('/');
      return parts[0] || course.grade;
    }
    return course.grade;
  };

  const getEffectivePoints = (course) => {
    const grade = getEffectiveGrade(course);
    const gradePoints = { 'A': 5.0, 'B': 4.0, 'C': 3.0, 'D': 2.0, 'E': 1.0, 'F': 0.0 };
    return gradePoints[grade] || course.grade_points || 0;
  };

  // Generate AND auto-save transcript
  const handleGenerateTranscript = async () => {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const newId = `MMTU-TRN-${datePart}-${randomPart}`;
    setTranscriptId(newId);
    setSavedId('');
    setShowTranscript(true);

    // Auto-save immediately
    setSaving(true);
    try {
      const response = await adminApi.saveTranscript({
        student_id: studentId,
        student_name: studentName,
        program_type: getProgramType(),
        department_name: deptData?.department?.name || 'N/A',
        existing_transcript_id: null,
        generated_transcript_id: newId,
        transcript_data: {
          semesters: studentData,
          cgpa: calculateCGPA(),
          totalCourses: getTotalCourses(),
          totalCredits: getTotalCredits(),
          generatedBy: user?.full_name || 'Admin',
          generatedAt: new Date().toISOString(),
          overrideMode: overrideMode,
        }
      });
      setSavedId(response.data.transcript_id);
      setTranscriptId(response.data.transcript_id);
      toast.success('Transcript generated and saved automatically!');
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTranscript = () => {
    window.print();
  };

  const handleVerifyTranscript = async () => {
    if (!verifyId.trim()) { toast.error('Please enter a transcript ID'); return; }
    setVerifyLoading(true); setVerifyResult(null); setVerifyTranscriptData(null);
    try {
      const res = await adminApi.verifyTranscript(verifyId);
      setVerifyResult(res.data);
      if (res.data.valid) {
        setVerifyTranscriptData(res.data.transcript);
        setShowVerifyTranscript(true);
      }
    } catch (error) {
      setVerifyResult({
        valid: false,
        message: error.response?.data?.message || 'Invalid transcript ID'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  const toggleSemester = (e) => {
    const header = e.currentTarget;
    const details = header.nextElementSibling;
    if (details) details.style.display = details.style.display === 'block' ? 'none' : 'block';
  };

  // Check transcript eligibility
  const hasWarnings = studentData?.some(s => ['FAIL', 'WITHDREW', 'DOUBLE_FAIL'].includes(s.status));
  const hasDoubleFail = studentData?.some(s => s.status === 'DOUBLE_FAIL' || s.has_double_fail);
  const hasCompletedFinalYear = studentData?.some(sem => 
    sem.level === 'Year 4' || sem.level === 'Level 400' || 
    sem.level === 'Year 5' || sem.level === 'Level 500'
  );
  const canGenerateTranscript = overrideMode || (!hasDoubleFail && !hasWarnings && hasCompletedFinalYear && studentData?.length > 0);
  
  const cgpa = calculateCGPA();

  return (
    <div className="dashboard-container">
      {/* ==================== TRANSCRIPT MODAL ==================== */}
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15,23,42,0.9)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, padding: '1.5rem', backdropFilter: 'blur(8px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                background: '#ffffff', borderRadius: '24px', maxWidth: '1000px',
                width: '100%', maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
                fontFamily: '"Inter", system-ui, sans-serif', position: 'relative',
              }}
              id="transcript-print"
            >
              <style>{`
                @media print {
                  body * { visibility: hidden; }
                  #transcript-print, #transcript-print * { visibility: visible; }
                  #transcript-print { position: absolute; left: 0; top: 0; width: 100%; border-radius: 0 !important; box-shadow: none !important; }
                  .no-print { display: none !important; }
                }
              `}</style>

              <div style={{ padding: '2.5rem' }}>
                {/* University Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem', borderBottom: '3px solid #0A2A66' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                    <img src={logo} alt="MMTU Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '16px' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    <div>
                      <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>MILTON MARGAI TECHNICAL UNIVERSITY</h2>
                      <p style={{ color: '#64748b', fontSize: '0.75rem', margin: '2px 0 0' }}>Goderich Campus, Freetown | Sierra Leone</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ color: '#0A2A66', fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '3px', textTransform: 'uppercase' }}>Transcript</h1>
                    {transcriptId && (
                      <div style={{ background: '#f0f4ff', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 700, color: '#0A2A66', fontFamily: 'monospace', marginTop: '6px', display: 'inline-block' }}>{transcriptId}</div>
                    )}
                  </div>
                </div>

                {/* Student Info Card */}
                <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.2rem' }}>
                    {[
                      { icon: <FaUserGraduate />, label: 'Student Name', value: studentName },
                      { icon: <FaIdCard />, label: 'Student ID', value: studentId },
                      { icon: <FaBookOpen />, label: 'Program', value: getProgramType() },
                      { icon: <FaBuilding />, label: 'Department', value: deptData?.department?.name || 'N/A' },
                      { icon: <FaUniversity />, label: 'Faculty', value: deptData?.department?.faculty || 'N/A' },
                      { icon: <FaCalendarAlt />, label: 'Issue Date', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <div style={{ color: '#0A2A66', fontSize: '0.9rem', marginTop: '2px', opacity: 0.6 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>{item.label}</div>
                          <div style={{ fontSize: '0.88rem', color: '#1e293b', fontWeight: 600 }}>{item.value}</div>
                        </div>
                      </div>
                    ))}
                    {overrideMode && (
                      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                        <div style={{ color: '#dc2626', fontSize: '0.9rem', marginTop: '2px' }}><FaExclamationTriangle /></div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: '#dc2626', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '2px' }}>Note</div>
                          <div style={{ fontSize: '0.88rem', color: '#dc2626', fontWeight: 600 }}>Demo Mode — Override Active</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Semester Sections */}
                {studentData?.map((semester, i) => (
                  <div key={i} style={{ marginBottom: '1.2rem', pageBreakInside: 'avoid' }}>
                    <div style={{ background: semester.status === 'DOUBLE_FAIL' ? 'linear-gradient(135deg, #831843 0%, #be185d 100%)' : semester.status === 'FAIL' || semester.status === 'WITHDREW' ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' : 'linear-gradient(135deg, #0A2A66 0%, #1e40af 100%)', color: 'white', padding: '0.7rem 1.5rem', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{semester.academic_year} — {semester.level} {semester.semester}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>GPA: <strong>{semester.gpa != null ? semester.gpa.toFixed(2) : 'N/A'}</strong></span>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: 'rgba(255,255,255,0.2)' }}>{semester.status === 'DOUBLE_FAIL' ? 'DOUBLE FAIL' : semester.status || 'N/A'}</span>
                      </div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={thStyle}>Code</th><th style={thStyle}>Course Title</th><th style={thStyle}>CR</th><th style={thStyle}>Grade</th><th style={thStyle}>GP</th><th style={thStyle}>Remark</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semester.courses?.map((course, j) => {
                            const effectiveGrade = getEffectiveGrade(course);
                            const isCleared = course.has_reference && course.reference_display;
                            const isDoubleFail = course.reference_status === 'double_fail';
                            return (
                              <tr key={j} style={{ borderBottom: '1px solid #f1f5f9', background: isDoubleFail ? '#fdf2f8' : j % 2 === 0 ? 'white' : '#fafbfc' }}>
                                <td style={tdStyle}><strong style={{ color: '#0A2A66' }}>{course.course_code}</strong></td>
                                <td style={tdStyle}>{course.course_name}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{course.credit_hours}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: getGradeColor(effectiveGrade), background: getGradeBg(effectiveGrade) }}>{effectiveGrade || '—'}</span>
                                  {isCleared && <span style={{ fontSize: '0.6rem', display: 'block', color: '#059669', fontWeight: 600, marginTop: '3px' }}>Cleared</span>}
                                  {isDoubleFail && <span style={{ fontSize: '0.6rem', display: 'block', color: '#be185d', fontWeight: 600, marginTop: '3px' }}>Double Fail</span>}
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>{getEffectivePoints(course).toFixed(1)}</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  {isDoubleFail ? <span style={{ color: '#be185d', fontWeight: 600 }}>Must Repeat</span> :
                                   effectiveGrade === 'A' ? <span style={{ color: '#059669' }}>Excellent</span> : 
                                   effectiveGrade === 'B' ? <span style={{ color: '#2563eb' }}>Very Good</span> : 
                                   effectiveGrade === 'C' ? <span style={{ color: '#d97706' }}>Good</span> : 
                                   effectiveGrade === 'D' ? <span style={{ color: '#ea580c' }}>Pass</span> : 
                                   effectiveGrade === 'E' ? <span style={{ color: '#dc2626' }}>Marginal Fail</span> : 
                                   effectiveGrade === 'F' ? <span style={{ color: '#991b1b' }}>Fail</span> : 
                                   <span style={{ color: '#94a3b8' }}>—</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {/* CGPA Summary Card */}
                <div style={{ background: 'linear-gradient(135deg, #0A2A66 0%, #1e40af 100%)', borderRadius: '20px', padding: '1.5rem 2rem', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', color: 'white' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600, marginBottom: '6px' }}>Cumulative Grade Point Average</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 900, fontFamily: 'monospace' }}>{cgpa.toFixed(2)}</span>
                      <div><div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFC107' }}>{getLetterGrade(cgpa)}</div><div style={{ fontSize: '0.75rem', opacity: 0.8, fontWeight: 500 }}>{getRemark(cgpa)}</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                    <div><div style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 600 }}>Total Courses</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFC107' }}>{getTotalCourses()}</div></div>
                    <div><div style={{ fontSize: '0.6rem', opacity: 0.7, textTransform: 'uppercase', fontWeight: 600 }}>Total Credits</div><div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFC107' }}>{getTotalCredits()}</div></div>
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0' }}>
                  {[
                    { title: 'Prepared By', name: user?.full_name || 'Admin', role: 'Examinations Officer' },
                    { title: 'Checked By', name: '', role: 'Head of Department' },
                    { title: 'Approved By', name: '', role: 'Dean of Faculty' },
                  ].map((sig, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ borderBottom: '2px solid #0A2A66', width: '100%', marginBottom: '0.5rem', height: '30px' }} />
                      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{sig.title}</div>
                      {sig.name && <div style={{ fontSize: '0.82rem', color: '#0A2A66', fontWeight: 700, marginTop: '2px' }}>{sig.name}</div>}
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{sig.role}</div>
                    </div>
                  ))}
                </div>

                {/* Barcode */}
                {transcriptId && (
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '2px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                      <FaBarcode style={{ color: '#0A2A66', fontSize: '0.8rem' }} />
                      <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Verification Barcode</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', background: 'white', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <Barcode value={transcriptId} width={1.8} height={55} fontSize={10} format="CODE128" displayValue={true} renderer="svg" />
                    </div>
                    <p style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '0.6rem' }}>Scan this barcode to verify transcript authenticity</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #0A2A66', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    <FaShieldAlt style={{ color: '#059669', fontSize: '0.7rem' }} />
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Official Document | Electronically Generated</span>
                    {overrideMode && <span style={{ fontSize: '0.68rem', color: '#dc2626', fontWeight: 700, marginLeft: '0.5rem' }}>(Demo Mode)</span>}
                  </div>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8', margin: '2px 0' }}>This transcript is valid without physical signature. ID: {transcriptId}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="no-print" style={{ borderTop: '2px solid #e2e8f0', padding: '1.2rem 2rem', display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', background: '#f8fafc', borderRadius: '0 0 24px 24px', position: 'sticky', bottom: 0 }}>
                <button onClick={handleDownloadTranscript} style={{ padding: '0.65rem 1.5rem', borderRadius: '30px', border: '2px solid #e2e8f0', background: 'white', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}><FaPrint /> Print</button>
                {saving && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#16a34a', fontSize: '0.85rem', fontWeight: 500 }}><FaCheckCircle /> Auto-saved: {savedId}</span>}
                <button onClick={() => { setShowTranscript(false); }} style={{ padding: '0.65rem 1.5rem', borderRadius: '30px', border: '2px solid #fecaca', background: '#fef2f2', color: '#dc2626', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}><FaTimes /> Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== VERIFY MODAL ==================== */}
      <AnimatePresence>
        {showVerifyTranscript && verifyTranscriptData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1.5rem', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} style={{ background: cardBg, borderRadius: '24px', maxWidth: '550px', width: '100%', padding: '2.5rem', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.4)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', border: '3px solid #a7f3d0' }}><FaCheckCircle style={{ color: '#059669', fontSize: '2.2rem' }} /></div>
              <h2 style={{ color: '#059669', fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Verified Authentic Transcript</h2>
              <p style={{ color: textSec, fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: 1.6 }}>This transcript has been verified as authentic from MMTU Examinations Office.</p>
              <div style={{ background: cardBgHover, borderRadius: '16px', padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem' }}>
                {[['Student Name', verifyTranscriptData.student_name],['Student ID', verifyTranscriptData.student_id],['Transcript ID', verifyTranscriptData.transcript_id],['Generated By', verifyTranscriptData.generated_by_name],['Date', new Date(verifyTranscriptData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],['Status', 'Active & Valid']].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 5 ? `1px solid ${border}` : 'none' }}>
                    <span style={{ fontSize: '0.8rem', color: textSec, fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', color: '#0A2A66', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { setShowVerifyTranscript(false); setVerifyTranscriptData(null); }} style={{ padding: '0.8rem 2rem', borderRadius: '30px', border: `2px solid ${border}`, background: cardBg, color: '#0A2A66', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MAIN CONTENT ==================== */}
      <FadeIn>
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <Link to="/admin/dashboard" className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard</Link>
          <h1>Transcript Management</h1>
        </div>
      </FadeIn>

      {/* Override Mode Toggle */}
      <div style={{ background: overrideMode ? '#fef2f2' : cardBg, borderRadius: '14px', padding: '1rem 1.5rem', marginBottom: '1.5rem', border: `1px solid ${overrideMode ? '#fecaca' : border}`, boxShadow: shadowSm, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {overrideMode ? <FaToggleOn style={{ color: '#dc2626', fontSize: '1.5rem' }} /> : <FaToggleOff style={{ color: textMuted, fontSize: '1.5rem' }} />}
          <div>
            <div style={{ fontWeight: 600, color: overrideMode ? '#dc2626' : '#0A2A66', fontSize: '0.95rem' }}>
              {overrideMode ? 'Demo Override Active' : 'Transcript Restrictions Enforced'}
            </div>
            <p style={{ color: textSec, fontSize: '0.8rem', margin: '2px 0 0' }}>
              {overrideMode ? 'Transcript generation allowed at any stage for testing/demo purposes.' : 'Transcript only available after final year with no academic issues.'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOverrideMode(!overrideMode)}
          style={{
            padding: '0.5rem 1.2rem', borderRadius: '8px',
            background: overrideMode ? '#dc2626' : '#0A2A66',
            color: 'white', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
          {overrideMode ? <FaLock /> : <FaToggleOn />}
          {overrideMode ? 'Disable Override' : 'Enable Demo Override'}
        </button>
      </div>

      {/* Student Transcript */}
      <div style={{ background: cardBg, borderRadius: '20px', padding: '1.8rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaUserGraduate style={{ color: '#0A2A66' }} /> Student Transcript</h2>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Student ID</label>
            <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID" onKeyPress={e => e.key === 'Enter' && fetchTranscript()} style={{ borderRadius: '12px' }} />
          </div>
          <button className="btn btn-primary" onClick={fetchTranscript} disabled={loading} style={{ height: '44px', borderRadius: '12px' }}>{loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Retrieve Data</button>
          <button className="btn btn-outline" onClick={() => { setStudentId(''); setStudentData(null); setStudentName(''); setSearched(false); }} style={{ height: '44px', borderRadius: '12px' }}><FaRedoAlt /> Reset</button>
        </div>

        {studentData && (
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                Student: {studentName} ({studentId})
              </h3>

              {/* Generate Button */}
              {hasDoubleFail ? (
                <div style={{ padding: '0.7rem 1.2rem', borderRadius: '30px', background: '#fdf2f8', color: '#be185d', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #fbcfe8' }}>
                  <FaBan /> Cannot Generate — Double Fail
                </div>
              ) : !canGenerateTranscript && !overrideMode ? (
                <div style={{ padding: '0.7rem 1.2rem', borderRadius: '30px', background: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid #e2e8f0' }}>
                  <FaClock /> Transcript Available After Final Year
                </div>
              ) : (
                <button onClick={handleGenerateTranscript} style={{ 
                  padding: '0.7rem 1.5rem', borderRadius: '30px', border: 'none', 
                  background: overrideMode ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #0A2A66, #1e40af)', 
                  color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  gap: '0.5rem', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', 
                  boxShadow: '0 4px 15px rgba(10,42,102,0.3)' 
                }}>
                  <FaFileAlt /> Generate & Save Transcript
                </button>
              )}
            </div>

            {/* Double Fail Warning */}
            {hasDoubleFail && (
              <div style={{ background: '#fdf2f8', borderLeft: '4px solid #be185d', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FaBan style={{ color: '#be185d', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#831843', fontSize: '0.9rem' }}>Double Reference Failure Detected</div>
                  <p style={{ color: '#831843', fontSize: '0.85rem', margin: 0 }}>
                    This student has a double fail reference and must repeat the course(s). Transcript generation is blocked.
                  </p>
                </div>
              </div>
            )}

            {/* Warning for other failures */}
            {!hasDoubleFail && hasWarnings && (
              <div style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FaExclamationTriangle style={{ color: '#dc2626', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.9rem' }}>Academic Issues Detected</div>
                  <p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>
                    This student has failures or withdrawals. These must be resolved before a transcript can be generated.
                  </p>
                </div>
              </div>
            )}

            {/* Not final year warning */}
            {!hasWarnings && !hasDoubleFail && !hasCompletedFinalYear && !overrideMode && (
              <div style={{ background: '#f0f4ff', borderLeft: '4px solid #0A2A66', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <FaClock style={{ color: '#0A2A66', marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>Final Year Not Yet Completed</div>
                  <p style={{ color: '#0A2A66', fontSize: '0.85rem', margin: 0 }}>
                    Transcript generation is only available after the student completes their final year. Enable Demo Override for testing.
                  </p>
                </div>
              </div>
            )}

            {/* Semester list */}
            {studentData.map((semester, i) => (
              <div key={i} style={{ border: `1px solid ${semester.status === 'DOUBLE_FAIL' ? '#fbcfe8' : border}`, borderRadius: '16px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                <div onClick={toggleSemester} style={{ background: semester.status === 'DOUBLE_FAIL' ? '#fdf2f8' : cardBgHover, padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#0A2A66', fontWeight: 600, margin: 0 }}>{semester.academic_year} — {semester.level} {semester.semester}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: textSec }}>GPA: <strong>{semester.gpa != null ? semester.gpa.toFixed(2) : 'N/A'}</strong></span>
                    {getStatusBadge(semester.status)}
                    <FaChevronDown style={{ fontSize: '0.7rem', color: textMuted }} />
                  </div>
                </div>
                <div style={{ display: 'none', borderTop: `1px solid ${border}` }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Course Code</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Course Name</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Credits</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Grade</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Points</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: textSec, fontSize: '0.8rem', textTransform: 'uppercase' }}>Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.courses?.map((course, j) => (
                        <tr key={j} style={{ borderBottom: `1px solid ${border}`, background: course.reference_status === 'double_fail' ? '#fdf2f8' : 'transparent' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{course.course_code}</td>
                          <td style={{ padding: '10px 16px', color: textPri, fontSize: '0.85rem' }}>{course.course_name}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: textPri }}>{course.credit_hours}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600 }}>{course.grade || '—'}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'center', color: textPri }}>{course.grade_points != null ? course.grade_points.toFixed(1) : '—'}</td>
                          <td style={{ padding: '10px 16px' }}>
                            {course.reference_status === 'double_fail' ? (
                              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#fdf2f8', color: '#be185d' }}>Double Fail</span>
                            ) : course.has_reference ? (
                              course.reference_display ? (
                                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#ecfdf5', color: '#059669' }}>{course.reference_display}</span>
                              ) : (
                                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#fffbeb', color: '#d97706' }}>Pending</span>
                              )
                            ) : (
                              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500, background: cardBgHover, color: textMuted }}>None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {searched && !studentData && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem', color: textMuted, marginTop: '1rem', borderTop: `1px solid ${border}` }}>
            <FaUserGraduate style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} />
            <p>No records found for student ID {studentId}</p>
          </div>
        )}
      </div>

      {/* Verify Transcript */}
      <div style={{ background: cardBg, borderRadius: '20px', padding: '1.8rem', marginBottom: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaShieldAlt style={{ color: '#059669' }} /> Verify Transcript Authenticity</h2>
        <p style={{ color: textSec, fontSize: '0.85rem', marginBottom: '1rem' }}>Enter a transcript ID to verify its authenticity.</p>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
            <input type="text" value={verifyId} onChange={e => setVerifyId(e.target.value)} placeholder="e.g., MMTU-TRN-20260621-1234" style={{ fontFamily: 'monospace', borderRadius: '12px' }} />
          </div>
          <button className="btn btn-primary" onClick={handleVerifyTranscript} disabled={verifyLoading} style={{ height: '44px', borderRadius: '12px' }}>{verifyLoading ? <FaSpinner className="animate-spin" /> : <FaShieldAlt />} Verify</button>
        </div>
        {verifyResult && !verifyResult.valid && (
          <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaTimesCircle style={{ color: '#dc2626', fontSize: '1.2rem' }} />
            <div><p style={{ color: '#991b1b', fontWeight: 600, margin: 0 }}>Invalid Transcript</p><p style={{ color: '#991b1b', fontSize: '0.85rem', margin: '4px 0 0' }}>{verifyResult.message}</p></div>
          </div>
        )}
      </div>

      {/* Department Students */}
      <div style={{ background: cardBg, borderRadius: '20px', padding: '1.8rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaBuilding style={{ color: '#0A2A66' }} /> Department Students</h2>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '160px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Department</label>
            <select value={deptFilters.dept_id} onChange={e => setDeptFilters({ ...deptFilters, dept_id: e.target.value })} onClick={() => loadDepartments()} style={{ borderRadius: '12px' }}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.faculty_name})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Program</label>
            <select value={deptFilters.program} onChange={e => setDeptFilters({ ...deptFilters, program: e.target.value })} style={{ borderRadius: '12px' }}>
              <option value="">All</option><option value="BSc">BSc</option><option value="Diploma">Diploma</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Level</label>
            <select value={deptFilters.level} onChange={e => setDeptFilters({ ...deptFilters, level: e.target.value })} style={{ borderRadius: '12px' }}>
              <option value="">All</option><option value="Year 1">Year 1</option><option value="Year 2">Year 2</option><option value="Year 3">Year 3</option><option value="Year 4">Year 4</option>
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '140px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Academic Year</label>
            <select value={deptFilters.academic_year} onChange={e => setDeptFilters({ ...deptFilters, academic_year: e.target.value })} style={{ borderRadius: '12px' }}>
              <option value="">Latest</option><option>2023/2024</option><option>2024/2025</option><option>2025/2026</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={queryDepartment} disabled={deptLoading} style={{ height: '44px', borderRadius: '12px' }}>{deptLoading ? <FaSpinner className="animate-spin" /> : <FaUsers />} Query</button>
          <button className="btn btn-outline" onClick={resetDepartmentQuery} style={{ height: '44px', borderRadius: '12px' }}><FaRedoAlt /> Reset</button>
        </div>

        {deptData && (
          <ShakeOnMount>
            <div style={{ borderTop: `1px solid ${border}`, paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ background: cardBgHover, borderRadius: '16px', padding: '1.2rem', marginBottom: '1.25rem' }}>
                <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaBuilding style={{ color: '#0A2A66' }} /> {deptData.department?.name}</h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: textPri, fontSize: '0.85rem' }}>
                  <span><strong>Faculty:</strong> {deptData.department?.faculty}</span>
                  <span><strong>HOD:</strong> {deptData.hod || 'N/A'}</span>
                  <span><strong>Dean:</strong> {deptData.dean || 'N/A'}</span>
                  <span><strong>Year:</strong> {deptData.academic_year || 'N/A'}</span>
                  <span><strong>Active:</strong> <span style={{ color: '#0A2A66', fontWeight: 700 }}>{deptData.total}</span></span>
                  {deptData.failed_count > 0 && <span><strong>Failed:</strong> <span style={{ color: '#dc2626', fontWeight: 700 }}>{deptData.failed_count}</span></span>}
                </div>
              </div>

              {deptData.students && deptData.students.length > 0 && (
                <div style={{ border: `1px solid ${border}`, borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ background: '#0A2A66' }}>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>ID</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>Name</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>Prog</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S1 GPA</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S1 Status</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S2 GPA</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S2 Status</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>Final GPA</th>
                        <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptData.students.map((s, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
                          <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{s.student_id}</td>
                          <td style={{ padding: '11px 16px', color: textPri, fontSize: '0.85rem' }}>{s.student_name}</td>
                          <td style={{ padding: '11px 16px', color: textPri, fontSize: '0.85rem' }}>{s.program || '—'}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600, color: '#0A2A66' }}>{s.semester1_gpa != null ? s.semester1_gpa.toFixed(2) : 'N/A'}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.semester1_status)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600, color: '#0A2A66' }}>{s.semester2_gpa != null ? s.semester2_gpa.toFixed(2) : 'N/A'}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.semester2_status)}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 700, color: '#0A2A66' }}>{s.final_gpa != null ? s.final_gpa.toFixed(2) : 'N/A'}</td>
                          <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.final_status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {deptData.failed_students && deptData.failed_students.length > 0 && (
                <div>
                  <div style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '0.8rem 1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <FaExclamationTriangle style={{ color: '#dc2626', marginTop: '2px' }} />
                    <div><div style={{ fontWeight: 600, color: '#991b1b', fontSize: '0.9rem' }}>Failed / Withdrew Students</div><p style={{ color: '#991b1b', fontSize: '0.85rem', margin: 0 }}>These students are no longer part of this class.</p></div>
                  </div>
                  <div style={{ border: '1px solid #fecaca', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                      <thead>
                        <tr style={{ background: '#dc2626' }}>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>ID</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>Name</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left' }}>Prog</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S1 GPA</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S1 Status</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S2 GPA</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>S2 Status</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>Final GPA</th>
                          <th style={{ color: 'white', padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptData.failed_students.map((s, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #fecaca', background: i % 2 === 0 ? '#fff5f5' : '#fef2f2' }}>
                            <td style={{ padding: '11px 16px', fontWeight: 600, color: '#991b1b', fontSize: '0.85rem' }}>{s.student_id}</td>
                            <td style={{ padding: '11px 16px', color: '#7f1d1d', fontSize: '0.85rem' }}>{s.student_name}</td>
                            <td style={{ padding: '11px 16px', color: '#7f1d1d', fontSize: '0.85rem' }}>{s.program || '—'}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600, color: '#991b1b' }}>{s.semester1_gpa != null ? s.semester1_gpa.toFixed(2) : 'N/A'}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.semester1_status)}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 600, color: '#991b1b' }}>{s.semester2_gpa != null ? s.semester2_gpa.toFixed(2) : 'N/A'}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.semester2_status)}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center', fontWeight: 700, color: '#991b1b' }}>{s.final_gpa != null ? s.final_gpa.toFixed(2) : 'N/A'}</td>
                            <td style={{ padding: '11px 16px', textAlign: 'center' }}>{getStatusBadge(s.final_status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </ShakeOnMount>
        )}
      </div>
    </div>
  );
};

const thStyle = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' };
const tdStyle = { padding: '9px 16px', color: '#334155', fontSize: '0.8rem' };

export default Transcript;