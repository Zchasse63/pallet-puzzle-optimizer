// Product Types
export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'mm';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  dimensions: ProductDimensions;
  weight: number;
  units_per_pallet?: number;
  created_at: string;
  updated_at: string;
}

// Container Types
export interface Container {
  length: number;
  width: number;
  height: number;
  max_weight: number;
  unit: 'cm' | 'in' | 'mm';
}

// Pallet Types
export interface Pallet {
  length: number;
  width: number;
  height: number;
  weight: number;
  max_weight: number;
  unit: 'cm' | 'in' | 'mm';
}

// Optimization Types
export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface ProductPlacement {
  product_id: string;
  position: Position;
  rotation: Rotation;
  quantity: number;
}

export interface PalletArrangement {
  pallet: Pallet;
  arrangement: ProductPlacement[];
  weight: number;
  utilization: number;
}

export interface OptimizationResult {
  success: boolean;
  message?: string;
  utilization: number;
  palletArrangements: PalletArrangement[];
  remainingProducts: Array<{ product: Product; quantity: number }>;
}

export interface OptimizationSummary {
  success: boolean;
  message?: string;
  utilization: number;
  totalPallets: number;
  totalProducts: number;
  remainingProducts: number;
  weightUtilization?: number;
}

// Quote Types
export interface QuoteProduct {
  product_id: string;
  quantity: number;
  price?: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  products: QuoteProduct[];
  container_utilization: number;
  total_pallets: number;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// Email Types
export interface EmailLog {
  id: string;
  quote_id: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  error_message?: string;
  sent_at: string;
}