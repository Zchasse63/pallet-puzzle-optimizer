'use client';

import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
  label?: string;
}

/**
 * Animated loading spinner component with customizable size and color
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'text-blue-600',
  className = '',
  label
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
    xl: 'h-16 w-16 border-4'
  };

  const spinnerClass = `${sizeClasses[size]} ${color} ${className}`;

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-transparent border-b-transparent ${spinnerClass}`}
        role="status"
        aria-label="Loading"
      />
      {label && (
        <span className="mt-2 text-sm text-gray-600">{label}</span>
      )}
    </div>
  );
}
