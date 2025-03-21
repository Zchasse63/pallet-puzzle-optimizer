
import React, { useState, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';
import ProductSearchDialog from './ProductSearchDialog';
import { Product } from '@/lib/types';
import { calculateContainerPercentage } from '@/lib/api';
import ErrorBoundary from './common/ErrorBoundary';
import { useProducts, useProductStats, useProductActions, useIsLoading, useUIActions } from '@/lib/store';
import { AlertCircle, Plus, ArrowRight } from 'lucide-react';
import ContainerUtilizationBar from './common/ContainerUtilizationBar';
import { Button } from './ui/button';

/**
 * ProductsTab component displays and manages the list of products in the container
 * Simplified to prevent infinite loops and state management issues
 */
const ProductsTab: React.FC = () => {
  // Access store data directly to prevent infinite loop issues
  const products = useProducts();
  const productStats = useProductStats();
  const { containerUtilization } = productStats;
  const { updateQuantity, addProduct } = useProductActions();
  const { setActiveTab } = useUIActions();
  const isLoading = useIsLoading();
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // Animation configurations
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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-medium">Products & Quantities</h2>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              onClick={() => setSearchDialogOpen(true)}
              className="bg-app-blue text-white hover:bg-app-dark-blue flex items-center"
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Product
            </Button>
          </motion.div>
        </div>
        
        {/* Container Utilization Summary */}
        <motion.div 
          className="bg-white rounded-lg border border-gray-100 p-4 mb-4 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ContainerUtilizationBar 
            utilizationPercentage={containerUtilization} 
          />
        </motion.div>
        
        <motion.div 
          className="bg-blue-50 p-4 rounded-lg border border-blue-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-gray-700">Add products to your container and see how they fit. The calculator will optimize space and convert to pallets.</p>
        </motion.div>
      </div>
      
      {/* Desktop view - Table */}
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm hidden md:block"
      >
        <ErrorBoundary>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600 text-sm">
                <th className="py-3 px-4 font-medium">Product</th>
                <th className="py-3 px-4 font-medium text-right">Price</th>
                <th className="py-3 px-4 font-medium text-right">Quantity</th>
                <th className="py-3 px-4 font-medium text-right">Units Per Pallet</th>
                <th className="py-3 px-4 font-medium text-right">Estimated Pallets</th>
                <th className="py-3 px-4 font-medium text-right">Container Space (%)</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
                      <p>No products added yet. Click "Add Product" to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <motion.tr 
                    key={product.id} 
                    className="border-t border-gray-100"
                    variants={item}
                  >
                    <td className="py-4 px-4">{product.name}</td>
                    <td className="py-4 px-4 text-right">${product.price?.toFixed(2) || '0.00'}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end">
                        <input
                          type="number"
                          aria-label={`Quantity for ${product.name}`}
                          className="w-28 py-2 px-3 border border-gray-200 rounded-md text-right focus:ring-2 focus:ring-blue-100 focus:border-app-blue transition-all outline-none"
                          value={product.quantity}
                          onChange={(e) => updateQuantity(product.id, e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">{product.unitsPerPallet || '-'}</td>
                    <td className="py-4 px-4 text-right">
                      {product.quantity > 0 && product.unitsPerPallet > 0 ? Math.ceil(product.quantity / product.unitsPerPallet) : '-'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {product.quantity > 0 
                        ? calculateContainerPercentage(product).toFixed(1) + '%'
                        : '0.0%'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </ErrorBoundary>
      </motion.div>
      
      {/* Mobile view - Cards */}
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="show"
        className="md:hidden space-y-4"
      >
        <ErrorBoundary>
          {products.length === 0 ? (
            <motion.div 
              className="bg-white rounded-lg border border-gray-100 p-6 text-center"
              variants={item}
            >
              <div className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-gray-500 mb-4">No products added yet</p>
                <Button
                  onClick={() => setSearchDialogOpen(true)}
                  className="bg-app-blue text-white hover:bg-app-dark-blue flex items-center"
                  disabled={isLoading}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </div>
            </motion.div>
          ) : (
            products.map((product) => (
              <motion.div 
                key={product.id} 
                className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm"
                variants={item}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-800">{product.name}</h3>
                  <span className="text-app-blue font-medium">${product.price?.toFixed(2) || '0.00'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 mb-1">Quantity</p>
                    <input
                      type="number"
                      aria-label={`Quantity for ${product.name}`}
                      className="w-full py-2 px-3 border border-gray-200 rounded-md text-right focus:ring-2 focus:ring-blue-100 focus:border-app-blue transition-all outline-none"
                      value={product.quantity}
                      onChange={(e) => updateQuantity(product.id, e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <p className="text-gray-500 mb-1">Units Per Pallet</p>
                    <p className="py-2 px-3 bg-gray-50 rounded-md text-right">{product.unitsPerPallet}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Estimated Pallets</p>
                    <p className="py-2 px-3 bg-gray-50 rounded-md text-right">
                      {product.quantity > 0 && product.unitsPerPallet > 0 ? Math.ceil(product.quantity / product.unitsPerPallet) : '-'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500 mb-1">Container Space</p>
                    <p className="py-2 px-3 bg-gray-50 rounded-md text-right">
                      {product.quantity > 0 
                        ? calculateContainerPercentage(product).toFixed(1) + '%'
                        : '0.0%'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </ErrorBoundary>
      </motion.div>
      
      <motion.div 
        className="flex justify-end mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button
          className="bg-app-blue text-white hover:bg-app-dark-blue flex items-center"
          onClick={() => setActiveTab('container')}
          disabled={isLoading}
        >
          Continue to Container View
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
      
      {/* Product Search Dialog */}
      <ProductSearchDialog 
        open={searchDialogOpen} 
        onOpenChange={setSearchDialogOpen} 
        onProductSelect={(product) => {
          // Use the addProduct function from props to handle adding the product
          addProduct(product);
        }}
      />
    </TabTransition>
  );
};

export default memo(ProductsTab);
