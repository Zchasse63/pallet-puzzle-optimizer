import { memoize, standardizeDimensions } from './utils';
import type {
  Product,
  Container,
  Pallet,
  Position,
  Rotation,
  ProductPlacement,
  PalletArrangement,
  OptimizationResult,
  OptimizationSummary
} from '@/types';

/**
 * Validates products for optimization
 */
export const validateProductsForOptimization = memoize((
  products: Array<{ product: Product; quantity: number }>
): { valid: boolean; invalidProducts: string[] } => {
  const invalidProducts: string[] = [];
  
  for (const { product } of products) {
    // Check if dimensions exist
    if (!product.dimensions) {
      invalidProducts.push(product.name || product.id);
      continue;
    }
    
    const { length, width, height } = product.dimensions;
    
    // Check for valid dimensions
    if (
      typeof length !== 'number' ||
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      length <= 0 ||
      width <= 0 ||
      height <= 0
    ) {
      invalidProducts.push(product.name || product.id);
    }
  }
  
  return {
    valid: invalidProducts.length === 0,
    invalidProducts
  };
});

/**
 * Standardizes dimensions to centimeters
 */
const standardizeItem = <T extends { length: number; width: number; height: number; unit: 'cm' | 'in' | 'mm' }>(
  item: T
): T => {
  return {
    ...item,
    length: standardizeDimensions(item.length, item.unit),
    width: standardizeDimensions(item.width, item.unit),
    height: standardizeDimensions(item.height, item.unit),
    unit: 'cm' as const
  };
};

/**
 * Sorts products by volume (descending)
 */
const sortProductsByVolume = (
  products: Array<{ product: Product; quantity: number }>
): Array<{ product: Product; quantity: number }> => {
  return [...products].sort((a, b) => {
    const volumeA = a.product.dimensions.length * a.product.dimensions.width * a.product.dimensions.height;
    const volumeB = b.product.dimensions.length * b.product.dimensions.width * b.product.dimensions.height;
    return volumeB - volumeA;
  });
};

/**
 * Checks if a product can fit at a position with a specific rotation
 */
const canFit = (
  product: { length: number; width: number; height: number },
  position: Position,
  rotation: Rotation,
  pallet: { length: number; width: number; height: number },
  occupiedSpace: boolean[][][]
): boolean => {
  // Apply rotation to get actual dimensions
  let length, width, height;
  
  if (typeof rotation === 'object') {
    // Handle 3D rotation
    if (rotation.x === 90 || rotation.x === 270) {
      [height, length, width] = [product.length, product.height, product.width];
    } else if (rotation.y === 90 || rotation.y === 270) {
      [width, height, length] = [product.length, product.width, product.height];
    } else if (rotation.z === 90 || rotation.z === 270) {
      [length, width, height] = [product.width, product.length, product.height];
    } else {
      [length, width, height] = [product.length, product.width, product.height];
    }
  } else {
    // Handle simple rotation
    if (rotation === 'length-width') {
      [length, width, height] = [product.length, product.width, product.height];
    } else {
      [length, width, height] = [product.width, product.length, product.height];
    }
  }
  
  // Check if product fits within pallet boundaries
  if (
    position.x + length > pallet.length ||
    position.y + width > pallet.width ||
    position.z + height > pallet.height
  ) {
    return false;
  }
  
  // Check if space is already occupied
  for (let x = position.x; x < position.x + length; x++) {
    for (let y = position.y; y < position.y + width; y++) {
      for (let z = position.z; z < position.z + height; z++) {
        if (occupiedSpace[x][y][z]) {
          return false;
        }
      }
    }
  }
  
  return true;
};

/**
 * Finds the best position for a product on a pallet
 */
const findBestPosition = (
  product: { length: number; width: number; height: number },
  pallet: { length: number; width: number; height: number },
  occupiedSpace: boolean[][][]
): { position: Position; rotation: Rotation } | null => {
  // Define possible rotations
  const rotations: Rotation[] = [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 90 },
    { x: 90, y: 0, z: 0 },
    { x: 0, y: 90, z: 0 }
  ];
  
  // Try each position and rotation
  for (let z = 0; z < pallet.height; z++) {
    for (let y = 0; y < pallet.width; y++) {
      for (let x = 0; x < pallet.length; x++) {
        const position = { x, y, z };
        
        for (const rotation of rotations) {
          if (canFit(product, position, rotation, pallet, occupiedSpace)) {
            return { position, rotation };
          }
        }
      }
    }
  }
  
  return null;
};

