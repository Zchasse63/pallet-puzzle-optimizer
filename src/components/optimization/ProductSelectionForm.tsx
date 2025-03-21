'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Plus, Minus, Trash2 } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductSelectionFormProps {
  selectedProducts: Array<{ product_id: string; quantity: number }>;
  setSelectedProducts: React.Dispatch<React.SetStateAction<Array<{ product_id: string; quantity: number }>>>;
  onNext: () => void;
}

export function ProductSelectionForm({ 
  selectedProducts, 
  setSelectedProducts, 
  onNext 
}: ProductSelectionFormProps) {
  const { user } = useSupabase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user?.id);
          
        if (error) {
          throw error;
        }
        
        setProducts(data || []);
      } catch (error: any) {
        toast.error(`Error fetching products: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      fetchProducts();
    }
  }, [user]);
  
  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Add product to selection
  const addProduct = (product: Product) => {
    // Check if product already exists in selection
    const existingProduct = selectedProducts.find(p => p.product_id === product.id);
    
    if (existingProduct) {
      // Update quantity if product already exists
      setSelectedProducts(prev => 
        prev.map(p => 
          p.product_id === product.id 
            ? { ...p, quantity: p.quantity + 1 } 
            : p
        )
      );
    } else {
      // Add new product with quantity 1
      setSelectedProducts(prev => [
        ...prev, 
        { product_id: product.id!, quantity: 1 }
      ]);
    }
    
    toast.success(`Added ${product.name} to selection`);
  };
  
  // Update product quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove product if quantity is less than 1
      setSelectedProducts(prev => 
        prev.filter(p => p.product_id !== productId)
      );
      
      const productName = products.find(p => p.id === productId)?.name || 'Product';
      toast.info(`Removed ${productName} from selection`);
    } else {
      // Update quantity
      setSelectedProducts(prev => 
        prev.map(p => 
          p.product_id === productId 
            ? { ...p, quantity: newQuantity } 
            : p
        )
      );
    }
  };
  
  // Get product details by ID
  const getProductById = (productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  };
  
  // Calculate total items selected
  const totalItems = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
  
  return (
    <div className="space-y-6">
      {/* Search and filter */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products by name or SKU..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Product list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-3">Available Products</h3>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No products match your search' : 'No products found. Add products first.'}
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku} | 
                          {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => addProduct(product)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Selected Products</h3>
              <Badge variant="outline">{totalItems} items</Badge>
            </div>
            
            {selectedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No products selected. Add products from the list.
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedProducts.map(({ product_id, quantity }) => {
                      const product = getProductById(product_id);
                      if (!product) return null;
                      
                      return (
                        <TableRow key={product_id}>
                          <TableCell>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} {product.dimensions.unit}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product_id, quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product_id, quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product_id, 0)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="default"
          onClick={onNext}
          disabled={selectedProducts.length === 0}
        >
          Next: Configure Container
        </Button>
      </div>
    </div>
  );
}
