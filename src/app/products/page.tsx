import { Metadata } from 'next';
import ProductList from '@/components/products/ProductList';
import AddProductButton from '@/components/products/AddProductButton';

export const metadata: Metadata = {
  title: 'Products | Pallet Puzzle Optimizer',
  description: 'Manage your products for pallet optimization',
};

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <AddProductButton />
      </div>
      
      <ProductList />
    </div>
  );
}
