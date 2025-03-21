import { useState, useEffect } from 'react';
import { supabase, Tables } from '../lib/supabase';
import { db } from '../lib/db-helpers';

/**
 * A component to demonstrate Supabase connectivity and data operations
 * This component will:
 * 1. Test the connection to Supabase
 * 2. Create demo data if tables are empty
 * 3. Display existing data from the database
 */
export const SupabaseDemo = () => {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [products, setProducts] = useState<Tables['products'][]>([]);
  const [quotes, setQuotes] = useState<Tables['quotes'][]>([]);
  const [isCreatingDemoData, setIsCreatingDemoData] = useState(false);
  const [demoDataStatus, setDemoDataStatus] = useState('');

  // Demo products data
  const demoProducts = [
    {
      name: 'Standard Cardboard Box',
      sku: 'BOX-STD-001',
      description: 'Standard corrugated cardboard box suitable for most shipping needs.',
      price: 2.99,
      dimensions: { length: 30, width: 20, height: 15 },
      weight: 0.5,
      unitsPerPallet: 50
    },
    {
      name: 'Heavy Duty Shipping Box',
      sku: 'BOX-HD-002',
      description: 'Reinforced cardboard box designed for heavier items up to 25kg.',
      price: 4.99,
      dimensions: { length: 40, width: 30, height: 25 },
      weight: 0.8,
      unitsPerPallet: 50
    },
    {
      name: 'Small Mailer Box',
      sku: 'BOX-SM-003',
      description: 'Compact box perfect for small items and e-commerce shipping.',
      price: 1.99,
      dimensions: { length: 20, width: 15, height: 10 },
      weight: 0.3,
      unitsPerPallet: 50
    },
    {
      name: 'Document Shipping Box',
      sku: 'BOX-DOC-004',
      description: 'Flat box designed specifically for documents and paperwork.',
      price: 2.49,
      dimensions: { length: 35, width: 25, height: 5 },
      weight: 0.4,
      unitsPerPallet: 50
    }
  ];

  // Check connection to Supabase
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('products').select('count()', { count: 'exact', head: true });
        
        if (error) {
          console.error('Supabase connection error:', error);
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connected');
          loadData();
        }
      } catch (err) {
        console.error('Error checking Supabase connection:', err);
        setConnectionStatus('error');
      }
    };

    checkConnection();
  }, []);

  // Load data from Supabase
  const loadData = async () => {
    try {
      // Load products
      const productsResponse = await db.products.getAll();
      if (productsResponse.status === 'success' && productsResponse.data) {
        setProducts(productsResponse.data);
      }

      // Load quotes
      const quotesResponse = await db.quotes.getAll();
      if (quotesResponse.status === 'success' && quotesResponse.data) {
        setQuotes(quotesResponse.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  // Create demo data
  const createDemoData = async () => {
    setIsCreatingDemoData(true);
    setDemoDataStatus('Creating demo products...');
    
    try {
      // Insert demo products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .insert(demoProducts)
        .select();
      
      if (productsError) {
        setDemoDataStatus(`Error creating products: ${productsError.message}`);
        setIsCreatingDemoData(false);
        return;
      }
      
      setDemoDataStatus('Products created successfully. Creating demo quotes...');
      
      // Create demo quotes
      const productIds = productsData.map(p => p.id);
      const demoQuotes = generateDemoQuotes(productIds);
      
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .insert(demoQuotes)
        .select();
      
      if (quotesError) {
        setDemoDataStatus(`Error creating quotes: ${quotesError.message}`);
        setIsCreatingDemoData(false);
        return;
      }
      
      setDemoDataStatus('Demo data created successfully!');
      loadData(); // Reload data
    } catch (err: any) {
      setDemoDataStatus(`Error creating demo data: ${err.message || 'Unknown error'}`);
    } finally {
      setIsCreatingDemoData(false);
    }
  };

  // Generate demo quotes
  const generateDemoQuotes = (productIds: string[]) => {
    const statuses = ['draft', 'sent', 'accepted', 'rejected'] as const;
    const quotes = [];
    
    for (let i = 0; i < 3; i++) {
      // Select 1-3 random products for this quote
      const numProducts = Math.floor(Math.random() * 3) + 1;
      const shuffledIds = [...productIds].sort(() => 0.5 - Math.random());
      const selectedProductIds = shuffledIds.slice(0, numProducts);
      
      // Create product entries for the quote
      const products = selectedProductIds.map(productId => ({
        product_id: productId,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: parseFloat((Math.random() * 5 + 1).toFixed(2))
      }));
      
      quotes.push({
        quote_number: `Q-${Date.now()}-${i}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        products,
        container_utilization: parseFloat((Math.random() * 0.3 + 0.6).toFixed(2)),
        total_pallets: Math.ceil(products.reduce((sum, p) => sum + p.quantity, 0) / 50),
        expires_at: new Date(Date.now() + (30 + i * 5) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return quotes;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Supabase Database Demo</h1>
      
      {/* Connection Status */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
        <div className="p-4 rounded border">
          {connectionStatus === 'checking' && (
            <p className="text-yellow-600">Checking connection to Supabase...</p>
          )}
          {connectionStatus === 'connected' && (
            <p className="text-green-600">✅ Connected to Supabase successfully!</p>
          )}
          {connectionStatus === 'error' && (
            <div>
              <p className="text-red-600 mb-2">❌ Error connecting to Supabase</p>
              <p className="text-sm">Please check your environment variables and Supabase configuration.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Demo Data Creation */}
      {connectionStatus === 'connected' && products.length === 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Demo Data</h2>
          <div className="p-4 rounded border">
            <p className="mb-4">No products found in the database. Would you like to create some demo data?</p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              onClick={createDemoData}
              disabled={isCreatingDemoData}
            >
              {isCreatingDemoData ? 'Creating...' : 'Create Demo Data'}
            </button>
            {demoDataStatus && (
              <p className="mt-2 text-sm">{demoDataStatus}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Products Display */}
      {products.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Products ({products.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="p-4 rounded border">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                <p className="text-sm text-gray-600">
                  {product.description}
                </p>
                <p className="text-sm text-gray-600">
                  Dimensions: {product.dimensions.length}L × {product.dimensions.width}W × {product.dimensions.height}H
                </p>
                <p className="mt-2 font-medium">${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quotes Display */}
      {quotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Quotes ({quotes.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {quotes.map(quote => (
              <div key={quote.id} className="p-4 rounded border">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{quote.quote_number}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    quote.status === 'draft' ? 'bg-gray-200' :
                    quote.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                    quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {quote.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Products: {quote.products.length}
                </p>
                <p className="text-sm text-gray-600">
                  Container Utilization: {(quote.container_utilization * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">
                  Total Pallets: {quote.total_pallets}
                </p>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(quote.expires_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SupabaseDemo;
