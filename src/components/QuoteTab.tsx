import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';
import { toast } from 'sonner';
import QuotePdfPreview from './QuotePdfPreview';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unitsPerPallet: number;
}

interface QuoteTabProps {
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
  setActiveTab: (tab: string) => void;
}

const QuoteTab: React.FC<QuoteTabProps> = ({ 
  products, 
  containerUtilization, 
  totalPallets, 
  setActiveTab 
}) => {
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  
  // Sample pricing data (would come from a real pricing engine in production)
  const productPrices = {
    1: 5.85, // Product A
    2: 8.25, // Product B
    3: 7.50  // Product C
  };
  
  const shippingCost = 3850;
  const importDuties = 1228;
  
  const calculateProductTotal = (product: Product) => {
    return product.quantity * (productPrices[product.id as keyof typeof productPrices] || 0);
  };
  
  const productsTotal = products.reduce(
    (sum, product) => sum + calculateProductTotal(product), 
    0
  );
  
  const grandTotal = productsTotal + shippingCost + importDuties;
  
  const handleDownloadQuote = () => {
    setShowPdfPreview(true);
  };
  
  const handleEmailQuote = () => {
    toast.success("Quote sent successfully", {
      description: "The quote has been emailed to you",
      duration: 3000
    });
  };
  
  return (
    <TabTransition id="quote" className="py-6 px-6">
      <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Quote Summary</h2>
        <p className="text-gray-600">
          Complete shipment quote including products, shipping, and duties
        </p>
      </div>
      
      <motion.div 
        className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="font-medium text-lg text-blue-900 mb-3">Container Details</h3>
        <div className="flex flex-col sm:flex-row gap-y-4">
          <div className="flex-1">
            <div className="mb-1 text-blue-800"><span className="font-medium">Container Type:</span> 40' Standard</div>
            <div className="mb-1 text-blue-800"><span className="font-medium">Utilization:</span> {containerUtilization}%</div>
            <div className="text-blue-800"><span className="font-medium">Total Pallets:</span> {totalPallets} (after arrival)</div>
          </div>
          <div className="flex-1">
            <div className="mb-1 text-blue-800"><span className="font-medium">Origin:</span> Shanghai, China</div>
            <div className="mb-1 text-blue-800"><span className="font-medium">Destination:</span> Los Angeles, USA</div>
            <div className="text-blue-800"><span className="font-medium">Est. Transit Time:</span> 18-22 days</div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="py-3 px-4 font-medium">Description</th>
              <th className="py-3 px-4 font-medium text-right">Quantity</th>
              <th className="py-3 px-4 font-medium text-right">Price Per Unit</th>
              <th className="py-3 px-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              if (product.quantity === 0) return null;
              
              const total = calculateProductTotal(product);
              
              return (
                <motion.tr 
                  key={product.id} 
                  className="border-t border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <td className="py-4 px-4">{product.name}</td>
                  <td className="py-4 px-4 text-right">{product.quantity.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">${productPrices[product.id as keyof typeof productPrices].toFixed(2)}</td>
                  <td className="py-4 px-4 text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </motion.tr>
              );
            })}
            
            <motion.tr 
              className="border-t border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <td className="py-4 px-4">Shipping & Handling</td>
              <td className="py-4 px-4 text-right">-</td>
              <td className="py-4 px-4 text-right">-</td>
              <td className="py-4 px-4 text-right">${shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </motion.tr>
            
            <motion.tr 
              className="border-t border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <td className="py-4 px-4">Import Duties</td>
              <td className="py-4 px-4 text-right">-</td>
              <td className="py-4 px-4 text-right">-</td>
              <td className="py-4 px-4 text-right">${importDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </motion.tr>
            
            <motion.tr 
              className="bg-gray-50 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <td className="py-4 px-4">Total</td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4 text-right">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </motion.tr>
          </tbody>
        </table>
      </motion.div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div 
          className="w-full lg:w-1/2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-3">Savings Analysis</h3>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-green-800 mb-2">
              <span className="font-medium">Container Discount:</span> 22% savings vs. individual pallet ordering
            </p>
            <p className="text-green-800">
              <span className="font-medium">Per Unit Cost:</span> $5.85 vs. $7.50 (regular pricing)
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="w-full lg:w-1/2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-3">Next Steps</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <motion.button
              className="flex-1 bg-green-500 text-white px-5 py-2.5 rounded-md font-medium shadow-sm hover:shadow-md hover:bg-green-600 transition-all-200 flex items-center justify-center"
              onClick={handleDownloadQuote}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Quote PDF
            </motion.button>
            
            <motion.button
              className="flex-1 bg-app-blue text-white px-5 py-2.5 rounded-md font-medium shadow-sm hover:shadow-md hover:bg-app-dark-blue transition-all-200 flex items-center justify-center"
              onClick={handleEmailQuote}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Quote
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      <div className="flex justify-start mt-6">
        <motion.button
          className="bg-gray-100 px-5 py-2.5 rounded-md text-gray-700 hover:bg-gray-200 transition-all-200 flex items-center"
          onClick={() => setActiveTab('pallets')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Pallet View
        </motion.button>
      </div>
      
      {showPdfPreview && (
        <QuotePdfPreview 
          products={products}
          containerUtilization={containerUtilization}
          totalPallets={totalPallets}
          productPrices={productPrices}
          shippingCost={shippingCost}
          importDuties={importDuties}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
    </TabTransition>
  );
};

export default QuoteTab;
