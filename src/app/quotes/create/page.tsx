'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Container, Pallet, OptimizationResult, OptimizationFormData } from '@/types';
import { optimizeShipping, validateProductsForOptimization } from '@/lib/optimization-engine';
import { toast } from 'sonner';
import { z } from 'zod';
import { Package, Truck, Save, ArrowLeft, Plus, Minus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/contexts/SupabaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Form validation schema
const optimizationSchema = z.object({
  container_length: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Container length must be a positive number' }
  ),
  container_width: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Container width must be a positive number' }
  ),
  container_height: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Container height must be a positive number' }
  ),
  container_max_weight: z.string().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: 'Max weight must be a valid number' }
  ),
  container_unit: z.enum(['cm', 'in', 'mm']),
  products: z.array(
    z.object({
      product_id: z.string().min(1, 'Product is required'),
      quantity: z.string().refine(
        (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
        { message: 'Quantity must be a positive integer' }
      )
    })
  ).min(1, 'At least one product is required')
});

export default function CreateQuotePage() {
  const router = useRouter();
  const { user } = useSupabase();
  
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<OptimizationFormData>({
    container_length: '1200',
    container_width: '240',
    container_height: '260',
    container_max_weight: '25000',
    container_unit: 'cm',
    products: [{ product_id: '', quantity: '1' }]
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof OptimizationFormData, string>>>({});
  const [productErrors, setProductErrors] = useState<Array<{ product_id?: string; quantity?: string }>>([{}]);
  
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [generalError, setGeneralError] = useState('');
  
  // Fetch available products
  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setLoadError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setAvailableProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setLoadError(err.message || 'Failed to load products');
      toast.error('Failed to load products', {
        description: err.message || 'Please try again later',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };
  
  const handleContainerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof OptimizationFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleProductChange = (index: number, field: 'product_id' | 'quantity', value: string) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
    
    // Clear error when user makes a change
    const updatedErrors = [...productErrors];
    if (updatedErrors[index] && updatedErrors[index][field]) {
      updatedErrors[index] = { ...updatedErrors[index], [field]: undefined };
      setProductErrors(updatedErrors);
    }
  };
  
  const addProductRow = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { product_id: '', quantity: '1' }]
    }));
    
    setProductErrors((prev) => [...prev, {}]);
  };
  
  const removeProductRow = (index: number) => {
    if (formData.products.length <= 1) {
      return; // Keep at least one product row
    }
    
    const updatedProducts = [...formData.products];
    updatedProducts.splice(index, 1);
    
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
    
    const updatedErrors = [...productErrors];
    updatedErrors.splice(index, 1);
    setProductErrors(updatedErrors);
  };
  
  const validateForm = (): boolean => {
    try {
      optimizationSchema.parse(formData);
      setFormErrors({});
      setProductErrors(Array(formData.products.length).fill({}));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newFormErrors: Partial<Record<keyof OptimizationFormData, string>> = {};
        const newProductErrors = Array(formData.products.length).fill({}).map(() => ({ product_id: '', quantity: '' }));
        
        error.errors.forEach((err) => {
          const path = err.path;
          
          if (path.length === 1) {
            // Top-level form error
            newFormErrors[path[0] as keyof OptimizationFormData] = err.message;
          } else if (path.length === 3 && path[0] === 'products') {
            // Product-specific error
            const index = parseInt(path[1] as string);
            const field = path[2] as 'product_id' | 'quantity';
            
            if (!isNaN(index) && index >= 0 && index < newProductErrors.length) {
              newProductErrors[index][field] = err.message;
            }
          }
        });
        
        setFormErrors(newFormErrors);
        setProductErrors(newProductErrors);
      }
      return false;
    }
  };
  
  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isOptimizing) return;
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the form errors before optimizing');
      return;
    }
    
    setGeneralError('');
    setIsOptimizing(true);
    setOptimizationResult(null);
    
    try {
      // Prepare data for optimization
      const container: Container = {
        length: parseFloat(formData.container_length),
        width: parseFloat(formData.container_width),
        height: parseFloat(formData.container_height),
        max_weight: formData.container_max_weight ? parseFloat(formData.container_max_weight) : undefined,
        unit: formData.container_unit
      };
      
      const productsForOptimization = formData.products.map(item => {
        const product = availableProducts.find(p => p.id === item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        return {
          product,
          quantity: parseInt(item.quantity)
        };
      });
      
      // Validate products for optimization
      const { valid, invalidProducts } = validateProductsForOptimization(productsForOptimization);
      
      if (!valid) {
        throw new Error(`The following products have invalid dimensions: ${invalidProducts.join(', ')}`);
      }
      
      // Run optimization
      const result = optimizeShipping(productsForOptimization, container);
      
      // Store result
      setOptimizationResult(result);
      
      // Show success message
      toast.success('Optimization completed successfully');
      
    } catch (err: any) {
      console.error('Optimization error:', err);
      setGeneralError(err.message || 'Failed to optimize');
      toast.error('Optimization failed', {
        description: err.message || 'Please try again later',
      });
    } finally {
      setIsOptimizing(false);
    }
  };
  
  const handleSaveQuote = async () => {
    if (!optimizationResult || !user) return;
    
    try {
      // Generate a unique quote number
      const quoteNumber = `Q-${Date.now().toString().slice(-8)}`;
      
      // Prepare quote data
      const quoteData = {
        quote_number: quoteNumber,
        status: 'draft',
        products: formData.products.map(item => {
          const product = availableProducts.find(p => p.id === item.product_id);
          return {
            product_id: item.product_id,
            product_name: product?.name || 'Unknown Product',
            quantity: parseInt(item.quantity),
            price: product?.price,
            dimensions: product?.dimensions,
            weight: product?.weight
          };
        }),
        container_utilization: optimizationResult.utilization,
        total_pallets: optimizationResult.palletArrangements.length,
        user_id: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('quotes')
        .insert(quoteData)
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success('Quote saved successfully');
      
      // Redirect to the quote details page
      router.push(`/quotes/${data.id}`);
      
    } catch (err: any) {
      console.error('Error saving quote:', err);
      toast.error('Failed to save quote', {
        description: err.message || 'Please try again later',
      });
    }
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              Create New Quote
            </h1>
            <Link
              href="/quotes"
              className="inline-flex items-center px-3 py-1.5 border border-white rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Quotes
            </Link>
          </div>
          
          {loadError ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-4">{loadError}</div>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <form onSubmit={handleOptimize} className="p-6 space-y-6">
              {generalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {generalError}
                </div>
              )}
              
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-gray-500" />
                  Container Dimensions
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Container Length */}
                  <div>
                    <label htmlFor="container_length" className="block text-sm font-medium text-gray-700">
                      Length <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      type="text"
                      id="container_length"
                      name="container_length"
                      value={formData.container_length}
                      onChange={handleContainerChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.container_length ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.container_length}
                      aria-describedby={formErrors.container_length ? 'container_length_error' : undefined}
                    />
                    {formErrors.container_length && (
                      <p id="container_length_error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.container_length}</p>
                    )}
                  </div>
                  
                  {/* Container Width */}
                  <div>
                    <label htmlFor="container_width" className="block text-sm font-medium text-gray-700">
                      Width <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      type="text"
                      id="container_width"
                      name="container_width"
                      value={formData.container_width}
                      onChange={handleContainerChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.container_width ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.container_width}
                      aria-describedby={formErrors.container_width ? 'container_width_error' : undefined}
                    />
                    {formErrors.container_width && (
                      <p id="container_width_error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.container_width}</p>
                    )}
                  </div>
                  
                  {/* Container Height */}
                  <div>
                    <label htmlFor="container_height" className="block text-sm font-medium text-gray-700">
                      Height <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(required)</span>
                    </label>
                    <input
                      type="text"
                      id="container_height"
                      name="container_height"
                      value={formData.container_height}
                      onChange={handleContainerChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.container_height ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.container_height}
                      aria-describedby={formErrors.container_height ? 'container_height_error' : undefined}
                    />
                    {formErrors.container_height && (
                      <p id="container_height_error" className="mt-1 text-sm text-red-600" role="alert">{formErrors.container_height}</p>
                    )}
                  </div>
                  
                  {/* Container Max Weight */}
                  <div>
                    <label htmlFor="container_max_weight" className="block text-sm font-medium text-gray-700">
                      Max Weight
                    </label>
                    <input
                      type="text"
                      id="container_max_weight"
                      name="container_max_weight"
                      value={formData.container_max_weight}
                      onChange={handleContainerChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.container_max_weight ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                    />
                    {formErrors.container_max_weight && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.container_max_weight}</p>
                    )}
                  </div>
                  
                  {/* Container Unit */}
                  <div>
                    <label htmlFor="container_unit" className="block text-sm font-medium text-gray-700">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="container_unit"
                      name="container_unit"
                      value={formData.container_unit}
                      onChange={handleContainerChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="in">Inches (in)</option>
                      <option value="mm">Millimeters (mm)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-gray-900 flex items-center">
                    <Package className="mr-2 h-5 w-5 text-gray-500" />
                    Products
                  </h2>
                  <button
                    type="button"
                    onClick={addProductRow}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="mr-1.5 h-4 w-4 text-gray-500" />
                    Add Product
                  </button>
                </div>
                
                {isLoadingProducts ? (
                  <div className="flex justify-center items-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading products...</span>
                  </div>
                ) : availableProducts.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
                    <p>No products available. Please add products first.</p>
                    <Link 
                      href="/products/add" 
                      className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                    >
                      Add your first product
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.products.map((product, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="flex-grow">
                          <label htmlFor={`product_${index}`} className="sr-only">
                            Product
                          </label>
                          <select
                            id={`product_${index}`}
                            value={product.product_id}
                            onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                            className={`block w-full rounded-md shadow-sm ${
                              productErrors[index]?.product_id ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                          >
                            <option value="">Select a product</option>
                            {availableProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {productErrors[index]?.product_id && (
                            <p className="mt-1 text-sm text-red-600">{productErrors[index].product_id}</p>
                          )}
                        </div>
                        
                        <div className="w-32">
                          <label htmlFor={`quantity_${index}`} className="sr-only">
                            Quantity
                          </label>
                          <div className="flex rounded-md shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = parseInt(product.quantity);
                                if (currentQty > 1) {
                                  handleProductChange(index, 'quantity', (currentQty - 1).toString());
                                }
                              }}
                              className="inline-flex items-center px-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <input
                              type="text"
                              id={`quantity_${index}`}
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none ${
                                productErrors[index]?.quantity ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                              }`}
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentQty = parseInt(product.quantity);
                                handleProductChange(index, 'quantity', (currentQty + 1).toString());
                              }}
                              className="inline-flex items-center px-2 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {productErrors[index]?.quantity && (
                            <p className="mt-1 text-sm text-red-600">{productErrors[index].quantity}</p>
                          )}
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeProductRow(index)}
                          className="inline-flex items-center p-2 border border-transparent rounded-full text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          disabled={formData.products.length <= 1}
                        >
                          <Trash2 className="h-5 w-5" />
                          <span className="sr-only">Remove</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-5">
                <button
                  type="submit"
                  disabled={isOptimizing || isLoadingProducts || availableProducts.length === 0}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  aria-label="Run optimization with current settings"
                  aria-busy={isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <span>Run Optimization</span>
                  )}
                </button>
              </div>
            </form>
          )}
          
          {optimizationResult && (
            <section 
              className="border-t border-gray-200 p-6" 
              aria-labelledby="optimization-results-heading"
              role="region"
            >
              <h2 
                id="optimization-results-heading" 
                className="text-lg font-medium text-gray-900 mb-4"
                tabIndex={-1} // Allow focus but not in tab order
              >
                Optimization Results
              </h2>
              
              <div 
                className="bg-gray-50 p-4 rounded-lg mb-6"
                aria-label="Optimization summary statistics"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className="bg-white p-4 rounded-md shadow-sm"
                    role="group"
                    aria-labelledby="container-utilization-label"
                  >
                    <div 
                      id="container-utilization-label"
                      className="text-sm font-medium text-gray-700"
                    >
                      Container Utilization
                    </div>
                    <div 
                      className="text-2xl font-bold text-blue-700"
                      aria-live="polite"
                    >
                      {optimizationResult.utilization.toFixed(2)}%
                      <span className="sr-only"> container space utilized</span>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-white p-4 rounded-md shadow-sm"
                    role="group"
                    aria-labelledby="total-pallets-label"
                  >
                    <div 
                      id="total-pallets-label"
                      className="text-sm font-medium text-gray-700"
                    >
                      Total Pallets
                    </div>
                    <div 
                      className="text-2xl font-bold text-blue-700"
                      aria-live="polite"
                    >
                      {optimizationResult.palletArrangements.length}
                      <span className="sr-only"> pallets used in this arrangement</span>
                    </div>
                  </div>
                  
                  <div 
                    className="bg-white p-4 rounded-md shadow-sm"
                    role="group"
                    aria-labelledby="total-weight-label"
                  >
                    <div 
                      id="total-weight-label"
                      className="text-sm font-medium text-gray-700"
                    >
                      Total Weight
                    </div>
                    <div 
                      className="text-2xl font-bold text-blue-700"
                      aria-live="polite"
                    >
                      {optimizationResult.palletArrangements.reduce((total, pallet) => total + pallet.weight, 0).toFixed(2)} kg
                      <span className="sr-only"> total weight of all products</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 
                  id="pallet-arrangement-heading" 
                  className="text-md font-medium text-gray-900 mb-2"
                >
                  Pallet Arrangement
                </h3>
                <div 
                  className="bg-white border border-gray-200 rounded-md overflow-hidden"
                  role="region"
                  aria-labelledby="pallet-arrangement-heading"
                >
                  <table 
                    className="min-w-full divide-y divide-gray-200"
                    aria-describedby="pallet-arrangement-heading"
                  >
                    <caption className="sr-only">
                      Table showing the arrangement of pallets in the container, including their positions and products loaded on each pallet.
                    </caption>
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Pallet ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Position
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Products
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {optimizationResult.palletArrangements.map((pallet, palletIndex) => (
                        <tr key={palletIndex}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {palletIndex + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            <span aria-label={`Position coordinates for pallet ${palletIndex + 1}`}>
                              Utilization: {pallet.utilization.toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <ul className="list-disc list-inside" aria-label={`Products on pallet ${palletIndex + 1}`}>
                              {pallet.arrangement.map((item, idx) => {
                                const productData = availableProducts.find(p => p.id === item.product_id);
                                const productName = productData?.name || item.product_id;
                                return (
                                  <li key={idx}>
                                    {productName} × {item.quantity}
                                    <span className="sr-only"> units</span>
                                  </li>
                                );
                              })}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveQuote}
                  className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  aria-label="Save quote with optimization results"
                >
                  <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  Save Quote
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
