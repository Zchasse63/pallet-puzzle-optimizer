# Pallet Puzzle Optimizer - Optimization Engine

## Overview

The Optimization Engine is the core algorithm of the Pallet Puzzle Optimizer application. It efficiently arranges products on pallets and pallets within shipping containers to maximize space utilization while respecting weight constraints and other physical limitations.

## Table of Contents

1. [Architecture](#architecture)
2. [Core Algorithms](#core-algorithms)
3. [Type Definitions](#type-definitions)
4. [Performance Optimizations](#performance-optimizations)
5. [Usage Examples](#usage-examples)
6. [Testing](#testing)
7. [Integration with React Components](#integration-with-react-components)

## Architecture

The optimization engine follows a functional programming approach with clean separation of concerns:

- **Dimension Standardization**: All measurements are converted to centimeters for consistent calculations
- **Space Representation**: 3D space is modeled using a boolean occupancy grid
- **Placement Algorithms**: Bottom-left-back strategy with rotation options for optimal packing
- **Weight Constraints**: Products are placed respecting maximum weight limits of pallets and containers
- **Caching & Memoization**: Performance optimizations to avoid redundant calculations

## Core Algorithms

### Product Placement Strategy

The engine uses a bottom-left-back strategy, which prioritizes placing products:
1. At the lowest possible height (z-coordinate)
2. As far left as possible (y-coordinate)
3. As far back as possible (x-coordinate)

This approach creates a stable packing pattern that maximizes space utilization.

```typescript
const findBestPosition = (
  product: ProductDimensions,
  space: Space
): { position: Position; rotation: Rotation } | null => {
  // Check corners first for optimal placement
  const cornerPositions: Position[] = [
    { x: 0, y: 0, z: 0 }, // Bottom left back
    { x: 0, y: Math.max(0, space.width - Math.ceil(product.width)), z: 0 }, // Bottom right back
    { x: Math.max(0, space.length - Math.ceil(product.length)), y: 0, z: 0 }, // Bottom left front
  ];
  
  // Try each corner position with different rotations
  for (const position of cornerPositions) {
    for (const rotation of rotations) {
      if (canFit(product, position, rotation, space)) {
        return { position, rotation };
      }
    }
  }
  
  // If corners don't work, try a systematic grid search
  // ...
}
```

### Optimization Process

1. **Standardize Dimensions**: Convert all measurements to centimeters
2. **Sort Products**: Arrange by volume, weight, and height for optimal placement
3. **Pallet Optimization**: Place products on pallets using the best-fit algorithm
4. **Container Optimization**: Arrange pallets in the shipping container
5. **Calculate Utilization**: Determine space and weight utilization percentages

## Type Definitions

The engine uses TypeScript interfaces for type safety:

```typescript
// Core types for dimensions
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

// Position in 3D space
export interface Position {
  x: number;
  y: number;
  z: number;
}

// Rotation options
export type Rotation = { x: number; y: number; z: number } | 'length-width' | 'width-length';

// Space representation
export interface Space {
  length: number;
  width: number;
  height: number;
  occupied: boolean[][][];
}

// Optimization result
export interface OptimizationResult {
  success: boolean;
  message?: string;
  utilization: number;
  palletArrangements: PalletArrangement[];
  remainingProducts: Array<{ product: Product; quantity: number }>;
}
```

## Performance Optimizations

The engine implements several performance optimizations:

1. **Memoization**: Frequently called functions like `standardizeDimensions` and `validateProductsForOptimization` are memoized to avoid redundant calculations.

```typescript
const standardizeDimensions = memoize(<T extends { length: number; width: number; height: number; unit: 'cm' | 'in' | 'mm' }>(
  item: T
): StandardizedItem<T> => {
  // Conversion logic...
}, (item) => `${item.length}-${item.width}-${item.height}-${item.unit}`);
```

2. **Caching**: Results of complex calculations are cached using intelligent cache keys based on input parameters.

```typescript
const optimizeContainerLoading = memoize((
  // Function parameters...
) => {
  // Optimization logic...
}, (products, container, palletType) => {
  // Create a cache key based on the inputs
  return JSON.stringify({
    products: products.map(p => ({ 
      id: p.product.id, 
      dimensions: p.product.dimensions, 
      weight: p.product.weight,
      quantity: p.quantity 
    })),
    container: { /* container properties */ },
    pallet: { /* pallet properties */ }
  });
});
```

3. **Early Returns**: Validation checks are performed early to avoid unnecessary processing.

```typescript
// Early validation for empty product list
if (!products || products.length === 0) {
  return {
    success: false,
    message: 'No products to optimize',
    utilization: 0,
    palletArrangements: [],
    remainingProducts: []
  };
}
```

4. **Optimized React Hooks**: React hooks use proper dependency tracking with JSON.stringify for stable references.

```typescript
export const useOptimization = (
  products: Array<{ product: Product; quantity: number }>,
  container: Container,
  palletType: Pallet = DEFAULT_PALLET
): OptimizationResult => {
  return useMemo(() => {
    // Early return for empty product list
    if (!products || products.length === 0) {
      return { /* empty result */ };
    }
    
    return optimizeShipping(products, container, palletType);
  }, [
    // Stringify the products to ensure proper dependency tracking
    JSON.stringify(products.map(p => ({ 
      id: p.product.id, 
      dimensions: p.product.dimensions, 
      weight: p.product.weight,
      quantity: p.quantity 
    }))),
    JSON.stringify({ container, pallet: palletType })
  ]);
};
```

## Usage Examples

### Basic Optimization

```typescript
import { optimizeShipping } from 'lib/optimization-engine';
import type { Product, Container, Pallet } from 'types';

// Define products
const products: Array<{ product: Product; quantity: number }> = [
  { 
    product: {
      id: 'product-1',
      name: 'Box A',
      sku: 'BOX-A',
      dimensions: { length: 30, width: 20, height: 15, unit: 'cm' },
      weight: 5
    },
    quantity: 10
  },
  // More products...
];

// Define container
const container: Container = {
  length: 580,
  width: 240,
  height: 260,
  max_weight: 26000,
  unit: 'cm'
};

// Define pallet
const pallet: Pallet = {
  length: 120,
  width: 100,
  height: 15,
  weight: 25,
  max_weight: 1500,
  unit: 'cm'
};

// Run optimization
const result = optimizeShipping(products, container, pallet);

// Use the result
console.log(`Utilization: ${result.utilization.toFixed(2)}%`);
console.log(`Pallets used: ${result.palletArrangements.length}`);
console.log(`Remaining products: ${result.remainingProducts.length}`);
```

### React Component Integration

```tsx
import { useOptimization } from 'lib/optimization-engine';
import type { Product, Container, Pallet } from 'types';

const OptimizationComponent = ({ 
  products, 
  container, 
  pallet 
}: { 
  products: Array<{ product: Product; quantity: number }>;
  container: Container;
  pallet: Pallet;
}) => {
  // Use the memoized optimization hook
  const result = useOptimization(products, container, pallet);
  
  if (!result.success) {
    return <div>Optimization failed: {result.message}</div>;
  }
  
  return (
    <div>
      <h2>Optimization Results</h2>
      <p>Container utilization: {result.utilization.toFixed(2)}%</p>
      <p>Pallets used: {result.palletArrangements.length}</p>
      {/* Render visualization or detailed results */}
    </div>
  );
};
```

## Testing

The optimization engine includes comprehensive unit tests covering:

1. **Basic functionality**: Valid inputs produce expected outputs
2. **Edge cases**: Empty product lists, invalid dimensions, oversized products
3. **Weight constraints**: Respecting maximum weight limits
4. **Performance**: Handling large product sets efficiently

Run tests with:

```bash
npx vitest run src/__tests__/lib/optimization-engine.test.ts
```

## Integration with React Components

The optimization engine is designed to work seamlessly with React components:

1. **Memoized Hooks**: `useOptimization` provides memoized results to prevent unnecessary recalculations
2. **Stable Dependencies**: JSON.stringify is used for dependency tracking to prevent unnecessary re-renders
3. **Early Returns**: Quick responses for empty or invalid inputs
4. **Structured Results**: Results are formatted for easy consumption by UI components

For visualization components, the optimization results provide all necessary data for 3D rendering or 2D representations of the packing arrangement.
