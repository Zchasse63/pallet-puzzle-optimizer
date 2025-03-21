
import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ArrowLeft, ArrowRight } from 'lucide-react';
import TabTransition from './common/TabTransition';
import { useProducts, useProductStats, useIsLoading, useUIActions } from '@/lib/store';
import { Button } from './ui/button';
import ErrorBoundary from './common/ErrorBoundary';

/**
 * PalletsTab component displays pallet distribution and summary
 */
const PalletsTab: React.FC = () => {
  // Use optimized selectors from the store
  const products = useProducts();
  const { totalPallets } = useProductStats();
  const { setActiveTab } = useUIActions();
  const isLoading = useIsLoading();
  const productColors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-orange-400'];
  
  // Generate a simplified visual representation of pallets by product
  const generatePalletSummary = () => {
    return products
      .filter(product => product.quantity > 0)
      .map((product, index) => {
        const pallets = Math.ceil(product.quantity / product.unitsPerPallet);
        const percentage = parseFloat(((pallets / totalPallets) * 100).toFixed(1));
        
        return (
          <motion.div 
            key={product.id}
            className="mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + (index * 0.1) }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-700 font-medium">{product.name}</span>
              <span className="text-gray-700">{pallets} pallets ({percentage.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <motion.div 
                className={`h-2.5 rounded-full ${productColors[index % productColors.length]}`}
                style={{ width: `${percentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: 0.3 + (index * 0.1) }}
              />
            </div>
          </motion.div>
        );
      });
  };
  
  return (
    <TabTransition id="pallets" className="py-6 px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Pallet Conversion</h2>
        <motion.div 
          className="bg-yellow-50 p-4 rounded-lg border border-yellow-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="flex items-center text-yellow-800">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Products will arrive unpalletized. This view helps you plan how the shipment will convert to pallets at your facility.
          </p>
        </motion.div>
      </div>
      
      <ErrorBoundary>
        <motion.div 
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <motion.div 
            className="flex items-center justify-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="w-28 h-28 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <div className="text-center">
                <motion.div 
                  className="text-3xl font-bold text-app-blue"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {totalPallets}
                </motion.div>
                <div className="text-xs text-blue-800">Total Pallets</div>
              </div>
            </div>
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-3">Pallet Distribution</h3>
            <div className="space-y-1">
              {generatePalletSummary()}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="font-medium text-gray-800 mb-1">Storage Requirements</h4>
            <p className="text-sm text-gray-700">
              Floor space: ~{totalPallets * 4} m² <br />
              Standard rack positions: {Math.ceil(totalPallets / 3)}
            </p>
          </motion.div>
          
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <h4 className="font-medium text-gray-800 mb-1">Transport</h4>
            <div className="flex items-center">
              <Truck className="w-5 h-5 mr-2 text-gray-600" />
              <span className="text-sm text-gray-700">
                {Math.ceil(totalPallets / 28)} standard truck loads
              </span>
            </div>
          </motion.div>
        </div>
        </motion.div>
      </ErrorBoundary>
      
      <div className="flex justify-between mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            onClick={() => setActiveTab('container')}
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Container View
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            className="bg-app-blue text-white hover:bg-app-dark-blue flex items-center"
            onClick={() => setActiveTab('quote')}
            disabled={isLoading}
          >
            Continue to Quote
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </TabTransition>
  );
};

export default PalletsTab;
