import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animate?: boolean;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  height = '1rem',
  width = '100%',
  rounded = 'md',
  animate = true,
}) => {
  const roundedClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  const baseClasses = `bg-gray-200 ${roundedClasses[rounded]} ${className}`;
  
  return animate ? (
    <motion.div
      className={baseClasses}
      style={{ height, width }}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ 
        repeat: Infinity, 
        duration: 1.5, 
        ease: "easeInOut" 
      }}
      role="status"
      aria-label="Loading"
    />
  ) : (
    <div 
      className={baseClasses} 
      style={{ height, width }}
      role="status"
      aria-label="Loading"
    />
  );
};

export default LoadingSkeleton;
