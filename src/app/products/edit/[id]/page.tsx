'use client';

import { Metadata } from 'next';
import ProductForm from '@/components/products/ProductForm';

export default function EditProductPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProductForm productId={params.id} />
    </div>
  );
}
