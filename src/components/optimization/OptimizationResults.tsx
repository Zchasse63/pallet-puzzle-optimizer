'use client';

import { useEffect, useState } from 'react';
import { Container, OptimizationResult, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Truck, 
  Package, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizationVisualizer } from './OptimizationVisualizer';

interface OptimizationResultsProps {
  result: OptimizationResult;
  container: Container;
  selectedProducts: Array<{ product_id: string; quantity: number }>;
  onCreateQuote: () => void;
}

export function OptimizationResults({
  result,
  container,
  selectedProducts,
  onCreateQuote
}: OptimizationResultsProps) {
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Fetch product details for all selected products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Get unique product IDs
        const productIds = selectedProducts.map(p => p.product_id);
        
        if (productIds.length === 0) {
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
          
        if (error) {
          throw error;
        }
        
        // Convert array to record for easy lookup
        const productsRecord: Record<string, Product> = {};
        data.forEach(product => {
          productsRecord[product.id!] = product;
        });
        
        setProducts(productsRecord);
      } catch (error: any) {
        toast.error(`Error fetching product details: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [selectedProducts]);
  
  // Format utilization percentage
  const formatUtilization = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Format dimensions with unit
  const formatDimensions = (length: number, width: number, height: number, unit: string): string => {
    return `${length} × ${width} × ${height} ${unit}`;
  };
  
  // Get product by ID
  const getProduct = (productId: string): Product | undefined => {
    return products[productId];
  };
  
  // Calculate total products
  const totalProducts = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
  
  // Calculate packed products
  const packedProducts = result.palletArrangements.reduce((sum, pallet) => {
    return sum + pallet.arrangement.reduce((palletSum, item) => {
      return palletSum + item.quantity;
    }, 0);
  }, 0);
  
  // Calculate remaining products
  const remainingProducts = result.remainingProducts.reduce((sum, p) => sum + p.quantity, 0);
  
  // Generate CSV data for download
  const generateCsvData = (): string => {
    // CSV header
    let csv = 'Product Name,SKU,Dimensions,Quantity,Packed,Remaining\n';
    
    // Add data for each product
    selectedProducts.forEach(({ product_id, quantity }) => {
      const product = getProduct(product_id);
      if (!product) return;
      
      // Calculate packed quantity for this product
      const packedQuantity = result.palletArrangements.reduce((sum, pallet) => {
        return sum + pallet.arrangement.reduce((palletSum, item) => {
          return item.product_id === product_id ? palletSum + item.quantity : palletSum;
        }, 0);
      }, 0);
      
      // Calculate remaining quantity
      const remainingQuantity = result.remainingProducts.find(p => p.product.id === product_id)?.quantity || 0;
      
      // Format dimensions
      const dimensions = `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height}${product.dimensions.unit}`;
      
      // Add row
      csv += `"${product.name}","${product.sku}","${dimensions}",${quantity},${packedQuantity},${remainingQuantity}\n`;
    });
    
    return csv;
  };
  
  // Handle download CSV
  const handleDownloadCsv = () => {
    const csvData = generateCsvData();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `optimization-results-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[100px]" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {result.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {result.success ? 'Optimization Successful' : 'Partial Optimization'}
            </h3>
            <div className="mt-1 text-sm">
              <p>{result.message || (result.success ? 'All products were successfully packed' : 'Some products could not be packed')}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Utilization */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground mb-1">Space Utilization</div>
            <div className="text-3xl font-bold mb-2">{formatUtilization(result.utilization)}</div>
            <Progress value={result.utilization * 100} className="w-full" />
          </CardContent>
        </Card>
        
        {/* Pallets */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground mb-1">Total Pallets</div>
            <div className="text-3xl font-bold">{result.palletArrangements.length}</div>
            <div className="text-sm text-muted-foreground mt-2">
              Container: {formatDimensions(container.length, container.width, container.height, container.unit)}
            </div>
          </CardContent>
        </Card>
        
        {/* Products */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <div className="text-sm text-muted-foreground mb-1">Products Packed</div>
            <div className="text-3xl font-bold">{packedProducts} / {totalProducts}</div>
            {remainingProducts > 0 && (
              <div className="text-sm text-amber-600 mt-2">
                {remainingProducts} products could not be packed
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="summary" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Summary</span>
          </TabsTrigger>
          <TabsTrigger value="visualization" className="flex items-center">
            <Truck className="mr-2 h-4 w-4" />
            <span>Visualization</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <span>Detailed Report</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Summary tab */}
        <TabsContent value="summary">
          <div className="space-y-4">
            {/* Packed products */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-3">Packed Products</h3>
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Dimensions</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Packed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProducts.map(({ product_id, quantity }) => {
                        const product = getProduct(product_id);
                        if (!product) return null;
                        
                        // Calculate packed quantity for this product
                        const packedQuantity = result.palletArrangements.reduce((sum, pallet) => {
                          return sum + pallet.arrangement.reduce((palletSum, item) => {
                            return item.product_id === product_id ? palletSum + item.quantity : palletSum;
                          }, 0);
                        }, 0);
                        
                        return (
                          <TableRow key={product_id}>
                            <TableCell>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                            </TableCell>
                            <TableCell>
                              {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                            </TableCell>
                            <TableCell className="text-right">{quantity}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={packedQuantity === quantity ? 'success' : 'warning'}>
                                {packedQuantity} / {quantity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Remaining products */}
            {result.remainingProducts.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-3">Remaining Products</h3>
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Dimensions</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.remainingProducts.map(({ product, quantity }) => {
                          return (
                            <TableRow key={product.id}>
                              <TableCell>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                              </TableCell>
                              <TableCell>
                                {product.dimensions.length} × {product.dimensions.width} × {product.dimensions.height} {product.dimensions.unit}
                              </TableCell>
                              <TableCell className="text-right">{quantity}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        {/* Visualization tab */}
        <TabsContent value="visualization">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-3">Container Visualization</h3>
              <div className="h-[500px] w-full">
                <OptimizationVisualizer 
                  result={result} 
                  container={container} 
                  products={products} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Detailed report tab */}
        <TabsContent value="details">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Detailed Pallet Report</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadCsv}
                  className="flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {result.palletArrangements.map((pallet, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Pallet #{index + 1}</h4>
                          <Badge variant="outline">
                            Utilization: {formatUtilization(pallet.utilization)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          Dimensions: {pallet.pallet.length} × {pallet.pallet.width} × {pallet.pallet.height} {pallet.pallet.unit} | 
                          Weight: {pallet.weight.toFixed(2)} kg
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Position</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pallet.arrangement.map((item, itemIndex) => {
                              const product = getProduct(item.product_id);
                              if (!product) return null;
                              
                              return (
                                <TableRow key={`${index}-${itemIndex}`}>
                                  <TableCell>
                                    <div className="font-medium">{product.name}</div>
                                    <div className="text-sm text-muted-foreground">SKU: {product.sku}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      X: {item.position.x}, Y: {item.position.y}, Z: {item.position.z}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Rotation: {JSON.stringify(item.rotation)}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">{item.quantity}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="default"
          onClick={onCreateQuote}
          className="flex items-center"
        >
          <FileText className="mr-2 h-4 w-4" />
          Create Quote
        </Button>
      </div>
    </div>
  );
}
