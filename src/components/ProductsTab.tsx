
import React from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unitsPerPallet: number;
  dimensions: { length: number; width: number; height: number };
}

interface ProductsTabProps {
  products: Product[];
  updateQuantity: (id: number, quantity: string) => void;
  setActiveTab: (tab: string) => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({ products, updateQuantity, setActiveTab }) => {
  const staggerChildren = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <TabTransition id="products" className="py-6 px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Products & Quantities</h2>
        <motion.div 
          className="bg-blue-50 p-4 rounded-lg border border-blue-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gray-700">Add products to your container and see how they fit. The calculator will optimize space and convert to pallets.</p>
        </motion.div>
      </div>
      
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm"
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="py-3 px-4 font-medium">Product</th>
              <th className="py-3 px-4 font-medium text-right">Quantity</th>
              <th className="py-3 px-4 font-medium text-right">Units Per Pallet</th>
              <th className="py-3 px-4 font-medium text-right">Estimated Pallets</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <motion.tr 
                key={product.id} 
                className="border-t border-gray-100"
                variants={item}
              >
                <td className="py-4 px-4">{product.name}</td>
                <td className="py-4 px-4">
                  <div className="flex justify-end">
                    <input
                      type="number"
                      className="w-28 py-2 px-3 border border-gray-200 rounded-md text-right focus:ring-2 focus:ring-blue-100 focus:border-app-blue transition-all outline-none"
                      value={product.quantity}
                      onChange={(e) => updateQuantity(product.id, e.target.value)}
                    />
                  </div>
                </td>
                <td className="py-4 px-4 text-right">{product.unitsPerPallet}</td>
                <td className="py-4 px-4 text-right">
                  {product.quantity > 0 ? Math.ceil(product.quantity / product.unitsPerPallet) : 0}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      
      <motion.div 
        className="flex justify-end mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.button
          className="bg-app-blue text-white px-5 py-2.5 rounded-md font-medium shadow-sm hover:shadow-md hover:bg-app-dark-blue transition-all-200 flex items-center"
          onClick={() => setActiveTab('container')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue to Container View
          <svg className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </motion.button>
      </motion.div>
    </TabTransition>
  );
};

export default ProductsTab;
