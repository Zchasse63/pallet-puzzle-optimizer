import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Quote, Product } from '@/types';

interface QuoteDetailsProps {
  quote: Quote;
}

export function QuoteDetails({ quote }: QuoteDetailsProps) {
  const { products, isLoading } = useProducts();
  const [quoteProducts, setQuoteProducts] = useState<Array<{
    product: Product;
    quantity: number;
    price?: number;
  }>>([]);
  
  // Match quote products with full product details
  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const productDetails = quote.products.map(quoteProduct => {
        const product = products.find(p => p.id === quoteProduct.product_id);
        return {
          product: product || { id: quoteProduct.product_id } as Product,
          quantity: quoteProduct.quantity,
          price: quoteProduct.price
        };
      });
      
      setQuoteProducts(productDetails);
    }
  }, [quote, products, isLoading]);
  
  // Calculate total price
  const totalPrice = quoteProducts.reduce((sum, item) => {
    return sum + (item.price || 0) * item.quantity;
  }, 0);
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'sent':
        return <Badge variant="secondary">Sent</Badge>;
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Quote Header */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Quote Number</h3>
          <p className="font-medium">{quote.quote_number}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          <div>{getStatusBadge(quote.status)}</div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
          <p>{formatDate(quote.created_at)}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Expires</h3>
          <p>{formatDate(quote.expires_at)}</p>
        </div>
      </div>
      
      {/* Optimization Summary */}
      <div className="border rounded-md p-4">
        <h3 className="font-medium mb-2">Optimization Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Container Utilization</p>
            <p className="font-medium">{quote.container_utilization.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Pallets</p>
            <p className="font-medium">{quote.total_pallets}</p>
          </div>
        </div>
      </div>
      
      {/* Products Table */}
      <div>
        <h3 className="font-medium mb-2">Products</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quoteProducts.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.product.name || `Product ${index + 1}`}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    {item.price ? `$${item.price.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.price ? `$${(item.price * item.quantity).toFixed(2)}` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
              {totalPrice > 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${totalPrice.toFixed(2)}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}