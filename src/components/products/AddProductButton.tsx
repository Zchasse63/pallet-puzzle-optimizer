'use client';

import { useRouter } from 'next/navigation';
import { PlusCircle } from 'lucide-react';

export default function AddProductButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push('/products/add')}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <PlusCircle className="mr-2 h-4 w-4" />
      Add Product
    </button>
  );
}
