'use client';

import { motion } from 'framer-motion';
import AddProductButton from '@/components/products/AddProductButton';
import ProductList from '@/components/products/ProductList.refactored';
import { Suspense } from 'react';
import { Package, Loader2 } from 'lucide-react';

export default function ProductsPage() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="flex justify-between items-center mb-6"
        variants={itemVariants}
      >
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Package className="mr-2 h-6 w-6 text-blue-600" aria-hidden="true" />
          Products
        </h1>
        <AddProductButton />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Suspense fallback={
          <div className="bg-white shadow-md rounded-lg p-8 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" aria-hidden="true" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        }>
          <ProductList />
        </Suspense>
      </motion.div>
    </motion.div>
  );
}
