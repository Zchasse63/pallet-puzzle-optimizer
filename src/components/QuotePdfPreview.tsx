
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unitsPerPallet: number;
}

interface QuotePdfPreviewProps {
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
  productPrices: Record<number, number>;
  shippingCost: number;
  importDuties: number;
  onClose: () => void;
}

const QuotePdfPreview: React.FC<QuotePdfPreviewProps> = ({
  products,
  containerUtilization,
  totalPallets,
  productPrices,
  shippingCost,
  importDuties,
  onClose
}) => {
  const calculateProductTotal = (product: Product) => {
    return product.quantity * (productPrices[product.id] || 0);
  };
  
  const productsTotal = products.reduce(
    (sum, product) => sum + calculateProductTotal(product), 
    0
  );
  
  const grandTotal = productsTotal + shippingCost + importDuties;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <div className="text-lg font-semibold">Shipping Quote Preview</div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 bg-white">
          {/* PDF Header with logo and date */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-blue-800">Container Load Quote</h1>
              <p className="text-gray-600">Generated on {currentDate}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold mb-1">SHIP-SMART Inc.</div>
              <div className="text-gray-600 text-sm">
                <p>123 Logistics Way</p>
                <p>Shipping Harbor, CA 90210</p>
                <p>contact@shipsmart.example.com</p>
              </div>
            </div>
          </div>
          
          {/* Customer & Quote Details */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">Container Details</h3>
              <div className="text-sm">
                <p><span className="font-medium">Container Type:</span> 40' Standard</p>
                <p><span className="font-medium">Utilization:</span> {containerUtilization}%</p>
                <p><span className="font-medium">Total Pallets:</span> {totalPallets}</p>
              </div>
            </div>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-700 mb-2">Shipping Information</h3>
              <div className="text-sm">
                <p><span className="font-medium">Origin:</span> Shanghai, China</p>
                <p><span className="font-medium">Destination:</span> Los Angeles, USA</p>
                <p><span className="font-medium">Est. Transit Time:</span> 18-22 days</p>
              </div>
            </div>
          </div>
          
          {/* Products Table */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">Products & Services</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="py-2 px-4 border">Description</th>
                  <th className="py-2 px-4 border text-right">Quantity</th>
                  <th className="py-2 px-4 border text-right">Price Per Unit</th>
                  <th className="py-2 px-4 border text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  if (product.quantity === 0) return null;
                  
                  const total = calculateProductTotal(product);
                  
                  return (
                    <tr key={product.id} className="border-t">
                      <td className="py-2 px-4 border">{product.name}</td>
                      <td className="py-2 px-4 border text-right">{product.quantity.toLocaleString()}</td>
                      <td className="py-2 px-4 border text-right">${productPrices[product.id].toFixed(2)}</td>
                      <td className="py-2 px-4 border text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
                
                <tr className="border-t">
                  <td className="py-2 px-4 border">Shipping & Handling</td>
                  <td className="py-2 px-4 border text-right">-</td>
                  <td className="py-2 px-4 border text-right">-</td>
                  <td className="py-2 px-4 border text-right">${shippingCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                
                <tr className="border-t">
                  <td className="py-2 px-4 border">Import Duties</td>
                  <td className="py-2 px-4 border text-right">-</td>
                  <td className="py-2 px-4 border text-right">-</td>
                  <td className="py-2 px-4 border text-right">${importDuties.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                
                <tr className="bg-gray-50 font-medium">
                  <td className="py-2 px-4 border">Total</td>
                  <td className="py-2 px-4 border"></td>
                  <td className="py-2 px-4 border"></td>
                  <td className="py-2 px-4 border text-right">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Savings Analysis */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3">Savings Analysis</h3>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <p className="text-green-800 mb-2">
                <span className="font-medium">Container Discount:</span> 22% savings vs. individual pallet ordering
              </p>
              <p className="text-green-800">
                <span className="font-medium">Per Unit Cost:</span> $5.85 vs. $7.50 (regular pricing)
              </p>
            </div>
          </div>
          
          {/* Footer & Terms */}
          <div className="mt-12 pt-6 border-t text-sm text-gray-600">
            <h3 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h3>
            <p className="mb-1">Quote valid for 30 days from the date of issue.</p>
            <p className="mb-1">All prices are in USD and subject to change based on customs requirements.</p>
            <p>Delivery times are estimates and may vary based on customs clearance and weather conditions.</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Download PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuotePdfPreview;
