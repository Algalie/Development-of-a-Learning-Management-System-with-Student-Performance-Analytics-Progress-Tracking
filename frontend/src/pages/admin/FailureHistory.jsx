import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { 
  FaArrowLeft, FaSearch, FaRedoAlt, FaSpinner, FaUserGraduate,
  FaCalculator, FaFileAlt, FaTrash, FaExclamationTriangle,
  FaCheckCircle, FaTimesCircle, FaHistory
} from 'react-icons/fa';

const FailureHistory = () => {
  const [studentId, setStudentId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, studentId: '' });
  const [deleting, setDeleting] = useState(false);

  const searchStudent = async () => {
    if (!studentId.trim()) { toast.error('Please enter a student ID'); return; }
    setLoading(true); setData(null);
    try {
      const res = await adminApi.getFailureHistory(studentId);
      setData(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch records');
      setData(null);
    } finally { setLoading(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await adminApi.deleteStudentData(deleteModal.studentId);
      toast.success(res.data?.message || 'Student data deleted');
      setDeleteModal({ open: false, studentId: '' });
      setData(null); setStudentId('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const getStatusBadge = (status) => {
    if (status === 'FAIL') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626' }}>FAIL</span>;
    if (status === 'WITHDREW') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04' }}>WITHDREW</span>;
    if (status === 'DOUBLE_FAIL') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fdf2f8', color: '#be185d' }}>DOUBLE FAIL</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b' }}>{status || 'Unknown'}</span>;
  };

  const getGPAColor = (status) => {
    if (status === 'FAIL') return '#dc2626';
    if (status === 'WITHDREW') return '#ca8a04';
    if (status === 'DOUBLE_FAIL') return '#be185d';
    return '#0A2A66';
  };

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div className="page-header">
          <Link to="/admin/dashboard" className="back-btn">
            <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
          </Link>
          <div>
            <h1>Failure & Withdrawal History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Search for students with academic failure, withdrawal, or double fail records
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Search Section */}
      <div style={{
        background: 'var(--card-bg)', borderRadius: '14px', padding: '1.5rem',
        marginBottom: '1.5rem', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h2 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaSearch style={{ color: '#dc2626' }} /> Search Student
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Student ID</label>
            <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} placeholder="Enter student ID (e.g., 7626)" onKeyPress={e => e.key === 'Enter' && searchStudent()} />
          </div>
          <button className="btn btn-primary" onClick={searchStudent} disabled={loading} style={{ height: '44px' }}>
            {loading ? <FaSpinner className="animate-spin" /> : <FaSearch />} Search
          </button>
          <button className="btn btn-outline" onClick={() => { setStudentId(''); setData(null); }} style={{ height: '44px' }}>
            <FaRedoAlt /> Reset
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Searching for records...</p>
        </div>
      )}

      {/* Results */}
      {data && (
        <ShakeOnMount>
          {/* Student Info Header */}
          <div style={{
            background: 'var(--card-bg)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <h3 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUserGraduate style={{ color: '#0A2A66' }} /> {data.student_name || 'Unknown'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Student ID: <strong style={{ color: 'var(--text-primary)' }}>{data.student_id}</strong>
                {data.program_type && <> · Program: <strong style={{ color: 'var(--text-primary)' }}>{data.program_type}</strong></>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to={`/admin/gpa-calculator`} className="btn btn-outline btn-sm">
                <FaCalculator style={{ marginRight: '0.3rem' }} /> GPA
              </Link>
              <Link to={`/admin/transcript`} className="btn btn-outline btn-sm">
                <FaFileAlt style={{ marginRight: '0.3rem' }} /> Transcript
              </Link>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteModal({ open: true, studentId: data.student_id })}>
                <FaTrash style={{ marginRight: '0.3rem' }} /> Delete
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'FAIL', value: data.summary?.total_failures || 0, color: '#dc2626', bg: '#fef2f2', icon: <FaTimesCircle /> },
              { label: 'WITHDREW', value: data.summary?.total_withdrew || 0, color: '#ca8a04', bg: '#fefce8', icon: <FaExclamationTriangle /> },
              { label: 'DOUBLE FAIL', value: data.summary?.total_double_fail || 0, color: '#be185d', bg: '#fdf2f8', icon: <FaTimesCircle /> },
              { label: 'TOTAL RECORDS', value: data.total_records || 0, color: '#0A2A66', bg: '#f0f4ff', icon: <FaHistory /> },
            ].map((item, i) => (
              <div key={i} style={{
                background: 'var(--card-bg)', borderRadius: '12px', padding: '1.25rem',
                border: '1px solid var(--border)', textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color, lineHeight: 1, marginBottom: '0.3rem' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Warning Boxes */}
          {(data.summary?.total_double_fail > 0) && (
            <div style={{ background: '#fdf2f8', borderLeft: '4px solid #be185d', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <FaTimesCircle style={{ color: '#be185d', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#831843', marginBottom: '0.25rem' }}>Double Reference Failure</div>
                <p style={{ color: '#831843', fontSize: '0.9rem', margin: 0 }}>This student has <strong>{data.summary.total_double_fail} DOUBLE FAIL</strong> record(s). Courses must be repeated.</p>
              </div>
            </div>
          )}
          {(data.summary?.total_withdrew > 0) && (
            <div style={{ background: '#fefce8', borderLeft: '4px solid #ca8a04', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <FaExclamationTriangle style={{ color: '#ca8a04', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#854d0e', marginBottom: '0.25rem' }}>Academic Withdrawal</div>
                <p style={{ color: '#854d0e', fontSize: '0.9rem', margin: 0 }}>Student has been <strong>WITHDRAWN</strong> in <strong>{data.summary.total_withdrew}</strong> academic period(s).</p>
              </div>
            </div>
          )}
          {(data.summary?.total_failures > 0) && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid #dc2626', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <FaTimesCircle style={{ color: '#dc2626', marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.25rem' }}>Academic Failure</div>
                <p style={{ color: '#991b1b', fontSize: '0.9rem', margin: 0 }}>Student has <strong>{data.summary.total_failures} FAIL</strong> record(s).</p>
              </div>
            </div>
          )}

          {/* Records Table */}
          {data.records && data.records.length > 0 && (
            <div style={{
              background: 'var(--card-bg)', borderRadius: '14px', border: '1px solid var(--border)',
              overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FaHistory style={{ color: '#0A2A66' }} /> Failure & Withdrawal Records
                </h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--card-bg-hover)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>#</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Academic Year</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Level</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Semester</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>GPA</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Pending Refs</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((record, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{i + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0A2A66', fontSize: '0.85rem' }}>{record.academic_year || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{record.level || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.85rem' }}>{record.semester || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', color: getGPAColor(record.status) }}>
                        {record.gpa != null ? record.gpa.toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{getStatusBadge(record.status)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {record.pending_references_count > 0 ? (
                          <span style={{ fontWeight: 600, color: '#ca8a04' }}>{record.pending_references_count}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{record.created_at || 'N/A'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <Link to="/admin/gpa-calculator" style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.4rem 0.8rem', borderRadius: '6px',
                          background: 'var(--card-bg-hover)', color: 'var(--text-primary)',
                          textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500,
                          border: '1px solid var(--border)',
                        }}>
                          <FaCalculator style={{ fontSize: '0.7rem' }} /> GPA
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* No Records */}
          {(!data.records || data.records.length === 0) && (
            <div style={{
              textAlign: 'center', padding: '3rem', background: 'var(--card-bg)',
              borderRadius: '14px', border: '1px solid var(--border)', color: 'var(--text-muted)',
            }}>
              <FaCheckCircle style={{ fontSize: '2.5rem', color: '#16a34a', marginBottom: '1rem' }} />
              <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Failure or Withdrawal Records</h3>
              <p>Student <strong>{data.student_id}</strong> is in good academic standing.</p>
            </div>
          )}
        </ShakeOnMount>
      )}

      {/* Initial Empty State */}
      {!data && !loading && (
        <div style={{
          textAlign: 'center', padding: '4rem', background: 'var(--card-bg)',
          borderRadius: '14px', border: '1px solid var(--border)', color: 'var(--text-muted)',
        }}>
          <FaSearch style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>Search for a Student</h3>
          <p>Enter a student ID above to view their failure and withdrawal history.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModal.open}
        title="Delete Student Data"
        message={`Permanently delete ALL data for student ${deleteModal.studentId}? This action CANNOT be undone.`}
        confirmText={deleting ? 'Deleting...' : 'Delete Permanently'}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, studentId: '' })}
      />
    </div>
  );
};

export default FailureHistory;