'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ProductsTab from '@/components/ProductsTab';
import ContainerTab from '@/components/ContainerTab';
import PalletsTab from '@/components/PalletsTab';
import QuoteTab from '@/components/QuoteTab';
import { useActiveTabValue, useProducts, useProductStats, useProductActions, useIsLoading, useUIActions } from '@/lib/store';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

/**
 * Home page component that displays the container calculator interface
 * Uses Zustand store for state management and optimized selectors
 */
const HomePage = memo(() => {
  // Get state from Zustand store using optimized selectors with proper memoization
  const products = useProducts();
  const activeTab = useActiveTabValue();
  const productStats = useProductStats();
  
  // Access derived state directly from productStats
  const { containerUtilization, totalPallets } = productStats;
  
  const uiActions = useUIActions();
  const { setActiveTab } = uiActions;
  
  const isLoading = useIsLoading();
  
  // Memoize the quotes tab props to prevent unnecessary re-renders
  const quoteTabProps = useMemo(() => ({
    products,
    containerUtilization,
    totalPallets,
    setActiveTab
  }), [products, containerUtilization, totalPallets, setActiveTab]);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <LoadingSkeleton height="2.5rem" width="60%" className="mb-2" />
            <LoadingSkeleton height="1rem" width="40%" />
          </div>
          
          <div className="mb-6">
            <LoadingSkeleton height="3rem" className="mb-4" />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <LoadingSkeleton height="1.5rem" width="30%" className="mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <LoadingSkeleton height="1.2rem" width="40%" />
                  <LoadingSkeleton height="1.2rem" width="20%" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          {activeTab === 'products' && <ProductsTab />}
          
          {activeTab === 'container' && <ContainerTab />}
          
          {activeTab === 'pallets' && <PalletsTab />}
          
          {activeTab === 'quote' && (
            <QuoteTab 
              {...quoteTabProps}
            />
          )}
        </main>
      </motion.div>
    </div>
  );
});

export default HomePage;
