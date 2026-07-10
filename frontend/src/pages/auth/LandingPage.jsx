import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUserShield, FaChalkboardTeacher, FaGraduationCap, FaChartLine,
  FaBookOpen, FaClipboardCheck, FaCalculator, FaShieldAlt,
  FaArrowRight, FaBolt, FaUsers, FaServer, FaMobileAlt, FaRocket
} from 'react-icons/fa';
import FadeIn from '../../components/animations/FadeIn';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import logo from '../../assets/images/logo.png';

const LandingPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--surface)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: 'var(--text-primary)',
    }}>
      
      {/* ==================== NAVIGATION ==================== */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 3rem', background: 'var(--card-bg)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            overflow: 'hidden', border: '2px solid #FFC107',
            boxShadow: '0 2px 10px rgba(255,193,7,0.2)',
          }}>
            <img 
              src={logo} 
              alt="MMTU" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, color: '#0A2A66', fontSize: '1.1rem', lineHeight: 1.2 }}>
              MMTU
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Learning Management System
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DarkModeToggle />
          <Link to="/admin/login" style={{
            padding: '0.5rem 1.3rem', borderRadius: '25px',
            background: 'transparent', color: '#0A2A66',
            fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
            border: '2px solid #0A2A66', transition: 'all 0.3s',
          }}>
            Admin
          </Link>
          <Link to="/lecturer/login" style={{
            padding: '0.5rem 1.3rem', borderRadius: '25px',
            background: '#0A2A66', color: 'white',
            fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
            transition: 'all 0.3s',
          }}>
            Lecturer
          </Link>
        </div>
      </motion.nav>

      {/* ==================== HERO SECTION ==================== */}
      <div style={{
        maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem 3rem',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem',
        alignItems: 'center',
      }}>
        {/* Left Content */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(255,193,7,0.1)', padding: '0.4rem 1rem',
            borderRadius: '25px', marginBottom: '1.5rem',
            border: '1px solid rgba(255,193,7,0.3)',
          }}>
            <FaRocket style={{ color: '#FFC107', fontSize: '0.8rem' }} />
            <span style={{ fontSize: '0.75rem', color: '#92400e', fontWeight: 600 }}>
              Final Year Project • 2026
            </span>
          </div>

          <h1 style={{
            fontSize: '2.8rem', fontWeight: 900, color: '#0A2A66',
            lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.5px',
          }}>
            Development of a Learning Management System
          </h1>
          
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.8rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{ width: '50px', height: '3px', background: '#FFC107', borderRadius: '2px' }} />
            <span style={{
              fontSize: '1.1rem', fontWeight: 600, color: '#FFC107',
            }}>
              with Student Performance Analytics & Progress Tracking
            </span>
          </div>

          <p style={{
            color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.8,
            marginBottom: '2rem', maxWidth: '500px',
          }}>
            A comprehensive digital platform for managing student grades, 
            calculating GPA, tracking academic progress, and streamlining 
            the entire examination workflow with real-time analytics.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Link to="/admin/login" style={{
              background: 'linear-gradient(135deg, #0A2A66, #0d3b8c)',
              color: 'white', padding: '0.85rem 1.8rem', borderRadius: '12px',
              fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 15px rgba(10,42,102,0.3)',
              transition: 'all 0.3s',
            }}>
              <FaUserShield /> Admin Portal <FaArrowRight style={{ fontSize: '0.7rem' }} />
            </Link>
            <Link to="/lecturer/login" style={{
              background: 'white', color: '#0A2A66',
              padding: '0.85rem 1.8rem', borderRadius: '12px',
              fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              border: '2px solid #FFC107',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s',
            }}>
              <FaChalkboardTeacher /> Lecturer Portal
            </Link>
          </div>
        </motion.div>

        {/* Right Visual */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.4 }}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Background decorative elements */}
          <div style={{
            position: 'absolute', width: '320px', height: '320px',
            borderRadius: '50%', background: 'rgba(10,42,102,0.03)',
            top: '-30px', right: '0', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', width: '180px', height: '180px',
            borderRadius: '50%', background: 'rgba(255,193,7,0.05)',
            bottom: '-20px', left: '20px', zIndex: 0,
          }} />

          {/* Info Cards Stack */}
          <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '400px' }}>
            
            {/* Main Feature Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{
                background: 'linear-gradient(135deg, #0A2A66, #0d3b8c)',
                borderRadius: '20px', padding: '1.5rem', marginBottom: '1rem',
                color: 'white', boxShadow: '0 15px 40px rgba(10,42,102,0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '55px', height: '55px', borderRadius: '16px',
                  background: 'rgba(255,193,7,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                }}>
                  <FaChartLine style={{ color: '#FFC107' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>Performance Analytics</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '2px' }}>
                    Real-time student tracking
                  </div>
                </div>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem',
              }}>
                {[
                  { value: 'GPA', label: 'Calculation' },
                  { value: 'TRN', label: 'Transcripts' },
                  { value: 'REF', label: 'References' },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '12px', padding: '0.8rem', textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <div style={{ fontWeight: 800, color: '#FFC107', fontSize: '0.9rem' }}>
                      {item.value}
                    </div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '2px' }}>
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Small Feature Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              {[
                { icon: <FaBookOpen />, title: 'Course Mgmt', color: '#3b82f6', bg: '#eff6ff' },
                { icon: <FaClipboardCheck />, title: 'Grade Processing', color: '#10b981', bg: '#ecfdf5' },
                { icon: <FaUsers />, title: 'Auto Enrollment', color: '#7c3aed', bg: '#f5f3ff' },
                { icon: <FaShieldAlt />, title: '2FA Security', color: '#f59e0b', bg: '#fffbeb' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  style={{
                    background: 'var(--card-bg)',
                    borderRadius: '14px', padding: '1rem',
                    border: '1px solid var(--border)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', gap: '0.7rem',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: item.bg, color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0A2A66' }}>
                    {item.title}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ==================== FEATURES SECTION ==================== */}
      <div style={{ 
        maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem',
        borderTop: '1px solid var(--border)',
      }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ 
              color: '#0A2A66', fontSize: '2rem', fontWeight: 800, 
              marginBottom: '0.5rem', letterSpacing: '-0.3px',
            }}>
              Key Features
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Everything you need for academic record management and student performance tracking
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.2rem',
        }}>
          {[
            { 
              icon: <FaBookOpen />, 
              title: 'Course Management', 
              desc: 'Create and manage courses with automated student enrollment based on academic progression.',
              color: '#3b82f6', bg: '#eff6ff',
            },
            { 
              icon: <FaClipboardCheck />, 
              title: 'Grade Processing', 
              desc: 'Automated grade calculation with multi-level approval workflow (HOD → Dean → Exam Office).',
              color: '#10b981', bg: '#ecfdf5',
            },
            { 
              icon: <FaCalculator />, 
              title: 'GPA System', 
              desc: 'Real-time GPA computation with reference grade tracking and credit hour penalties.',
              color: '#7c3aed', bg: '#f5f3ff',
            },
            { 
              icon: <FaChartLine />, 
              title: 'Performance Analytics', 
              desc: 'Comprehensive student performance tracking with failure history and progress monitoring.',
              color: '#f59e0b', bg: '#fffbeb',
            },
            { 
              icon: <FaServer />, 
              title: 'Transcript Generation', 
              desc: 'Official transcript generation with unique verification IDs and barcode authentication.',
              color: '#ef4444', bg: '#fef2f2',
            },
            { 
              icon: <FaMobileAlt />, 
              title: 'Mobile Verification', 
              desc: 'Students can verify transcript authenticity instantly using the mobile app barcode scanner.',
              color: '#6366f1', bg: '#eef2ff',
            },
          ].map((feature, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.05}>
              <motion.div 
                whileHover={{ y: -4 }}
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '16px', padding: '1.8rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'all 0.3s',
                  cursor: 'default',
                }}
              >
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: feature.bg, color: feature.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', marginBottom: '1.2rem',
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  color: '#0A2A66', fontSize: '1.05rem', fontWeight: 700, 
                  marginBottom: '0.5rem',
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: 'var(--text-secondary)', fontSize: '0.85rem', 
                  lineHeight: 1.6, margin: 0,
                }}>
                  {feature.desc}
                </p>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ==================== PORTAL ACCESS ==================== */}
      <div style={{ 
        maxWidth: '1000px', margin: '0 auto', padding: '2rem 2rem 4rem',
      }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ 
              color: '#0A2A66', fontSize: '2rem', fontWeight: 800, 
              marginBottom: '0.5rem',
            }}>
              Access Your Portal
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
              Choose your role to get started
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            {
              icon: <FaUserShield />,
              title: 'Administrator',
              desc: 'Full system control',
              color: '#0A2A66',
              bg: '#f0f4ff',
              features: [
                'User Management',
                'Faculty & Dept Setup',
                'GPA Calculation',
                'Transcript Generation',
                'Approval Oversight',
                'System Analytics',
              ],
              link: '/admin/login',
              linkText: 'Access Admin Portal',
            },
            {
              icon: <FaChalkboardTeacher />,
              title: 'Lecturer',
              desc: 'Course & grade management',
              color: '#FFC107',
              bg: '#FFF8E1',
              features: [
                'Course Creation',
                'Student Enrollment',
                'CA Grade Entry',
                'Exam Grade Entry',
                'Reference Grades',
                'Approval Tracking',
              ],
              link: '/lecturer/login',
              linkText: 'Access Lecturer Portal',
            },
          ].map((portal, i) => (
            <FadeIn key={i} delay={0.1 + i * 0.1}>
              <motion.div 
                whileHover={{ y: -4 }}
                style={{
                  background: 'var(--card-bg)',
                  borderRadius: '20px', padding: '2rem',
                  border: '1px solid var(--border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '16px',
                    background: portal.bg, color: portal.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', border: `2px solid ${portal.color === '#FFC107' ? '#FFC107' : portal.color}`,
                  }}>
                    {portal.icon}
                  </div>
                  <div>
                    <h3 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                      {portal.title}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                      {portal.desc}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                  marginBottom: '1.5rem', flex: 1,
                }}>
                  {portal.features.map((feat, j) => (
                    <div key={j} style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.78rem', color: 'var(--text-secondary)',
                    }}>
                      <span style={{ color: '#10b981', fontSize: '0.5rem' }}>●</span>
                      {feat}
                    </div>
                  ))}
                </div>

                <Link to={portal.link} style={{
                  background: 'linear-gradient(135deg, #0A2A66, #0d3b8c)',
                  color: 'white', padding: '0.75rem', borderRadius: '12px',
                  fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
                  textAlign: 'center', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(10,42,102,0.2)',
                  transition: 'all 0.3s',
                }}>
                  {portal.icon} {portal.linkText}
                </Link>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>

      {/* ==================== FOOTER ==================== */}
      <div style={{ 
        background: '#0a0f1a', padding: '3rem 2rem', color: 'white',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
            }}>
              🎓
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                Development of a Learning Management System
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '2px' }}>
                with Student Performance Analytics & Progress Tracking
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', color: '#64748b', fontSize: '0.8rem' }}>
            <span>🏛️ Milton Margai Technical University</span>
            <span>📊 Performance Analytics</span>
            <span>📈 Progress Tracking</span>
          </div>
        </div>
        <div style={{
          maxWidth: '1200px', margin: '1.5rem auto 0',
          paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)',
          textAlign: 'center', color: '#475569', fontSize: '0.75rem',
        }}>
          © 2025 Final Year Project • All Rights Reserved
        </div>
      </div>
    </div>
  );
};

export default LandingPage;