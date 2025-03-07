
import React from 'react';
import { motion } from 'framer-motion';

const Header: React.FC = () => {
  return (
    <motion.header 
      className="bg-white border-b border-gray-100 backdrop-blur-lg p-6 rounded-t-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <h1 className="text-3xl font-medium tracking-tight text-app-text">Container Calculator</h1>
      <p className="text-app-text-secondary mt-1">Visualize and optimize your container shipments</p>
    </motion.header>
  );
};

export default Header;
