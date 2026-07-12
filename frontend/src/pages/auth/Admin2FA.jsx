import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../../components/animations/FadeIn';
import ShakeOnMount from '../../components/animations/ShakeOnMount';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { FaShieldAlt, FaUniversity, FaArrowLeft, FaArrowRight, FaEnvelope, FaClock, FaRedoAlt, FaCheckCircle, FaLock } from 'react-icons/fa';
import logo from '../../assets/images/logo.png';

const Admin2FA = () => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const [resendTime, setResendTime] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [devEmail, setDevEmail] = useState('');
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const { adminVerify2FA } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const code = location.state?.dev_2fa_code || sessionStorage.getItem('dev_2fa_code');
    const email = location.state?.email || sessionStorage.getItem('dev_email');
    if (code && email) {
      setDevCode(code);
      setDevEmail(email);
      const timer = setTimeout(() => {
        setShowCodeModal(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (timeLeft <= 0) { setExpired(true); return; }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (resendTime <= 0) { setCanResend(true); return; }
    const timer = setInterval(() => setResendTime((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendTime]);

  const handleDigitChange = (index, value) => {
    if (value.length > 1) return;
    const newDigits = [...digits];
    newDigits[index] = value.replace(/[^0-9]/g, '');
    setDigits(newDigits);
    if (value && index < 3) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    const newDigits = [...digits];
    paste.split('').slice(0, 4).forEach((num, i) => { newDigits[i] = num; });
    setDigits(newDigits);
    inputRefs[Math.min(paste.length, 3)].current?.focus();
  };

  const verifyAndProceed = async (code) => {
    setLoading(true);
    try {
      const tempToken = sessionStorage.getItem('temp_token');
      if (!tempToken) {
        toast.error('Session expired. Please login again.');
        navigate('/admin/login');
        return;
      }

      const response = await adminVerify2FA({ temp_token: tempToken, code });

      if (response.token) {
        // ✅ SAVE TOKEN TO LOCAL STORAGE
        localStorage.setItem('token', response.token);
        sessionStorage.removeItem('temp_token');
        sessionStorage.removeItem('auth_type');
        sessionStorage.removeItem('dev_2fa_code');
        sessionStorage.removeItem('dev_email');
        toast.success(response.message || 'Verification successful!');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code');
      setDigits(['', '', '', '']);
      inputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFromModal = async () => {
    setShowCodeModal(false);
    const codeDigits = devCode.split('');
    setDigits(codeDigits);
    await verifyAndProceed(devCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 4) { toast.error('Please enter the complete 4-digit code'); return; }
    if (expired) { toast.error('Code has expired. Please request a new one.'); return; }
    await verifyAndProceed(code);
  };

  const handleResend = () => {
    setTimeLeft(60); setResendTime(60); setCanResend(false); setExpired(false);
    setDigits(['', '', '', '']); inputRefs[0].current?.focus();
    toast.success('New verification code sent!');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: 'var(--surface)',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    }}>
      
      <AnimatePresence>
        {showCodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(15,23,42,0.85)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              style={{
                background: 'var(--card-bg)', borderRadius: '24px', padding: '2.5rem 2rem',
                maxWidth: '420px', width: '90%', textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '18px',
                background: 'rgba(255,193,7,0.1)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem',
                border: '2px solid rgba(255,193,7,0.3)',
              }}>
                <FaEnvelope style={{ fontSize: '1.5rem', color: '#FFC107' }} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                2FA Code Generated
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                Sent to:
              </p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.2rem' }}>
                {devEmail}
              </p>
              <div style={{
                background: 'var(--card-bg-hover)', borderRadius: '16px', padding: '1.3rem',
                marginBottom: '1.5rem', border: '1px solid var(--border)',
              }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Code</p>
                <p style={{
                  fontSize: '2.8rem', fontWeight: 900, color: '#0A2A66',
                  letterSpacing: '14px', margin: 0, fontFamily: 'monospace',
                }}>
                  {devCode}
                </p>
              </div>
              <button
                onClick={handleVerifyFromModal}
                style={{
                  width: '100%', padding: '0.85rem', borderRadius: '14px',
                  border: 'none', background: '#0A2A66', color: 'white',
                  fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 4px 15px rgba(10,42,102,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <FaCheckCircle style={{ fontSize: '0.9rem' }} /> Verify & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <div style={{ position: 'absolute', top: -60, right: -60, width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,193,7,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

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
            <img src={logo} alt="MMTU Logo" style={{ width: '72px', height: '72px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
          </motion.div>

          <FadeIn delay={0.5}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                Milton Margai Technical University
              </div>
              <h2 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.3rem', letterSpacing: '-0.5px' }}>
                Secure Verification
              </h2>
              <h3 style={{ color: '#FFC107', fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                Two-Factor Authentication
              </h3>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              A verification code has been sent to your registered email address. 
              Enter the code below to access your admin dashboard.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.08)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaShieldAlt style={{ color: '#FFC107', fontSize: '0.7rem' }} />
                Secure Login
              </div>
            </div>
          </FadeIn>

          <Link to="/admin/login" style={{ marginTop: '3rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 500 }}>
            <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Back to Login
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        style={{ flex: '0 0 55%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: 'var(--surface)' }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <DarkModeToggle />
          </div>

          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem', color: '#0A2A66' }}>
              <FaUniversity style={{ fontSize: '1.5rem', color: '#FFC107' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0A2A66' }}>MILTON MARGAI TECHNICAL UNIVERSITY</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Exams Management & GPA Grading Portal</div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0A2A66', marginBottom: '0.3rem', letterSpacing: '-0.5px' }}>
              Two-Factor <span style={{ color: '#FFC107' }}>Auth</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Enter the 4-digit code sent to your email to continue.
            </p>
          </FadeIn>

          <ShakeOnMount>
            <div style={{
              background: 'var(--card-bg)', borderRadius: '20px', padding: '2rem',
              border: '1px solid var(--border)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                background: 'var(--card-bg-hover)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 1rem',
                fontSize: '1.4rem', color: '#0A2A66', border: '2px solid var(--border)',
              }}>
                <FaLock />
              </div>

              <h2 style={{ color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '3px', textAlign: 'center' }}>
                Verification Code
              </h2>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.2rem', fontSize: '0.82rem' }}>
                Enter the code from your email
              </p>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', marginBottom: '1.5rem',
                background: timeLeft <= 10 ? 'rgba(239,68,68,0.08)' : 'var(--card-bg-hover)',
                padding: '0.5rem 1rem', borderRadius: '25px',
                border: `1px solid ${timeLeft <= 10 ? 'rgba(239,68,68,0.2)' : 'var(--border)'}`,
              }}>
                <FaClock style={{ color: timeLeft <= 10 ? '#dc2626' : 'var(--text-muted)', fontSize: '0.8rem' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: timeLeft <= 10 ? '#dc2626' : 'var(--text-secondary)' }}>
                  Code expires in {formatTime(timeLeft)}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.2rem' }}>
                  {digits.map((digit, index) => (
                    <input key={index} ref={inputRefs[index]} type="text" maxLength={1} value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined} disabled={expired} autoFocus={index === 0}
                      inputMode="numeric" pattern="[0-9]" required 
                      style={{
                        width: '56px', height: '60px', borderRadius: '14px',
                        border: `2px solid ${expired ? 'rgba(239,68,68,0.3)' : digit ? '#0A2A66' : 'var(--border)'}`,
                        textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                        color: digit ? '#0A2A66' : 'var(--text-primary)', fontFamily: 'monospace',
                        outline: 'none', 
                        background: expired ? 'rgba(239,68,68,0.05)' : digit ? 'rgba(10,42,102,0.04)' : 'var(--input-bg)',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || expired} 
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '12px',
                    border: 'none', background: expired ? 'var(--border)' : '#0A2A66',
                    color: 'white', fontWeight: 600, fontSize: '0.9rem',
                    cursor: loading || expired ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: expired ? 'none' : '0 4px 15px rgba(10,42,102,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? <><i className="fas fa-spinner animate-spin"></i> Verifying...</> : <><FaCheckCircle /> Verify & Continue</>}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                <button onClick={handleResend} disabled={!canResend} 
                  style={{
                    background: 'none', border: 'none',
                    color: canResend ? '#0A2A66' : 'var(--text-muted)',
                    fontSize: '0.82rem', fontWeight: 500,
                    cursor: canResend ? 'pointer' : 'not-allowed',
                    fontFamily: 'Inter, sans-serif',
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                  <FaRedoAlt style={{ color: canResend ? '#FFC107' : 'var(--text-muted)', fontSize: '0.75rem' }} />
                  {canResend ? 'Resend Code' : `Resend Code (${resendTime}s)`}
                </button>
              </div>

              <div style={{
                background: 'var(--card-bg-hover)', borderRadius: '12px', padding: '0.8rem 1rem',
                marginTop: '1.2rem', display: 'flex', alignItems: 'center',
                gap: '0.5rem', border: '1px solid var(--border)',
              }}>
                <FaEnvelope style={{ color: '#3b82f6', fontSize: '0.8rem' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                  Code sent to your registered email
                </span>
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginTop: '1.2rem', paddingTop: '1rem',
                borderTop: '1px solid var(--border)',
              }}>
                <Link to="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Back to Login
                </Link>
                <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                  Home <FaArrowRight style={{ fontSize: '0.7rem' }} />
                </Link>
              </div>
            </div>
          </ShakeOnMount>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            © 2025 Milton Margai Technical University. All rights reserved.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin2FA;