import { useState, useMemo } from 'react';
import { optimizeShipping, prepareOptimizationSummary } from '@/lib/optimization-engine';
import type { Product, Container, Pallet, OptimizationResult, OptimizationSummary } from '@/types';

export function useOptimization() {
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run optimization
  const optimize = async (
    products: Array<{ product: Product; quantity: number }>,
    container: Container,
    pallet: Pallet
  ) => {
    try {
      setIsOptimizing(true);
      setError(null);

      // Simulate async processing for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Run optimization
      const optimizationResult = optimizeShipping(products, container, pallet);
      setResult(optimizationResult);

      return optimizationResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Optimization failed';
      setError(errorMessage);
      console.error('Optimization error:', err);
      return null;
    } finally {
      setIsOptimizing(false);
    }
  };

  // Prepare summary from result
  const summary: OptimizationSummary | null = useMemo(() => {
    if (!result) return null;
    return prepareOptimizationSummary(result);
  }, [result]);

  return {
    result,
    summary,
    isOptimizing,
    error,
    optimize
  };
}