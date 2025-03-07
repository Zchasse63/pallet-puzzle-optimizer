
import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabTransitionProps {
  children: ReactNode;
  className?: string;
  id: string;
}

const TabTransition: React.FC<TabTransitionProps> = ({ children, className = '', id }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default TabTransition;
