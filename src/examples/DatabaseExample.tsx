import { useState, useEffect } from 'react';
import { db } from '../lib/db-helpers';
import { Tables } from '../lib/supabase';

/**
 * Example component showing how to use the database helper functions
 * This component demonstrates fetching products, creating a quote,
 * and viewing email logs - all using the db-helpers
 */
export const DatabaseExample = () => {
  const [products, setProducts] = useState<Tables['products'][]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [quoteStatus, setQuoteStatus] = useState<{
    isCreating: boolean;
    message: string;
    error: boolean;
    quoteId?: string;
  }>({
    isCreating: false,
    message: '',
    error: false
  });
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Fetch products when component mounts
  useEffect(() => {
    async function loadProducts() {
      setIsLoadingProducts(true);
      const response = await db.products.getAll({
        sortBy: 'name',
        sortOrder: 'asc'
      });
      
      if (response.status === 'success' && response.data) {
        setProducts(response.data);
      } else {
        console.error('Failed to load products:', response.error);
      }
      setIsLoadingProducts(false);
    }

    loadProducts();
  }, []);

  // Handle product selection
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Create a new quote with selected products
  const createQuote = async () => {
    if (selectedProductIds.length === 0) {
      setQuoteStatus({
        isCreating: false,
        message: 'Please select at least one product',
        error: true
      });
      return;
    }

    setQuoteStatus({
      isCreating: true,
      message: 'Creating quote...',
      error: false
    });

    // Prepare quote data with selected products
    const quoteData = {
      quote_number: `Q-${Date.now()}`,
      status: 'draft' as const,
      products: selectedProductIds.map(id => {
        const product = products.find(p => p.id === id);
        return {
          product_id: id,
          quantity: 1, // Default quantity
          price: product?.price || 0
        };
      }),
      container_utilization: 0.75, // Example value
      total_pallets: selectedProductIds.length, // Simplified calculation
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    };

    const response = await db.quotes.create(quoteData);

    if (response.status === 'success' && response.data) {
      setQuoteStatus({
        isCreating: false,
        message: `Quote created successfully with ID: ${response.data.id}`,
        error: false,
        quoteId: response.data.id
      });
      
      // Reset selection
      setSelectedProductIds([]);
    } else {
      setQuoteStatus({
        isCreating: false,
        message: `Failed to create quote: ${response.error}`,
        error: true
      });
    }
  };

  // Fetch email logs for a quote
  const loadEmailLogs = async (quoteId: string) => {
    const response = await db.emailLogs.getForQuote(quoteId);
    
    if (response.status === 'success' && response.data) {
      setEmailLogs(response.data);
    } else {
      console.error('Failed to load email logs:', response.error);
      setEmailLogs([]);
    }
  };

  // Example of using the raw SQL execution capability
  const runCustomQuery = async () => {
    const response = await db.executeQuery<{ name: string; count: number }>(
      'SELECT p.name, COUNT(q.id) as count FROM products p LEFT JOIN quotes q ON q.products::jsonb @> ANY(ARRAY[jsonb_build_object(\'product_id\', p.id)]) GROUP BY p.name ORDER BY count DESC LIMIT 5'
    );

    if (response.status === 'success' && response.data) {
      console.log('Top 5 products in quotes:', response.data);
    } else {
      console.error('Failed to run custom query:', response.error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Supabase Database Integration Example</h1>
      
      {/* Products Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        
        {isLoadingProducts ? (
          <p>Loading products...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <div 
                key={product.id} 
                className={`border rounded p-4 cursor-pointer ${
                  selectedProductIds.includes(product.id) 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
                onClick={() => toggleProductSelection(product.id)}
              >
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">
                  Dimensions: {product.dimensions.length}L × {product.dimensions.width}W × {product.dimensions.height}H
                </p>
                <p className="mt-2 font-medium">${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Quote Creation Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Quote</h2>
        
        <div className="mb-4">
          <p>{selectedProductIds.length} products selected</p>
        </div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          onClick={createQuote}
          disabled={isLoadingProducts || selectedProductIds.length === 0 || quoteStatus.isCreating}
        >
          {quoteStatus.isCreating ? 'Creating...' : 'Create Quote'}
        </button>
        
        {quoteStatus.message && (
          <div className={`mt-4 p-3 rounded ${quoteStatus.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {quoteStatus.message}
          </div>
        )}
      </section>
      
      {/* Email Logs Section */}
      {quoteStatus.quoteId && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Email Logs</h2>
          
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-4"
            onClick={() => loadEmailLogs(quoteStatus.quoteId!)}
          >
            Load Email Logs
          </button>
          
          {emailLogs.length > 0 ? (
            <div className="border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {emailLogs.map((log, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.recipient_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === 'sent' ? 'bg-green-100 text-green-800' :
                          log.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No email logs found for this quote.</p>
          )}
        </section>
      )}
      
      {/* Custom Query Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Advanced Queries</h2>
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          onClick={runCustomQuery}
        >
          Run Custom SQL Query
        </button>
        <p className="mt-2 text-sm text-gray-600">
          This will run a custom SQL query to find the top 5 products used in quotes. 
          Check the console for results.
        </p>
      </section>
    </div>
  );
};

export default DatabaseExample;