/**
 * Places a product on a pallet and updates the occupied space
 */
const placeProduct = (
  product: { length: number; width: number; height: number },
  position: Position,
  rotation: Rotation,
  occupiedSpace: boolean[][][]
): void => {
  // Apply rotation to get actual dimensions
  let length, width, height;
  
  if (typeof rotation === 'object') {
    // Handle 3D rotation
    if (rotation.x === 90 || rotation.x === 270) {
      [height, length, width] = [product.length, product.height, product.width];
    } else if (rotation.y === 90 || rotation.y === 270) {
      [width, height, length] = [product.length, product.width, product.height];
    } else if (rotation.z === 90 || rotation.z === 270) {
      [length, width, height] = [product.width, product.length, product.height];
    } else {
      [length, width, height] = [product.length, product.width, product.height];
    }
  } else {
    // Handle simple rotation
    if (rotation === 'length-width') {
      [length, width, height] = [product.length, product.width, product.height];
    } else {
      [length, width, height] = [product.width, product.length, product.height];
    }
  }
  
  // Mark space as occupied
  for (let x = position.x; x < position.x + length; x++) {
    for (let y = position.y; y < position.y + width; y++) {
      for (let z = position.z; z < position.z + height; z++) {
        occupiedSpace[x][y][z] = true;
      }
    }
  }
};

/**
 * Calculates space utilization
 */
const calculateUtilization = (
  placements: ProductPlacement[],
  products: Record<string, Product>,
  pallet: { length: number; width: number; height: number }
): number => {
  let totalVolume = 0;
  const palletVolume = pallet.length * pallet.width * pallet.height;
  
  for (const placement of placements) {
    const product = products[placement.product_id];
    if (product) {
      const productVolume = product.dimensions.length * product.dimensions.width * product.dimensions.height;
      totalVolume += productVolume * placement.quantity;
    }
  }
  
  return (totalVolume / palletVolume) * 100;
};

/**
 * Optimizes product placement on a pallet
 */
const optimizePallet = (
  products: Array<{ product: Product; quantity: number }>,
  pallet: Pallet,
  productMap: Record<string, Product>
): {
  placements: ProductPlacement[];
  remainingProducts: Array<{ product: Product; quantity: number }>;
  weight: number;
  utilization: number;
} => {
  // Standardize pallet dimensions
  const standardPallet = standardizeItem(pallet);
  
  // Initialize occupied space
  const occupiedSpace: boolean[][][] = Array(Math.ceil(standardPallet.length))
    .fill(null)
    .map(() => 
      Array(Math.ceil(standardPallet.width))
        .fill(null)
        .map(() => Array(Math.ceil(standardPallet.height)).fill(false))
    );
  
  const placements: ProductPlacement[] = [];
  const remainingProducts: Array<{ product: Product; quantity: number }> = [];
  let currentWeight = pallet.weight; // Start with pallet weight
  
  // Process each product
  for (const { product, quantity } of products) {
    const standardProduct = standardizeItem(product.dimensions);
    
    let remainingQuantity = quantity;
    
    // Try to place each unit of the product
    for (let i = 0; i < quantity; i++) {
      // Check if adding this product would exceed weight limit
      if (currentWeight + product.weight > pallet.max_weight) {
        remainingQuantity = quantity - i;
        break;
      }
      
      // Find best position for this product
      const result = findBestPosition(
        standardProduct,
        standardPallet,
        occupiedSpace
      );
      
      if (result) {
        // Place product
        placeProduct(
          standardProduct,
          result.position,
          result.rotation,
          occupiedSpace
        );
        
        // Add to placements
        placements.push({
          product_id: product.id,
          position: result.position,
          rotation: result.rotation,
          quantity: 1
        });
        
        // Update weight
        currentWeight += product.weight;
      } else {
        // Couldn't fit this product
        remainingQuantity = quantity - i;
        break;
      }
    }
    
    // Add remaining quantity to remainingProducts
    if (remainingQuantity > 0) {
      remainingProducts.push({
        product,
        quantity: remainingQuantity
      });
    }
  }
  
  // Calculate utilization
  const utilization = calculateUtilization(placements, productMap, standardPallet);
  
  return {
    placements,
    remainingProducts,
    weight: currentWeight,
    utilization
  };
};

