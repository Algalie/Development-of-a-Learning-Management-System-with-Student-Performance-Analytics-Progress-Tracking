import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { 
  FaArrowLeft, FaSearch, FaSpinner, FaCalculator, FaHistory,
  FaExclamationTriangle, FaTimesCircle, FaCheckCircle, FaInfoCircle,
  FaTable
} from 'react-icons/fa';

const GPACalculator = () => {
  const [form, setForm] = useState({ 
    student_id: '', 
    academic_year: '2026/2027', 
    level: '', 
    semester: '' 
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchGrades = async () => {
    if (!form.student_id || !form.academic_year || !form.level || !form.semester) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    setResult(null);
    setData(null);
    try {
      const res = await adminApi.getStudentGrades(form);
      setData(res.data);
      if (!res.data.current_grades || res.data.current_grades.length === 0) {
        toast.error('No grades found for this student/semester');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch grades');
    } finally {
      setLoading(false);
    }
  };

  const calculateAndSave = async () => {
    if (!data || !data.current_grades || data.current_grades.length === 0) {
      toast.error('No grades to calculate');
      return;
    }
    if (data.has_double_fail) {
      toast.error('Cannot calculate - double fail reference exists. Student must repeat course(s).');
      return;
    }
    if (data.has_pending_references) {
      toast.error('Cannot calculate - pending references exist. Clear references first.');
      return;
    }

    let totalCredits = 0;
    let totalPoints = 0;
    const formulaParts = [];

    data.current_grades.forEach(g => {
      const credits = g.effective_credit_hours || g.credit_hours;
      totalCredits += credits;
      totalPoints += credits * g.grade_points;
      formulaParts.push(`${credits}×${g.grade_points.toFixed(1)}`);
    });

    const currentGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;

    let status, statusClass;
    if (currentGPA >= 3.0) { status = 'PASS'; statusClass = 'pass'; }
    else if (currentGPA >= 2.7) { status = 'FAIL'; statusClass = 'fail'; }
    else { status = 'WITHDREW'; statusClass = 'withdrew'; }

    let finalGPA = currentGPA;
    let finalFormula = '';
    let previousSemesterGPA = null;
    const isSemester2 = form.semester === 'Semester 2';

    if (isSemester2 && data.previous_semesters && data.previous_semesters.length > 0) {
      const sem1Record = data.previous_semesters.find(
        p => p.level === form.level &&
             p.academic_year === form.academic_year &&
             p.semester === 'Semester 1'
      );

      if (sem1Record && sem1Record.gpa != null) {
        previousSemesterGPA = sem1Record.gpa;
        finalGPA = (previousSemesterGPA + currentGPA) / 2;
        finalFormula = `(${previousSemesterGPA.toFixed(2)} + ${currentGPA.toFixed(2)}) ÷ 2 = ${finalGPA.toFixed(2)}`;
      } else {
        finalFormula = 'No Semester 1 GPA found for this academic year. Final GPA equals current GPA.';
      }
    } else {
      finalFormula = isSemester2
        ? 'No Semester 1 GPA found. Final GPA equals current GPA.'
        : 'First semester GPA equals current GPA.';
    }

    setResult({
      gpa: currentGPA,
      finalGPA: finalGPA,
      previousSemesterGPA: previousSemesterGPA,
      status,
      statusClass,
      totalCredits,
      totalPoints,
      formulaParts,
      finalFormula,
      isSemester2,
    });

    setCalculating(true);
    try {
      await adminApi.calculateGPA({
        student_id: form.student_id,
        student_name: data.student_name,
        level: form.level,
        semester: form.semester,
        academic_year: form.academic_year,
        grades: data.current_grades,
        previous_gpas: data.previous_semesters || [],
      });
      toast.success('GPA calculated and saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('GPA calculated but failed to save');
    } finally {
      setCalculating(false);
    }
  };

  const getGradeDisplay = (g) => {
    if (g.has_double_fail) {
      return (
        <div>
          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem' }}>DOUBLE FAIL</span>
          {g.display_grade && (
            <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>
              ({g.display_grade.split('/')[0]}/{g.display_grade.split('/')[1]})
            </div>
          )}
        </div>
      );
    }
    if (g.has_cleared_reference && g.display_grade) {
      const [newGrade, oldGrade] = g.display_grade.split('/');
      return (
        <span className="display-grade">
          <span className="new-grade">{newGrade}</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>/</span>
          <span className="old-grade">{oldGrade}</span>
        </span>
      );
    }
    if (g.has_pending_reference) {
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏳ Pending Ref</span>;
    }
    if (g.grade === 'PENDING_REF') {
      return <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏳ Pending</span>;
    }
    return <span className={`grade-badge grade-${g.grade || 'F'}`}>{g.grade || '-'}</span>;
  };

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const borderLight = 'var(--border-light)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '950px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <h1>GPA Calculator</h1>
        </div>
      </FadeIn>

      {/* Input Form */}
      <div style={{
        background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
        boxShadow: shadowSm, border: `1px solid ${borderLight}`,
        marginBottom: '1.5rem',
      }}>
        <h3 style={{ color: '#0A2A66', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaSearch style={{ color: '#FFC107' }} /> Student Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Student ID <span style={{ color: '#dc2626' }}>*</span></label>
            <input type="text" name="student_id" value={form.student_id} onChange={handleChange} placeholder="e.g., 7626" />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Academic Year <span style={{ color: '#dc2626' }}>*</span></label>
            <select name="academic_year" value={form.academic_year} onChange={handleChange}>
              <option value="">Select</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Year <span style={{ color: '#dc2626' }}>*</span></label>
            <select name="level" value={form.level} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Year 1">Year 1</option>
              <option value="Year 2">Year 2</option>
              <option value="Year 3">Year 3</option>
              <option value="Year 4">Year 4</option>
            </select>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: textSec }}>Semester <span style={{ color: '#dc2626' }}>*</span></label>
            <select name="semester" value={form.semester} onChange={handleChange}>
              <option value="">Select</option>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={fetchGrades} disabled={loading}>
            {loading ? (
              <><FaSpinner className="animate-spin" /> Retrieving...</>
            ) : (
              <><FaSearch /> Retrieve Grades</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-container">
          <FaSpinner className="loading-spinner" />
          <p style={{ color: textSec }}>Loading grades...</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <ShakeOnMount>
          {/* Student Info Header */}
          <div style={{
            background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
            padding: '1rem 1.25rem', borderRadius: '14px', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
          }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0A2A66', fontSize: '1.1rem' }}>{data.student_name}</div>
              <div style={{ color: textSec, fontSize: '0.85rem' }}>
                {form.level} - {form.semester} ({form.academic_year})
              </div>
            </div>
            <span className="badge" style={{ background: '#0A2A66', color: 'white', padding: '0.3rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600 }}>
              {form.student_id}
            </span>
          </div>

          {/* Previous Semesters */}
          {data.previous_semesters && data.previous_semesters.length > 0 && (
            <div style={{
              background: cardBgHover, borderRadius: '14px', padding: '1rem 1.2rem',
              marginBottom: '1.5rem', border: `1px solid ${border}`,
            }}>
              <h4 style={{ color: '#0A2A66', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <FaHistory style={{ color: '#FFC107', marginRight: '0.4rem' }} />
                Previous Semesters:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {data.previous_semesters.map((prev, i) => (
                  <span key={i} style={{
                    display: 'inline-block', background: cardBg, padding: '0.3rem 1rem',
                    borderRadius: '20px', fontSize: '0.85rem', border: `1px solid ${border}`,
                    color: textPri,
                  }}>
                    {prev.level} {prev.semester} ({prev.academic_year}):{' '}
                    <span style={{ fontWeight: 700, color: '#0A2A66' }}>
                      GPA {prev.gpa ? prev.gpa.toFixed(2) : 'N/A'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pending Reference Warning */}
          {data.has_pending_references && (
            <div className="warning-box pending-ref" style={{ display: 'block', marginBottom: '1.5rem' }}>
              <FaExclamationTriangle />
              <div>
                <div className="warning-title">⚠️ Pending References Found</div>
                <div className="warning-detail">
                  This student has pending references for:{' '}
                  <strong>{data.pending_reference_courses?.join(', ')}</strong>.
                  <br />
                  <strong>GPA cannot be calculated</strong> until these references are cleared.
                </div>
              </div>
            </div>
          )}

          {/* Double Fail Warning */}
          {data.has_double_fail && (
            <div className="warning-box double-fail" style={{ display: 'block', marginBottom: '1.5rem' }}>
              <FaTimesCircle />
              <div>
                <div className="warning-title">❌ Double Reference Failure</div>
                <div className="warning-detail">
                  This student has a double reference in:{' '}
                  <strong>{data.double_fail_courses?.join(', ')}</strong>.
                  <br />
                  Student fails this module. These courses receive <strong>0 grade points</strong>.
                </div>
              </div>
            </div>
          )}

          {/* Grades Table */}
          {data.current_grades && data.current_grades.length > 0 && (
            <div style={{
              background: cardBg, borderRadius: 'var(--radius-xl)', padding: '1.5rem',
              boxShadow: shadowSm, border: `1px solid ${borderLight}`,
            }}>
              <h3 style={{ color: '#0A2A66', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaTable style={{ color: '#FFC107' }} /> Current Semester Grades
              </h3>
              <div style={{
                background: cardBg, borderRadius: 'var(--radius-xl)', overflow: 'auto',
                border: `1px solid ${borderLight}`, marginBottom: '1rem',
              }}>
                <table>
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Grade Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.current_grades.map((g, i) => (
                      <tr key={i} style={g.has_pending_reference ? { background: 'var(--warning-bg)' } : g.has_double_fail ? { background: 'var(--danger-bg)' } : {}}>
                        <td><strong>{g.course_code}</strong></td>
                        <td>{g.course_name}</td>
                        <td>
                          <div style={{ color: textPri }}>
                            {g.credit_hours}
                            {g.effective_credit_hours !== g.credit_hours && (
                              <> → <strong style={{ color: '#f59e0b' }}>{g.effective_credit_hours}</strong></>
                            )}
                          </div>
                          {g.effective_credit_hours !== g.credit_hours && (
                            <small style={{ color: '#f59e0b', fontSize: '0.7rem', display: 'block' }}>
                              (×2 credit penalty applied)
                            </small>
                          )}
                          {g.has_double_fail && (
                            <small style={{ color: '#ef4444', fontSize: '0.7rem', display: 'block' }}>
                              Must repeat course
                            </small>
                          )}
                        </td>
                        <td style={{ color: textPri }}>{g.score != null ? g.score.toFixed(1) : '-'}</td>
                        <td>{getGradeDisplay(g)}</td>
                        <td style={{ fontWeight: 600, color: g.grade_points === 0 && g.has_double_fail ? '#ef4444' : '#0A2A66' }}>
                          {g.grade_points != null ? g.grade_points.toFixed(1) : '0.0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{
                textAlign: 'right', padding: '1rem', background: cardBgHover,
                borderRadius: '10px', fontWeight: 500, color: textPri,
                border: `1px solid ${border}`,
              }}>
                <strong>Total Credits:</strong>{' '}
                {data.current_grades.reduce((s, g) => s + (g.effective_credit_hours || g.credit_hours), 0)}{' '}
                | <strong>Total Points:</strong>{' '}
                {data.current_grades.reduce((s, g) => s + (g.effective_credit_hours || g.credit_hours) * g.grade_points, 0).toFixed(2)}
              </div>

              {/* Calculate Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  className="btn btn-success"
                  onClick={calculateAndSave}
                  disabled={calculating || data.has_pending_references || data.has_double_fail}
                >
                  {calculating ? (
                    <><FaSpinner className="animate-spin" /> Calculating...</>
                  ) : (
                    <><FaCalculator /> Calculate & Save GPA</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* No grades message */}
          {(!data.current_grades || data.current_grades.length === 0) && (
            <div style={{
              background: cardBg, borderRadius: 'var(--radius-xl)', padding: '3rem',
              boxShadow: shadowSm, border: `1px solid ${borderLight}`,
              textAlign: 'center',
            }}>
              <FaInfoCircle style={{ color: '#f59e0b', fontSize: '3rem', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Grades Found</h3>
              <p style={{ color: textMuted }}>No enrollments found for {data.student_name} in {form.level} - {form.semester} ({form.academic_year}).</p>
            </div>
          )}

          {/* ==================== RESULT DISPLAY ==================== */}
          {result && (
            <div style={{ marginTop: '1.5rem' }}>
              {/* Semester GPA Result */}
              <div className={`result-box ${result.statusClass}`}>
                <div className="label">
                  {result.isSemester2 ? 'Semester 2 GPA' : 'Semester GPA'}
                </div>
                <div className="value">{result.gpa.toFixed(2)}</div>
                <div className="formula">
                  ({result.formulaParts?.join(' + ')}) = {result.totalPoints.toFixed(2)} ÷ {result.totalCredits} = {result.gpa.toFixed(2)}
                </div>
                <span className={`status-badge-lg status-${result.status.toLowerCase()}`}>
                  {result.status === 'PASS' && <FaCheckCircle style={{ marginRight: '4px' }} />}
                  {result.status === 'FAIL' && <FaExclamationTriangle style={{ marginRight: '4px' }} />}
                  {result.status === 'WITHDREW' && <FaTimesCircle style={{ marginRight: '4px' }} />}
                  {result.status}
                </span>
                {result.status === 'PASS' && (
                  <p style={{ color: '#10b981', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    ✅ Student has passed this semester with GPA ≥ 3.0
                  </p>
                )}
                {result.status === 'FAIL' && (
                  <p style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    ⚠️ Student failed. GPA is between 2.7 and 3.0.
                  </p>
                )}
                {result.status === 'WITHDREW' && (
                  <p style={{ color: '#f59e0b', marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                    ❌ Student withdrawn. GPA is below 2.7.
                  </p>
                )}
              </div>

              {/* Final/Cumulative GPA (only for Semester 2) */}
              {result.isSemester2 && (
                <div className="result-box" style={{ marginTop: '1rem', borderLeft: '5px solid #0A2A66' }}>
                  <div className="label">
                    {form.level} Final GPA ({form.academic_year})
                  </div>
                  <div className="value" style={{ color: '#0A2A66' }}>{result.finalGPA.toFixed(2)}</div>
                  <div className="formula">
                    {result.finalFormula}
                  </div>
                  {result.previousSemesterGPA != null && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: textSec }}>
                      Semester 1 GPA: <strong style={{ color: textPri }}>{result.previousSemesterGPA.toFixed(2)}</strong> +{' '}
                      Semester 2 GPA: <strong style={{ color: textPri }}>{result.gpa.toFixed(2)}</strong> ={' '}
                      Final: <strong style={{ color: '#0A2A66' }}>{result.finalGPA.toFixed(2)}</strong>
                    </div>
                  )}
                  {result.finalGPA >= 3.0 ? (
                    <span className="status-badge-lg status-pass" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      <FaCheckCircle style={{ marginRight: '4px' }} /> FINAL PASS
                    </span>
                  ) : result.finalGPA >= 2.7 ? (
                    <span className="status-badge-lg status-fail" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      <FaExclamationTriangle style={{ marginRight: '4px' }} /> FINAL FAIL
                    </span>
                  ) : (
                    <span className="status-badge-lg status-withdrew" style={{ marginTop: '0.5rem', display: 'inline-block' }}>
                      <FaTimesCircle style={{ marginRight: '4px' }} /> FINAL WITHDREW
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </ShakeOnMount>
      )}
    </div>
  );
};

export default GPACalculator;