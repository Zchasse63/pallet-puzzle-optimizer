
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductsTab from '@/components/ProductsTab';
import ContainerTab from '@/components/ContainerTab';
import PalletsTab from '@/components/PalletsTab';
import QuoteTab from '@/components/QuoteTab';

const Index = () => {
  const [products, setProducts] = useState([
    { id: 1, name: "Product A", quantity: 1200, unitsPerPallet: 100, dimensions: { length: 0.5, width: 0.4, height: 0.3 } },
    { id: 2, name: "Product B", quantity: 800, unitsPerPallet: 50, dimensions: { length: 0.7, width: 0.5, height: 0.4 } },
    { id: 3, name: "Product C", quantity: 0, unitsPerPallet: 75, dimensions: { length: 0.6, width: 0.6, height: 0.2 } }
  ]);
  
  const [activeTab, setActiveTab] = useState('products');
  
  // Calculate container utilization (simplified for mockup)
  const containerUtilization = 68;
  
  // Calculate total pallets
  const totalPallets = products.reduce((sum, product) => 
    sum + Math.ceil(product.quantity / product.unitsPerPallet), 0);
  
  const updateQuantity = (id: number, newQuantity: string) => {
    setProducts(products.map(product => 
      product.id === id ? {...product, quantity: parseInt(newQuantity) || 0} : product
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <motion.div 
        className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Header />
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="bg-app-surface">
          {activeTab === 'products' && (
            <ProductsTab 
              products={products} 
              updateQuantity={updateQuantity} 
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'container' && (
            <ContainerTab 
              products={products} 
              containerUtilization={containerUtilization} 
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'pallets' && (
            <PalletsTab 
              products={products} 
              totalPallets={totalPallets} 
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'quote' && (
            <QuoteTab 
              products={products} 
              containerUtilization={containerUtilization} 
              totalPallets={totalPallets} 
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </motion.div>
    </div>
  );
};

export default Index;
