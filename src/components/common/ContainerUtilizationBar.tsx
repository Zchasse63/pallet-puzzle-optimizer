import React from 'react';
import { motion } from 'framer-motion';
import { CONTAINER_CAPACITY_CBM } from '@/lib/api';

interface ContainerUtilizationBarProps {
  utilizationPercentage: number;
  showBadge?: boolean;
  className?: string;
  delay?: number;
}

/**
 * A reusable container utilization progress bar component
 * Displays a progress bar with utilization percentage and optional badge
 */
const ContainerUtilizationBar: React.FC<ContainerUtilizationBarProps> = ({
  utilizationPercentage,
  showBadge = true,
  className = '',
  delay = 0.3
}) => {
  return (
    <div className={`w-full ${className}`}>
      {showBadge && (
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Container Utilization</h3>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
            {utilizationPercentage.toFixed(1)}% filled
          </span>
        </div>
      )}
      
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <motion.div 
          className="bg-app-blue h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${utilizationPercentage}%` }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div className="bg-gray-50 p-2 rounded-md">
          <div className="font-medium mb-1">Total Capacity</div>
          <div>{CONTAINER_CAPACITY_CBM} CBM</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-md">
          <div className="font-medium mb-1">Used Space</div>
          <div>{(CONTAINER_CAPACITY_CBM * (utilizationPercentage / 100)).toFixed(1)} CBM</div>
        </div>
        <div className="bg-gray-50 p-2 rounded-md">
          <div className="font-medium mb-1">Remaining</div>
          <div>{(CONTAINER_CAPACITY_CBM - (CONTAINER_CAPACITY_CBM * (utilizationPercentage / 100))).toFixed(1)} CBM</div>
        </div>
      </div>
    </div>
  );
};

export default ContainerUtilizationBar;
