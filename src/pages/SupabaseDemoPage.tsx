import { useState } from 'react';
import SupabaseDemo from '../components/SupabaseDemo';
import { db } from '../lib/db-helpers';
import { Tables } from '../lib/supabase';

/**
 * A page that demonstrates Supabase functionality and database operations
 * This page includes:
 * 1. The SupabaseDemo component for basic connection testing and demo data
 * 2. Advanced database operations using the db-helpers
 */
const SupabaseDemoPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<string>('');

  // Perform a database operation based on the selected operation
  const performOperation = async () => {
    setIsLoading(true);
    setQueryResult(null);
    setQueryError(null);

    try {
      let result;

      switch (selectedOperation) {
        case 'getProducts':
          result = await db.products.getAll({
            sortBy: 'name',
            sortOrder: 'asc'
          });
          break;
        case 'getProductsWithFilter':
          result = await db.products.getAll({
            filter: { price: 2.99 },
            sortBy: 'name'
          });
          break;
        case 'getQuotes':
          result = await db.quotes.getAll({
            sortBy: 'created_at',
            sortOrder: 'desc'
          });
          break;
        case 'getQuotesByStatus':
          result = await db.quotes.getAll({
            filter: { status: 'draft' }
          });
          break;
        case 'customQuery':
          result = await db.executeQuery<{ name: string; total_quotes: number }>(
            'SELECT p.name, COUNT(q.id) as total_quotes FROM products p LEFT JOIN quotes q ON q.products::jsonb @> ANY(ARRAY[jsonb_build_object(\'product_id\', p.id)]) GROUP BY p.name ORDER BY total_quotes DESC'
          );
          break;
        default:
          setQueryError('Please select an operation');
          break;
      }

      if (result) {
        setQueryResult(result);
        if (result.error) {
          setQueryError(result.error);
        }
      }
    } catch (err: any) {
      setQueryError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Format JSON for display
  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Supabase Integration</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: SupabaseDemo component */}
        <div>
          <SupabaseDemo />
        </div>
        
        {/* Right column: Advanced database operations */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Advanced Database Operations</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Operation</label>
            <select
              className="w-full p-2 border rounded"
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
            >
              <option value="">-- Select an operation --</option>
              <option value="getProducts">Get All Products</option>
              <option value="getProductsWithFilter">Get Products with Price Filter</option>
              <option value="getQuotes">Get All Quotes</option>
              <option value="getQuotesByStatus">Get Quotes by Status (Draft)</option>
              <option value="customQuery">Run Custom Query (Product Quote Count)</option>
            </select>
          </div>
          
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 mb-6"
            onClick={performOperation}
            disabled={isLoading || !selectedOperation}
          >
            {isLoading ? 'Running...' : 'Run Operation'}
          </button>
          
          {queryError && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
              <h3 className="font-medium mb-2">Error</h3>
              <p>{queryError}</p>
            </div>
          )}
          
          {queryResult && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Result</h3>
              <div className="p-4 bg-gray-100 rounded overflow-auto max-h-96">
                <pre className="text-sm">{formatJson(queryResult)}</pre>
              </div>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-blue-50 rounded">
            <h3 className="font-medium mb-2">Using the db-helpers Library</h3>
            <p className="text-sm mb-2">
              The operations above demonstrate how to use the db-helpers library for type-safe
              database interactions. Here's an example:
            </p>
            <pre className="text-xs bg-gray-800 text-white p-3 rounded">
{`// Get products with filtering and sorting
const products = await db.products.getAll({
  filter: { price: 2.99 },
  sortBy: 'name',
  sortOrder: 'asc'
});

// Create a new quote
const newQuote = await db.quotes.create({
  quote_number: 'Q-12345',
  status: 'draft',
  products: [{ product_id: '123', quantity: 5, price: 2.99 }],
  container_utilization: 0.85,
  total_pallets: 1,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseDemoPage;
