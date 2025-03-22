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
import { Edit, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatDimensions } from '@/lib/utils';
import { toast } from 'sonner';
import { announceToScreenReader } from '@/lib/utils';
import { Product } from '@/types';

export default function ProductList() {
  const { products, isLoading, error, deleteProduct, formatDate } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product;
    direction: 'ascending' | 'descending';
  } | null>(null);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort
  const handleSort = (key: keyof Product) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig?.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const result = await deleteProduct(id);
      
      if (result.success) {
        toast.success('Product deleted successfully');
        announceToScreenReader('Product deleted successfully', 'polite');
      } else {
        toast.error('Failed to delete product', {
          description: result.error || 'Please try again later',
        });
        announceToScreenReader(`Error: ${result.error || 'Failed to delete product'}`, 'assertive');
      }
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.description?.toLowerCase().includes(searchLower) || false)
      );
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      
      if (key === 'dimensions') {
        // Special handling for dimensions
        const volumeA = a.dimensions.length * a.dimensions.width * a.dimensions.height;
        const volumeB = b.dimensions.length * b.dimensions.width * b.dimensions.height;
        
        return direction === 'ascending'
          ? volumeA - volumeB
          : volumeB - volumeA;
      }
      
      const aValue = a[key];
      const bValue = b[key];
      
      if (aValue < bValue) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" data-testid="loading-spinner" />
        <p>Loading products...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive font-semibold mb-2">{error}</p>
        <p className="text-muted-foreground">Please try again later</p>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg">
        <h3 className="font-semibold text-lg mb-2">No products found</h3>
        <p className="text-muted-foreground mb-4">Create your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="w-[200px] cursor-pointer"
                onClick={() => handleSort('name')}
                aria-sort={sortConfig?.key === 'name' ? sortConfig.direction : undefined}
              >
                <div className="flex items-center">
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('sku')}
                aria-sort={sortConfig?.key === 'sku' ? sortConfig.direction : undefined}
              >
                <div className="flex items-center">
                  SKU
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('dimensions')}
                aria-sort={sortConfig?.key === 'dimensions' ? sortConfig.direction : undefined}
              >
                <div className="flex items-center">
                  Dimensions
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('weight')}
                aria-sort={sortConfig?.key === 'weight' ? sortConfig.direction : undefined}
              >
                <div className="flex items-center">
                  Weight
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
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
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}