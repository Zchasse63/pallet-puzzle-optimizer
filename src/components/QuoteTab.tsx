import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TabTransition from './common/TabTransition';
import { toast } from 'sonner';
import QuotePdfPreview from './QuotePdfPreview';
import WebQuotePreview from './WebQuotePreview';
import { FileText, Globe, Mail, ArrowLeft } from 'lucide-react';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { sendQuoteEmail } from "../lib/email-service";
import { useProducts, useProductStats, useIsLoading, useUIActions } from '@/lib/store';
import ErrorBoundary from './common/ErrorBoundary';
import { Product } from '@/lib/types';

interface QuoteTabProps {
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
  setActiveTab: (tab: string) => void;
}

/**
 * QuoteTab component displays quote summary and provides options to generate PDF, web, or email quotes
 */
const QuoteTab: React.FC<QuoteTabProps> = ({
  products,
  containerUtilization,
  totalPallets,
  setActiveTab
}) => {
  // Use isLoading from store
  const isLoading = useIsLoading();
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [showWebPreview, setShowWebPreview] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    recipientEmail: '',
    customerName: '',
    customerCompany: '',
    additionalNotes: ''
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Standard markup for pricing comparison
  const standardMarkup = 0.22; // 22% markup for standard pricing
  
  const calculateProductTotal = (product: Product) => {
    return product.quantity * (product.price || 0);
  };
  
  // Calculate the standard price (what it would cost without container discount)
  const calculateStandardPrice = (product: Product) => {
    return product.price ? product.price * (1 + standardMarkup) : 0;
  };
  
  // Calculate product totals, filtering out products with zero quantity
  const productsWithQuantity = products.filter(product => product.quantity > 0);
  
  const productsTotal = productsWithQuantity.reduce(
    (sum, product) => sum + calculateProductTotal(product), 
    0
  );
  
  const grandTotal = productsTotal;
  
  // Create a mock quote object for the WebQuotePreview component
  const mockQuote = {
    id: `quote-${Math.floor(Math.random() * 10000)}`,
    quote_number: `Q-${Math.floor(Math.random() * 10000)}`,
    products: productsWithQuantity,
    container_utilization: containerUtilization,
    total_pallets: totalPallets,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    created_at: new Date().toISOString(),
    view_count: 0
  };
  
  const handlePdfQuote = () => {
    setShowPdfPreview(true);
  };
  
  const handleWebQuote = () => {
    setShowWebPreview(true);
  };
  
  const handleEmailQuote = () => {
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!emailData.recipientEmail) {
      toast.error("Please enter a recipient email address");
      return;
    }

    setIsSendingEmail(true);
    
    try {
      const quoteId = `Q-${Math.floor(Math.random() * 10000)}`;
      
      const result = await sendQuoteEmail({
        recipientEmail: emailData.recipientEmail,
        quoteId,
        products: productsWithQuantity,
        containerUtilization,
        totalPallets,
        customerName: emailData.customerName,
        customerCompany: emailData.customerCompany,
        additionalNotes: emailData.additionalNotes
      });
      
      if (result.success) {
        toast.success("Quote sent successfully", {
          description: `The quote has been emailed to ${emailData.recipientEmail}`,
          duration: 3000
        });
        setShowEmailDialog(false);
        // Reset form
        setEmailData({
          recipientEmail: '',
          customerName: '',
          customerCompany: '',
          additionalNotes: ''
        });
      } else {
        toast.error("Failed to send email", {
          description: result.message,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error("An unexpected error occurred", {
        description: "Please try again later",
        duration: 5000
      });
    } finally {
      setIsSendingEmail(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <TabTransition id="quote" className="py-6 px-6">
      <ErrorBoundary>
        <div className="mb-6">
        <h2 className="text-2xl font-medium mb-2">Quote Summary</h2>
        <p className="text-gray-600">
          Complete shipment quote including products, shipping, and duties
        </p>
      </div>
      
      <motion.div 
        className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="font-medium text-lg text-blue-900 mb-3">Container Details</h3>
        <div className="flex flex-col sm:flex-row gap-y-4">
          <div className="flex-1">
            <div className="mb-1 text-blue-800"><span className="font-medium">Container Type:</span> 40' Standard</div>
            <div className="mb-1 text-blue-800"><span className="font-medium">Utilization:</span> {containerUtilization.toFixed(1)}%</div>
            <div className="text-blue-800"><span className="font-medium">Total Pallets:</span> {totalPallets} (after arrival)</div>
          </div>
          <div className="flex-1">
            <div className="mb-1 text-blue-800"><span className="font-medium">Origin:</span> Shanghai, China</div>
            <div className="mb-1 text-blue-800"><span className="font-medium">Destination:</span> Los Angeles, USA</div>
            <div className="text-blue-800"><span className="font-medium">Est. Transit Time:</span> 18-22 days</div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-600 text-sm">
              <th className="py-3 px-4 font-medium">Description</th>
              <th className="py-3 px-4 font-medium text-right">Quantity</th>
              <th className="py-3 px-4 font-medium text-right">Price Per Unit</th>
              <th className="py-3 px-4 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => {
              if (product.quantity === 0) return null;
              
              const total = calculateProductTotal(product);
              
              return (
                <motion.tr 
                  key={product.id} 
                  className="border-t border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (index * 0.1) }}
                >
                  <td className="py-4 px-4">{product.name}</td>
                  <td className="py-4 px-4 text-right">{product.quantity.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right">${(product.price || 0).toFixed(2)}</td>
                  <td className="py-4 px-4 text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </motion.tr>
              );
            })}
            
            {/* Shipping and import duties are now added as products when needed */}
            
            <motion.tr 
              className="bg-gray-50 font-medium"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <td className="py-4 px-4">Total</td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4"></td>
              <td className="py-4 px-4 text-right">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </motion.tr>
          </tbody>
        </table>
      </motion.div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <motion.div 
          className="w-full lg:w-1/2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-3">Savings Analysis</h3>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <p className="text-green-800 mb-2">
              <span className="font-medium">Container Discount:</span> 22.0% savings vs. individual pallet ordering
            </p>
            <p className="text-green-800">
              <span className="font-medium">Average Per Unit Cost:</span> Container pricing vs. standard pricing (22.0% savings)
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          className="w-full lg:w-1/2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-lg font-medium mb-3">Quote Options</h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Button
              variant="secondary"
              className="flex-1 bg-green-500 text-white hover:bg-green-600 flex items-center justify-center"
              onClick={handlePdfQuote}
              disabled={isLoading}
            >
              <FileText className="w-5 h-5 mr-2" />
              PDF Quote
            </Button>
            
            <Button
              variant="secondary"
              className="flex-1 bg-indigo-500 text-white hover:bg-indigo-600 flex items-center justify-center"
              onClick={handleWebQuote}
              disabled={isLoading}
            >
              <Globe className="w-5 h-5 mr-2" />
              Web Quote
            </Button>
          </div>
          
          <h3 className="text-lg font-medium mb-3">Share Options</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-app-blue text-white hover:bg-app-dark-blue flex items-center justify-center"
              onClick={handleEmailQuote}
              disabled={isLoading}
            >
              <Mail className="w-5 h-5 mr-2" />
              Email Quote
            </Button>
          </div>
        </motion.div>
      </div>
      
      </ErrorBoundary>
      
      <div className="flex justify-start mt-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="outline"
            className="bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center"
            onClick={() => setActiveTab('pallets')}
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Pallet View
          </Button>
        </motion.div>
      </div>
      
      {showPdfPreview && (
        <QuotePdfPreview 
          products={productsWithQuantity}
          containerUtilization={containerUtilization}
          totalPallets={totalPallets}
          onClose={() => setShowPdfPreview(false)}
        />
      )}
      
      {showWebPreview && (
        <WebQuotePreview 
          quote={mockQuote}
          onClose={() => setShowWebPreview(false)}
        />
      )}
      
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Email Quote</DialogTitle>
            <DialogDescription>
              Send this quote to yourself or a customer via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipientEmail" className="required">Recipient Email</Label>
              <Input
                id="recipientEmail"
                name="recipientEmail"
                type="email"
                placeholder="email@example.com"
                value={emailData.recipientEmail}
                onChange={handleInputChange}
                required
                autoFocus
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                name="customerName"
                placeholder="John Doe"
                value={emailData.customerName}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="customerCompany">Company</Label>
              <Input
                id="customerCompany"
                name="customerCompany"
                placeholder="Acme Inc."
                value={emailData.customerCompany}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                placeholder="Add any special instructions or notes here..."
                value={emailData.additionalNotes}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail || !emailData.recipientEmail}
            >
              {isSendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabTransition>
  );
};

export default QuoteTab;
