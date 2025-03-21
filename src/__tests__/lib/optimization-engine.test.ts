import { beforeEach } from '@jest/globals';
import {
  optimizeShipping,
  prepareOptimizationSummary,
  validateProductsForOptimization
} from '@/lib/optimization-engine';
import type {
  Product,
  Container,
  Pallet,
  OptimizationResult
} from '@/types';

describe('Optimization Engine', () => {
  // Mock data for testing
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    sku: 'TP-001',
    dimensions: {
      length: 10,
      width: 10,
      height: 10,
      unit: 'cm' as const
    },
    weight: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockContainer: Container = {
    length: 100,
    width: 100,
    height: 100,
    max_weight: 1000,
    unit: 'cm'
  };

  const mockPallet: Pallet = {
    length: 80,
    width: 80,
    height: 15,
    weight: 10,
    max_weight: 500,
    unit: 'cm'
  };



  describe('optimizeShipping', () => {
    it('should return a valid optimization result for valid inputs', () => {
      const products: Array<{ product: Product; quantity: number }> = [{ product: mockProduct, quantity: 10 }];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.utilization).toBeGreaterThan(0);
      expect(result.palletArrangements.length).toBeGreaterThan(0);
      expect(Array.isArray(result.remainingProducts)).toBe(true);
    });

    it('should handle empty product list', () => {
      const products: Array<{ product: Product; quantity: number }> = [];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No products to optimize');
    });

    it('should handle invalid product dimensions', () => {
      const invalidProduct: Product = {
        ...mockProduct,
        dimensions: {
          length: -10, // Invalid negative dimension
          width: 10,
          height: 10,
          unit: 'cm' as const
        }
      };
      
      const products: Array<{ product: Product; quantity: number }> = [{ product: invalidProduct, quantity: 10 }];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid');
    });

    it('should handle products that are too large for the container', () => {
      const largeProduct: Product = {
        ...mockProduct,
        dimensions: {
          length: 200, // Larger than container
          width: 200,
          height: 200,
          unit: 'cm' as const
        }
      };
      
      const products: Array<{ product: Product; quantity: number }> = [{ product: largeProduct, quantity: 1 }];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('too large');
    });

    it('should optimize products with different dimensions', () => {
      const products: Array<{ product: Product; quantity: number }> = [
        { 
          product: mockProduct, 
          quantity: 5 
        },
        { 
          product: {
            ...mockProduct,
            id: 'product-2',
            dimensions: {
              length: 20,
              width: 15,
              height: 10,
              unit: 'cm' as const
            }
          }, 
          quantity: 3 
        }
      ];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result.success).toBe(true);
      expect(result.utilization).toBeGreaterThan(0);
    });

    it('should respect container weight limits', () => {
      const heavyProduct: Product = {
        ...mockProduct,
        weight: 300 // Very heavy product
      };
      
      const products: Array<{ product: Product; quantity: number }> = [{ product: heavyProduct, quantity: 5 }];
      const containerWithWeightLimit: Container = {
        ...mockContainer,
        max_weight: 1000
      };
      
      const result = optimizeShipping(products, containerWithWeightLimit);
      
      // Some products should remain unplaced due to weight constraints
      expect(result.remainingProducts.length).toBeGreaterThan(0);
    });
    
    it('should handle products with different dimension units', () => {
      const products: Array<{ product: Product; quantity: number }> = [
        {
          product: {
            ...mockProduct,
            id: 'inches-product',
            dimensions: {
              length: 10,
              width: 10,
              height: 10,
              unit: 'in' as const
            }
          },
          quantity: 3
        }
      ];
      
      const result = optimizeShipping(products, mockContainer);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.palletArrangements.length).toBeGreaterThan(0);
      expect(result.utilization).toBeGreaterThan(0);
    });
    
    it('should handle container with insufficient dimensions', () => {
      const tinyContainer: Container = {
        length: 5,
        width: 5,
        height: 5,
        max_weight: 1000,
        unit: 'cm'
      };
      
      const result = optimizeShipping([{ product: mockProduct, quantity: 5 }], tinyContainer);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toContain('too large');
    });
    
    it('should handle extreme weight constraints correctly', () => {
      const heavyProduct = {
        ...mockProduct,
        weight: 500 // Very heavy product
      };
      
      const lightWeightContainer: Container = {
        ...mockContainer,
        max_weight: 600 // Only allows for 1 product + pallet
      };
      
      const result = optimizeShipping([{ product: heavyProduct, quantity: 5 }], lightWeightContainer);
      
      expect(result).toBeDefined();
      expect(result.remainingProducts.length).toBeGreaterThan(0);
      expect(result.palletArrangements.length).toBeLessThan(5); // Should not fit all 5 products due to weight
    });
  });

  describe('prepareOptimizationSummary', () => {
    it('should prepare a summary from optimization results', () => {
      const mockResult: OptimizationResult = {
        success: true,
        message: 'Optimization successful',
        utilization: 75.5,
        palletArrangements: [
          {
            pallet: {
              length: 120,
              width: 100,
              height: 15,
              weight: 25,
              max_weight: 500,
              unit: 'cm'
            },
            arrangement: [
              {
                product_id: 'product-1',
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                quantity: 1
              }
            ],
            weight: 30,
            utilization: 75.5
          }
        ],
        remainingProducts: []
      };
      
      const summary = prepareOptimizationSummary(mockResult);
      
      expect(summary.success).toBe(true);
      expect(summary.utilization).toBe(75.5);
      expect(summary.totalPallets).toBe(1);
      expect(summary.message).toBe('Optimization successful');
    });
  });

  describe('validateProductsForOptimization', () => {
    it('should validate products with valid dimensions', () => {
      const products = [{ product: mockProduct, quantity: 1 }];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(true);
      expect(result.invalidProducts).toEqual([]);
    });
    
    it('should identify products with invalid dimensions', () => {
      const invalidProduct = {
        ...mockProduct,
        id: 'invalid-product',
        dimensions: null
      };
      
      const products = [{ product: invalidProduct as Product, quantity: 1 }];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(false);
      expect(result.invalidProducts.length).toBeGreaterThan(0);
    });
    
    it('should identify products with negative dimensions', () => {
      const invalidProduct = {
        ...mockProduct,
        id: 'negative-dimensions',
        dimensions: {
          length: -10,
          width: 10,
          height: 10,
          unit: 'cm' as const
        }
      };
      
      const products: Array<{ product: Product; quantity: number }> = [{ product: invalidProduct, quantity: 1 }];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(false);
      expect(result.invalidProducts.length).toBeGreaterThan(0);
    });
    
    it('should identify products with zero dimensions', () => {
      const invalidProduct = {
        ...mockProduct,
        id: 'zero-dimensions',
        dimensions: {
          length: 0,
          width: 10,
          height: 10,
          unit: 'cm' as const
        }
      };
      
      const products: Array<{ product: Product; quantity: number }> = [{ product: invalidProduct, quantity: 1 }];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(false);
      expect(result.invalidProducts.length).toBeGreaterThan(0);
    });
    
    it('should validate products with different dimension units', () => {
      const products = [
        {
          product: {
            ...mockProduct,
            id: 'inches-product',
            dimensions: {
              length: 10,
              width: 10,
              height: 10,
              unit: 'in' as const
            }
          },
          quantity: 1
        },
        {
          product: {
            ...mockProduct,
            id: 'mm-product',
            dimensions: {
              length: 100,
              width: 100,
              height: 100,
              unit: 'mm' as const
            }
          },
          quantity: 1
        }
      ];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(true);
      expect(result.invalidProducts).toHaveLength(0);
    });
    
    it('should handle mixed valid and invalid products', () => {
      // Create a copy of mockProduct with a specific name that we can check for
      const invalidProduct = {
        ...mockProduct,
        id: 'invalid-product',
        name: 'Invalid Product Name', // The validation function prioritizes name over id
        dimensions: {
          length: -10, // Negative dimension makes it invalid
          width: 10,
          height: 10,
          unit: 'cm' as const
        }
      };
      
      const products: Array<{ product: Product; quantity: number }> = [
        {
          product: {
            ...mockProduct,
            id: 'valid-product',
            name: 'Valid Product',
            dimensions: {
              length: 10,
              width: 10,
              height: 10,
              unit: 'cm' as const
            }
          },
          quantity: 1
        },
        {
          product: invalidProduct,
          quantity: 1
        }
      ];
      
      const result = validateProductsForOptimization(products);
      
      expect(result.valid).toBe(false);
      expect(result.invalidProducts).toHaveLength(1);
      // Check for the name instead of the ID since the validation function uses name as priority
      expect(result.invalidProducts).toContain('Invalid Product Name');
    });
  });
  
  // Performance tests
  describe('Performance', () => {
    it('should handle optimization of large product sets efficiently', () => {
      // Create a large set of products with proper typing
      const products: Array<{ product: Product; quantity: number }> = Array(50).fill(null).map((_, index) => ({
        product: {
          ...mockProduct,
          id: `product-${index}`,
          dimensions: {
            length: 5 + (index % 5),
            width: 5 + (index % 3),
            height: 5 + (index % 4),
            unit: 'cm' as const
          }
        },
        quantity: 1 + (index % 5)
      }));
      
      const startTime = performance.now();
      
      const result = optimizeShipping(products, mockContainer);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Verify that optimization completes within a reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(5000); // 5 seconds max
      expect(result.success).toBe(true);
    });
    
    it('should handle multiple optimization calls with different parameters efficiently', () => {
      // Create several different product sets
      const productSets: Array<Array<{ product: Product; quantity: number }>> = Array(5).fill(null).map((_, setIndex) => {
        return Array(10).fill(null).map((_, index) => ({
          product: {
            ...mockProduct,
            id: `product-${setIndex}-${index}`,
            dimensions: {
              length: 5 + (index % 5),
              width: 5 + (index % 3),
              height: 5 + (index % 4),
              unit: 'cm' as const
            }
          },
          quantity: 1 + (index % 3)
        }));
      });
      
      const startTime = performance.now();
      
      // Run optimization for each product set
      const results = productSets.map(products => {
        return optimizeShipping(products, mockContainer);
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Verify all optimizations complete within a reasonable time
      expect(executionTime).toBeLessThan(10000); // 10 seconds max for all sets
      expect(results.every(r => r.success)).toBe(true);
    });
    
    it('should benefit from memoization for repeated calls with same parameters', () => {
      const products: Array<{ product: Product; quantity: number }> = [
        {
          product: mockProduct,
          quantity: 5
        }
      ];
      
      // First call - should take normal time
      const startTime1 = performance.now();
      const result1 = optimizeShipping(products, mockContainer);
      const endTime1 = performance.now();
      const firstCallDuration = endTime1 - startTime1;
      
      // Second call with same parameters - should be faster due to memoization
      const startTime2 = performance.now();
      const result2 = optimizeShipping(products, mockContainer);
      const endTime2 = performance.now();
      const secondCallDuration = endTime2 - startTime2;
      
      // The second call should be significantly faster due to memoization
      // We're not using a strict assertion here because the actual performance
      // gain can vary based on the testing environment
      expect(secondCallDuration).toBeLessThanOrEqual(firstCallDuration);
      
      // Results should be identical
      expect(JSON.stringify(result1)).toEqual(JSON.stringify(result2));
    });
    
    it('should handle edge case of many small products efficiently', () => {
      // Create many small products
      const manySmallProducts: Array<{ product: Product; quantity: number }> = Array(100).fill(null).map((_, index) => ({
        product: {
          ...mockProduct,
          id: `small-product-${index}`,
          dimensions: {
            length: 2,
            width: 2,
            height: 2,
            unit: 'cm' as const
          }
        },
        quantity: 1
      }));
      
      const startTime = performance.now();
      const result = optimizeShipping(manySmallProducts, mockContainer);
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5000); // Should still be efficient
      expect(result.success).toBe(true);
      expect(result.palletArrangements.length).toBeGreaterThan(0);
    });
  });
});
