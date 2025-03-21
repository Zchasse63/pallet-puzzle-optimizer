
import React from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';
import { calculateProductVolume, calculateTotalProductVolume, CONTAINER_CAPACITY_CBM } from '@/lib/api';
import ContainerUtilizationBar from './common/ContainerUtilizationBar';
import { useProducts, useProductStats, useProductActions, useIsLoading, useUIActions } from '@/lib/store';
import { Button } from './ui/button';
import { Zap, ArrowLeft, ArrowRight } from 'lucide-react';
import ErrorBoundary from './common/ErrorBoundary';

/**
 * ContainerTab component displays container utilization and product summary
 */
const ContainerTab: React.FC = () => {
  // Use optimized selectors from the store
  const products = useProducts();
  const { containerUtilization } = useProductStats();
  const { optimizeContainer } = useProductActions();
  const { setActiveTab } = useUIActions();
  const isLoading = useIsLoading();
  return (
    <TabTransition id="container" className="py-6 px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Container Utilization</h2>
        <p className="text-gray-600">
          Visualize how your products fit in a standard shipping container
        </p>
      </div>
      
      <ErrorBoundary>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 flex justify-center">
          <motion.div 
            className="bg-gray-50 rounded-xl border border-gray-100 shadow-sm w-full h-[400px] flex flex-col overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 2D Container visualization */}
            <div className="p-4 bg-white border-b border-gray-100">
              <h3 className="text-lg font-medium">Container Contents (2D View)</h3>
              <p className="text-sm text-gray-600">{containerUtilization.toFixed(1)}% of {CONTAINER_CAPACITY_CBM} CBM utilized</p>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="relative w-full h-full bg-white border-2 border-gray-200 rounded-lg">
                {/* Container utilization bar */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-blue-500 opacity-20"
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.min(100, containerUtilization)}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                />
                
                {/* Product blocks visualization - stacked from bottom */}
                {products
                  .filter(p => p.quantity > 0)
                  .sort((a, b) => calculateProductVolume(b) - calculateProductVolume(a))
                  .map((product, index) => {
                    // Calculate product volume percentage
                    const volumePercentage = parseFloat(((calculateTotalProductVolume(product) / CONTAINER_CAPACITY_CBM) * 100).toFixed(1));
                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-yellow-500',
                      'bg-purple-500',
                      'bg-pink-500',
                      'bg-indigo-500',
                      'bg-red-500',
                      'bg-orange-500',
                      'bg-teal-500',
                      'bg-cyan-500'
                    ];
                    
                    return (
                      <motion.div 
                        key={product.id}
                        className={`absolute left-0 right-0 ${colors[index % colors.length]} opacity-70 border-t border-white`}
                        style={{
                          bottom: `${index > 0 ? 
                            products
                              .filter(p => p.quantity > 0)
                              .slice(0, index)
                              .reduce((acc, p) => acc + (calculateTotalProductVolume(p) / CONTAINER_CAPACITY_CBM) * 100, 0) : 0}%`,
                          height: `${volumePercentage}%`,
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                      >
                        <div className="absolute top-1 left-2 text-xs font-medium text-white drop-shadow-md">
                          {product.name}
                        </div>
                      </motion.div>
                    );
                  })
                }
                
                <motion.div 
                  className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-medium shadow-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {containerUtilization.toFixed(1)}% filled
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div className="w-full md:w-1/3">
          <motion.div 
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-full"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ContainerUtilizationBar 
              utilizationPercentage={containerUtilization}
              className="mb-5"
              delay={0.5}
            />
            
            <div className="mb-5">
              <h4 className="text-sm font-medium mb-2 text-gray-700">Efficiency Analysis</h4>
              <div className="bg-gray-50 rounded-md p-3 text-xs">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${containerUtilization > 85 ? 'bg-green-500' : containerUtilization > 70 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                  <div className="font-medium">
                    {containerUtilization > 85 ? 'Excellent' : containerUtilization > 70 ? 'Good' : 'Needs Improvement'}
                  </div>
                </div>
                <p className="text-gray-600">
                  {containerUtilization > 85 
                    ? 'Your container space is being utilized efficiently.'
                    : containerUtilization > 70 
                      ? 'Good utilization, but there may be room for improvement.'
                      : 'Consider adding more products or optimizing your current selection to improve space utilization.'}
                </p>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center"
                onClick={optimizeContainer}
                disabled={isLoading}
              >
                <Zap className="w-5 h-5 mr-2" />
                Optimize Container Space
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Product Summary Section */}
      <motion.div 
        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h3 className="text-lg font-medium mb-4">Product Summary</h3>
        
        <div className="divide-y divide-gray-100">
          {products
            .filter(p => p.quantity > 0)
            .map((product, index) => {
              const productVolume = calculateTotalProductVolume(product);
              const volumePercentage = ((productVolume / 68) * 100).toFixed(1);
              
              return (
                <motion.div 
                  key={product.id}
                  className="py-3 first:pt-0 last:pb-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-medium">{product.name}</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">{product.quantity.toLocaleString()} units</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-sm text-gray-500">
                    <span>Volume: {productVolume.toFixed(1)} m³</span>
                    <span>{volumePercentage}% of container</span>
                  </div>
                </motion.div>
              );
            })
          }
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
            onClick={() => setActiveTab('products')}
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            className="bg-app-blue text-white hover:bg-app-dark-blue flex items-center"
            onClick={() => setActiveTab('pallets')}
            disabled={isLoading}
          >
            Continue to Pallet View
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </div>
    </TabTransition>
  );
};

export default ContainerTab;
