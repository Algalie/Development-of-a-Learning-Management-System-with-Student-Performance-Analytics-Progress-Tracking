import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { lecturerApi } from '../../api/lecturerApi';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';

const AssessmentNotifications = () => {
  const [data, setData] = useState({ rejected_ca: [], rejected_exam: [] });
  const [activeTab, setActiveTab] = useState('ca');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await lecturerApi.getAssessmentNotifications();
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-container" style={{ maxWidth: '1000px' }}><div className="loading-container"><i className="fas fa-spinner loading-spinner"></i><p>Loading...</p></div></div>;
  }

  const totalRejected = (data.rejected_ca?.length || 0) + (data.rejected_exam?.length || 0);

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
      <FadeIn>
        <div className="page-header">
          <Link to="/lecturer/dashboard" className="back-btn"><i className="fas fa-arrow-left"></i> Dashboard</Link>
          <h1>
            <i className="fas fa-bell" style={{ color: 'var(--gold)' }}></i> Assessment Notifications
          </h1>
          {totalRejected > 0 && (
            <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.3rem 0.9rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600, border: '1px solid var(--danger-border)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <i className="fas fa-exclamation-triangle"></i> {totalRejected} Rejected
            </span>
          )}
        </div>
      </FadeIn>

      <div className="tabs">
        <span className={`tab ${activeTab === 'ca' ? 'active' : ''}`} onClick={() => setActiveTab('ca')}>
          <i className="fas fa-calculator"></i> Rejected CA
          <span className="count">{data.rejected_ca?.length || 0}</span>
        </span>
        <span className={`tab ${activeTab === 'exam' ? 'active' : ''}`} onClick={() => setActiveTab('exam')}>
          <i className="fas fa-file-alt"></i> Rejected Exam
          <span className="count">{data.rejected_exam?.length || 0}</span>
        </span>
      </div>

      <ShakeOnMount>
        {/* Rejected CA */}
        {activeTab === 'ca' && (
          <div className="notification-list">
            {(data.rejected_ca || []).length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                  <h3>No Rejected CA</h3>
                  <p>All your continuous assessments have been approved.</p>
                </div>
              </div>
            ) : (
              (data.rejected_ca || []).map(rejection => (
                <motion.div key={rejection.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="notification-card" style={{ borderLeftColor: '#7c3aed', background: 'white', borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', borderLeft: '5px solid #7c3aed', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="type-badge type-ca" style={{ padding: '0.3rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700 }}><i className="fas fa-calculator"></i> Continuous Assessment</span>
                    <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i className="fas fa-times-circle"></i> Rejected</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-book" style={{ color: 'var(--gold)' }}></i>
                      {rejection.course?.course_code}: {rejection.course?.course_name}
                    </div>

                    <div className="rejection-details">
                      <div className="rejection-reason">
                        <i className="fas fa-comment-dots"></i>
                        <span>{rejection.rejection_reason}</span>
                      </div>
                      <div className="rejected-by">
                        <span><i className="fas fa-user"></i> Rejected by: <strong>{rejection.approved_by?.full_name || 'Unknown'}</strong></span>
                        <span className="separator" style={{ color: '#cbd5e1' }}>|</span>
                        <span><i className="fas fa-clock"></i> {rejection.approved_at ? new Date(rejection.approved_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Link to={`/lecturer/course/${rejection.course?.id}`} className="btn btn-primary"><i className="fas fa-eye"></i> View Course</Link>
                    <Link to={`/lecturer/course/${rejection.course?.id}/enter-ca`} className="btn btn-outline"><i className="fas fa-edit"></i> Edit CA</Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Rejected Exam */}
        {activeTab === 'exam' && (
          <div className="notification-list">
            {(data.rejected_exam || []).length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                  <h3>No Rejected Exams</h3>
                  <p>All your exam grades have been approved.</p>
                </div>
              </div>
            ) : (
              (data.rejected_exam || []).map(rejection => (
                <motion.div key={rejection.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="notification-card" style={{ borderLeftColor: '#10b981', background: 'white', borderRadius: '18px', padding: '1.5rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-light)', borderLeft: '5px solid #10b981', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span className="type-badge type-exam" style={{ padding: '0.3rem 1rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700 }}><i className="fas fa-file-alt"></i> Exam Grades</span>
                    <span className="badge badge-rejected" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><i className="fas fa-times-circle"></i> Rejected</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fas fa-book" style={{ color: 'var(--gold)' }}></i>
                      {rejection.course?.course_code}: {rejection.course?.course_name}
                    </div>

                    <div className="rejection-details">
                      <div className="rejection-reason">
                        <i className="fas fa-comment-dots"></i>
                        <span>{rejection.rejection_reason}</span>
                      </div>
                      <div className="rejected-by">
                        <span><i className="fas fa-user"></i> Rejected by: <strong>{rejection.approved_by?.full_name || 'Unknown'}</strong></span>
                        <span className="separator" style={{ color: '#cbd5e1' }}>|</span>
                        <span><i className="fas fa-clock"></i> {rejection.approved_at ? new Date(rejection.approved_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="action-buttons" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Link to={`/lecturer/course/${rejection.course?.id}`} className="btn btn-primary"><i className="fas fa-eye"></i> View Course</Link>
                    <Link to={`/lecturer/course/${rejection.course?.id}/enter-exam`} className="btn btn-outline"><i className="fas fa-edit"></i> Edit Exam Grades</Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </ShakeOnMount>
    </div>
  );
};

export default AssessmentNotifications;