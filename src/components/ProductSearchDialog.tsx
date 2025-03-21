import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { searchProducts } from "@/lib/api";
import { Product } from "@/lib/types";

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductSelect: (product: Product) => void;
}

const ProductSearchDialog: React.FC<ProductSearchDialogProps> = ({ 
  open, 
  onOpenChange,
  onProductSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (debouncedSearchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchProducts(debouncedSearchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching products:', error);
        // In a real app, we would handle this error properly
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedSearchTerm]);

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    onOpenChange(false);
    setSearchTerm('');
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Search Products</DialogTitle>
          <DialogDescription>
            Search our catalog to find and add products to your pallet configuration.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="relative">
            <Input
              placeholder="Search by product name, SKU, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10"
              autoFocus
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isSearching ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm.trim().length < 2 ? (
              <div className="space-y-4">
                <div className="text-center py-2 text-gray-600 border-b pb-2">
                  <p>Begin typing to search, or explore these popular products:</p>
                </div>
                <div className="grid gap-3">
                  {[
                    { name: "Organic Coconut Water", sku: "BEV-001", description: "Natural hydration drink, 12 oz cans" },
                    { name: "Premium Coffee Beans", sku: "GRO-124", description: "Dark roast, 1 lb bags" },
                    { name: "Dried Mango Slices", sku: "SNK-056", description: "No sugar added, 8 oz packages" },
                    { name: "Almond Flour", sku: "BAK-089", description: "Gluten-free baking alternative, 2 lb bags" },
                    { name: "Olive Oil Extra Virgin", sku: "OIL-023", description: "Cold-pressed, 500 ml bottles" }
                  ].map((example, index) => (
                    <motion.div
                      key={example.sku}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-3 bg-gray-50 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                      onClick={() => setSearchTerm(example.name)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{example.name}</h4>
                          <div className="text-sm text-gray-500">
                            <span>SKU: {example.sku}</span>
                            <p className="text-xs text-gray-500 mt-1">{example.description}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchTerm(example.name);
                          }}
                        >
                          Search
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No products found matching "{searchTerm}"</p>
              </div>
            ) : (
              <motion.ul className="space-y-2">
                <AnimatePresence>
                  {searchResults.map((product, index) => (
                    <motion.li
                      key={product.id}
                      custom={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="text-sm text-gray-500 flex space-x-4">
                            <span>SKU: {product.sku}</span>
                            <span>{product.unitsPerPallet} units/pallet</span>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductSelect(product);
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSearchDialog;
