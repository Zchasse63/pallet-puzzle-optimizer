import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { handleError } from '@/utils/errorHandling';
import { announceToScreenReader } from '@/utils/accessibility';
import { SupabaseClient } from '@supabase/supabase-js';

// Define the Product type
export interface Product {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  weight: number;
  user_id: string;
  is_active: boolean;
  category: string | null;
  sku: string | null;
}

type ProductFilter = 'all' | 'active' | 'inactive';

interface UseProductsOptions {
  limit?: number;
  filter?: ProductFilter;
  announceChanges?: boolean;
}

/**
 * Custom hook for managing products
 * Centralizes product data fetching and manipulation
 */
export function useProducts(options: UseProductsOptions = {}) {
  const { 
    limit = undefined, 
    filter = 'all',
    announceChanges = true
  } = options;
  
  const { user, supabase } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Format date for display
   */
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);
  
  /**
   * Fetch products from the database
   */
  const fetchProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);
      
      // Apply filter
      if (filter === 'active') {
        query = query.eq('is_active', true);
      } else if (filter === 'inactive') {
        query = query.eq('is_active', false);
      }
      
      // Apply ordering
      query = query.order('created_at', { ascending: false });
      
      // Apply limit if specified
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error: supabaseError } = await query;
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setProducts(data || []);
      
      // Announce to screen readers if enabled
      if (announceChanges) {
        if (data && data.length > 0) {
          announceToScreenReader(`Loaded ${data.length} products`, 'polite');
        } else {
          announceToScreenReader('No products found', 'polite');
        }
      }
    } catch (err) {
      const processedError = handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to load products'
      });
      
      setError(processedError.message);
      
      if (announceChanges) {
        announceToScreenReader(`Error: ${processedError.message}`, 'assertive');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, limit, filter, announceChanges]);
  
  /**
   * Create a new product
   */
  const createProduct = useCallback(async (productData: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .insert([
          { 
            ...productData,
            user_id: user.id,
            created_at: new Date().toISOString(),
            is_active: productData.is_active !== undefined ? productData.is_active : true
          }
        ])
        .select();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh products
      fetchProducts();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to create product'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchProducts]);
  
  /**
   * Update an existing product
   */
  const updateProduct = useCallback(async (id: string, productData: Partial<Product>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure user owns the product
        .select();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh products
      fetchProducts();
      
      return { success: true, data: data?.[0] };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to update product'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchProducts]);
  
  /**
   * Delete a product
   */
  const deleteProduct = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { error: supabaseError } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Security: ensure user owns the product
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      // Refresh products
      fetchProducts();
      
      return { success: true };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: true,
        logToConsole: true,
        defaultMessage: 'Failed to delete product'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase, fetchProducts]);
  
  /**
   * Get a single product by ID
   */
  const getProductById = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: ensure user owns the product
        .single();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      return { success: true, data };
    } catch (err) {
      const processedError = handleError(err, {
        showToast: false,
        logToConsole: true,
        defaultMessage: 'Failed to fetch product'
      });
      
      return { success: false, error: processedError.message };
    }
  }, [user, supabase]);
  
  /**
   * Toggle product active status
   */
  const toggleProductStatus = useCallback(async (id: string, isActive: boolean) => {
    return updateProduct(id, { is_active: isActive });
  }, [updateProduct]);
  
  // Fetch products on mount and when dependencies change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return {
    products,
    isLoading,
    error,
    formatDate,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    toggleProductStatus
  };
}

export default useProducts;
