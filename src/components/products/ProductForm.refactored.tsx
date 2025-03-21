'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { Package, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { motion } from 'framer-motion';

// Custom hooks
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/hooks/useProducts';
import { useFormValidation } from '@/hooks/useFormValidation';

// Utilities
import { announceToScreenReader } from '@/utils/accessibility';

// Form validation schema using Zod
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.string().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: 'Price must be a valid number' }
  ),
  length: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Length must be a positive number' }
  ),
  width: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Width must be a positive number' }
  ),
  height: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Height must be a positive number' }
  ),
  unit: z.enum(['cm', 'in', 'mm']),
  weight: z.string().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: 'Weight must be a valid number' }
  ),
  units_per_pallet: z.string().refine(
    (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
    { message: 'Units per pallet must be a non-negative integer' }
  ),
}) as z.ZodType<ProductFormData>;

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

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const isEditMode = !!productId;
  
  // Use our custom hooks
  const { 
    createProduct, 
    updateProduct, 
    getProductById 
  } = useProducts({ announceChanges: false });
  
  const initialFormData: ProductFormData = {
    name: '',
    sku: '',
    description: '',
    price: '',
    length: '',
    width: '',
    height: '',
    unit: 'cm',
    weight: '',
    units_per_pallet: '',
  };
  
  const {
    formData,
    setFormData,
    formErrors,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    validateForm,
    setFormErrors
  } = useFormValidation<ProductFormData>({
    initialValues: initialFormData,
    validationSchema: productSchema
  });
  
  const [isFetching, setIsFetching] = useState(isEditMode);
  // Structured error state with multiple error categories
  const [errors, setErrors] = useState<{
    general: string;
    api: string;
    validation: string;
    system: string;
  }>({ general: '', api: '', validation: '', system: '' });
  
  // Helper to set a specific error type
  const setError = (type: keyof typeof errors, message: string) => {
    setErrors(prev => ({ ...prev, [type]: message }));
  };
  
  // Clear all errors
  const clearErrors = () => {
    setErrors({ general: '', api: '', validation: '', system: '' });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };
  
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, [isEditMode, productId]);

  /**
   * Fetches a product by ID and populates the form with its data
   * Implements robust error handling with categorization and user feedback
   */
  const fetchProduct = async (id: string) => {
    try {
      setIsFetching(true);
      clearErrors();
      
      const result = await getProductById(id);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const product = result.data;
      
      if (product) {
        // Map product data to form fields, handling optional values safely
        setFormData({
          name: product.name,
          sku: product.sku || '',
          description: product.description || '',
          price: (product as any).price?.toString() || '',
          length: product.dimensions?.length?.toString() || '',
          width: product.dimensions?.width?.toString() || '',
          height: product.dimensions?.height?.toString() || '',
          unit: (product as any).unit || 'cm',
          weight: product.weight?.toString() || '',
          units_per_pallet: (product as any).units_per_pallet?.toString() || '',
        });
        
        announceToScreenReader('Product loaded successfully', 'polite');
      } else {
        // Handle unexpected case of success but no data returned
        throw new Error('Product not found or data is incomplete');
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      
      // Determine error category based on error type
      const errorMessage = err.message || 'Failed to load product data';
      const isNetwork = err.name === 'NetworkError' || err.message?.includes('network');
      const isNotFound = err.message?.includes('not found') || err.status === 404;
      
      // Set appropriate error category
      if (isNetwork) {
        setError('api', errorMessage);
      } else if (isNotFound) {
        setError('api', 'Product not found. It may have been deleted.');
      } else {
        setError('system', errorMessage);
      }
      
      // Also set general error for the UI
      setError('general', errorMessage);
      
      // User feedback via toast
      toast.error('Failed to load product', {
        description: err.message || 'Please try again later',
      });
      
      // Accessibility announcement
      announceToScreenReader(`Error: ${err.message || 'Failed to load product'}`, 'assertive');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      const errorMessage = 'Please fix the form errors before submitting';
      toast.error(errorMessage);
      setError('validation', errorMessage);
      announceToScreenReader('Form has errors. Please fix them before submitting.', 'assertive');
      return;
    }
    
    clearErrors();
    setIsSubmitting(true);
    
    try {
      // Convert form data to product object
      const productData: Partial<Product> & Record<string, any> = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || undefined,
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height)
        },
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        is_active: true, // Default to active
      };
      
      // Add custom properties that aren't in the Product interface
      // These will be handled by the backend
      const customData = {
        price: formData.price ? parseFloat(formData.price) : undefined,
        unit: formData.unit,
        units_per_pallet: formData.units_per_pallet ? parseInt(formData.units_per_pallet) : undefined
      };
      
      let result;
      
      // Merge the product data with custom data for API submission
      const submissionData = { ...productData, ...customData };
      
      if (isEditMode && productId) {
        // Update existing product
        result = await updateProduct(productId, submissionData);
      } else {
        // Insert new product
        result = await createProduct(submissionData);
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Show success toast
      toast.success(isEditMode ? 'Product updated successfully' : 'Product created successfully');
      
      // Announce success
      announceToScreenReader(
        isEditMode ? 'Product updated successfully' : 'Product created successfully', 
        'polite'
      );
      
      // Redirect to products list with action parameter
      router.push(`/products?action=${isEditMode ? 'updated' : 'added'}`);
      
    } catch (err: any) {
      // Enhanced error handling with proper console logging and error categorization
      console.error('Error saving product:', err);
      
      // Determine error type and set appropriate message
      const errorMessage = err.message || (isEditMode ? 'Failed to update product' : 'Failed to add product');
      const errorType = err.name === 'NetworkError' ? 'api' : 'system';
      
      // Set both general error and specific error type
      setError('general', errorMessage);
      setError(errorType as keyof typeof errors, errorMessage);
      
      // Toast notification for user feedback
      toast.error(errorMessage);
      
      // Accessibility announcement
      announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
      
      // For critical errors, add telemetry logging in production
      if (process.env.NODE_ENV === 'production') {
        // Future implementation: log to monitoring system
        console.error('CRITICAL ERROR:', { 
          component: 'ProductForm', 
          action: isEditMode ? 'update' : 'create',
          error: err,
          user: 'authenticated', // In future, add user context
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <motion.div 
        className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <Link
            href="/products"
            className="inline-flex items-center px-3 py-1.5 border border-white rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Back to products list"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Back to Products
          </Link>
        </div>
        
        {isFetching ? (
          <div className="p-8 flex justify-center items-center" aria-live="polite">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
            <span className="ml-2 text-gray-600">Loading product data...</span>
          </div>
        ) : (
          <motion.form 
            onSubmit={handleSubmit} 
            className="p-6 space-y-6"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Error display section with enhanced accessibility and visual feedback */}
            {(errors.general || errors.api || errors.validation || errors.system) && (
              <div 
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
                role="alert"
                aria-live="assertive"
                data-testid="form-error-container"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-medium">{errors.general || errors.api || errors.validation || errors.system}</span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter product name"
                  aria-required="true"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600" id="name-error">{formErrors.name}</p>
                )}
              </div>
              
              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.sku ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="Enter product SKU"
                  aria-required="true"
                  aria-invalid={!!formErrors.sku}
                  aria-describedby={formErrors.sku ? "sku-error" : undefined}
                />
                {formErrors.sku && (
                  <p className="mt-1 text-sm text-red-600" id="sku-error">{formErrors.sku}</p>
                )}
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className={`pl-7 block w-full rounded-md shadow-sm ${
                      formErrors.price ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="0.00"
                    aria-invalid={!!formErrors.price}
                    aria-describedby={formErrors.price ? "price-error" : undefined}
                  />
                </div>
                {formErrors.price && (
                  <p className="mt-1 text-sm text-red-600" id="price-error">{formErrors.price}</p>
                )}
              </div>
              
              {/* Description */}
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter product description"
                />
              </div>
              
              <div className="col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dimensions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Length */}
                  <div>
                    <label htmlFor="length" className="block text-sm font-medium text-gray-700">
                      Length <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="length"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.length ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.length}
                      aria-describedby={formErrors.length ? "length-error" : undefined}
                    />
                    {formErrors.length && (
                      <p className="mt-1 text-sm text-red-600" id="length-error">{formErrors.length}</p>
                    )}
                  </div>
                  
                  {/* Width */}
                  <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                      Width <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="width"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.width ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.width}
                      aria-describedby={formErrors.width ? "width-error" : undefined}
                    />
                    {formErrors.width && (
                      <p className="mt-1 text-sm text-red-600" id="width-error">{formErrors.width}</p>
                    )}
                  </div>
                  
                  {/* Height */}
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                      Height <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="height"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      className={`mt-1 block w-full rounded-md shadow-sm ${
                        formErrors.height ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="0.0"
                      aria-required="true"
                      aria-invalid={!!formErrors.height}
                      aria-describedby={formErrors.height ? "height-error" : undefined}
                    />
                    {formErrors.height && (
                      <p className="mt-1 text-sm text-red-600" id="height-error">{formErrors.height}</p>
                    )}
                  </div>
                  
                  {/* Unit */}
                  <div>
                    <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                      Unit <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      aria-required="true"
                    >
                      <option value="cm">Centimeters (cm)</option>
                      <option value="in">Inches (in)</option>
                      <option value="mm">Millimeters (mm)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Weight */}
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    type="text"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className={`flex-1 rounded-none rounded-l-md ${
                      formErrors.weight ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="0.0"
                    aria-invalid={!!formErrors.weight}
                    aria-describedby={formErrors.weight ? "weight-error" : undefined}
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    kg
                  </span>
                </div>
                {formErrors.weight && (
                  <p className="mt-1 text-sm text-red-600" id="weight-error">{formErrors.weight}</p>
                )}
              </div>
              
              {/* Units per Pallet */}
              <div>
                <label htmlFor="units_per_pallet" className="block text-sm font-medium text-gray-700">
                  Units per Pallet
                </label>
                <input
                  type="text"
                  id="units_per_pallet"
                  name="units_per_pallet"
                  value={formData.units_per_pallet}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    formErrors.units_per_pallet ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                  placeholder="0"
                  aria-invalid={!!formErrors.units_per_pallet}
                  aria-describedby={formErrors.units_per_pallet ? "units-error" : undefined}
                />
                {formErrors.units_per_pallet && (
                  <p className="mt-1 text-sm text-red-600" id="units-error">{formErrors.units_per_pallet}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-5">
              <Link
                href="/products"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                aria-label="Cancel and return to products list"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></span>
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    {isEditMode ? 'Update Product' : 'Save Product'}
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </motion.div>
    </ProtectedRoute>
  );
}
