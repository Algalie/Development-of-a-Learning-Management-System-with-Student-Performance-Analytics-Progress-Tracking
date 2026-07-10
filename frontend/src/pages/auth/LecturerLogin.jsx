import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { FaChalkboardTeacher, FaUniversity, FaArrowLeft, FaArrowRight, FaLock, FaIdCard } from 'react-icons/fa';
import logo from '../../assets/images/logo.png';

const LecturerLogin = () => {
  const [formData, setFormData] = useState({ lecturer_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { lecturerLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.lecturer_id.trim() || !formData.password.trim()) {
      toast.error('Please enter both Lecturer ID and password');
      return;
    }
    setLoading(true);
    try {
      const response = await lecturerLogin(formData);
      if (response.requires_2fa) {
        sessionStorage.setItem('temp_token', response.temp_token);
        sessionStorage.setItem('auth_type', 'lecturer');
        sessionStorage.setItem('dev_2fa_code', response.dev_2fa_code || '');
        sessionStorage.setItem('dev_email', response.email || '');
        toast.success('Verification code sent to your email');
        navigate('/lecturer/2fa', {
          state: {
            dev_2fa_code: response.dev_2fa_code,
            email: response.email
          }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--surface)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      
      {/* ============ LEFT PANEL ============ */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          flex: '0 0 45%', background: 'linear-gradient(160deg, #0A2A66 0%, #0d3b8c 40%, #0A2A66 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '3rem', position: 'relative', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'rgba(255,193,7,0.04)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -40,
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '420px' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            style={{
              width: '100px', height: '100px', borderRadius: '24px',
              background: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 2rem',
              overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            }}
          >
            <img 
              src={logo} 
              alt="MMTU Logo" 
              style={{ width: '72px', height: '72px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          <FadeIn delay={0.5}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px',
              }}>
                Milton Margai Technical University
              </div>
              <h2 style={{
                color: 'white', fontSize: '1.8rem', fontWeight: 800,
                margin: '0 0 0.3rem', letterSpacing: '-0.5px',
              }}>
                University Academic
              </h2>
              <h3 style={{
                color: '#FFC107', fontSize: '1.2rem', fontWeight: 600,
                margin: 0,
              }}>
                Management Information System
              </h3>
            </div>

            <p style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem',
              lineHeight: 1.6, marginBottom: '2rem',
            }}>
              Enter grades, track student performance, manage courses, 
              and handle academic records through the lecturer portal.
            </p>

            <div style={{
              display: 'flex', gap: '0.6rem', justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem',
                borderRadius: '20px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
              }}>
                <FaChalkboardTeacher style={{ color: '#FFC107', fontSize: '0.7rem' }} />
                Lecturer Access
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem',
                borderRadius: '20px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)',
              }}>
                2FA Secured
              </div>
            </div>
          </FadeIn>

          <Link to="/" style={{
            marginTop: '3rem', color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            gap: '6px', fontSize: '0.8rem', fontWeight: 500,
          }}>
            <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Back to Home
          </Link>
        </div>
      </motion.div>

      {/* ============ RIGHT PANEL ============ */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        style={{
          flex: '0 0 55%', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: '3rem',
          background: 'var(--surface)',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Dark Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <DarkModeToggle />
          </div>

          <FadeIn delay={0.3}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              marginBottom: '2rem', color: '#0A2A66',
            }}>
              <FaUniversity style={{ fontSize: '1.5rem', color: '#FFC107' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0A2A66' }}>
                  MILTON MARGAI TECHNICAL UNIVERSITY
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  Exams Management & GPA Grading Portal
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <h1 style={{
              fontSize: '2.2rem', fontWeight: 800, color: '#0A2A66',
              marginBottom: '0.3rem', letterSpacing: '-0.5px',
            }}>
              Lecturer <span style={{ color: '#FFC107' }}>Login</span>
            </h1>
            <p style={{
              color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem',
            }}>
              Enter your credentials to access your lecturer dashboard.
            </p>
          </FadeIn>

          <ShakeOnMount>
            <div style={{
              background: 'var(--card-bg)', borderRadius: '20px', padding: '2rem',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)',
            }}>
              {/* Lecturer Icon */}
              <div style={{
                width: '65px', height: '65px', borderRadius: '18px',
                background: 'rgba(255,193,7,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1.2rem',
                fontSize: '1.6rem', color: '#FFC107', border: '2px solid rgba(255,193,7,0.2)',
              }}>
                <FaChalkboardTeacher />
              </div>

              <h2 style={{
                color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700,
                marginBottom: '3px', textAlign: 'center',
              }}>
                Lecturer Sign In
              </h2>
              <p style={{
                color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem',
                fontSize: '0.82rem',
              }}>
                Access the lecturer portal
              </p>

              <form onSubmit={handleSubmit} style={{
                display: 'flex', flexDirection: 'column', gap: '1rem',
              }} autoComplete="off">
                
                <div>
                  <label style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)',
                    marginBottom: '0.4rem', display: 'flex', alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <FaIdCard style={{ color: '#FFC107', fontSize: '0.75rem' }} /> Lecturer ID
                  </label>
                  <input 
                    type="text" 
                    value={formData.lecturer_id} 
                    onChange={(e) => setFormData({ ...formData, lecturer_id: e.target.value })} 
                    placeholder="e.g., LEC001" 
                    autoComplete="off" 
                    required 
                    style={{
                      width: '100%', padding: '0.7rem 1rem', borderRadius: '12px',
                      border: '1.5px solid var(--border)', fontSize: '0.88rem',
                      fontFamily: 'Inter, sans-serif', outline: 'none',
                      background: 'var(--input-bg)', color: 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)',
                    marginBottom: '0.4rem', display: 'flex', alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <FaLock style={{ color: '#FFC107', fontSize: '0.75rem' }} /> Password
                  </label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    placeholder="••••••••" 
                    autoComplete="new-password" 
                    required 
                    style={{
                      width: '100%', padding: '0.7rem 1rem', borderRadius: '12px',
                      border: '1.5px solid var(--border)', fontSize: '0.88rem',
                      fontFamily: 'Inter, sans-serif', outline: 'none',
                      background: 'var(--input-bg)', color: 'var(--text-primary)',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '12px',
                    border: 'none', background: '#0A2A66', color: 'white',
                    fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', marginTop: '0.5rem',
                    boxShadow: '0 4px 15px rgba(10,42,102,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <><i className="fas fa-spinner animate-spin"></i> Signing in...</>
                  ) : (
                    <>Sign In <FaArrowRight style={{ fontSize: '0.75rem' }} /></>
                  )}
                </button>
              </form>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: '1.5rem', paddingTop: '1.2rem',
                borderTop: '1px solid var(--border)',
              }}>
                <Link to="/admin/login" style={{
                  color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontWeight: 500,
                }}>
                  <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Admin Login
                </Link>
                <Link to="/" style={{
                  color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontWeight: 500,
                }}>
                  Home <FaArrowRight style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>
          </ShakeOnMount>

          <p style={{
            marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)',
            fontSize: '0.72rem',
          }}>
            © 2025 Milton Margai Technical University. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LecturerLogin;