/**
 * Main optimization function
 */
export const optimizeShipping = memoize((
  products: Array<{ product: Product; quantity: number }>,
  container: Container,
  palletType: Pallet = {
    length: 120,
    width: 100,
    height: 15,
    weight: 25,
    max_weight: 1500,
    unit: 'cm'
  }
): OptimizationResult => {
  // Validate inputs
  if (!products || products.length === 0) {
    return {
      success: false,
      message: 'No products to optimize',
      utilization: 0,
      palletArrangements: [],
      remainingProducts: []
    };
  }
  
  const validation = validateProductsForOptimization(products);
  if (!validation.valid) {
    return {
      success: false,
      message: `Invalid product dimensions: ${validation.invalidProducts.join(', ')}`,
      utilization: 0,
      palletArrangements: [],
      remainingProducts: products
    };
  }
  
  // Create a map of products for quick lookup
  const productMap: Record<string, Product> = {};
  for (const { product } of products) {
    productMap[product.id] = product;
  }
  
  // Sort products by volume (largest first)
  const sortedProducts = sortProductsByVolume(products);
  
  // Initialize result
  const palletArrangements: PalletArrangement[] = [];
  let remainingProducts = [...sortedProducts];
  let containerWeight = 0;
  let containerUtilization = 0;
  
  // Continue optimizing until no more products can be placed or container is full
  while (remainingProducts.length > 0) {
    // Check if adding another pallet would exceed container weight
    if (containerWeight + palletType.weight > container.max_weight) {
      break;
    }
    
    // Optimize pallet
    const {
      placements,
      remainingProducts: newRemainingProducts,
      weight: palletWeight,
      utilization: palletUtilization
    } = optimizePallet(remainingProducts, palletType, productMap);
    
    // If no products were placed, break
    if (placements.length === 0) {
      break;
    }
    
    // Add pallet to arrangements
    palletArrangements.push({
      pallet: palletType,
      arrangement: placements,
      weight: palletWeight,
      utilization: palletUtilization
    });
    
    // Update container weight
    containerWeight += palletWeight;
    
    // Update remaining products
    remainingProducts = newRemainingProducts;
  }
  
  // Calculate overall container utilization
  if (palletArrangements.length > 0) {
    const totalUtilization = palletArrangements.reduce(
      (sum, pallet) => sum + pallet.utilization,
      0
    );
    containerUtilization = totalUtilization / palletArrangements.length;
  }
  
  return {
    success: true,
    utilization: containerUtilization,
    palletArrangements,
    remainingProducts
  };
});

/**
 * Prepares a summary of optimization results
 */
export const prepareOptimizationSummary = (
  result: OptimizationResult
): OptimizationSummary => {
  if (!result) {
    return {
      success: false,
      message: 'No optimization result available',
      utilization: 0,
      totalPallets: 0,
      totalProducts: 0,
      remainingProducts: 0
    };
  }
  
  // Count total products placed
  let totalProductsPlaced = 0;
  for (const pallet of result.palletArrangements) {
    for (const placement of pallet.arrangement) {
      totalProductsPlaced += placement.quantity;
    }
  }
  
  // Count total remaining products
  let totalRemainingProducts = 0;
  for (const { quantity } of result.remainingProducts) {
    totalRemainingProducts += quantity;
  }
  
  // Calculate weight utilization if available
  let weightUtilization;
  if (result.palletArrangements.length > 0) {
    const pallet = result.palletArrangements[0].pallet;
    const avgWeight = result.palletArrangements.reduce(
      (sum, p) => sum + p.weight,
      0
    ) / result.palletArrangements.length;
    
    weightUtilization = (avgWeight / pallet.max_weight) * 100;
  }
  
  return {
    success: result.success,
    message: result.message,
    utilization: result.utilization,
    totalPallets: result.palletArrangements.length,
    totalProducts: totalProductsPlaced,
    remainingProducts: totalRemainingProducts,
    weightUtilization
  };
};