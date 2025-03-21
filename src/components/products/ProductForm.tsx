'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, ProductFormData } from '@/types';
import { toast } from 'sonner';
import { z } from 'zod';
import { Package, ArrowLeft, Save, Info } from 'lucide-react';
import Link from 'next/link';
import { useSupabase } from '@/contexts/SupabaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { announceToScreenReader } from '@/utils/accessibility';

// Enhanced form validation schema using Zod
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    { message: 'Price must be a non-negative number' }
  ),
  length: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Length must be a positive number greater than zero' }
  ),
  width: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Width must be a positive number greater than zero' }
  ),
  height: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    { message: 'Height must be a positive number greater than zero' }
  ),
  unit: z.enum(['cm', 'in', 'mm']),
  weight: z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    { message: 'Weight must be a non-negative number' }
  ),
  units_per_pallet: z.string().refine(
    (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
    { message: 'Units per pallet must be a non-negative integer' }
  ),
});

interface ProductFormProps {
  productId?: string;
}

export default function ProductForm({ productId }: ProductFormProps) {
  const router = useRouter();
  const { user } = useSupabase();
  const isEditMode = !!productId;
  
  const [formData, setFormData] = useState<ProductFormData>({
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
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);
  const [generalError, setGeneralError] = useState('');
  const [showDimensionHelp, setShowDimensionHelp] = useState(false);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      fetchProduct(productId);
    }
  }, [isEditMode, productId]);

  const fetchProduct = async (id: string) => {
    try {
      setIsFetching(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setFormData({
          name: data.name,
          sku: data.sku,
          description: data.description || '',
          price: data.price?.toString() || '',
          length: data.dimensions?.length?.toString() || '',
          width: data.dimensions?.width?.toString() || '',
          height: data.dimensions?.height?.toString() || '',
          unit: data.dimensions?.unit || 'cm',
          weight: data.weight?.toString() || '',
          units_per_pallet: data.units_per_pallet?.toString() || '',
        });
      }
    } catch (err: any) {
      console.error('Error fetching product:', err);
      toast.error('Failed to load product', {
        description: err.message || 'Please try again later',
      });
      setGeneralError('Failed to load product data');
    } finally {
      setIsFetching(false);
    }
  };

  // Enhanced change handler with unit conversion support
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for unit changes to convert dimensions
    if (name === 'unit' && value !== formData.unit) {
      const prevUnit = formData.unit;
      const newUnit = value as 'cm' | 'in' | 'mm';
      
      // Only convert if we have valid dimensions
      const length = parseFloat(formData.length);
      const width = parseFloat(formData.width);
      const height = parseFloat(formData.height);
      
      if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
        // Convert to the new unit
        const convertedDimensions = convertDimensions(
          { length, width, height },
          prevUnit,
          newUnit
        );
        
        setFormData((prev) => ({
          ...prev,
          unit: newUnit,
          length: convertedDimensions.length.toFixed(2),
          width: convertedDimensions.width.toFixed(2),
          height: convertedDimensions.height.toFixed(2)
        }));
      } else {
        // Just update the unit if we don't have valid dimensions to convert
        setFormData((prev) => ({ ...prev, unit: newUnit }));
      }
    } else {
      // Regular field update
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (formErrors[name as keyof ProductFormData]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  
  // Helper function to convert dimensions between units
  const convertDimensions = (
    dimensions: { length: number; width: number; height: number },
    fromUnit: 'cm' | 'in' | 'mm',
    toUnit: 'cm' | 'in' | 'mm'
  ) => {
    // First convert to cm as the standard unit
    let lengthInCm = dimensions.length;
    let widthInCm = dimensions.width;
    let heightInCm = dimensions.height;
    
    // Convert from source unit to cm
    if (fromUnit === 'in') {
      lengthInCm *= 2.54; // 1 inch = 2.54 cm
      widthInCm *= 2.54;
      heightInCm *= 2.54;
    } else if (fromUnit === 'mm') {
      lengthInCm /= 10; // 1 cm = 10 mm
      widthInCm /= 10;
      heightInCm /= 10;
    }
    
    // Convert from cm to target unit
    if (toUnit === 'in') {
      return {
        length: lengthInCm / 2.54,
        width: widthInCm / 2.54,
        height: heightInCm / 2.54
      };
    } else if (toUnit === 'mm') {
      return {
        length: lengthInCm * 10,
        width: widthInCm * 10,
        height: heightInCm * 10
      };
    }
    
    // Return as cm if toUnit is cm
    return { length: lengthInCm, width: widthInCm, height: heightInCm };
  };

  // Enhanced validation with more detailed error messages
  const validateForm = (): boolean => {
    try {
      // Run schema validation
      productSchema.parse(formData);
      
      // Additional validation for dimension relationships
      const length = parseFloat(formData.length);
      const width = parseFloat(formData.width);
      const height = parseFloat(formData.height);
      
      // Check if dimensions are too small for practical use
      // Convert to cm for consistent validation
      const unit = formData.unit;
      const minDimension = unit === 'cm' ? 0.1 : unit === 'mm' ? 1 : 0.04; // 1mm, 0.1cm, or 0.04in
      
      const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
      
      if (length < minDimension) {
        newErrors.length = `Length is too small for ${unit} measurement`;
      }
      
      if (width < minDimension) {
        newErrors.width = `Width is too small for ${unit} measurement`;
      }
      
      if (height < minDimension) {
        newErrors.height = `Height is too small for ${unit} measurement`;
      }
      
      // If we found any additional errors
      if (Object.keys(newErrors).length > 0) {
        setFormErrors(newErrors);
        return false;
      }
      
      // Clear errors if validation passes
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof ProductFormData;
          newErrors[path] = err.message;
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  };

  // Accessibility announcements are now handled by the imported utility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    // Validate form
    if (!validateForm()) {
      const errorMessage = 'Please fix the form errors before submitting';
      toast.error(errorMessage);
      announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
      return;
    }
    
    setGeneralError('');
    setIsLoading(true);
    
    try {
      // Convert form data to product object with enhanced validation
      const productData: Product = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description ? formData.description.trim() : undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        dimensions: {
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          unit: formData.unit,
        },
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        units_per_pallet: formData.units_per_pallet ? parseInt(formData.units_per_pallet) : undefined,
      };
      
      // Additional validation to ensure all required dimensions are valid numbers
      if (isNaN(productData.dimensions.length) || 
          isNaN(productData.dimensions.width) || 
          isNaN(productData.dimensions.height)) {
        throw new Error('Invalid dimensions: all dimensions must be valid numbers');
      }
      
      // Always call Supabase first before any UI updates to ensure proper error handling
      let result;
      
      if (isEditMode) {
        // Update existing product
        result = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .eq('user_id', user?.id); // Security: ensure user owns the product
      } else {
        // Insert new product
        result = await supabase
          .from('products')
          .insert({
            ...productData,
            user_id: user?.id,
            created_at: new Date().toISOString(),
            is_active: true
          });
      }
      
      const { error } = result;
      
      if (error) {
        // Handle specific error cases
        if (error.code === '23505') { // Unique constraint violation
          throw new Error('A product with this SKU already exists');
        } else {
          // Handle general API error
          const errorMessage = error.message || 'Failed to save product';
          throw new Error(errorMessage);
        }
      }
      
      // Handle success case
      const successMessage = isEditMode ? 'Product updated successfully' : 'Product added successfully';
      toast.success(successMessage);
      announceToScreenReader(successMessage);
      
      // Redirect to products list with action parameter
      router.push(`/products?action=${isEditMode ? 'updated' : 'added'}`);
      
    } catch (err: any) {
      // Enhanced error handling with proper console logging
      console.error('Error saving product:', err);
      
      // Set error message for UI display
      const errorMessage = err.message || (isEditMode ? 'Failed to update product' : 'Failed to add product');
      setGeneralError(errorMessage);
      
      // Toast notification for user feedback
      toast.error(errorMessage);
      
      // Accessibility announcement
      announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
          <Link
            href="/products"
            className="inline-flex items-center px-3 py-1.5 border border-white rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Products
          </Link>
        </div>
        
        {isFetching ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading product data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {generalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {generalError}
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
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
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
                />
                {formErrors.sku && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.sku}</p>
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
                  />
                </div>
                {formErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Dimensions</h3>
                  <button 
                    type="button"
                    onClick={() => setShowDimensionHelp(!showDimensionHelp)}
                    className="text-blue-600 hover:text-blue-800 mb-3 flex items-center text-sm"
                  >
                    <Info className="h-4 w-4 mr-1" />
                    {showDimensionHelp ? 'Hide help' : 'Dimension help'}
                  </button>
                </div>
                
                {showDimensionHelp && (
                  <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-800">
                    <p className="font-medium mb-1">Dimension Guidelines:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>All dimensions must be positive numbers greater than zero</li>
                      <li>Changing the unit will automatically convert your dimensions</li>
                      <li>For accurate optimization, use precise measurements</li>
                      <li>Minimum values: 0.1cm / 1mm / 0.04in</li>
                    </ul>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Length */}
                  <div>
                    <label htmlFor="length" className="block text-sm font-medium text-gray-700">
                      Length <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
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
                        aria-describedby="length-unit"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                        <span className="text-gray-500 text-sm" id="length-unit">{formData.unit}</span>
                      </div>
                    </div>
                    {formErrors.length && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.length}</p>
                    )}
                  </div>
                  
                  {/* Width */}
                  <div>
                    <label htmlFor="width" className="block text-sm font-medium text-gray-700">
                      Width <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
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
                        aria-describedby="width-unit"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                        <span className="text-gray-500 text-sm" id="width-unit">{formData.unit}</span>
                      </div>
                    </div>
                    {formErrors.width && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.width}</p>
                    )}
                  </div>
                  
                  {/* Height */}
                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                      Height <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
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
                        aria-describedby="height-unit"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-1">
                        <span className="text-gray-500 text-sm" id="height-unit">{formData.unit}</span>
                      </div>
                    </div>
                    {formErrors.height && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.height}</p>
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
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    kg
                  </span>
                </div>
                {formErrors.weight && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.weight}</p>
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
                />
                {formErrors.units_per_pallet && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.units_per_pallet}</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-5">
              <Link
                href="/products"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-1.5 h-4 w-4" />
                    {isEditMode ? 'Update Product' : 'Save Product'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </ProtectedRoute>
  );
}
