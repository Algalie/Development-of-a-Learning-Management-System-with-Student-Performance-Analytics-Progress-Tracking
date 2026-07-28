import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import FadeIn from '../../components/animations/FadeIn';
import DarkModeToggle from '../../components/common/DarkModeToggle';
import { FaArrowLeft, FaEnvelope, FaClock, FaRedoAlt, FaCheckCircle, FaLock, FaRegCopy, FaTimes } from 'react-icons/fa';
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
    if (code) {
      setDevCode(code);
      setDevEmail(email || '');
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

  const copyCode = () => {
    navigator.clipboard.writeText(devCode);
    toast.success('Code copied!');
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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", padding: '1.5rem',
    }}>
      
      {/* MINIMAL POPUP */}
      <AnimatePresence>
        {showCodeModal && devCode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
              background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-start',
              justifyContent: 'center', zIndex: 9999, padding: '1rem', paddingTop: '15vh',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{
                background: 'var(--card-bg)', borderRadius: '14px', maxWidth: '380px', width: '100%',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)', border: '1px solid var(--border)',
                padding: '1.5rem',
              }}
            >
              {/* Close button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button onClick={() => setShowCodeModal(false)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px', borderRadius: '6px',
                }}>
                  <FaTimes style={{ fontSize: '0.9rem' }} />
                </button>
              </div>

              {/* Title */}
              <p style={{ 
                color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 500,
                textAlign: 'center', margin: '0 0 1rem',
              }}>
                Your verification code
              </p>

              {/* Code */}
              <div style={{
                textAlign: 'center', marginBottom: '0.8rem',
              }}>
                <span style={{
                  fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)',
                  letterSpacing: '8px', fontFamily: 'monospace',
                }}>
                  {devCode}
                </span>
              </div>

              {/* Copy button */}
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <button onClick={copyCode} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '0.75rem',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  <FaRegCopy style={{ fontSize: '0.7rem' }} /> Copy code
                </button>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)', margin: '0.8rem 0' }} />

              {/* Email */}
              {devEmail && (
                <p style={{
                  color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center',
                  margin: '0 0 0.8rem',
                }}>
                  Sent to {devEmail}
                </p>
              )}

              {/* Timer */}
              <p style={{
                color: timeLeft <= 10 ? '#dc2626' : 'var(--text-muted)',
                fontSize: '0.75rem', textAlign: 'center', margin: '0 0 0.8rem',
              }}>
                Expires in {formatTime(timeLeft)}
              </p>

              {/* Verify button */}
              <button onClick={handleVerifyFromModal}
                style={{
                  width: '100%', padding: '0.6rem', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--card-bg)',
                  color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.85rem',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}>
                Verify & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '460px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <DarkModeToggle />
        </div>

        <FadeIn delay={0.2}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src={logo} alt="MMTU Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', borderRadius: '16px', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onError={(e) => { e.target.style.display = 'none'; }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
              Milton Margai Technical University
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0A2A66', margin: '0 0 0.3rem' }}>
              Two-Factor Authentication
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              Enter the 4-digit code to continue
            </p>
          </div>
        </FadeIn>

        <div style={{
          background: 'var(--card-bg)', borderRadius: '20px', padding: '2rem',
          border: '1px solid var(--border)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--card-bg-hover)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 0.8rem',
              border: '2px solid var(--border)',
            }}>
              <FaLock style={{ color: '#0A2A66', fontSize: '1.2rem' }} />
            </div>
          </div>

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
            display: 'flex', justifyContent: 'space-between',
            marginTop: '1.2rem', paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
          }}>
            <Link to="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
              <FaArrowLeft style={{ fontSize: '0.7rem' }} /> Back
            </Link>
          </div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          © 2025 Milton Margai Technical University
        </p>
      </motion.div>
    </div>
  );
};

export default Admin2FA;