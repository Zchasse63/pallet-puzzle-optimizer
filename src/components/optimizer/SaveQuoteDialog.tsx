import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuotes } from '@/hooks/useQuotes';
import { OptimizationResult } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { generateQuoteNumber } from '@/lib/utils';

// Form schema
const quoteFormSchema = z.object({
  notes: z.string().optional(),
  expiryDays: z.coerce.number().int().positive().default(30),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

interface SaveQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optimizationResult: OptimizationResult | null;
}

export function SaveQuoteDialog({ open, onOpenChange, optimizationResult }: SaveQuoteDialogProps) {
  const { createQuote } = useQuotes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      notes: '',
      expiryDays: 30,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: QuoteFormValues) => {
    if (!optimizationResult || !optimizationResult.success) {
      toast.error('Cannot save quote from failed optimization');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare product data for quote
      const products = optimizationResult.palletArrangements.flatMap(pallet => 
        pallet.arrangement.map(placement => ({
          product_id: placement.product_id,
          quantity: placement.quantity,
        }))
      );
      
      // Create quote
      const result = await createQuote(optimizationResult, products);
      
      if (result.success) {
        toast.success('Quote saved successfully');
        form.reset();
        onOpenChange(false);
      } else {
        toast.error('Failed to save quote', {
          description: result.error || 'Please try again later',
        });
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Generate a preview quote number
  const previewQuoteNumber = generateQuoteNumber();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save as Quote</DialogTitle>
          <DialogDescription>
            Save this optimization result as a quote that can be shared with customers.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Quote Number</label>
                <Input value={previewQuoteNumber} disabled className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated quote number
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="expiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry (days)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Quote validity period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes for this quote"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="bg-muted p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2">Quote Summary</h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="text-muted-foreground">Utilization:</span>{' '}
                  {optimizationResult?.utilization.toFixed(1)}%
                </p>
                <p>
                  <span className="text-muted-foreground">Pallets:</span>{' '}
                  {optimizationResult?.palletArrangements.length || 0}
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span> Draft
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Quote'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}