
import React from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unitsPerPallet: number;
}

interface ContainerTabProps {
  products: Product[];
  containerUtilization: number;
  setActiveTab: (tab: string) => void;
}

const ContainerTab: React.FC<ContainerTabProps> = ({ 
  products, 
  containerUtilization, 
  setActiveTab 
}) => {
  return (
    <TabTransition id="container" className="py-6 px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Container Utilization</h2>
        <p className="text-gray-600">
          Visualize how your products fit in a standard shipping container
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3 flex justify-center">
          <motion.div 
            className="bg-gray-50 rounded-xl border border-gray-100 shadow-sm w-full h-[400px] flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative w-[280px] h-[320px] perspective-800">
              <motion.div 
                className="absolute top-0 left-0 w-full h-full bg-white rounded-md border-2 border-gray-300 shadow-lg"
                initial={{ rotateY: -20, rotateX: 10 }}
                animate={{ rotateY: -25, rotateX: 15 }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                {/* Container visualization */}
                <div className="absolute inset-2 bg-gray-100 rounded overflow-hidden">
                  {/* Product blocks visualization */}
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-[#3B82F6] h-[35%] opacity-80"
                    initial={{ height: "0%" }}
                    animate={{ height: "35%" }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-[#10B981] h-[25%] opacity-80"
                    initial={{ height: "0%" }}
                    animate={{ height: "25%" }}
                    transition={{ duration: 0.7, delay: 0.5 }}
                  />
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 bg-[#F59E0B] h-[10%] opacity-80"
                    initial={{ height: "0%" }}
                    animate={{ height: "10%" }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                  />
                  
                  <motion.div 
                    className="absolute top-2 right-2 bg-white px-2 py-1 rounded-md text-xs font-medium shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {containerUtilization}% filled
                  </motion.div>
                </div>
              </motion.div>
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
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Container Utilization</h3>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <motion.div 
                  className="bg-app-blue h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${containerUtilization}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{containerUtilization}% of container space used</p>
            </div>
            
            <motion.div 
              className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h4 className="font-medium text-green-800 mb-1">Efficiency Rating</h4>
              <p className="text-sm text-green-700">
                Good utilization. Consider adding more Product C to optimize space usage.
              </p>
            </motion.div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Product Summary</h3>
              {products.map((product, index) => (
                <motion.div 
                  key={product.id}
                  className="flex justify-between items-center mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <span className="text-gray-700">{product.name}:</span>
                  <span className="font-medium">{product.quantity.toLocaleString()} units</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <motion.button
          className="bg-gray-100 px-5 py-2.5 rounded-md text-gray-700 hover:bg-gray-200 transition-all-200 flex items-center"
          onClick={() => setActiveTab('products')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Products
        </motion.button>
        
        <motion.button
          className="bg-app-blue text-white px-5 py-2.5 rounded-md font-medium shadow-sm hover:shadow-md hover:bg-app-dark-blue transition-all-200 flex items-center"
          onClick={() => setActiveTab('pallets')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Continue to Pallet View
          <svg className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </TabTransition>
  );
};

export default ContainerTab;
