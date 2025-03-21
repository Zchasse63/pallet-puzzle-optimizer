import { OptimizationResult, Product, Container, Pallet } from '@/types';
import { useMemo } from 'react';

// Mock sample pallet arrangement for testing
const createMockPalletArrangement = (productCount: number) => ({
  pallet: {
    length: 120,
    width: 100,
    height: 15,
    weight: 25,
    max_weight: 500,
    unit: 'cm' as const
  },
  arrangement: Array(productCount).fill(0).map((_, i) => ({
    product_id: `product-${i + 1}`,
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    quantity: 1
  })),
  weight: 100,
  utilization: 75
});

// Mock optimization result for testing
const createMockOptimizationResult = (
  success: boolean, 
  palletCount: number, 
  remainingCount: number,
  message?: string
): OptimizationResult => ({
  success,
  message,
  utilization: success ? 85 : 0,
  palletArrangements: success 
    ? Array(palletCount).fill(0).map((_, i) => createMockPalletArrangement(3)) 
    : [],
  remainingProducts: Array(remainingCount).fill(0).map((_, i) => ({
    product: {
      id: `remaining-${i + 1}`,
      name: `Remaining Product ${i + 1}`,
      sku: `REM-${i + 1}`,
      dimensions: { length: 30, width: 20, height: 10, unit: 'cm' },
      weight: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    quantity: 1
  }))
});

// Mock implementation of optimizeShipping
export const optimizeShipping = jest.fn((
  products: Array<{ product: Product; quantity: number }>,
  container: Container,
  pallet?: Pallet
): OptimizationResult => {
  // Return failure for empty product list
  if (!products || products.length === 0) {
    return createMockOptimizationResult(false, 0, 0, 'No products to optimize');
  }
  
  // Return failure for oversized products (mock detection)
  const hasOversizedProduct = products.some(p => 
    p.product.dimensions.length > 200 || 
    p.product.dimensions.width > 200 || 
    p.product.dimensions.height > 200
  );
  
  if (hasOversizedProduct) {
    return createMockOptimizationResult(false, 0, 1, 'Product too large for container');
  }
  
  // Return failure for weight constraints (mock detection)
  const totalWeight = products.reduce((sum, p) => sum + (p.product.weight * p.quantity), 0);
  if (container.max_weight && totalWeight > container.max_weight) {
    return {
      success: true,
      utilization: 50,
      palletArrangements: [createMockPalletArrangement(2)],
      remainingProducts: products.slice(1).map(p => ({ ...p }))
    };
  }
  
  // Return success for normal cases
  return createMockOptimizationResult(true, Math.ceil(products.length / 3), 0);
});

// Mock implementation of useOptimization hook
export const useOptimization = (
  products: Array<{ product: Product; quantity: number }>,
  container: Container,
  pallet?: Pallet
): OptimizationResult => {
  return useMemo(() => {
    return optimizeShipping(products, container, pallet);
  }, [
    JSON.stringify(products),
    JSON.stringify(container),
    JSON.stringify(pallet)
  ]);
};

// Mock other exported functions
export const validateProductsForOptimization = jest.fn((products) => {
  const hasInvalidProduct = products.some(p => !p.product.dimensions);
  return {
    valid: !hasInvalidProduct,
    invalidProducts: hasInvalidProduct ? ['invalid-product'] : []
  };
});

export const standardizeDimensions = jest.fn((item) => {
  return {
    ...item,
    length: item.length,
    width: item.width,
    height: item.height,
    unit: 'cm' as const
  };
});
