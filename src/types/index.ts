// Database Types
export interface Product {
  id?: string;
  name: string;
  sku: string;
  description?: string;
  price?: number;
  dimensions: ProductDimensions;
  weight?: number;
  units_per_pallet?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface Quote {
  id?: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  products: QuoteProduct[];
  container_utilization?: number;
  total_pallets?: number;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  expires_at?: string;
  view_count?: number;
  share_count?: number;
}

export interface QuoteProduct {
  product_id: string;
  product_name: string;
  quantity: number;
  price?: number;
  dimensions?: ProductDimensions;
  weight?: number;
}

// Optimization Engine Types

/**
 * Position in 3D space
 */
export interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * Rotation options for products and pallets
 */
export type Rotation = { x: number; y: number; z: number } | 'length-width' | 'width-length';

/**
 * Space representation for optimization calculations
 */
export interface Space {
  length: number;
  width: number;
  height: number;
  occupied: boolean[][][];
}

/**
 * Generic type for standardized dimensions
 */
export type StandardizedItem<T> = Omit<T, 'unit'> & { 
  length: number; 
  width: number; 
  height: number; 
  unit: 'cm' 
};

export interface Container {
  length: number;
  width: number;
  height: number;
  max_weight?: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface Pallet {
  length: number;
  width: number;
  height: number;
  weight: number;
  max_weight?: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface OptimizationResult {
  success: boolean;
  message?: string;
  utilization: number;
  palletArrangements: PalletArrangement[];
  remainingProducts: Array<{ product: Product; quantity: number }>;
}

export interface PalletArrangement {
  pallet: Pallet;
  arrangement: {
    product_id: string;
    position: Position;
    rotation: { x: number; y: number; z: number };
    quantity: number;
  }[];
  weight: number;
  utilization: number;
}

export interface ProductArrangement {
  product_id: string;
  quantity: number;
  arrangement: {
    x: number;
    y: number;
    z: number;
    rotation: 'length-width' | 'width-length';
  }[];
}

// Form Types
export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  price: string;
  length: string;
  width: string;
  height: string;
  unit: 'cm' | 'in' | 'mm';
  weight: string;
  units_per_pallet: string;
}

export interface OptimizationFormData {
  container_length: string;
  container_width: string;
  container_height: string;
  container_max_weight: string;
  container_unit: 'cm' | 'in' | 'mm';
  products: {
    product_id: string;
    quantity: string;
  }[];
}
