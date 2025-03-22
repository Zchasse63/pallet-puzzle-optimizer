import { useProducts } from '@/hooks/useProducts';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export function ProductStats() {
  const { products, isLoading } = useProducts();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
        <span>Loading products...</span>
      </div>
    );
  }
  
  // Empty state
  if (products.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }
  
  // Calculate product usage statistics (mock data for now)
  // In a real app, this would come from your API based on actual usage
  const productStats = products.slice(0, 5).map((product, index) => {
    // Generate mock usage percentage between 30% and 90%
    const usagePercent = 30 + (index * 15) % 60;
    
    return {
      product,
      usagePercent,
      optimizationCount: Math.floor(Math.random() * 20) + 1
    };
  });
  
  return (
    <div className="space-y-6">
      {productStats.map(({ product, usagePercent, optimizationCount }) => (
        <div key={product.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-muted-foreground">{product.sku}</div>
            </div>
            <div className="text-sm font-medium">{usagePercent}%</div>
          </div>
          <Progress value={usagePercent} />
          <div className="text-xs text-muted-foreground">
            Used in {optimizationCount} optimization{optimizationCount !== 1 ? 's' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}