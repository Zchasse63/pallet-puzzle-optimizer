'use client';

import { useState } from 'react';
import { Container } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Info, ArrowLeft, Calculator } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

// Common container presets
const CONTAINER_PRESETS = {
  '20ft': {
    length: 590,
    width: 235,
    height: 239,
    max_weight: 21770,
    unit: 'cm' as const
  },
  '40ft': {
    length: 1203,
    width: 235,
    height: 239,
    max_weight: 26780,
    unit: 'cm' as const
  },
  '40ft_high_cube': {
    length: 1203,
    width: 235,
    height: 270,
    max_weight: 26330,
    unit: 'cm' as const
  },
  'custom': {
    length: 0,
    width: 0,
    height: 0,
    max_weight: 0,
    unit: 'cm' as const
  }
};

// Form validation schema
const containerSchema = z.object({
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
  max_weight: z.string().refine(
    (val) => !val || !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: 'Max weight must be a non-negative number' }
  ),
  unit: z.enum(['cm', 'in', 'mm'])
});

interface ContainerSelectionFormProps {
  container: Container;
  setContainer: React.Dispatch<React.SetStateAction<Container>>;
  onBack: () => void;
  onOptimize: () => void;
}

export function ContainerSelectionForm({
  container,
  setContainer,
  onBack,
  onOptimize
}: ContainerSelectionFormProps) {
  const [formData, setFormData] = useState({
    length: container.length.toString(),
    width: container.width.toString(),
    height: container.height.toString(),
    max_weight: container.max_weight?.toString() || '',
    unit: container.unit
  });
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [showDimensionHelp, setShowDimensionHelp] = useState(false);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof typeof formData]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Set preset to custom when user modifies values
    setSelectedPreset('custom');
  };
  
  // Handle unit change
  const handleUnitChange = (value: 'cm' | 'in' | 'mm') => {
    const prevUnit = formData.unit;
    const newUnit = value;
    
    // Convert dimensions to the new unit
    const length = parseFloat(formData.length);
    const width = parseFloat(formData.width);
    const height = parseFloat(formData.height);
    
    if (!isNaN(length) && !isNaN(width) && !isNaN(height)) {
      const convertedDimensions = convertDimensions(
        { length, width, height },
        prevUnit,
        newUnit
      );
      
      setFormData(prev => ({
        ...prev,
        unit: newUnit,
        length: convertedDimensions.length.toFixed(2),
        width: convertedDimensions.width.toFixed(2),
        height: convertedDimensions.height.toFixed(2)
      }));
    } else {
      setFormData(prev => ({ ...prev, unit: newUnit }));
    }
    
    // Set preset to custom when unit changes
    setSelectedPreset('custom');
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
  
  // Handle preset selection
  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    
    if (preset !== 'custom') {
      const selectedPreset = CONTAINER_PRESETS[preset as keyof typeof CONTAINER_PRESETS];
      setFormData({
        length: selectedPreset.length.toString(),
        width: selectedPreset.width.toString(),
        height: selectedPreset.height.toString(),
        max_weight: selectedPreset.max_weight.toString(),
        unit: selectedPreset.unit
      });
      
      // Clear any errors
      setFormErrors({});
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    try {
      containerSchema.parse(formData);
      setFormErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof typeof formData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof typeof formData;
          newErrors[path] = err.message;
        });
        setFormErrors(newErrors);
      }
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Update container state with form data
    setContainer({
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      max_weight: formData.max_weight ? parseFloat(formData.max_weight) : undefined,
      unit: formData.unit
    });
    
    // Run optimization
    onOptimize();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Container presets */}
      <div className="space-y-2">
        <Label>Container Preset</Label>
        <Select value={selectedPreset} onValueChange={handlePresetChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a container preset" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20ft">20ft Standard Container</SelectItem>
            <SelectItem value="40ft">40ft Standard Container</SelectItem>
            <SelectItem value="40ft_high_cube">40ft High Cube Container</SelectItem>
            <SelectItem value="custom">Custom Dimensions</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Container dimensions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Container Dimensions</h3>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDimensionHelp(!showDimensionHelp)}
              className="flex items-center text-sm"
            >
              <Info className="h-4 w-4 mr-1" />
              {showDimensionHelp ? 'Hide help' : 'Show help'}
            </Button>
          </div>
          
          {showDimensionHelp && (
            <div className="bg-blue-50 p-3 rounded-md mb-4 text-sm text-blue-800">
              <p className="font-medium mb-1">Container Guidelines:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All dimensions must be positive numbers</li>
                <li>Standard 20ft container: 590 × 235 × 239 cm</li>
                <li>Standard 40ft container: 1203 × 235 × 239 cm</li>
                <li>High cube 40ft container: 1203 × 235 × 270 cm</li>
                <li>Changing the unit will automatically convert your dimensions</li>
              </ul>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Length */}
            <div className="space-y-2">
              <Label htmlFor="length">
                Length <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="length"
                  name="length"
                  value={formData.length}
                  onChange={handleChange}
                  className={formErrors.length ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                  placeholder="0.0"
                  aria-describedby="length-unit"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm" id="length-unit">{formData.unit}</span>
                </div>
              </div>
              {formErrors.length && (
                <p className="text-sm text-red-600">{formErrors.length}</p>
              )}
            </div>
            
            {/* Width */}
            <div className="space-y-2">
              <Label htmlFor="width">
                Width <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="width"
                  name="width"
                  value={formData.width}
                  onChange={handleChange}
                  className={formErrors.width ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                  placeholder="0.0"
                  aria-describedby="width-unit"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm" id="width-unit">{formData.unit}</span>
                </div>
              </div>
              {formErrors.width && (
                <p className="text-sm text-red-600">{formErrors.width}</p>
              )}
            </div>
            
            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">
                Height <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  className={formErrors.height ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                  placeholder="0.0"
                  aria-describedby="height-unit"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm" id="height-unit">{formData.unit}</span>
                </div>
              </div>
              {formErrors.height && (
                <p className="text-sm text-red-600">{formErrors.height}</p>
              )}
            </div>
            
            {/* Max Weight */}
            <div className="space-y-2">
              <Label htmlFor="max_weight">
                Maximum Weight
              </Label>
              <div className="relative">
                <Input
                  id="max_weight"
                  name="max_weight"
                  value={formData.max_weight}
                  onChange={handleChange}
                  className={formErrors.max_weight ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}
                  placeholder="0.0"
                  aria-describedby="weight-unit"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm" id="weight-unit">kg</span>
                </div>
              </div>
              {formErrors.max_weight && (
                <p className="text-sm text-red-600">{formErrors.max_weight}</p>
              )}
            </div>
          </div>
          
          {/* Unit selection */}
          <div className="mt-4">
            <Label htmlFor="unit">
              Unit <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.unit} onValueChange={(value: 'cm' | 'in' | 'mm') => handleUnitChange(value)}>
              <SelectTrigger id="unit">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="in">Inches (in)</SelectItem>
                <SelectItem value="mm">Millimeters (mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {/* Action buttons */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        
        <Button
          type="submit"
          className="flex items-center"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Run Optimization
        </Button>
      </div>
    </form>
  );
}
