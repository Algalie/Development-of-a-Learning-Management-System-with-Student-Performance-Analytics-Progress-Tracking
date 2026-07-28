import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUserShield, FaChalkboardTeacher, FaGraduationCap, FaChartLine,
  FaBookOpen, FaClipboardCheck, FaCalculator, FaShieldAlt,
  FaArrowRight, FaUsers, FaServer, FaMobileAlt,
  FaUniversity, FaStar, FaCheckCircle, FaRocket
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
        transition={{ duration: 0.6 }}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '0.9rem 4rem', background: 'rgba(255,255,255,0.95)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          position: 'sticky', top: 0, zIndex: 100,
          backdropFilter: 'blur(20px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <img 
            src={logo} 
            alt="MMTU" 
            style={{ width: '40px', height: '40px', borderRadius: '10px', border: '2px solid #FFC107' }}
          />
          <div>
            <div style={{ fontWeight: 800, color: '#0A2A66', fontSize: '1rem', lineHeight: 1.2 }}>
              MMTU
            </div>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 500 }}>
              GPA Management System
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <DarkModeToggle />
          <Link to="/admin/login" style={{
            padding: '0.5rem 1.3rem', borderRadius: '8px',
            color: '#0A2A66', fontWeight: 600, fontSize: '0.82rem', 
            textDecoration: 'none', border: '2px solid #0A2A66',
            transition: 'all 0.3s',
          }}>Admin</Link>
          <Link to="/lecturer/login" style={{
            padding: '0.5rem 1.3rem', borderRadius: '8px',
            background: '#0A2A66', color: 'white',
            fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none',
            transition: 'all 0.3s',
          }}>Lecturer</Link>
        </div>
      </motion.nav>

      {/* ==================== HERO SECTION ==================== */}
      <div style={{
        width: '100%', position: 'relative',
        background: '#0A2A66', minHeight: '550px',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.25,
        }}>
          <img 
            src="/src/assets/images/mmtu2.jpeg"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        {/* Content */}
        <div style={{
          maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem',
          position: 'relative', zIndex: 1, width: '100%',
        }}>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            style={{ maxWidth: '750px' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,193,7,0.15)', padding: '0.4rem 1rem',
              borderRadius: '20px', marginBottom: '1.2rem',
              border: '1px solid rgba(255,193,7,0.3)',
            }}>
              <FaStar style={{ color: '#FFC107', fontSize: '0.7rem' }} />
              <span style={{ fontSize: '0.7rem', color: '#FFC107', fontWeight: 600 }}>
                Milton Margai Technical University
              </span>
            </div>
            <h1 style={{
              fontSize: '2.8rem', fontWeight: 900, color: 'white',
              lineHeight: 1.15, marginBottom: '0.8rem', letterSpacing: '-1px',
            }}>
              Development of a Learning Management System
            </h1>
            <div style={{
              width: '60px', height: '3px', background: '#FFC107',
              borderRadius: '2px', marginBottom: '1rem',
            }} />
            <p style={{
              fontSize: '1.2rem', color: '#FFC107',
              fontWeight: 600, marginBottom: '1rem',
            }}>
              with Student Performance Analytics & Progress Tracking
            </p>
            <p style={{
              fontSize: '1rem', color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7, marginBottom: '2rem', maxWidth: '550px',
            }}>
              A comprehensive digital platform for managing student grades, 
              calculating GPA, tracking academic progress, and streamlining 
              the entire examination workflow.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/admin/login" style={{
                background: '#FFC107', color: '#0A2A66',
                padding: '0.85rem 2rem', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                transition: 'all 0.3s',
              }}>
                <FaUserShield /> Admin Portal <FaArrowRight />
              </Link>
              <Link to="/lecturer/login" style={{
                background: 'rgba(255,255,255,0.12)', color: 'white',
                padding: '0.85rem 2rem', borderRadius: '8px',
                fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid rgba(255,255,255,0.25)',
                transition: 'all 0.3s',
              }}>
                <FaChalkboardTeacher /> Lecturer Portal
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ==================== FEATURES GRID ==================== */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 2rem' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ color: '#0A2A66', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Platform Features
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              A complete solution for academic record management
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.2rem',
        }}>
          {[
            { 
              icon: <FaBookOpen />, title: 'Course Management',
              desc: 'Create and manage courses with automated student enrollment based on academic progression.',
              color: '#3b82f6',
            },
            { 
              icon: <FaClipboardCheck />, title: 'Grade Processing',
              desc: 'Automated grade calculation with multi-level approval workflow (HOD to Dean to Exam Office).',
              color: '#10b981',
            },
            { 
              icon: <FaCalculator />, title: 'GPA System',
              desc: 'Real-time GPA computation with reference grade tracking and credit hour penalties.',
              color: '#7c3aed',
            },
            { 
              icon: <FaChartLine />, title: 'Performance Analytics',
              desc: 'Comprehensive student tracking with failure history and progress monitoring dashboards.',
              color: '#f59e0b',
            },
            { 
              icon: <FaUsers />, title: 'Auto Enrollment',
              desc: 'Smart student filtering based on previous semester performance and qualification status.',
              color: '#ef4444',
            },
            { 
              icon: <FaServer />, title: 'Transcript Generation',
              desc: 'Official transcripts with unique verification IDs and barcode authentication system.',
              color: '#6366f1',
            },
            { 
              icon: <FaMobileAlt />, title: 'Mobile Verification',
              desc: 'Instant transcript authenticity verification using the mobile app barcode scanner.',
              color: '#0891b2',
            },
            { 
              icon: <FaShieldAlt />, title: '2FA Security',
              desc: 'Two-factor authentication for all administrative and lecturer accounts.',
              color: '#059669',
            },
            { 
              icon: <FaRocket />, title: 'AI Powered',
              desc: 'Smart academic assistant with GPA prediction and performance insights.',
              color: '#d946ef',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ y: -5 }}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '16px', padding: '1.8rem',
                border: '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                cursor: 'default',
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px',
                background: `${feature.color}15`,
                color: feature.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', marginBottom: '1.2rem',
              }}>
                {feature.icon}
              </div>
              <h3 style={{ color: '#0A2A66', fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ==================== PORTAL ACCESS CARDS ==================== */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 2rem 5rem' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ color: '#0A2A66', fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Access Your Portal
            </h2>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Choose your role to get started
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
        }}>
          {[
            {
              icon: <FaUserShield />,
              title: 'Administrator',
              desc: 'Full system control and oversight',
              color: '#0A2A66',
              bg: '#f0f4ff',
              features: [
                'User & Faculty Management',
                'GPA Calculation & Transcripts',
                'Approval Oversight',
                'System Analytics Dashboard',
                'Grade Edit Requests',
                'Block GPA Processing',
              ],
              link: '/admin/login',
            },
            {
              icon: <FaChalkboardTeacher />,
              title: 'Lecturer',
              desc: 'Course and grade management',
              color: '#FFC107',
              bg: '#FFF8E1',
              features: [
                'Course Creation & Management',
                'Student Enrollment (Manual/CSV/Auto)',
                'Grade Entry & Submission',
                'Reference Grade Management',
                'Approval Tracking',
                'Grade Edit Requests',
              ],
              link: '/lecturer/login',
            },
          ].map((portal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -5 }}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '20px', padding: '2.2rem',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{
                  width: '55px', height: '55px', borderRadius: '16px',
                  background: portal.bg, color: portal.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem',
                  border: `2px solid ${portal.color}`,
                }}>
                  {portal.icon}
                </div>
                <div>
                  <h3 style={{ color: '#0A2A66', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {portal.title}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '2px 0 0' }}>
                    {portal.desc}
                  </p>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '0.6rem', marginBottom: '1.8rem', flex: 1,
              }}>
                {portal.features.map((feat, j) => (
                  <div key={j} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.8rem', color: '#475569',
                  }}>
                    <FaCheckCircle style={{ color: '#10b981', fontSize: '0.65rem', flexShrink: 0 }} />
                    {feat}
                  </div>
                ))}
              </div>

              <Link to={portal.link} style={{
                background: '#0A2A66',
                color: 'white', padding: '0.8rem', borderRadius: '10px',
                fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none',
                textAlign: 'center', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.5rem',
                transition: 'all 0.3s',
              }}>
                {portal.icon} Access {portal.title} Portal
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ==================== FOOTER ==================== */}
      <div style={{ 
        background: '#0a0f1a', padding: '2.5rem',
      }}>
        <div style={{
          maxWidth: '1000px', margin: '0 auto',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.6rem', marginBottom: '0.8rem',
          }}>
            <FaUniversity style={{ color: '#FFC107', fontSize: '1rem' }} />
            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>
              Milton Margai Technical University
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.3rem' }}>
            Development of a Learning Management System
          </p>
          <p style={{ color: '#64748b', fontSize: '0.72rem', margin: 0 }}>
            with Student Performance Analytics & Progress Tracking
          </p>
          <div style={{
            width: '40px', height: '2px',
            background: '#FFC107', margin: '1rem auto',
            borderRadius: '1px',
          }} />
          <p style={{ color: '#475569', fontSize: '0.7rem', margin: 0 }}>
            Goderich Campus, Freetown — Sierra Leone
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;