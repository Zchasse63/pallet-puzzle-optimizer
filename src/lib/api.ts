import { Product, SearchResult } from './types';

// Standard volume per case in cubic meters (CBM)
export const STANDARD_CASE_VOLUME = 0.05;

// Container capacity in cubic meters (CBM)
export const CONTAINER_CAPACITY_CBM = 68;

/**
 * Calculate the volume of a product in cubic meters
 * Each case has a standard volume of 0.05 CBM
 */
export const calculateProductVolume = (product: Product): number => {
  return STANDARD_CASE_VOLUME;
};

/**
 * Calculate the total volume occupied by a product based on quantity
 */
export const calculateTotalProductVolume = (product: Product): number => {
  return calculateProductVolume(product) * product.quantity;
};

/**
 * Calculate the percentage of container space used by a product
 * @returns Percentage value with 1 decimal place precision
 */
export const calculateContainerPercentage = (product: Product): number => {
  const totalVolume = calculateTotalProductVolume(product);
  return parseFloat(((totalVolume / CONTAINER_CAPACITY_CBM) * 100).toFixed(1));
};

/**
 * Calculate the total container utilization for all products
 * @returns Percentage value with 1 decimal place precision
 */
export const calculateTotalContainerUtilization = (products: Product[]): number => {
  const totalVolume = products.reduce((sum, product) => {
    return sum + calculateTotalProductVolume(product);
  }, 0);
  
  return parseFloat(((totalVolume / CONTAINER_CAPACITY_CBM) * 100).toFixed(1));
};

/**
 * Mock product catalog data - Food service takeout items
 * In a real application, this would come from a database or API
 */
/**
 * Product catalog with standardized values:
 * - Each product has exactly 0.05 CBM per case
 * - Each pallet holds exactly 50 cases
 * - Each product has a price defined
 * - Special service items (shipping, import duties) have a price of $1.00 and no pallet info
 */
const productCatalog: Product[] = [
  // Regular products
  { 
    id: 1, 
    name: "16oz Paper Food Container with Lid", 
    sku: "FC-16OZ", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 2.50,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 2, 
    name: "32oz Soup Container with Lid", 
    sku: "SC-32OZ", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 3.25,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 3, 
    name: "9-inch Compostable Plate", 
    sku: "CP-9IN", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 1.95,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 4, 
    name: "3-Compartment Meal Container", 
    sku: "MC-3C", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 3.75,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 5, 
    name: "Eco-Friendly Cutlery Set", 
    sku: "ECS-001", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 1.50,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 6, 
    name: "Insulated Pizza Delivery Box", 
    sku: "PB-14IN", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 4.95,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 7, 
    name: "Drink Carrier (4-cup)", 
    sku: "DC-4C", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 2.25,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 8, 
    name: "Paper Napkins (500 count)", 
    sku: "PN-500", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 3.99,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 9, 
    name: "Sauce Cups with Lids (2oz)", 
    sku: "SC-2OZ", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 1.25,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 10, 
    name: "Kraft Paper Bags (Medium)", 
    sku: "KB-MED", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 2.15,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 11, 
    name: "Biodegradable Straws (Wrapped)", 
    sku: "BS-WRAP", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 1.85,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 12, 
    name: "Deli Container with Lid (8oz)", 
    sku: "DC-8OZ", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 2.35,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 13, 
    name: "Catering Tray with Lid", 
    sku: "CT-FULL", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 5.45,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 14, 
    name: "Hot Cup Sleeves", 
    sku: "HCS-001", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 1.15,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  { 
    id: 15, 
    name: "Salad Bowl with Lid (32oz)", 
    sku: "SB-32OZ", 
    quantity: 0, 
    unitsPerPallet: 50, 
    price: 3.65,
    dimensions: { length: 0.5, width: 0.2, height: 0.5 } // 0.05 CBM
  },
  
  // Special service items (no pallet info required)
  { 
    id: 16, 
    name: "Shipping & Handling", 
    sku: "SRV-SHIP", 
    quantity: 0, 
    unitsPerPallet: 0, // Not applicable for service items
    price: 1.00,
    dimensions: { length: 0, width: 0, height: 0 } // No physical dimensions
  },
  { 
    id: 17, 
    name: "Import Duties", 
    sku: "SRV-DUTY", 
    quantity: 0, 
    unitsPerPallet: 0, // Not applicable for service items
    price: 1.00,
    dimensions: { length: 0, width: 0, height: 0 } // No physical dimensions
  }
];

/**
 * Search products in the catalog based on a search term
 * This is a mock implementation that simulates an API call
 * 
 * @param searchTerm The search term to filter products by
 * @param page Optional page number for pagination
 * @param pageSize Optional page size for pagination
 * @returns Promise with search results
 */
export const searchProducts = async (
  searchTerm: string,
  page: number = 1,
  pageSize: number = 10
): Promise<Product[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Filter products based on search term (case insensitive)
  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  const filteredProducts = productCatalog.filter(product => 
    product.name.toLowerCase().includes(normalizedSearchTerm) ||
    product.sku.toLowerCase().includes(normalizedSearchTerm)
  );
  
  // In a real app, we would implement proper pagination here
  return filteredProducts;
};

/**
 * Get a product by its ID
 * 
 * @param id The product ID
 * @returns The product or undefined if not found
 */
export const getProductById = (id: number): Product | undefined => {
  return productCatalog.find(product => product.id === id);
};
