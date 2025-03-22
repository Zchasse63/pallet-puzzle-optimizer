import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { formatPercent, formatWeight } from '@/lib/utils';
import { OptimizationResult, Product } from '@/types';
import { prepareOptimizationSummary } from '@/lib/optimization-engine';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OptimizationResultsProps {
  result: OptimizationResult | null;
}

export function OptimizationResults({ result }: OptimizationResultsProps) {
  const summary = useMemo(() => {
    if (!result) return null;
    return prepareOptimizationSummary(result);
  }, [result]);

  if (!result || !summary) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No optimization results available</p>
      </div>
    );
  }

  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Optimization Failed</AlertTitle>
        <AlertDescription>
          {result.message || 'Unable to optimize with the given parameters'}
        </AlertDescription>
      </Alert>
    );
  }

  // Count products by type
  const productCounts: Record<string, { product: Product; quantity: number }> = {};
  
  // Count placed products
  result.palletArrangements.forEach(pallet => {
    pallet.arrangement.forEach(placement => {
      if (!productCounts[placement.product_id]) {
        // Find product in remaining products to get full product info
        const productInfo = result.remainingProducts.find(p => p.product.id === placement.product_id);
        if (productInfo) {
          productCounts[placement.product_id] = {
            product: productInfo.product,
            quantity: placement.quantity
          };
        } else {
          // If not found in remaining, it's a new product
          productCounts[placement.product_id] = {
            product: { id: placement.product_id } as Product, // Partial info
            quantity: placement.quantity
          };
        }
      } else {
        productCounts[placement.product_id].quantity += placement.quantity;
      }
    });
  });
  
  // Add remaining products
  result.remainingProducts.forEach(({ product, quantity }) => {
    if (!productCounts[product.id]) {
      productCounts[product.id] = { product, quantity: 0 };
    }
    // Note: We don't add the quantity here because these are unplaced products
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Space Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(summary.utilization)}</div>
            <Progress value={summary.utilization} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pallets Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPallets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Products Placed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalProducts}</div>
            {summary.remainingProducts > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {summary.remainingProducts} products couldn't be placed
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Weight Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.weightUtilization ? formatPercent(summary.weightUtilization) : 'N/A'}
            </div>
            {summary.weightUtilization && (
              <Progress value={summary.weightUtilization} className="mt-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pallet Details */}
      <Card>
        <CardHeader>
          <CardTitle>Pallet Arrangements</CardTitle>
          <CardDescription>
            Details of product placement on each pallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.palletArrangements.map((pallet, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pallet {index + 1}</CardTitle>
                  <CardDescription>
                    Utilization: {formatPercent(pallet.utilization)} | 
                    Weight: {formatWeight(pallet.weight)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product ID</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Rotation</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pallet.arrangement.map((placement, i) => (
                        <TableRow key={i}>
                          <TableCell>{placement.product_id}</TableCell>
                          <TableCell>
                            ({placement.position.x}, {placement.position.y}, {placement.position.z})</TableCell>
                          <TableCell>
                            {typeof placement.rotation === 'object' 
                              ? `(${placement.rotation.x}°, ${placement.rotation.y}°, ${placement.rotation.z}°)`
                              : placement.rotation}
                          </TableCell>
                          <TableCell>{placement.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Product Summary</CardTitle>
          <CardDescription>
            Summary of products used in optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(productCounts).map(({ product, quantity }) => {
                const remaining = result.remainingProducts.find(p => p.product.id === product.id)?.quantity || 0;
                const total = quantity + remaining;
                const allPlaced = remaining === 0;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.name || product.id}</TableCell>
                    <TableCell>{quantity} of {total}</TableCell>
                    <TableCell>{remaining}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {allPlaced ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                            <span>All placed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-amber-500 mr-1" />
                            <span>Partially placed</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Remaining Products */}
      {result.remainingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unplaced Products</CardTitle>
            <CardDescription>
              Products that couldn't be placed in the container
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Some products couldn't be placed</AlertTitle>
              <AlertDescription>
                Consider using a larger container, different pallet type, or reducing product quantities.
              </AlertDescription>
            </Alert>
            
            <Table className="mt-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.remainingProducts.filter(p => p.quantity > 0).map(({ product, quantity }) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{quantity}</TableCell>
                    <TableCell>Insufficient space or weight capacity</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}