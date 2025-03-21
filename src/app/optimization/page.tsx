'use client';

import { useState } from 'react';
import { Container } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductSelectionForm } from '@/components/optimization/ProductSelectionForm';
import { ContainerSelectionForm } from '@/components/optimization/ContainerSelectionForm';
import { OptimizationResults } from '@/components/optimization/OptimizationResults';
import { useOptimization } from '@/lib/optimization-engine';
import { toast } from 'sonner';
import { Package, Truck, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OptimizationPage() {
  const router = useRouter();
  const { user } = useSupabase();
  
  // State for selected products and quantities
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product_id: string; quantity: number }>>([]);
  
  // State for container dimensions
  const [container, setContainer] = useState<Container>({
    length: 1200,
    width: 240,
    height: 240,
    max_weight: 25000,
    unit: 'cm'
  });
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('products');
  
  // State to track if optimization has been run
  const [hasOptimized, setHasOptimized] = useState(false);
  
  // Get optimization results using the hook from the optimization engine
  const optimizationResult = useOptimization(
    selectedProducts.map(sp => ({
      product: { id: sp.product_id } as any, // We'll fetch the full product in the component
      quantity: sp.quantity
    })),
    container
  );
  
  // Handle running the optimization
  const handleRunOptimization = () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }
    
    setHasOptimized(true);
    setActiveTab('results');
    toast.success('Optimization complete');
  };
  
  // Handle creating a quote from optimization results
  const handleCreateQuote = () => {
    if (!hasOptimized) {
      toast.error('Please run optimization first');
      return;
    }
    
    // Store optimization data in localStorage for the quote page
    localStorage.setItem('optimizationData', JSON.stringify({
      products: selectedProducts,
      container,
      result: optimizationResult
    }));
    
    // Navigate to quote creation page
    router.push('/quotes/add');
  };
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Optimization</h1>
            <p className="text-muted-foreground mt-1">
              Optimize your product loading for shipping
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/products')}
            >
              Manage Products
            </Button>
            <Button 
              variant="default" 
              onClick={handleCreateQuote}
              disabled={!hasOptimized}
            >
              Create Quote
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="products" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              <span>Select Products</span>
            </TabsTrigger>
            <TabsTrigger value="container" className="flex items-center">
              <Truck className="mr-2 h-4 w-4" />
              <span>Configure Container</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center" disabled={!hasOptimized}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>View Results</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Select Products</CardTitle>
                <CardDescription>
                  Choose products and quantities to optimize for shipping
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSelectionForm 
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                  onNext={() => setActiveTab('container')}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="container">
            <Card>
              <CardHeader>
                <CardTitle>Configure Container</CardTitle>
                <CardDescription>
                  Set the dimensions and constraints for your shipping container
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContainerSelectionForm 
                  container={container}
                  setContainer={setContainer}
                  onBack={() => setActiveTab('products')}
                  onOptimize={handleRunOptimization}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Results</CardTitle>
                <CardDescription>
                  View the results of your container optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizationResults 
                  result={optimizationResult}
                  container={container}
                  selectedProducts={selectedProducts}
                  onCreateQuote={handleCreateQuote}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
