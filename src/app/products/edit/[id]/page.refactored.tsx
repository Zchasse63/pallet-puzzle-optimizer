'use client';

import { motion } from 'framer-motion';
import ProductForm from '@/components/products/ProductForm.refactored';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function EditProductPage({ params }: { params: { id: string } }) {
  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      <Suspense fallback={
        <div className="bg-white shadow-md rounded-lg p-8 flex justify-center items-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" aria-hidden="true" />
          <span className="ml-2 text-gray-600">Loading product data...</span>
        </div>
      }>
        <ProductForm productId={params.id} />
      </Suspense>
    </motion.div>
  );
}
