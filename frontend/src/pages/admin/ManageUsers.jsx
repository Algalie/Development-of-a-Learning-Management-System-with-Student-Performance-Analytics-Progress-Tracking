import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import FadeIn from '../../components/animations/FadeIn';
import { 
  FaArrowLeft, FaUserShield, FaChalkboardTeacher, FaUserTie, FaCrown, FaFileAlt,
  FaUsers, FaPlus, FaEdit, FaTrash, FaEnvelope, FaPhone, FaGraduationCap,
  FaBuilding, FaCalendar, FaSpinner, FaUniversity
} from 'react-icons/fa';

const ManageUsers = () => {
  const [admins, setAdmins] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [activeTab, setActiveTab] = useState('admins');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, lecturersRes] = await Promise.all([
        adminApi.getAdmins(),
        adminApi.getLecturers(),
      ]);
      setAdmins(adminsRes.data.admins || adminsRes.data || []);
      setLecturers(lecturersRes.data.lecturers || lecturersRes.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally { setLoading(false); }
  };

  const handleDeleteLecturer = async (id, name) => {
    if (!window.confirm(`Delete lecturer ${name}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteLecturer(id);
      toast.success('Lecturer deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <FaSpinner className="loading-spinner" />
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading users...</p>
        </div>
      </div>
    );
  }

  const hods = lecturers.filter(l => l.role === 'head_of_department');
  const deans = lecturers.filter(l => l.role === 'dean');
  const examOfficers = lecturers.filter(l => l.role === 'exam_officer');

  const getRoleConfig = (role) => {
    const configs = {
      admin: { label: 'Admin', color: '#0A2A66', bg: '#f0f4ff' },
      super_admin: { label: 'Super Admin', color: '#ca8a04', bg: '#fefce8' },
      lecturer: { label: 'Lecturer', color: '#16a34a', bg: '#f0fdf4' },
      head_of_department: { label: 'HOD', color: '#7c3aed', bg: '#f5f3ff' },
      dean: { label: 'Dean', color: '#ca8a04', bg: '#fefce8' },
      exam_officer: { label: 'Exam Officer', color: '#dc2626', bg: '#fef2f2' },
    };
    return configs[role] || configs.lecturer;
  };

  const getInitials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const tabs = [
    { key: 'admins', label: 'Administrators', icon: <FaUserShield />, count: admins.length },
    { key: 'all-lecturers', label: 'All Lecturers', icon: <FaChalkboardTeacher />, count: lecturers.length },
    { key: 'approvers', label: 'Approvers', icon: <FaUserTie />, count: hods.length + deans.length + examOfficers.length },
  ];

  // Shared styles
  const cardBg = 'var(--card-bg)';
  const border = 'var(--border)';
  const shadowSm = 'var(--shadow-sm)';
  const textSec = 'var(--text-secondary)';
  const textMuted = 'var(--text-muted)';
  const textPri = 'var(--text-primary)';
  const cardBgHover = 'var(--card-bg-hover)';

  return (
    <div className="dashboard-container">
      <FadeIn>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Link to="/admin/dashboard" className="back-btn">
                <FaArrowLeft style={{ marginRight: '0.3rem' }} /> Dashboard
              </Link>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#0A2A66' }}>User & Faculty Management</h1>
            <p style={{ color: textSec, fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Manage administrators, lecturers, faculties and departments
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/admin/faculty-management" className="btn btn-outline btn-sm">
              <FaUniversity style={{ marginRight: '0.3rem' }} /> Faculties
            </Link>
            <Link to="/admin/add-lecturer" className="btn btn-success btn-sm">
              <FaPlus style={{ marginRight: '0.3rem' }} /> Add Lecturer
            </Link>
            <Link to="/admin/add-admin" className="btn btn-primary btn-sm">
              <FaPlus style={{ marginRight: '0.3rem' }} /> Add Admin
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { icon: <FaUserShield />, value: admins.length, label: 'Admins', bg: '#f0f4ff', color: '#0A2A66' },
          { icon: <FaChalkboardTeacher />, value: lecturers.length, label: 'Lecturers', bg: '#f0fdf4', color: '#16a34a' },
          { icon: <FaUserTie />, value: hods.length, label: 'HODs', bg: '#f5f3ff', color: '#7c3aed' },
          { icon: <FaCrown />, value: deans.length, label: 'Deans', bg: '#fefce8', color: '#ca8a04' },
          { icon: <FaFileAlt />, value: examOfficers.length, label: 'Exam Officers', bg: '#fef2f2', color: '#dc2626' },
        ].map((item, i) => (
          <div key={i} style={{
            background: cardBg, borderRadius: '10px', padding: '0.75rem 1.25rem',
            border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '0.75rem',
            boxShadow: shadowSm,
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0A2A66', lineHeight: 1 }}>{item.value}</div>
              <div style={{ fontSize: '0.7rem', color: textSec, fontWeight: 500, textTransform: 'uppercase' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: `2px solid ${border}`, paddingBottom: '0.75rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.6rem 1.2rem', borderRadius: '8px',
              background: activeTab === tab.key ? '#0A2A66' : 'transparent',
              color: activeTab === tab.key ? 'white' : textPri,
              border: activeTab === tab.key ? 'none' : `1px solid ${border}`,
              cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
            <span style={{
              background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : cardBgHover,
              padding: '0.1rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
              color: activeTab === tab.key ? 'white' : textSec,
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <ShakeOnMount>
        {/* ADMINISTRATORS TAB */}
        {activeTab === 'admins' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
            {admins.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
                <FaUserShield style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
                <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Administrators</h3>
                <p style={{ marginBottom: '1rem' }}>Add an administrator to get started.</p>
                <Link to="/admin/add-admin" className="btn btn-primary btn-sm"><FaPlus style={{ marginRight: '0.3rem' }} /> Add Admin</Link>
              </div>
            ) : (
              admins.map(admin => {
                const roleCfg = getRoleConfig(admin.role);
                return (
                  <motion.div key={admin.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: shadowSm, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: roleCfg.bg, color: roleCfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getInitials(admin.full_name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.15rem' }}>
                            {admin.full_name}
                            {admin.role === 'super_admin' && (
                              <span style={{ fontSize: '0.65rem', background: roleCfg.bg, color: roleCfg.color, padding: '2px 8px', borderRadius: '4px', marginLeft: '0.5rem', fontWeight: 600 }}>SUPER</span>
                            )}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: textSec }}>@{admin.username}</div>
                        </div>
                      </div>
                      <div style={{ borderTop: `1px solid ${border}`, paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem', color: textPri }}>
                          <FaEnvelope style={{ color: textMuted, fontSize: '0.75rem' }} /> {admin.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: textMuted }}>
                          <FaCalendar style={{ fontSize: '0.7rem' }} /> Joined {admin.created_at ? new Date(admin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: cardBgHover, borderTop: `1px solid ${border}`, padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: roleCfg.color, background: roleCfg.bg, padding: '3px 10px', borderRadius: '6px' }}>{roleCfg.label}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* ALL LECTURERS TAB */}
        {activeTab === 'all-lecturers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1rem' }}>
            {lecturers.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, color: textMuted }}>
                <FaChalkboardTeacher style={{ fontSize: '2.5rem', color: textMuted, marginBottom: '1rem' }} />
                <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem' }}>No Lecturers</h3>
                <p style={{ marginBottom: '1rem' }}>Add lecturers and create faculties to get started.</p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <Link to="/admin/faculty-management" className="btn btn-outline btn-sm"><FaUniversity style={{ marginRight: '0.3rem' }} /> Create Faculties</Link>
                  <Link to="/admin/add-lecturer" className="btn btn-success btn-sm"><FaPlus style={{ marginRight: '0.3rem' }} /> Add Lecturer</Link>
                </div>
              </div>
            ) : (
              lecturers.map(lecturer => {
                const roleCfg = getRoleConfig(lecturer.role);
                return (
                  <motion.div key={lecturer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${border}`, boxShadow: shadowSm, overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: roleCfg.bg, color: roleCfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {getInitials(lecturer.full_name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0A2A66', marginBottom: '0.15rem' }}>{lecturer.full_name}</h3>
                          <div style={{ fontSize: '0.8rem', color: textSec }}>{lecturer.lecturer_id}</div>
                        </div>
                      </div>
                      <div style={{ borderTop: `1px solid ${border}`, paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem', color: textPri }}>
                          <FaEnvelope style={{ color: textMuted, fontSize: '0.75rem' }} /> {lecturer.email}
                        </div>
                        {lecturer.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem', color: textPri }}>
                            <FaPhone style={{ color: textMuted, fontSize: '0.75rem' }} /> {lecturer.phone}
                          </div>
                        )}
                        {lecturer.qualification && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.85rem', color: textPri }}>
                            <FaGraduationCap style={{ color: textMuted, fontSize: '0.75rem' }} /> {lecturer.qualification}
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: textPri }}>
                          <FaBuilding style={{ color: textMuted, fontSize: '0.75rem' }} />
                          {lecturer.display_department || lecturer.department?.name || lecturer.faculty?.name || 'Not assigned'}
                        </div>
                      </div>
                    </div>
                    <div style={{ background: cardBgHover, borderTop: `1px solid ${border}`, padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: roleCfg.color, background: roleCfg.bg, padding: '3px 10px', borderRadius: '6px' }}>{roleCfg.label}</span>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <Link to={`/admin/edit-lecturer/${lecturer.id}`} style={{ width: '32px', height: '32px', borderRadius: '8px', background: cardBgHover, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: textPri, textDecoration: 'none', fontSize: '0.8rem' }}>
                          <FaEdit />
                        </Link>
                        <button onClick={() => handleDeleteLecturer(lecturer.id, lecturer.full_name)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* APPROVERS TAB */}
        {activeTab === 'approvers' && (
          <>
            {/* HODs */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUserTie style={{ color: '#7c3aed' }} /> Heads of Department ({hods.length})
              </h3>
              {hods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: cardBg, borderRadius: '10px', border: `1px solid ${border}`, color: textMuted }}>
                  <p>No HODs assigned. Create a lecturer with the "Head of Department" role.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '0.75rem' }}>
                  {hods.map(hod => (
                    <div key={hod.id} style={{ background: cardBg, borderRadius: '10px', padding: '1.25rem', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {getInitials(hod.full_name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>{hod.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: textSec }}>{hod.email}</div>
                        <div style={{ fontSize: '0.75rem', color: textMuted }}>
                          {hod.department?.name || <span style={{ color: '#dc2626' }}>No department assigned</span>}
                        </div>
                      </div>
                      <Link to={`/admin/edit-lecturer/${hod.id}`} style={{ color: textPri, textDecoration: 'none', fontSize: '0.85rem' }}><FaEdit /></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deans */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCrown style={{ color: '#ca8a04' }} /> Deans ({deans.length})
              </h3>
              {deans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: cardBg, borderRadius: '10px', border: `1px solid ${border}`, color: textMuted }}>
                  <p>No Deans assigned. Create a lecturer with the "Dean" role.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '0.75rem' }}>
                  {deans.map(dean => (
                    <div key={dean.id} style={{ background: cardBg, borderRadius: '10px', padding: '1.25rem', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fefce8', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {getInitials(dean.full_name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>{dean.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: textSec }}>{dean.email}</div>
                        <div style={{ fontSize: '0.75rem', color: textMuted }}>
                          {dean.faculty?.name || <span style={{ color: '#dc2626' }}>No faculty assigned</span>}
                        </div>
                      </div>
                      <Link to={`/admin/edit-lecturer/${dean.id}`} style={{ color: textPri, textDecoration: 'none', fontSize: '0.85rem' }}><FaEdit /></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exam Officers */}
            <div>
              <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaFileAlt style={{ color: '#dc2626' }} /> Exam Officers ({examOfficers.length})
              </h3>
              {examOfficers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: cardBg, borderRadius: '10px', border: `1px solid ${border}`, color: textMuted }}>
                  <p>No Exam Officers assigned.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '0.75rem' }}>
                  {examOfficers.map(eo => (
                    <div key={eo.id} style={{ background: cardBg, borderRadius: '10px', padding: '1.25rem', border: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                        {getInitials(eo.full_name)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#0A2A66', fontSize: '0.9rem' }}>{eo.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: textSec }}>{eo.email}</div>
                        <div style={{ fontSize: '0.75rem', color: textMuted }}>Global Role</div>
                      </div>
                      <Link to={`/admin/edit-lecturer/${eo.id}`} style={{ color: textPri, textDecoration: 'none', fontSize: '0.85rem' }}><FaEdit /></Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </ShakeOnMount>
    </div>
  );
};

export default ManageUsers;