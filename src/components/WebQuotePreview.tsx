import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../lib/types';
import { Check, Copy, X, Share2, FileText, Mail, ShoppingCart, Eye, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateQuoteUrl, 
  copyQuoteUrlToClipboard, 
  generateQuoteEmailLink,
  isQuoteExpired,
  formatQuoteExpiry
} from '../lib/quote-utils';

interface WebQuotePreviewProps {
  quote: {
    id: string;
    quote_number: string;
    products: Product[];
    container_utilization: number;
    total_pallets: number;
    expires_at?: string;
    created_at: string;
    view_count?: number;
    user_id?: string;
  };
  onClose?: () => void;
}

const WebQuotePreview: React.FC<WebQuotePreviewProps> = ({
  quote,
  onClose
}) => {
  const {
    id,
    quote_number,
    products = [],
    container_utilization: containerUtilization = 0,
    total_pallets: totalPallets = 0,
    expires_at,
    created_at,
    view_count = 0
  } = quote;
  const [copied, setCopied] = useState(false);
  const [orderRequested, setOrderRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);
  
  const calculateProductTotal = (product: Product) => {
    return product.quantity * (product.price || 0);
  };
  
  const productsTotal = products.reduce(
    (sum, product) => sum + calculateProductTotal(product), 
    0
  );
  
  const grandTotal = productsTotal;
  
  const currentDate = new Date(created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const isExpired = expires_at ? isQuoteExpired(expires_at) : false;
  const expiryDate = expires_at ? formatQuoteExpiry(expires_at) : 'No expiration';
  
  const quoteId = quote_number;
  const quoteUrl = generateQuoteUrl(id, {
    trackingParams: { source: 'direct' }
  });
  
  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    checkMobile();
    
    // Simulate loading for demo purposes
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  const handleCopyLink = async () => {
    const success = await copyQuoteUrlToClipboard(id, {
      trackingParams: { source: 'copy_button' }
    });
    
    if (success) {
      setCopied(true);
      toast.success("Quote link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
    
    // Track share event
    try {
      await fetch('/api/quotes/track-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id, method: 'copy' })
      });
    } catch (e) {
      console.error('Failed to track share event:', e);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quote #${quoteId}`,
          text: `Pallet optimization quote with ${totalPallets} pallets and ${containerUtilization}% container utilization`,
          url: generateQuoteUrl(id, { trackingParams: { source: 'share_button' } }),
        });
        toast.success("Quote shared successfully");
        
        // Track share event
        try {
          await fetch('/api/quotes/track-share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quoteId: id, method: 'share' })
          });
        } catch (e) {
          console.error('Failed to track share event:', e);
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support sharing
      handleCopyLink();
    }
  };
  
  const handleEmailShare = () => {
    const emailLink = generateQuoteEmailLink(id, {
      quoteNumber: quoteId,
      totalPallets: totalPallets,
      containerUtilization: containerUtilization
    });
    
    window.open(emailLink, '_blank');
    
    // Track email share event
    try {
      fetch('/api/quotes/track-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: id, method: 'email' })
      });
    } catch (e) {
      console.error('Failed to track email share event:', e);
    }
  };
  
  const handleRequestOrder = () => {
    setOrderRequested(true);
    toast.success("Order placed successfully", {
      description: "Your order has been received and will be processed shortly."
    });
  };
  
  // Skeleton loading component
  const QuoteSkeleton = () => (
    <div className="animate-pulse p-6">
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-8 bg-gray-200 rounded w-full max-w-md"></div>
        </div>
        <div className="text-right">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
      <div className="h-24 bg-gray-200 rounded mb-6"></div>
      <div className="flex justify-center">
        <div className="h-12 bg-gray-200 rounded w-40"></div>
      </div>
    </div>
  );

  // Mobile product card view
  const ProductCards = ({ products }: { products: Product[] }) => (
    <div className="space-y-4">
      {products.map(product => (
        <motion.div 
          key={product.id} 
          className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-medium text-gray-900">{product.name}</h4>
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="text-gray-500">Price:</div>
            <div className="text-right font-medium">${product.price?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-500">Quantity:</div>
            <div className="text-right font-medium">{product.quantity}</div>
            <div className="text-gray-500">Total:</div>
            <div className="text-right font-medium">
              ${calculateProductTotal(product).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <motion.div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="sticky top-0 bg-white p-3 sm:p-4 border-b flex justify-between items-center z-10">
          <h2 className="text-lg sm:text-xl font-semibold">
            {showCustomerView ? "Customer View" : "Web Quote Preview"}
            {showCustomerView && (
              <span className="ml-2 text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Customer Experience
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCustomerView(!showCustomerView)}
              className={`text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 ${showCustomerView ? 'bg-blue-50 text-blue-600' : ''}`}
              aria-label={showCustomerView ? "Show admin view" : "Show customer view"}
              title={showCustomerView ? "Return to admin view" : "Preview as customer"}
            >
              <Eye className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              aria-label="Close quote preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isLoading ? (
          <QuoteSkeleton />
        ) : (
          <div className="p-4 sm:p-6">
            {!showCustomerView && (
              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">Quote #{quoteId}</h1>
                  <p className="text-sm sm:text-base text-gray-600">Generated on {currentDate}</p>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1" />
                    <p className={`text-xs ${isExpired ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {isExpired ? 'Expired on ' : 'Valid until '}{expiryDate}
                      {isExpired && (
                        <span className="ml-1 inline-flex items-center">
                          <AlertTriangle className="w-3 h-3 text-red-500 mr-0.5" />
                          Contact for renewal
                        </span>
                      )}
                    </p>
                  </div>
                  {view_count > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Viewed {view_count} {view_count === 1 ? 'time' : 'times'}
                    </p>
                  )}
                  <div className="mt-3 sm:mt-4 flex items-center">
                    <div className="text-xs sm:text-sm bg-gray-100 rounded-md px-2 sm:px-3 py-1 text-gray-700 flex-grow max-w-[200px] sm:max-w-md truncate">
                      {quoteUrl}
                    </div>
                    {navigator.share ? (
                      <button 
                        onClick={handleShare}
                        className="ml-2 bg-gray-200 hover:bg-gray-300 rounded-md p-2 transition-colors"
                        aria-label="Share quote"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={handleCopyLink}
                        className="ml-2 bg-gray-200 hover:bg-gray-300 rounded-md p-2 transition-colors"
                        aria-label="Copy quote link"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="text-right w-full sm:w-auto">
                  <div className="text-sm sm:text-base text-gray-700 mb-1">Valid until: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Container Utilization: {containerUtilization.toFixed(1)}%</div>
                  <div className="text-xs sm:text-sm text-gray-600">Total Pallets: {totalPallets}</div>
                </div>
              </div>
            )}
            
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 border text-left">Product</th>
                    <th className="py-2 px-4 border text-right">Price</th>
                    <th className="py-2 px-4 border text-right">Quantity</th>
                    <th className="py-2 px-4 border text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t">
                      <td className="py-2 px-4 border">{product.name}</td>
                      <td className="py-2 px-4 border text-right">${product.price?.toFixed(2) || '0.00'}</td>
                      <td className="py-2 px-4 border text-right">{product.quantity}</td>
                      <td className="py-2 px-4 border text-right">
                        ${calculateProductTotal(product).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  
                  <tr className="bg-gray-50 font-medium">
                    <td className="py-2 px-4 border">Total</td>
                    <td className="py-2 px-4 border"></td>
                    <td className="py-2 px-4 border"></td>
                    <td className="py-2 px-4 border text-right">
                      ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View - Shown only on Mobile */}
            <div className="md:hidden mb-6">
              <ProductCards products={products} />
              
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center font-medium">
                  <span>Total</span>
                  <span>${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
            
            {!showCustomerView && (
              <div className="bg-green-50 border border-green-100 rounded-lg p-3 sm:p-4 mb-6">
                <p className="text-green-800 text-sm sm:text-base mb-2">
                  <span className="font-medium">Container Discount:</span> 22.0% savings vs. individual pallet ordering
                </p>
                <p className="text-green-800 text-sm sm:text-base">
                  <span className="font-medium">Average Per Unit Cost:</span> Container pricing vs. standard pricing (22.0% savings)
                </p>
              </div>
            )}
            
            {showCustomerView && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:p-4 mb-6">
                <p className="text-blue-800 text-sm sm:text-base mb-2">
                  <span className="font-medium">Special Offer:</span> 22.0% savings with this container quote
                </p>
                <p className="text-blue-800 text-sm sm:text-base">
                  <span className="font-medium">Limited Time:</span> This quote is valid for 30 days from the date of issue
                </p>
              </div>
            )}
            
            <div className="flex justify-center mb-16 sm:mb-6"> 
              <button
                onClick={handleRequestOrder}
                disabled={orderRequested}
                className={`w-full sm:w-auto px-6 py-4 sm:py-3 rounded-md font-medium text-white transition-all text-lg ${
                  orderRequested 
                    ? 'bg-green-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md active:bg-blue-800'
                }`}
              >
                {orderRequested ? (
                  <span className="flex items-center justify-center">
                    <Check className="w-5 h-5 mr-2" />
                    Order Placed
                  </span>
                ) : (
                  <span className="flex items-center justify-center font-medium">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Order
                  </span>
                )}
              </button>
            </div>
            
            {/* Mobile-specific fixed bottom navigation */}
            {isMobile && !showCustomerView && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-3 px-2 z-10 shadow-md">
                <button 
                  className="flex flex-col items-center text-blue-600"
                  onClick={() => {
                    onClose();
                    toast.info("Opening PDF quote");
                  }}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs mt-1">PDF</span>
                </button>
                <button 
                  className="flex flex-col items-center text-blue-600"
                  onClick={() => {
                    toast.info("Preparing email");
                  }}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-xs mt-1">Email</span>
                </button>
                <button 
                  className={`flex flex-col items-center ${orderRequested ? 'text-green-500' : 'text-blue-600'}`}
                  onClick={handleRequestOrder}
                  disabled={orderRequested}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs mt-1">{orderRequested ? 'Ordered' : 'Order'}</span>
                </button>
              </div>
            )}
            
            {/* Customer view mobile navigation */}
            {isMobile && showCustomerView && (
              <div className="fixed bottom-0 left-0 right-0 bg-blue-600 flex justify-around items-center py-3 px-2 z-10 shadow-md">
                <button 
                  className="flex flex-col items-center text-white"
                  onClick={() => {
                    toast.info("Downloading quote as PDF");
                  }}
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs mt-1">Save PDF</span>
                </button>
                <button 
                  className="flex flex-col items-center text-white"
                  onClick={() => {
                    toast.info("Contact sales representative");
                  }}
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-xs mt-1">Contact</span>
                </button>
                <button 
                  className={`flex flex-col items-center ${orderRequested ? 'text-green-200' : 'text-white'}`}
                  onClick={handleRequestOrder}
                  disabled={orderRequested}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-xs mt-1">{orderRequested ? 'Ordered' : 'Place Order'}</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {!showCustomerView && (
          <div className="p-4 text-center text-sm text-gray-500 border-t">
            <p>Click the <Eye className="w-4 h-4 inline mx-1" /> icon in the top-right corner to see exactly what your customer will see when they open the quote link.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default WebQuotePreview;
