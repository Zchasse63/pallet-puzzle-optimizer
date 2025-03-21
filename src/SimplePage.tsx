// Simple React Router implementation that works without the Next.js App Router conflicts
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ProductsTab from './components/ProductsTab';
import ContainerTab from './components/ContainerTab';
import PalletsTab from './components/PalletsTab';
import QuoteTab from './components/QuoteTab';
import LoadingSkeleton from './components/common/LoadingSkeleton';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import { useProducts, useProductStats, useUIActions, useActiveTabValue, useIsLoading, useProductActions } from './lib/store';

/**
 * Simple implementation of the Home page that avoids Next.js/React Router conflicts
 * 
 * This component follows clean architecture principles and proper state management practices
 * to ensure reliable rendering and prevent infinite loops
 */
const SimplePage = () => {
  // Get state from the store with direct access to prevent infinite loops
  const products = useProducts();
  const activeTab = useActiveTabValue();
  const productStats = useProductStats();
  const { containerUtilization, totalPallets } = productStats;
  const uiActions = useUIActions();
  const productActions = useProductActions();
  const { setActiveTab } = uiActions;
  const { optimizeContainer } = productActions;
  const isLoading = useIsLoading();
  
  // Debug log on mount
  useEffect(() => {
    console.log("SimplePage mounted", { products, containerUtilization, isLoading });
  }, []);

  // Show loading state if needed
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Toaster position="top-right" richColors closeButton />
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton height="400px" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="min-h-screen p-4">Something went wrong. Please refresh the page.</div>}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
        <Toaster position="top-right" richColors closeButton />
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <Header />
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <main className="bg-app-surface p-4">
            {activeTab === 'products' && (
              <ErrorBoundary>
                <ProductsTab />
              </ErrorBoundary>
            )}
            {activeTab === 'container' && (
              <ErrorBoundary>
                <ContainerTab />
              </ErrorBoundary>
            )}
            {activeTab === 'pallets' && (
              <ErrorBoundary>
                <PalletsTab />
              </ErrorBoundary>
            )}
            {activeTab === 'quote' && (
              <ErrorBoundary>
                <QuoteTab 
                  products={products}
                  containerUtilization={containerUtilization}
                  totalPallets={totalPallets}
                  setActiveTab={setActiveTab}
                />
              </ErrorBoundary>
            )}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SimplePage;
