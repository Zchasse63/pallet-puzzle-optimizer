
import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import TabTransition from './common/TabTransition';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unitsPerPallet: number;
}

interface PalletsTabProps {
  products: Product[];
  totalPallets: number;
  setActiveTab: (tab: string) => void;
}

const PalletsTab: React.FC<PalletsTabProps> = ({ products, totalPallets, setActiveTab }) => {
  const productColors = ['bg-red-400', 'bg-blue-400', 'bg-green-400'];
  
  const generatePalletBlocks = () => {
    const blocks: JSX.Element[] = [];
    let blockIndex = 0;
    
    products.forEach((product, productIndex) => {
      const pallets = Math.ceil(product.quantity / product.unitsPerPallet);
      
      for (let i = 0; i < pallets; i++) {
        if (product.quantity === 0) continue;
        
        blocks.push(
          <motion.div
            key={`${product.id}-${i}`}
            className={`w-10 h-12 ${productColors[productIndex]} m-1 border border-gray-300 rounded-sm shadow-sm`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: 0.1 * blockIndex,
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
            whileHover={{ 
              scale: 1.1, 
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              z: 10 
            }}
            title={`${product.name}: 1 pallet`}
          />
        );
        
        blockIndex++;
      }
    });
    
    return blocks;
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
      
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div 
          className="w-full lg:w-1/2 bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-4">Pallet Breakdown</h3>
          
          <div className="flex flex-col sm:flex-row gap-6 mb-6">
            <motion.div 
              className="flex items-center justify-center w-full sm:w-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="w-32 h-32 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <motion.div 
                    className="text-4xl font-bold text-app-blue"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: 0.4,
                      type: "spring",
                      stiffness: 400, 
                      damping: 25 
                    }}
                  >
                    {totalPallets}
                  </motion.div>
                  <div className="text-sm text-blue-800 mt-1">Total Pallets</div>
                </div>
              </div>
            </motion.div>
            
            <div className="flex-1">
              {products.map((product, index) => {
                const pallets = Math.ceil(product.quantity / product.unitsPerPallet);
                if (product.quantity === 0) return null;
                
                return (
                  <motion.div 
                    key={product.id} 
                    className="mb-3 flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                  >
                    <span className={`inline-block w-4 h-4 ${productColors[index]} rounded-sm mr-3`}></span>
                    <div className="flex-1 flex justify-between items-center">
                      <span className="text-gray-700">{product.name}:</span>
                      <span className="font-medium">{pallets} pallets</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          <motion.div 
            className="bg-gray-50 p-4 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="font-medium text-gray-800 mb-1">Space Requirements</h4>
            <p className="text-sm text-gray-700">
              These pallets would require approximately {totalPallets * 4} square meters of floor space for storage.
            </p>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="w-full lg:w-1/2 bg-white rounded-xl border border-gray-100 shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="text-lg font-medium mb-4">Pallet Visualization</h3>
          
          <div className="h-52 bg-gray-50 rounded-lg p-3 flex items-end flex-wrap justify-center">
            {generatePalletBlocks()}
          </div>
          
          <motion.div 
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h4 className="font-medium text-gray-800 mb-2">Transport Equivalents</h4>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <Truck className="w-6 h-6 mr-3 text-gray-600" />
              <span className="text-gray-700">
                Approximately {Math.ceil(totalPallets / 22)} standard truck loads
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
      
      <div className="flex justify-between mt-6">
        <motion.button
          className="bg-gray-100 px-5 py-2.5 rounded-md text-gray-700 hover:bg-gray-200 transition-all-200 flex items-center"
          onClick={() => setActiveTab('container')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Container View
        </motion.button>
        
        <motion.button
          className="bg-app-blue text-white px-5 py-2.5 rounded-md font-medium shadow-sm hover:shadow-md hover:bg-app-dark-blue transition-all-200 flex items-center"
          onClick={() => setActiveTab('quote')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Continue to Quote
          <svg className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </div>
    </TabTransition>
  );
};

export default PalletsTab;
