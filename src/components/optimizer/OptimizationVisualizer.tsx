import { useEffect, useRef } from 'react';
import { OptimizationResult } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface OptimizationVisualizerProps {
  result: OptimizationResult | null;
}

export function OptimizationVisualizer({ result }: OptimizationVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!result || !result.success || !canvasRef.current) {
      return;
    }
    
    // This is a placeholder for a more sophisticated 3D visualization
    // In a real implementation, we would use Three.js or a similar library
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Set up canvas dimensions
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    
    // Draw container outline
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvasWidth - 100, canvasHeight - 100);
    
    // Draw pallets
    const palletWidth = (canvasWidth - 120) / 3;
    const palletHeight = (canvasHeight - 120) / Math.ceil(result.palletArrangements.length / 3);
    
    result.palletArrangements.forEach((pallet, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      
      const x = 60 + col * palletWidth;
      const y = 60 + row * palletHeight;
      
      // Draw pallet
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(x, y, palletWidth - 10, palletHeight - 10);
      
      // Draw pallet border
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, palletWidth - 10, palletHeight - 10);
      
      // Draw pallet label
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Pallet ${index + 1}`, x + 5, y + 15);
      
      // Draw utilization text
      ctx.fillText(`${pallet.utilization.toFixed(1)}%`, x + 5, y + 30);
      
      // Draw products as colored rectangles
      const productWidth = (palletWidth - 20) / 4;
      const productHeight = (palletHeight - 50) / 3;
      
      pallet.arrangement.forEach((product, productIndex) => {
        const productRow = Math.floor(productIndex / 4);
        const productCol = productIndex % 4;
        
        const productX = x + 5 + productCol * productWidth;
        const productY = y + 40 + productRow * productHeight;
        
        // Generate a color based on product ID
        const hue = parseInt(product.product_id.substring(0, 6), 16) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
        
        // Draw product
        ctx.fillRect(productX, productY, productWidth - 2, productHeight - 2);
      });
    });
    
  }, [result]);
  
  if (!result) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No optimization results to visualize</p>
      </div>
    );
  }
  
  if (!result.success) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Visualization Error</AlertTitle>
        <AlertDescription>
          Cannot visualize failed optimization
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="text-sm text-muted-foreground mb-2">
        This is a simplified 2D visualization. In a production environment, this would be replaced with an interactive 3D view.
      </div>
      <div className="flex-1 border rounded-md overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={450}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}