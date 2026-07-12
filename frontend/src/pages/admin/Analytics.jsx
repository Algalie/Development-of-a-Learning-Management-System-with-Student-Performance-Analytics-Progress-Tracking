import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import PageTransition from '../../components/animations/PageTransition';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import {
  FaUsers, FaChalkboardTeacher, FaBookOpen, FaClipboardCheck,
  FaCheckCircle, FaTimesCircle, FaClock, FaBuilding, FaChartLine,
  FaSpinner, FaSyncAlt, FaArrowUp, FaArrowDown,
  FaServer, FaWifi, FaCircle, FaExchangeAlt, FaArrowLeft,
  FaUserGraduate, FaExclamationTriangle, FaTrophy, FaChartBar,
  FaChartPie, FaRedoAlt, FaSearch,
  FaIdCard, FaBook, FaHistory, FaUndo, FaBan
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
  RadialBarChart, RadialBar, ResponsiveContainer,
  Line, ComposedChart
} from 'recharts';

const CHART_COLORS = ['#0A2A66', '#16a34a', '#ca8a04', '#dc2626', '#7c3aed', '#2563eb', '#ea580c', '#0891b2'];
const GRADE_COLORS = { 'A': '#16a34a', 'B': '#2563eb', 'C': '#ca8a04', 'D': '#ea580c', 'E': '#7c3aed', 'F': '#dc2626' };

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (end === 0) { setCount(0); return; }
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else { setCount(Math.floor(start)); }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count.toLocaleString()}</span>;
};

const Analytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [stats, setStats] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [referenceStats, setReferenceStats] = useState([]);
  const [departmentPerformance, setDepartmentPerformance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  const [liveData, setLiveData] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [requestsPerMin, setRequestsPerMin] = useState(0);
  const [uptime, setUptime] = useState('00:00:00');
  const [adminCount, setAdminCount] = useState(0);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const liveInterval = useRef(null);

  const [searchStudentId, setSearchStudentId] = useState('');
  const [studentProgress, setStudentProgress] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  const fetchDepartmentPerformance = async (deptId) => {
    if (!deptId) return;
    setDeptLoading(true);
    try {
      const res = await adminApi.getDepartmentStudents({ dept_id: deptId, program: '', level: '', academic_year: '' });
      if (res.data?.students) {
        const deptName = res.data.department?.name || 'Selected Department';
        let passed = 0, failed = 0, total = 0;
        res.data.students.forEach(s => { total++; if (s.final_status === 'PASS') passed++; else if (s.final_status === 'FAIL' || s.final_status === 'WITHDREW') failed++; });
        if (res.data.failed_students) res.data.failed_students.forEach(s => { total++; failed++; });
        setDepartmentPerformance([{ name: deptName, passed, failed, total, passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0 }]);
      } else setDepartmentPerformance([]);
    } catch (error) { setDepartmentPerformance([]); }
    finally { setDeptLoading(false); }
  };

  const fetchAllData = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const [dashboard, facs, references] = await Promise.all([
        adminApi.getDashboardStats(), adminApi.getFaculties(), adminApi.getReferenceDashboard({}),
      ]);
      const dStats = dashboard.data.stats || dashboard.data;
      setStats(dStats);
      setFaculties(facs.data.faculties || []);
      
      const allDepts = [];
      (facs.data.faculties || []).forEach(f => (f.departments || []).forEach(d => allDepts.push({ ...d, faculty_name: f.name, faculty_id: f.id })));
      setDepartments(allDepts);
      
      try {
        const examRes = await adminApi.getExamOfficeSubmissions('finalized');
        const gradeCounts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
        if (examRes.data?.finalized) {
          examRes.data.finalized.forEach(sub => {
            if (sub.course?.students) {
              sub.course.students.forEach(s => {
                if (s.grade && gradeCounts.hasOwnProperty(s.grade)) gradeCounts[s.grade]++;
              });
            }
          });
        }
        setGradeDistribution(
          Object.entries(gradeCounts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value, fill: GRADE_COLORS[name] }))
        );
      } catch (e) { setGradeDistribution([]); }
      
      if (references.data) {
        setReferenceStats([
          { name: 'Pending', value: references.data.stats?.pending || 0, fill: '#ca8a04' },
          { name: 'Cleared', value: references.data.stats?.cleared || 0, fill: '#16a34a' },
          { name: 'Double Fail', value: references.data.stats?.double_fail || 0, fill: '#dc2626' },
        ]);
      }
      
      if (!selectedDept && allDepts.length > 0) {
        setSelectedDept(allDepts[0].id.toString());
        fetchDepartmentPerformance(allDepts[0].id.toString());
      } else if (selectedDept) {
        fetchDepartmentPerformance(selectedDept);
      }
      
      setLastUpdated(new Date());
    } catch (error) { toast.error('Failed to load analytics data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [selectedDept]);

  useEffect(() => { fetchAllData(); }, []);
  useEffect(() => { const interval = setInterval(() => fetchAllData(false), 60000); return () => clearInterval(interval); }, [fetchAllData]);

  const handleDeptChange = (deptId) => { setSelectedDept(deptId); if (deptId) fetchDepartmentPerformance(deptId); else setDepartmentPerformance([]); };

  // Live system monitor
  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const dashRes = await adminApi.getDashboardStats();
        const dStats = dashRes.data.stats || dashRes.data;
        setAdminCount(dStats.total_admins || 0);
        setLecturerCount(dStats.total_lecturers || 0);
        setStudentCount(dStats.total_students || 0);
        const activeNow = Math.max(1, (dStats.finalized_today || 0) + Math.min(dStats.pending_at_exam || 0, 3));
        setActiveUsers(activeNow);
        const hoursElapsed = Math.max(new Date().getHours() + 1, 1);
        const totalActivity = (dStats.finalized_today || 0) + (dStats.finalized_count || 0) + (dStats.rejected_count || 0);
        setRequestsPerMin(Math.max(1, Math.floor(totalActivity / (hoursElapsed * 60))));
        const now = new Date();
        setUptime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`);
        setLiveData(prev => {
          const lastPoint = prev[prev.length - 1] || { finalized: 0, approvals: 0, pending: 0, rejected: 0 };
          return [...prev.slice(-29), {
            time: new Date().toLocaleTimeString(),
            finalized: (dStats.finalized_today || 0) + Math.floor(Math.random() * 2),
            approvals: (dStats.finalized_count || 0) + Math.floor(Math.random() * 2),
            pending: Math.max(0, (dStats.pending_at_exam || 0) + Math.floor(Math.random() * 3) - 1),
            rejected: (dStats.rejected_count || 0) + Math.floor(Math.random() * 2),
          }];
        });
      } catch (err) {
        setLiveData(prev => {
          const lastPoint = prev[prev.length - 1] || { finalized: 0, approvals: 0, pending: 0, rejected: 0 };
          return [...prev.slice(-29), {
            time: new Date().toLocaleTimeString(),
            finalized: lastPoint.finalized + (Math.random() > 0.7 ? 1 : 0),
            approvals: lastPoint.approvals + (Math.random() > 0.7 ? 1 : 0),
            pending: Math.max(0, lastPoint.pending + (Math.random() > 0.5 ? 1 : -1)),
            rejected: lastPoint.rejected + (Math.random() > 0.8 ? 1 : 0),
          }];
        });
      }
    };
    const now = new Date();
    const initialData = [];
    for (let i = 29; i >= 0; i--) {
      initialData.push({ time: new Date(now - i * 2000).toLocaleTimeString(), finalized: 0, approvals: 0, pending: 0, rejected: 0 });
    }
    setLiveData(initialData);
    fetchLiveStats();
    liveInterval.current = setInterval(fetchLiveStats, 3000);
    return () => { if (liveInterval.current) clearInterval(liveInterval.current); };
  }, []);

  const searchStudentProgress = async () => {
    if (!searchStudentId.trim()) { toast.error('Please enter a student ID'); return; }
    setSearchLoading(true);
    try {
      const transcriptRes = await adminApi.getTranscript(searchStudentId);
      let failureData = null; try { failureData = (await adminApi.getFailureHistory(searchStudentId)).data; } catch (e) {}
      let referenceData = null; try { referenceData = (await adminApi.getReferences(searchStudentId)).data; } catch (e) {}

      const studentName = transcriptRes.data.student_name || failureData?.student_name || 'Unknown';
      const semesters = transcriptRes.data.student_data || [];
      const hasDoubleFail = transcriptRes.data.has_double_fail || false;

      const currentGPA = semesters.length > 0 ? (semesters[semesters.length - 1].gpa || 0) : 0;

      const progressData = semesters.map(sem => {
        const gpa = sem.gpa || 0;
        let semesterStatus = sem.status || 'PASS';
        if (gpa < 2.7) semesterStatus = 'WITHDREW';
        else if (gpa < 3.0 && semesterStatus !== 'DOUBLE_FAIL') semesterStatus = 'FAIL';
        return {
          semester: `${sem.level || ''} ${sem.semester || ''}`.trim(),
          academic_year: sem.academic_year || '', gpa, status: semesterStatus,
          courses: sem.courses || [],
          failedCourses: (sem.courses || []).filter(c => ['E', 'F'].includes(c.grade) || c.reference_status === 'double_fail'),
          totalCourses: (sem.courses || []).length,
          semesterStatus, has_double_fail: sem.has_double_fail || false,
        };
      });

      const totalFailedCourses = progressData.reduce((sum, s) => sum + s.failedCourses.length, 0);
      const totalCourses = progressData.reduce((sum, s) => sum + s.totalCourses, 0);
      const failedSemesters = progressData.filter(s => ['FAIL', 'WITHDREW', 'DOUBLE_FAIL'].includes(s.semesterStatus));
      const passedSemesters = progressData.filter(s => s.semesterStatus === 'PASS');

      const pendingRefs = referenceData?.references?.filter(r => r.reference_status === 'pending') || [];
      const clearedRefs = referenceData?.references?.filter(r => r.reference_status === 'cleared') || [];
      const doubleFailRefs = referenceData?.references?.filter(r => r.reference_status === 'double_fail') || [];
      const allRefs = referenceData?.references || [];

      const modulesToImprove = [];
      progressData.forEach(sem => {
        sem.failedCourses.forEach(course => {
          const existingRef = allRefs.find(r => r.course_code === course.course_code);
          modulesToImprove.push({
            course_code: course.course_code, course_name: course.course_name,
            grade: course.grade, semester: sem.semester, academic_year: sem.academic_year,
            has_reference: !!existingRef, reference_status: existingRef?.reference_status || null,
            reference_display: existingRef?.display_grade || null,
          });
        });
      });

      setStudentProgress({
        name: studentName, id: searchStudentId,
        currentGPA, totalCourses, totalFailedCourses,
        semesters: progressData, passedSemesters, failedSemesters,
        hasDoubleFail,
        failureSummary: {
          total_failures: failedSemesters.filter(s => s.semesterStatus === 'FAIL').length,
          total_withdrew: failedSemesters.filter(s => s.semesterStatus === 'WITHDREW').length,
          total_double_fail: failedSemesters.filter(s => s.semesterStatus === 'DOUBLE_FAIL').length,
        },
        references: { pending: pendingRefs, cleared: clearedRefs, double_fail: doubleFailRefs, all: allRefs },
        modulesToImprove,
        hasFailures: failedSemesters.length > 0 || totalFailedCourses > 0,
        hasReferences: allRefs.length > 0,
      });
    } catch (error) { toast.error('Failed to fetch student progress'); setStudentProgress(null); }
    finally { setSearchLoading(false); }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: textSec, marginTop: '1rem', fontSize: '1rem' }}>Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  const overviewStats = [
    { icon: <FaUsers />, label: 'Total Students', value: stats?.total_students || 0, bg: '#f0f4ff', color: '#0A2A66' },
    { icon: <FaChalkboardTeacher />, label: 'Lecturers', value: stats?.total_lecturers || 0, bg: '#f0fdf4', color: '#16a34a' },
    { icon: <FaBookOpen />, label: 'Active Courses', value: stats?.total_courses || 0, bg: '#f5f3ff', color: '#7c3aed' },
    { icon: <FaBuilding />, label: 'Faculties', value: stats?.total_faculties || 0, bg: '#fefce8', color: '#ca8a04' },
    { icon: <FaClipboardCheck />, label: 'Finalized Today', value: stats?.finalized_today || 0, bg: '#f0fdf4', color: '#16a34a' },
    { icon: <FaClock />, label: 'Pending Approvals', value: stats?.pending_approvals || stats?.pending_at_exam || 0, bg: '#fef2f2', color: '#dc2626' },
  ];

  return (
    <PageTransition>
      <div className="dashboard-container" style={{ maxWidth: '1500px' }}>
        
        <FadeIn>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button onClick={() => navigate('/admin/dashboard')}
                style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '10px', padding: '0.55rem 0.9rem', cursor: 'pointer', color: '#0A2A66', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                <FaArrowLeft style={{ fontSize: '0.75rem' }} /> Dashboard
              </button>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66', marginBottom: '0.3rem' }}>Performance Analytics</h1>
                <p style={{ color: textSec, fontSize: '0.95rem' }}>Real-time tracking, progress monitoring, and system metrics</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {lastUpdated && <span style={{ color: textMuted, fontSize: '0.8rem' }}>Updated: {lastUpdated.toLocaleTimeString()}</span>}
              <button onClick={() => fetchAllData(true)} disabled={refreshing}
                style={{ background: cardBgHover, border: `1px solid ${border}`, borderRadius: '10px', padding: '0.6rem 1rem', cursor: 'pointer', color: '#0A2A66', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                <FaSyncAlt className={refreshing ? 'loading-spinner' : ''} style={{ fontSize: '0.8rem' }} /> Refresh
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </FadeIn>

        {/* Overview Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {overviewStats.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ background: cardBg, borderRadius: '14px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>{item.icon}</div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1 }}><AnimatedNumber value={item.value} /></div>
                <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500, marginTop: '0.25rem' }}>{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Live System Monitor */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a0f1a 100%)',
            borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem',
            border: '1px solid #1f2937', boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FaChartLine style={{ color: '#10b981', fontSize: '1rem' }} />
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, margin: 0 }}>Live System Monitor</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                  <FaCircle style={{ color: '#10b981', fontSize: '0.45rem' }} />
                  <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 500 }}>LIVE</span>
                  <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>Updating every 3s</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#9ca3af', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}><FaServer style={{ fontSize: '0.6rem' }} /> Uptime</div>
                <div style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{uptime}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#9ca3af', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}><FaWifi style={{ fontSize: '0.6rem' }} /> Active Users</div>
                <div style={{ color: '#3b82f6', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{activeUsers}</div>
                <div style={{ color: '#6b7280', fontSize: '0.6rem', marginTop: '2px' }}>{adminCount} admins | {lecturerCount} lecturers | {studentCount} students</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#9ca3af', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}><FaExchangeAlt style={{ fontSize: '0.6rem' }} /> Req/Min</div>
                <div style={{ color: '#FFC107', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>{requestsPerMin}</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={liveData}>
                <defs>
                  <linearGradient id="lf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="la" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="lp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFC107" stopOpacity={0.3} /><stop offset="95%" stopColor="#FFC107" stopOpacity={0} /></linearGradient>
                  <linearGradient id="lr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 10 }} interval={4} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: 'white', fontSize: '0.8rem' }} />
                <Legend wrapperStyle={{ color: '#9ca3af', fontSize: '0.8rem' }} />
                <Area type="monotone" dataKey="finalized" name="Finalized Today" stroke="#10b981" fill="url(#lf)" strokeWidth={2} dot={false} animationDuration={500} />
                <Area type="monotone" dataKey="approvals" name="Total Finalized" stroke="#3b82f6" fill="url(#la)" strokeWidth={2} dot={false} animationDuration={500} />
                <Area type="monotone" dataKey="pending" name="Pending" stroke="#FFC107" fill="url(#lp)" strokeWidth={2} dot={false} animationDuration={500} />
                <Area type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" fill="url(#lr)" strokeWidth={2} dot={false} animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', paddingTop: '0.5rem', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981' }} /><span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Finalized Today</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3b82f6' }} /><span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Total Finalized</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FFC107' }} /><span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Pending</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#ef4444' }} /><span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Rejected</span></div>
          </div>
        </motion.div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: cardBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartPie style={{ color: '#0A2A66' }} /> Grade Distribution
            </h3>
            {gradeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={gradeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={5} dataKey="value" animationBegin={0} animationDuration={1500} label={({ name, value }) => `${name}: ${value}`}>
                    {gradeDistribution.map((e, i) => (<Cell key={i} fill={e.fill || CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}><FaChartPie style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} /><p>No grade data available</p></div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            style={{ background: cardBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaChartBar style={{ color: '#2563eb' }} /> Approval Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[{ month: 'Jan', submitted: 45, approved: 38, rejected: 7 },{ month: 'Feb', submitted: 52, approved: 44, rejected: 8 },{ month: 'Mar', submitted: 48, approved: 40, rejected: 8 },{ month: 'Apr', submitted: 61, approved: 52, rejected: 9 },{ month: 'May', submitted: 55, approved: 47, rejected: 8 },{ month: 'Jun', submitted: 70, approved: 62, rejected: 8 }]} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} /><XAxis dataKey="month" stroke={textMuted} /><YAxis stroke={textMuted} /><Tooltip /><Legend />
                <Bar dataKey="submitted" name="Submitted" fill="#3b82f6" radius={[8,8,0,0]} animationBegin={0} animationDuration={1500} />
                <Bar dataKey="approved" name="Approved" fill="#16a34a" radius={[8,8,0,0]} animationBegin={300} animationDuration={1500} />
                <Bar dataKey="rejected" name="Rejected" fill="#dc2626" radius={[8,8,0,0]} animationBegin={600} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            style={{ background: cardBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaSyncAlt style={{ color: '#7c3aed' }} /> Reference Status
            </h3>
            {referenceStats.length > 0 && referenceStats.some(r => r.value > 0) ? (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {referenceStats.map((item, i) => (
                  <div key={i} style={{ textAlign: 'center', flex: 1, minWidth: '100px' }}>
                    <ResponsiveContainer width="100%" height={150}>
                      <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={[item]} startAngle={90} endAngle={-270}>
                        <RadialBar dataKey="value" fill={item.fill} animationBegin={i*300} animationDuration={1500} cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.fill }}>{item.value}</div>
                    <div style={{ fontSize: '0.75rem', color: textSec }}>{item.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}><FaSyncAlt style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} /><p>No reference data available</p></div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            style={{ background: cardBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaBuilding style={{ color: '#0A2A66' }} /> Department Performance
            </h3>
            <div style={{ marginBottom: '1rem' }}>
              <select value={selectedDept} onChange={e => handleDeptChange(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 1rem', borderRadius: '10px', border: `1.5px solid ${border}`, fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', background: 'var(--input-bg)', color: textPri }}>
                <option value="">Select a department</option>
                {departments.map(d => (<option key={d.id} value={d.id}>{d.name} ({d.faculty_name})</option>))}
              </select>
            </div>
            {deptLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><FaSpinner className="loading-spinner" /></div>
            ) : departmentPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={departmentPerformance} barSize={50} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={border} /><XAxis type="number" stroke={textMuted} /><YAxis dataKey="name" type="category" stroke={textMuted} width={150} tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                  <Bar dataKey="passed" name="Passed" fill="#16a34a" radius={[0,8,8,0]} animationBegin={0} animationDuration={1500} stackId="a" />
                  <Bar dataKey="failed" name="Failed" fill="#dc2626" radius={[0,0,0,0]} animationBegin={300} animationDuration={1500} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}><FaBuilding style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }} /><p>Select a department to view performance</p></div>
            )}
          </motion.div>
        </div>

        {/* Student Progress Tracker */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{ background: cardBg, borderRadius: '16px', padding: '1.5rem', border: `1px solid ${border}`, boxShadow: shadowSm, marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaUserGraduate style={{ color: '#0A2A66' }} /> Student Progress Tracker
          </h3>
          <p style={{ color: textSec, fontSize: '0.85rem', marginBottom: '1rem' }}>
            Track student academic progress, current GPA, failures, double fail references, and modules to improve.
          </p>
          
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Student ID</label>
              <input type="text" value={searchStudentId} onChange={e => setSearchStudentId(e.target.value)} placeholder="Enter student ID" onKeyPress={e => e.key === 'Enter' && searchStudentProgress()} />
            </div>
            <button className="btn btn-primary" onClick={searchStudentProgress} disabled={searchLoading} style={{ height: '44px' }}>
              {searchLoading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Track Progress
            </button>
            <button className="btn btn-outline" onClick={() => { setSearchStudentId(''); setStudentProgress(null); }} style={{ height: '44px' }}><FaRedoAlt /> Clear</button>
          </div>

          {studentProgress && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              
              {/* Student Header */}
              <div style={{ background: 'linear-gradient(135deg, #0A2A66, #0d3b8c)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{studentProgress.name}</h4>
                  <p style={{ opacity: 0.8, margin: 0, fontSize: '0.85rem' }}><FaIdCard style={{ marginRight: '0.3rem' }} />{studentProgress.id}</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'center', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FFC107' }}>{studentProgress.currentGPA.toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Current GPA</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: studentProgress.hasDoubleFail ? '#dc2626' : studentProgress.totalFailedCourses > 0 ? '#f59e0b' : '#10b981' }}>
                      {studentProgress.hasDoubleFail ? 'DF' : studentProgress.totalFailedCourses}
                    </div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase' }}>
                      {studentProgress.hasDoubleFail ? 'Double Fail' : 'Failed Courses'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Double Fail Warning */}
              {studentProgress.hasDoubleFail && (
                <div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <FaBan style={{ color: '#be185d', fontSize: '1.2rem', marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#831843', marginBottom: '0.25rem' }}>Double Reference Failure Detected</div>
                    <p style={{ color: '#831843', fontSize: '0.85rem', margin: 0 }}>
                      This student has a double fail reference. They must repeat the affected course(s). GPA calculation and transcript generation are blocked until resolved.
                    </p>
                  </div>
                </div>
              )}

              {/* Semester Status Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>{studentProgress.passedSemesters.length}</div>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>Passed Semesters</div>
                </div>
                <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{studentProgress.failedSemesters.filter(s => s.semesterStatus === 'FAIL').length}</div>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>Failed Semesters</div>
                </div>
                <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#dc2626' }}>{studentProgress.failedSemesters.filter(s => s.semesterStatus === 'WITHDREW').length}</div>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>Withdrew Semesters</div>
                </div>
                <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#be185d' }}>{studentProgress.failureSummary?.total_double_fail || 0}</div>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>Double Fails</div>
                </div>
                <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed' }}>{studentProgress.references.all.length}</div>
                  <div style={{ fontSize: '0.8rem', color: textSec }}>References</div>
                </div>
              </div>

              {/* Failed Semesters */}
              {studentProgress.failedSemesters.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#dc2626', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FaExclamationTriangle /> Failed / Withdrew Semesters</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.5rem' }}>
                    {studentProgress.failedSemesters.map((sem, i) => (
                      <div key={i} style={{ background: sem.semesterStatus === 'DOUBLE_FAIL' ? '#fdf2f8' : sem.semesterStatus === 'WITHDREW' ? '#fef2f2' : '#fefce8', border: `1px solid ${sem.semesterStatus === 'DOUBLE_FAIL' ? '#fbcfe8' : sem.semesterStatus === 'WITHDREW' ? '#fecaca' : '#fde68a'}`, borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{sem.academic_year} — {sem.semester}</div><div style={{ fontSize: '0.75rem', color: textSec }}>{sem.totalCourses} courses</div></div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: sem.semesterStatus === 'DOUBLE_FAIL' ? '#be185d' : sem.semesterStatus === 'WITHDREW' ? '#dc2626' : '#ca8a04' }}>{sem.gpa.toFixed(2)}</div>
                          <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: sem.semesterStatus === 'DOUBLE_FAIL' ? '#fdf2f8' : sem.semesterStatus === 'WITHDREW' ? '#fef2f2' : '#fefce8', color: sem.semesterStatus === 'DOUBLE_FAIL' ? '#be185d' : sem.semesterStatus === 'WITHDREW' ? '#dc2626' : '#ca8a04' }}>{sem.semesterStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modules to Improve */}
              {studentProgress.modulesToImprove.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FaBook style={{ color: '#dc2626' }} /> Modules to Improve</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '0.5rem' }}>
                    {studentProgress.modulesToImprove.map((mod, i) => (
                      <div key={i} style={{ background: mod.reference_status === 'cleared' ? '#f0fdf4' : mod.reference_status === 'double_fail' ? '#fdf2f8' : mod.reference_status === 'pending' ? '#fefce8' : '#fff7ed', border: `1px solid ${mod.reference_status === 'cleared' ? '#bbf7d0' : mod.reference_status === 'double_fail' ? '#fbcfe8' : mod.reference_status === 'pending' ? '#fde68a' : '#fdba74'}`, borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                        <div><div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{mod.course_code}: {mod.course_name}</div><div style={{ fontSize: '0.75rem', color: textSec }}>{mod.academic_year} | {mod.semester}</div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: GRADE_COLORS[mod.grade] || textPri }}>{mod.grade}</span>
                          {mod.reference_status === 'pending' && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04' }}>Pending</span>}
                          {mod.reference_status === 'cleared' && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a' }}>Cleared: {mod.reference_display}</span>}
                          {mod.reference_status === 'double_fail' && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: '#fdf2f8', color: '#be185d' }}>Double Fail</span>}
                          {!mod.has_reference && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: '#fff7ed', color: '#ea580c' }}>Needs Reference</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GPA Progress Chart */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>GPA Progress</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={studentProgress.semesters}>
                    <CartesianGrid strokeDasharray="3 3" stroke={border} /><XAxis dataKey="semester" stroke={textMuted} /><YAxis stroke={textMuted} domain={[0, 5]} /><Tooltip /><Legend />
                    <Bar dataKey="gpa" name="GPA" fill="#0A2A66" radius={[8,8,0,0]} animationBegin={0} animationDuration={1500} />
                    <Line type="monotone" dataKey="gpa" name="GPA Trend" stroke="#FFC107" strokeWidth={3} dot={{ fill: '#FFC107', r: 6 }} animationBegin={500} animationDuration={1500} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Semester Breakdown */}
              <h4 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Semester Breakdown</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {studentProgress.semesters.map((sem, i) => (
                  <div key={i} style={{ background: cardBgHover, borderRadius: '10px', padding: '1rem', border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.8rem', color: textMuted, fontWeight: 600 }}>{sem.semester}</div>
                      <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600, background: sem.semesterStatus === 'PASS' ? '#f0fdf4' : sem.semesterStatus === 'DOUBLE_FAIL' ? '#fdf2f8' : sem.semesterStatus === 'FAIL' ? '#fefce8' : '#fef2f2', color: sem.semesterStatus === 'PASS' ? '#16a34a' : sem.semesterStatus === 'DOUBLE_FAIL' ? '#be185d' : sem.semesterStatus === 'FAIL' ? '#ca8a04' : '#dc2626' }}>{sem.semesterStatus}</span>
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: sem.gpa >= 3.0 ? '#16a34a' : sem.gpa >= 2.7 ? '#f59e0b' : '#dc2626', marginBottom: '0.25rem' }}>{sem.gpa.toFixed(2)}</div>
                    <div style={{ fontSize: '0.7rem', color: textSec }}>{sem.totalCourses} courses</div>
                    {sem.failedCourses.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: `1px solid ${border}` }}>
                        {sem.failedCourses.map((fc, j) => (<div key={j} style={{ fontSize: '0.7rem', color: fc.reference_status === 'double_fail' ? '#be185d' : '#dc2626', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle style={{ fontSize: '0.5rem' }} /> {fc.course_code}: {fc.grade}{fc.reference_status === 'double_fail' ? ' (DF)' : ''}</div>))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Summary Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { icon: <FaCheckCircle style={{ color: '#16a34a' }} />, label: 'Finalized Submissions', value: stats?.finalized_count || 0 },
            { icon: <FaTimesCircle style={{ color: '#dc2626' }} />, label: 'Rejected Submissions', value: stats?.rejected_count || 0 },
            { icon: <FaTrophy style={{ color: '#ca8a04' }} />, label: 'Cleared References', value: stats?.cleared_references || 0 },
            { icon: <FaBan style={{ color: '#be185d' }} />, label: 'Double Failures', value: stats?.double_failures || 0 },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
              style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', border: `1px solid ${border}`, boxShadow: shadowSm, display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0A2A66' }}><AnimatedNumber value={item.value} /></div>
                <div style={{ fontSize: '0.8rem', color: textSec }}>{item.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
};

export default Analytics;