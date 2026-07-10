import { motion } from 'framer-motion';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      onClick={toggleDarkMode}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        border: darkMode ? '2px solid rgba(255,193,7,0.3)' : '2px solid #e2e8f0',
        background: darkMode ? '#1e293b' : '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.1rem',
        transition: 'all 0.3s ease',
        boxShadow: darkMode 
          ? '0 4px 15px rgba(255,193,7,0.15)' 
          : '0 2px 8px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
      title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: darkMode ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      >
        {darkMode ? (
          <FaMoon style={{ color: '#FFC107' }} />
        ) : (
          <FaSun style={{ color: '#f59e0b' }} />
        )}
      </motion.div>
      
      {/* Glow effect in dark mode */}
      {darkMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            borderRadius: '16px',
            background: 'transparent',
            boxShadow: '0 0 20px rgba(255,193,7,0.2)',
            zIndex: -1,
          }}
        />
      )}
    </motion.button>
  );
};

export default DarkModeToggle;