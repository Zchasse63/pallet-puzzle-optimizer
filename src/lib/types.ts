/**
 * Product interface representing a product in the system
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  unitsPerPallet: number;
  price?: number; // Price per case in USD
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

/**
 * Search result interface for product search API
 */
export interface SearchResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
