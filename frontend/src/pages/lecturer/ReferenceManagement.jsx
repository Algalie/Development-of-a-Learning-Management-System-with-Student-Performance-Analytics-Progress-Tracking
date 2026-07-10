import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import { FaArrowLeft, FaPlusCircle, FaPaperPlane, FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const ReferenceManagement = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [references, setReferences] = useState([]);
  const [needingRefs, setNeedingRefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    try {
      const res = await lecturerApi.getReferenceManagement(id);
      setCourse(res.data.course || res.data);
      setReferences(res.data.references || []);
      setNeedingRefs(res.data.students_needing_references || []);
    } catch (error) { toast.error('Failed to load references'); }
    finally { setLoading(false); }
  };

  const handleCreateMissing = async () => {
    try { await lecturerApi.createMissingReferences(id); toast.success('References created!'); fetchData(); }
    catch (error) { toast.error('Failed to create references'); }
  };

  const handleUpdateGrade = async (refId, score) => {
    if (!score || score < 0 || score > 100) { toast.error('Enter a valid score (0-100)'); return; }
    try { await lecturerApi.updateReferenceGrade(refId, { new_score: parseFloat(score) }); toast.success('Reference grade updated!'); fetchData(); }
    catch (error) { toast.error(error.response?.data?.message || 'Failed to update'); }
  };

  const handleSubmit = async (refId) => {
    try { 
      await lecturerApi.submitForApproval('reference', refId); 
      toast.success('Reference submitted!'); 
      fetchData(); 
    }
    catch (error) { 
      toast.error(error.response?.data?.message || 'Failed to submit'); 
    }
  };

  const getGradeStyle = (grade) => {
    const colors = { A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#ea580c', E: '#7c3aed', F: '#dc2626' };
    const bgs = { A: '#f0fdf4', B: '#eff6ff', C: '#fefce8', D: '#fff7ed', E: '#f5f3ff', F: '#fef2f2' };
    return { color: colors[grade] || '#475569', bg: bgs[grade] || '#f1f5f9' };
  };

  const getStatusBadge = (approvalStatus, refGrade) => {
    if (approvalStatus === 'finalized') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheckCircle /> Finalized</span>;
    if (approvalStatus && approvalStatus.startsWith('pending_')) return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fefce8', color: '#ca8a04', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock /> Pending</span>;
    if (approvalStatus === 'rejected') return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#fef2f2', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTimesCircle /> Rejected</span>;
    if (refGrade) return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaCheck /> Ready</span>;
    return <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, background: '#f1f5f9', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>Enter Grade</span>;
  };

  const stats = {
    pending: references.filter(r => !r.reference_grade).length,
    ready: references.filter(r => r.reference_grade && ['draft', 'rejected', null].includes(r.approval_status)).length,
    finalized: references.filter(r => r.approval_status === 'finalized').length,
  };

  if (loading) return <div className="dashboard-container"><div style={{ textAlign: 'center', padding: '5rem' }}><FaSpinner className="loading-spinner" /><p>Loading...</p></div></div>;

  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to={`/lecturer/course/${id}`} className="back-btn"><FaArrowLeft style={{ marginRight: '0.3rem' }} /> Back to Course</Link>
          <h1>Reference Management</h1>
        </div>
      </FadeIn>

      <div style={{ background: cardBg, borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem', border: `1px solid ${border}` }}>
        <h2 style={{ fontSize: '1.2rem', color: '#0A2A66', fontWeight: 600 }}>{course?.course_code}: {course?.course_name}</h2>
        <p style={{ color: textSec, fontSize: '0.85rem' }}>{course?.semester} | {course?.academic_year}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
        {[{ label: 'Pending Entry', value: stats.pending, color: '#ca8a04', bg: '#fefce8' },{ label: 'Ready to Submit', value: stats.ready, color: '#16a34a', bg: '#f0fdf4' },{ label: 'Finalized', value: stats.finalized, color: '#0A2A66', bg: '#f0f4ff' }].map((s, i) => (
          <div key={i} style={{ background: cardBg, borderRadius: '10px', padding: '1.25rem', border: `1px solid ${border}`, textAlign: 'center', boxShadow: shadowSm }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: textSec, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {needingRefs.length > 0 && (
        <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ color: '#854d0e', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FaExclamationTriangle /> Missing Reference Records</h4>
            <p style={{ color: '#854d0e', fontSize: '0.85rem', margin: 0 }}>{needingRefs.length} student(s) need references.</p>
          </div>
          <button onClick={handleCreateMissing} className="btn btn-warning btn-sm"><FaPlusCircle style={{ marginRight: '0.3rem' }} /> Create Missing ({needingRefs.length})</button>
        </div>
      )}

      <ShakeOnMount>
        <div style={{ background: cardBg, borderRadius: '14px', border: `1px solid ${border}`, overflow: 'hidden', boxShadow: shadowSm }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${border}` }}>
            <h3 style={{ color: '#0A2A66', fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>Reference Records</h3>
          </div>
          {references.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: textMuted }}><FaCheckCircle style={{ fontSize: '2rem', color: textMuted, marginBottom: '0.5rem' }} /><p>No reference records yet.</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: cardBgHover, borderBottom: `2px solid ${border}` }}>
                  <th style={th}>Student</th><th style={th}>Original</th><th style={th}>New Grade</th><th style={th}>Display</th><th style={th}>Status</th><th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {references.map(ref => {
                  const orig = getGradeStyle(ref.original_grade);
                  const newG = ref.reference_grade ? getGradeStyle(ref.reference_grade) : null;
                  return (
                    <tr key={ref.id} style={{ borderBottom: `1px solid ${border}` }}>
                      <td style={{ padding: '10px 14px' }}><strong style={{ color: '#0A2A66' }}>{ref.student?.student_id || ref.student_id_num || 'N/A'}</strong><br /><span style={{ fontSize: '0.8rem', color: textSec }}>{ref.student?.student_name || ref.student_name || ''}</span></td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', background: orig.bg, color: orig.color }}>{ref.original_grade}</span>
                        <span style={{ fontSize: '0.75rem', color: textMuted, marginLeft: '0.3rem' }}>{ref.original_score?.toFixed(1)}%</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {ref.reference_grade ? (
                          <span style={{ padding: '3px 10px', borderRadius: '6px', fontWeight: 600, fontSize: '0.8rem', background: newG.bg, color: newG.color }}>{ref.reference_grade}</span>
                        ) : (
                          <form onSubmit={e => { e.preventDefault(); handleUpdateGrade(ref.id, e.target.querySelector('input').value); }} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="number" className="score-input" placeholder="Score" min="0" max="100" step="0.5" required style={{ width: '80px' }} />
                            <button type="submit" className="btn btn-primary btn-sm">Save</button>
                          </form>
                        )}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        {ref.display_grade ? (
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            <span style={{ color: '#16a34a' }}>{ref.display_grade.split('/')[0]}</span>
                            <span style={{ color: textMuted }}> / </span>
                            <span style={{ color: '#dc2626' }}>{ref.display_grade.split('/')[1]}</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>{getStatusBadge(ref.approval_status, ref.reference_grade)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {ref.reference_grade && ['draft', 'rejected', null].includes(ref.approval_status) && !ref.submitted_for_approval && (
                          <button onClick={() => handleSubmit(ref.id)} className="btn btn-success btn-sm"><FaPaperPlane style={{ marginRight: '0.3rem' }} /> Submit</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ShakeOnMount>
    </div>
  );
};

const th = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' };

export default ReferenceManagement;