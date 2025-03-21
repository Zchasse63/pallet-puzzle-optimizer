'use client';

import { Metadata } from 'next';
import ProductForm from '@/components/products/ProductForm';

export default function AddProductPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProductForm />
    </div>
  );
}
