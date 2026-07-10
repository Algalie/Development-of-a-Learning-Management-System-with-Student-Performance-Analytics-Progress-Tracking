import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaCalendarAlt, FaClock, FaUsers, FaTasks,
  FaArchive, FaEye, FaArrowRight, FaSpinner, FaBook, FaRedoAlt
} from 'react-icons/fa';

const CourseHistory = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const res = await lecturerApi.getCourseHistory();
      const data = res.data.courses || res.data || [];
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      toast.error('Failed to load course history');
    } finally { setLoading(false); }
  };

  const searchCourses = () => {
    let filtered = courses;
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.course_name?.toLowerCase().includes(term) ||
        c.course_code?.toLowerCase().includes(term)
      );
    }
    if (semesterFilter) {
      filtered = filtered.filter(c => c.semester?.includes(semesterFilter));
    }
    if (yearFilter) {
      filtered = filtered.filter(c => c.academic_year?.includes(yearFilter));
    }
    setFilteredCourses(filtered);
  };

  const resetFilters = () => {
    setSearch(''); setSemesterFilter(''); setYearFilter('');
    setFilteredCourses(courses);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: '#64748b', marginTop: '1rem' }}>Loading course history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/lecturer/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <h1>Course History</h1>
        </div>
      </FadeIn>

      {/* Search & Filters */}
      <div style={{
        background: 'white', borderRadius: '12px', padding: '1.25rem',
        marginBottom: '1.5rem', border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaSearch style={{ color: '#0A2A66' }} /> Search Archived Courses
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Course Code / Name</label>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Semester</label>
            <select value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
              <option value="">All Semesters</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Academic Year</label>
            <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
              <option value="">All Years</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2023/2024">2023/2024</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={resetFilters}>
            <FaRedoAlt style={{ marginRight: '0.3rem' }} /> Reset
          </button>
          <button className="btn btn-primary btn-sm" onClick={searchCourses}>
            <FaSearch style={{ marginRight: '0.3rem' }} /> Search
          </button>
        </div>
      </div>

      <ShakeOnMount>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredCourses.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4rem', background: 'white',
              borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8',
            }}>
              <FaArchive style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Archived Courses</h3>
              <p>Courses from previous semesters will appear here once archived.</p>
            </div>
          ) : (
            filteredCourses.map(course => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
                whileHover={{ borderColor: '#94a3b8' }}
              >
                {/* Course Info */}
                <div style={{ flex: 2, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, fontFamily: 'monospace' }}>
                      {course.course_code}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600,
                      background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
                    }}>
                      {course.program_type}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.5rem' }}>
                    {course.course_name}
                  </h3>

                  {/* Details Grid */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.5rem', padding: '0.75rem 0',
                    borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9',
                    marginBottom: '0.5rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                      <FaCalendarAlt style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                      {course.semester} | {course.academic_year}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                      <FaClock style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                      {course.credit_hours} Credits
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                      <FaUsers style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                      {course.students?.length || 0} Students
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#475569' }}>
                      <FaTasks style={{ color: '#94a3b8', fontSize: '0.75rem' }} />
                      {course.assessments?.length || 0} Assessments
                    </div>
                  </div>
                </div>

                {/* View Button */}
                <div style={{ flexShrink: 0 }}>
                  <Link
                    to={`/lecturer/course/${course.id}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      padding: '0.5rem 1.2rem', borderRadius: '8px',
                      background: '#f8fafc', color: '#0A2A66',
                      border: '1px solid #e2e8f0',
                      textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500,
                      transition: 'all 0.2s',
                    }}
                  >
                    <FaEye style={{ fontSize: '0.7rem' }} /> View Details
                    <FaArrowRight style={{ fontSize: '0.7rem' }} />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </ShakeOnMount>
    </div>
  );
};

export default CourseHistory;