'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Package, 
  Pencil, 
  Trash2, 
  Search, 
  ArrowUpDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';

// Custom hooks
import { useProducts, Product } from '@/hooks/useProducts';

// Utilities
import { generateA11yId, announceToScreenReader } from '@/utils/accessibility';

export default function ProductList() {
  const router = useRouter();
  const { 
    products, 
    isLoading, 
    error, 
    deleteProduct,
    formatDate
  } = useProducts({ announceChanges: true });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'sku' | 'created_at' | 'weight'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  // Generate unique IDs for accessibility
  const productsTableId = useRef(generateA11yId('products-table')).current;
  const searchInputId = useRef(generateA11yId('product-search')).current;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Check URL params for success messages
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get('action');
    
    if (action === 'added') {
      toast.success('Product added successfully');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (action === 'updated') {
      toast.success('Product updated successfully');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSort = (field: 'name' | 'sku' | 'created_at' | 'weight') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      setIsDeleting(id);
      const result = await deleteProduct(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success('Product deleted successfully');
      announceToScreenReader('Product deleted successfully', 'polite');
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error('Failed to delete product', {
        description: err.message || 'Please try again later',
      });
      announceToScreenReader(`Error: ${err.message || 'Failed to delete product'}`, 'assertive');
    } finally {
      setIsDeleting(null);
    }
  };

  // Sort and filter products
  const sortedAndFilteredProducts = [...products]
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      // Type-safe way to access properties
      let aValue: string | number | null = null;
      let bValue: string | number | null = null;
      
      // Get values based on sort field
      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'sku':
          aValue = a.sku || '';
          bValue = b.sku || '';
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'weight':
          aValue = a.weight || 0;
          bValue = b.weight || 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }

      if (aValue === null || aValue === undefined) return sortDirection === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortDirection === 'asc' ? 1 : -1;

      return sortDirection === 'asc' 
        ? (aValue < bValue ? -1 : 1) 
        : (bValue < aValue ? -1 : 1);
    });

  // Format dimensions for display
  const formatDimensions = (dimensions: { length: number; width: number; height: number; unit?: string }) => {
    if (!dimensions) return 'N/A';
    const { length, width, height, unit = 'cm' } = dimensions;
    return `${length} × ${width} × ${height} ${unit}`;
  };

  return (
    <ProtectedRoute>
      <motion.div 
        className="bg-white shadow-md rounded-lg overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="p-4 border-b">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              id={searchInputId}
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search products"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-8" aria-live="polite">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" aria-hidden="true" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center p-8 text-red-500" role="alert">
            <AlertCircle className="h-6 w-6 mr-2" aria-hidden="true" />
            {error}
          </div>
        ) : sortedAndFilteredProducts.length === 0 ? (
          <div className="text-center p-8 text-gray-500" aria-live="polite">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" aria-hidden="true" />
            <p className="mb-2">
              {searchTerm ? 'No products match your search' : 'No products found'}
            </p>
            <Link 
              href="/products/add" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Add your first product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table 
              className="min-w-full divide-y divide-gray-200"
              id={productsTableId}
              aria-label="Products table"
            >
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                    aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center">
                      <span>Name</span>
                      {sortField === 'name' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('sku')}
                    aria-sort={sortField === 'sku' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center">
                      <span>SKU</span>
                      {sortField === 'sku' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dimensions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                    aria-sort={sortField === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <div className="flex items-center">
                      <span>Units/Pallet</span>
                      {sortField === 'name' && (
                        <ArrowUpDown className="ml-1 h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredProducts.map((product) => (
                  <motion.tr 
                    key={product.id} 
                    className="hover:bg-gray-50"
                    variants={itemVariants}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDimensions(product.dimensions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.weight ? `${product.weight} kg` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(product as any).units_per_pallet || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/products/edit/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4 inline" aria-hidden="true" />
                        <span className="sr-only">Edit</span>
                      </Link>
                      <button
                        onClick={() => product.id && handleDelete(product.id)}
                        disabled={isDeleting === product.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        aria-label={`Delete ${product.name}`}
                        aria-busy={isDeleting === product.id}
                      >
                        {isDeleting === product.id ? (
                          <Loader2 className="h-4 w-4 inline animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-4 w-4 inline" aria-hidden="true" />
                        )}
                        <span className="sr-only">Delete</span>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </ProtectedRoute>
  );
}
