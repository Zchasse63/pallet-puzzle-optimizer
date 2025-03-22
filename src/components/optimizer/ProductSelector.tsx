import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Minus, Loader2, Search, X } from 'lucide-react';
import { formatDimensions } from '@/lib/utils';
import { Product } from '@/types';

interface ProductSelectorProps {
  selectedProducts: Array<{ product: Product; quantity: number }>;
  onProductsChange: (products: Array<{ product: Product; quantity: number }>) => void;
}

export function ProductSelector({ selectedProducts, onProductsChange }: ProductSelectorProps) {
  const { products, isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term
  const filteredProducts = products.filter(product => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      (product.description?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Add product to selection
  const addProduct = (product: Product) => {
    const existingIndex = selectedProducts.findIndex(p => p.product.id === product.id);
    
    if (existingIndex >= 0) {
      // Product already selected, increase quantity
      const updatedProducts = [...selectedProducts];
      updatedProducts[existingIndex] = {
        ...updatedProducts[existingIndex],
        quantity: updatedProducts[existingIndex].quantity + 1
      };
      onProductsChange(updatedProducts);
    } else {
      // Add new product with quantity 1
      onProductsChange([...selectedProducts, { product, quantity: 1 }]);
    }
  };

  // Update product quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove product if quantity is 0 or negative
      onProductsChange(selectedProducts.filter(p => p.product.id !== productId));
    } else {
      // Update quantity
      const updatedProducts = selectedProducts.map(p => 
        p.product.id === productId ? { ...p, quantity: newQuantity } : p
      );
      onProductsChange(updatedProducts);
    }
  };

  // Remove product from selection
  const removeProduct = (productId: string) => {
    onProductsChange(selectedProducts.filter(p => p.product.id !== productId));
  };

  // Check if a product is selected
  const isSelected = (productId: string) => {
    return selectedProducts.some(p => p.product.id === productId);
  };

  // Get quantity of a selected product
  const getQuantity = (productId: string) => {
    const product = selectedProducts.find(p => p.product.id === productId);
    return product ? product.quantity : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
        <span>Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected products */}
      <div>
        <h3 className="text-sm font-medium mb-2">Selected Products</h3>
        {selectedProducts.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 border rounded-md text-center">
            No products selected. Add products from the list below.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProducts.map(({ product, quantity }) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {formatDimensions(
                        product.dimensions.length,
                        product.dimensions.width,
                        product.dimensions.height,
                        product.dimensions.unit
                      )}
                    </TableCell>
                    <TableCell>{product.weight} kg</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeProduct(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Product selection */}
      <div>
        <div className="flex items-center mb-2">
          <h3 className="text-sm font-medium flex-1">Available Products</h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[200px]"
            />
          </div>
        </div>
        
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {formatDimensions(
                        product.dimensions.length,
                        product.dimensions.width,
                        product.dimensions.height,
                        product.dimensions.unit
                      )}
                    </TableCell>
                    <TableCell>{product.weight} kg</TableCell>
                    <TableCell className="text-right">
                      {isSelected(product.id) ? (
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, getQuantity(product.id) - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{getQuantity(product.id)}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, getQuantity(product.id) + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addProduct(product)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}