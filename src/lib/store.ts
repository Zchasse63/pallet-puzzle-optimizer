import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { Product } from './types';
import { 
  CONTAINER_CAPACITY_CBM, 
  calculateProductVolume, 
  calculateTotalProductVolume,
  calculateTotalContainerUtilization
} from './api';
import { toast } from 'sonner';

// Define action types and state separately for better organization
type ProductActions = {
  setProducts: (products: Product[]) => void;
  updateQuantity: (id: number, newQuantity: string) => void;
  addProduct: (product: Product) => void;
};

type TabActions = {
  setActiveTab: (tab: string) => void;
};

type UIActions = {
  setIsLoading: (isLoading: boolean) => void;
  setOrderRequested: (orderRequested: boolean) => void;
  optimizeContainer: () => void;
};

// Combine all actions
type Actions = ProductActions & TabActions & UIActions;

// Define state shape
type State = {
  // Product state
  products: Product[];
  
  // Tab state
  activeTab: string;
  
  // Loading states
  isLoading: boolean;
  
  // Derived state (calculated)
  containerUtilization: number;
  totalPallets: number;
  
  // Quote state
  orderRequested: boolean;
};

// Complete app state is the combination of state and actions
type AppState = State & Actions;

// Helper function to calculate derived state values
const calculateDerivedState = (products: Product[]) => ({
  containerUtilization: calculateTotalContainerUtilization(products),
  totalPallets: products
    .filter(p => p.quantity > 0 && p.unitsPerPallet > 0)
    .reduce((sum, p) => sum + Math.ceil(p.quantity / p.unitsPerPallet), 0)
});

// Initial product data
const initialProducts: Product[] = [
  { id: 1, name: "16oz Paper Food Container with Lid", sku: "FC-16OZ", quantity: 120, unitsPerPallet: 50, price: 0.85, dimensions: { length: 0.12, width: 0.12, height: 0.07 } },
  { id: 2, name: "32oz Soup Container with Lid", sku: "SC-32OZ", quantity: 80, unitsPerPallet: 50, price: 1.25, dimensions: { length: 0.15, width: 0.15, height: 0.09 } },
  { id: 3, name: "9-inch Compostable Plate", sku: "CP-9IN", quantity: 160, unitsPerPallet: 50, price: 0.65, dimensions: { length: 0.23, width: 0.23, height: 0.02 } },
  { id: 4, name: "Eco-Friendly Cutlery Set", sku: "ECS-001", quantity: 200, unitsPerPallet: 50, price: 0.45, dimensions: { length: 0.18, width: 0.03, height: 0.02 } },
  { id: 5, name: "Sauce Cups with Lids (2oz)", sku: "SC-2OZ", quantity: 240, unitsPerPallet: 50, price: 0.35, dimensions: { length: 0.05, width: 0.05, height: 0.03 } }
];

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      devtools(
        (set, get) => ({
      // Initial product state
      products: initialProducts,
      
      setProducts: (products) => set({ 
        products,
        ...calculateDerivedState(products)
      }),
      
      updateQuantity: (id, newQuantity) => {
        try {
          // Enforce numeric values and prevent negative quantities
          const parsedQuantity = isNaN(parseInt(newQuantity)) ? 0 : Math.max(0, parseInt(newQuantity));
          
          // Update the product quantity
          const updatedProducts = get().products.map(p =>
            p.id === id ? { ...p, quantity: parsedQuantity } : p
          );
          
          set({ 
            products: updatedProducts,
            ...calculateDerivedState(updatedProducts)
          });
        } catch (error) {
          console.error('Error updating quantity:', error);
          toast.error('Failed to update quantity');
          // Return unchanged state on error is automatic
        }
      },
      
      addProduct: (product) => {
        try {
          // Determine if product already exists in the list
          const existingProductIndex = get().products.findIndex(p => p.id === product.id);
          let updatedProducts;
          
          if (existingProductIndex >= 0) {
            // Update existing product
            updatedProducts = [...get().products];
            updatedProducts[existingProductIndex] = {
              ...updatedProducts[existingProductIndex],
              ...product,
              // If quantity is not specified in the new product, keep the existing quantity
              quantity: product.quantity ?? updatedProducts[existingProductIndex].quantity
            };
          } else {
            // Add new product
            updatedProducts = [...get().products, product];
          }
          
          set({ 
            products: updatedProducts,
            ...calculateDerivedState(updatedProducts)
          });
        } catch (error) {
          console.error('Error adding product:', error);
          toast.error('Failed to add product');
          // Return unchanged state on error is automatic
        }
      },
      
      // Tab state
      activeTab: 'products',
      setActiveTab: (activeTab) => set({ activeTab }),
      
      // Loading states
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),
      
      // Derived state
      ...calculateDerivedState(initialProducts),
      
      // Quote state
      orderRequested: false,
      setOrderRequested: (orderRequested) => set({ orderRequested }),
      
      // Container optimization with enhanced algorithm
      optimizeContainer: () => {
        try {
          const products = [...get().products];
          
          // Calculate current total volume
          const currentVolume = products.reduce((total, product) => {
            return total + calculateTotalProductVolume(product);
          }, 0);
          
          // Calculate remaining space
          const remainingSpace = CONTAINER_CAPACITY_CBM - currentVolume;
          
          if (remainingSpace <= 0) {
            toast.error("Container is already at maximum capacity!");
            return;
          }
          
          // Sort products by volume efficiency (smallest volume per unit first)
          const productsByEfficiency = [...products]
            .filter(p => p.quantity > 0) // Only consider products already in use
            .sort((a, b) => {
              const volumeA = calculateProductVolume(a);
              const volumeB = calculateProductVolume(b);
              return volumeA - volumeB;
            });
        
          if (productsByEfficiency.length === 0) {
            toast.error("Add some products first to optimize the container");
            return;
          }
          
          // Enhanced optimization algorithm
          // 1. First try to balance products based on their current ratios
          // 2. Then fill remaining space with most efficient products
          // 3. Consider pallet efficiency (try to fill complete pallets)
          
          // Calculate current product ratios
          const totalQuantity = productsByEfficiency.reduce((sum, p) => sum + p.quantity, 0);
          const productRatios = productsByEfficiency.map(p => p.quantity / totalQuantity);
          
          // First pass: try to maintain product ratios while increasing quantities
          let spaceLeft = remainingSpace;
          let optimizationsMade = false;
          
          // Calculate how much we can scale all products while maintaining ratios
          const maxScaleFactor = Math.min(
            ...productsByEfficiency.map((p, i) => {
              const additionalUnits = Math.floor(spaceLeft * productRatios[i] / calculateProductVolume(p));
              return 1 + (additionalUnits / p.quantity);
            })
          );
          
          // Apply scaling if it's meaningful (at least 5% increase)
          if (maxScaleFactor > 1.05) {
            productsByEfficiency.forEach((p, i) => {
              const productIndex = products.findIndex(product => product.id === p.id);
              const additionalUnits = Math.floor(p.quantity * (maxScaleFactor - 1));
              
              if (additionalUnits > 0) {
                products[productIndex].quantity += additionalUnits;
                spaceLeft -= additionalUnits * calculateProductVolume(p);
                optimizationsMade = true;
              }
            });
          }
          
          // Second pass: fill remaining space with most efficient products
          // Also consider pallet efficiency - try to complete pallets
          for (const product of productsByEfficiency) {
            const productIndex = products.findIndex(p => p.id === product.id);
            const unitVolume = calculateProductVolume(product);
            
            // Calculate how many more units we can add
            const maxAdditionalUnits = Math.floor(spaceLeft / unitVolume);
            
            if (maxAdditionalUnits > 0) {
              // Check if we can complete a pallet
              const currentPallets = Math.ceil(products[productIndex].quantity / product.unitsPerPallet);
              const unitsToNextPallet = (currentPallets * product.unitsPerPallet) - products[productIndex].quantity;
              
              // If we can complete a pallet and have space, prioritize that
              if (unitsToNextPallet > 0 && unitsToNextPallet <= maxAdditionalUnits) {
                products[productIndex].quantity += unitsToNextPallet;
                spaceLeft -= unitsToNextPallet * unitVolume;
                optimizationsMade = true;
              } else {
                // Otherwise just add as many as possible
                products[productIndex].quantity += maxAdditionalUnits;
                spaceLeft -= maxAdditionalUnits * unitVolume;
                optimizationsMade = true;
              }
            }
          }
          
          if (optimizationsMade) {
            set({ 
              products,
              ...calculateDerivedState(products)
            });
            toast.success("Container space optimized successfully!");
          } else {
            toast.info("No further optimization possible with current products");
          }
        } catch (error) {
          console.error('Error optimizing container:', error);
          toast.error('Failed to optimize container');
        }
      }
    }),
        { name: 'pallet-puzzle-store' }
      ),
      {
        name: 'pallet-puzzle-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          products: state.products,
          activeTab: state.activeTab
        }),
      }
    )
  )
);

