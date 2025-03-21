'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { 
  Package, 
  PlusCircle,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { calculateTotalProductVolume } from '@/lib/api';

import { Product as ProductType } from '@/lib/types';

// Define the Dashboard Product type (from database)
interface DashboardProduct {
  id: string;
  name: string;
  sku: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  unitsPerPallet: number;
  created_at: string;
  user_id: string;
}

// Helper function to convert DashboardProduct to ProductType for calculations
const convertToProductType = (product: DashboardProduct): ProductType => ({
  id: parseInt(product.id),
  name: product.name,
  sku: product.sku,
  quantity: product.quantity,
  unitsPerPallet: product.unitsPerPallet,
  dimensions: {
    length: product.length,
    width: product.width,
    height: product.height
  }
});

type SortField = 'name' | 'dimensions' | 'weight' | 'quantity' | 'volume';
type SortDirection = 'asc' | 'desc';

export default function ProductsPage() {
  const { user, supabase } = useSupabase();
  const router = useRouter();
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [user, supabase]);
  
  const handleCreateNewProduct = () => {
    router.push('/dashboard/products/new');
  };
  
  const handleEditProduct = (productId: string) => {
    router.push(`/dashboard/products/${productId}/edit`);
  };
  
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);
        
      if (error) throw error;
      
      setProducts(products.filter(product => product.id !== productToDelete));
      toast.success('Product deleted successfully');
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredProducts = products
    .filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'dimensions':
          return ((a.length * a.width * a.height) - (b.length * b.width * b.height)) * direction;
        case 'weight':
          return (a.weight - b.weight) * direction;
        case 'quantity':
          return (a.quantity - b.quantity) * direction;
        case 'volume':
          return (calculateTotalProductVolume(convertToProductType(a)) - calculateTotalProductVolume(convertToProductType(b))) * direction;
        default:
          return 0;
      }
    });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        
        <Button onClick={handleCreateNewProduct} className="shrink-0">
          <PlusCircle className="w-4 h-4 mr-2" />
          Add New Product
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {products.length === 0 
                ? "You haven't added any products yet. Add your first product to get started."
                : "No products match your search criteria. Try a different search term."}
            </p>
            {products.length === 0 && (
              <Button onClick={handleCreateNewProduct}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('name')}
                      className="flex items-center font-medium"
                    >
                      Product Name
                      {sortField === 'name' && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('dimensions')}
                      className="flex items-center font-medium"
                    >
                      Dimensions
                      {sortField === 'dimensions' && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('weight')}
                      className="flex items-center font-medium"
                    >
                      Weight
                      {sortField === 'weight' && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('quantity')}
                      className="flex items-center font-medium"
                    >
                      Qty
                      {sortField === 'quantity' && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => handleSort('volume')}
                      className="flex items-center font-medium"
                    >
                      Volume
                      {sortField === 'volume' && (
                        <ChevronDown className={`ml-1 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.length} × {product.width} × {product.height} cm
                    </TableCell>
                    <TableCell>{product.weight} kg</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      {(calculateTotalProductVolume(convertToProductType(product))).toFixed(2)} m³
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => setProductToDelete(product.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setProductToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProduct}
              disabled={isDeleting}
            >
              {isDeleting ? <LoadingSpinner size="sm" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
