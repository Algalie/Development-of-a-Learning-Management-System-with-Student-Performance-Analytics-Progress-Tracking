import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel, variant = 'primary' }) => {
  const variants = {
    primary: { bg: '#0A2A66', hoverBg: '#FFC107', hoverColor: '#0A2A66' },
    danger: { bg: '#ef4444', hoverBg: '#dc2626', hoverColor: 'white' },
    success: { bg: '#10b981', hoverBg: '#059669', hoverColor: 'white' },
    warning: { bg: '#f59e0b', hoverBg: '#d97706', hoverColor: 'white' },
  };

  const v = variants[variant] || variants.primary;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000
        }} onClick={onCancel}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white', borderRadius: '20px', padding: '2rem',
              maxWidth: '450px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#0A2A66', marginBottom: '0.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className={`fas fa-${variant === 'danger' ? 'exclamation-triangle' : 'info-circle'}`} style={{ color: v.bg }}></i>
              {title || 'Confirm'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {message || 'Are you sure?'}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '30px', border: '2px solid #0A2A66',
                  background: 'transparent', color: '#0A2A66', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem'
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                style={{
                  padding: '0.6rem 1.5rem', borderRadius: '30px', border: 'none',
                  background: v.bg, color: 'white', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem'
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;