// Custom selectors for optimized component rerenders with shallow comparison
export const useProducts = () => useAppStore((state) => state.products);
export const useActiveTab = () => useAppStore((state) => state.setActiveTab);
export const useContainerUtilization = () => useAppStore((state) => state.containerUtilization);
export const useTotalPallets = () => useAppStore((state) => state.totalPallets);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useOrderRequested = () => useAppStore((state) => state.orderRequested);
export const useActiveTabValue = () => useAppStore((state) => state.activeTab);

// Type for product stats to ensure proper TypeScript checking
type ProductStats = {
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
};

// Bulk selectors for product stats using the shallow equality comparison
export const useProductStats = (): ProductStats => {
  return useAppStore(
    (state) => ({
      products: state.products,
      containerUtilization: state.containerUtilization,
      totalPallets: state.totalPallets
    })
  );
};

// Type for product actions to ensure proper TypeScript checking
type ProductActionsType = {
  addProduct: (product: Product) => void;
  updateQuantity: (id: number, newQuantity: string) => void;
  setProducts: (products: Product[]) => void;
  optimizeContainer: () => void;
};

// Custom hooks that use shallow equality for efficient rerenders
export const useProductActions = (): ProductActionsType => {
  return useAppStore(
    (state) => ({
      addProduct: state.addProduct,
      updateQuantity: state.updateQuantity,
      setProducts: state.setProducts,
      optimizeContainer: state.optimizeContainer
    })
  );
};

// Type for UI actions to ensure proper TypeScript checking
type UIActionsType = {
  setActiveTab: (tab: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setOrderRequested: (orderRequested: boolean) => void;
};

// UI action hooks for better component organization
export const useUIActions = (): UIActionsType => {
  return useAppStore(
    (state) => ({
      setActiveTab: state.setActiveTab,
      setIsLoading: state.setIsLoading,
      setOrderRequested: state.setOrderRequested
    })
  );
};
