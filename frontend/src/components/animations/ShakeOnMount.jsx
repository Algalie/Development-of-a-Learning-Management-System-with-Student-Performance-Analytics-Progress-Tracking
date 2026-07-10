import { motion } from 'framer-motion';

const ShakeOnMount = ({ children, className = '', intensity = 'medium' }) => {
  const intensities = {
    light: { x: [0, -2, 2, -2, 2, 0] },
    medium: { x: [0, -5, 5, -5, 5, -3, 3, -1, 1, 0] },
    heavy: { x: [0, -8, 8, -8, 8, -5, 5, -3, 3, -1, 1, 0] },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: intensities[intensity].x,
      }}
      transition={{
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        x: { duration: 0.6, ease: 'easeInOut' },
      }}
    >
      {children}
    </motion.div>
  );
};

export default ShakeOnMount;