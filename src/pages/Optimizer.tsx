import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductSelector } from "@/components/optimizer/ProductSelector";
import { ContainerSelector } from "@/components/optimizer/ContainerSelector";
import { OptimizationResults } from "@/components/optimizer/OptimizationResults";
import { OptimizationVisualizer } from "@/components/optimizer/OptimizationVisualizer";
import { SaveQuoteDialog } from "@/components/optimizer/SaveQuoteDialog";
import { ArrowRight, Save } from "lucide-react";
import { useOptimization } from "@/hooks/useOptimization";
import { Product, Container, Pallet } from "@/types";

export default function Optimizer() {
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  
  const { result, isOptimizing, optimize } = useOptimization();
  
  const handleOptimize = () => {
    if (selectedContainer && selectedPallet && selectedProducts.length > 0) {
      optimize(selectedProducts, selectedContainer, selectedPallet);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pallet Optimizer</h2>
          <p className="text-muted-foreground">
            Optimize product placement on pallets and containers
          </p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>Results</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!result}>Visualization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Select products to optimize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSelector 
                  selectedProducts={selectedProducts}
                  onProductsChange={setSelectedProducts}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Container & Pallet</CardTitle>
                <CardDescription>
                  Select container and pallet specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContainerSelector
                  selectedContainer={selectedContainer}
                  selectedPallet={selectedPallet}
                  onContainerChange={setSelectedContainer}
                  onPalletChange={setSelectedPallet}
                />
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              onClick={handleOptimize}
              disabled={!selectedContainer || !selectedPallet || selectedProducts.length === 0 || isOptimizing}
            >
              {isOptimizing ? "Optimizing..." : "Run Optimization"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Results</CardTitle>
              <CardDescription>
                Summary of optimization results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OptimizationResults result={result} />
              
              <div className="flex justify-end mt-4">
                <Button onClick={() => setIsSaveDialogOpen(true)}>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visualization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>3D Visualization</CardTitle>
              <CardDescription>
                Visual representation of optimized packing
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <OptimizationVisualizer result={result} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <SaveQuoteDialog 
        open={isSaveDialogOpen} 
        onOpenChange={setIsSaveDialogOpen}
        optimizationResult={result}
      />
    </div>
  );
}