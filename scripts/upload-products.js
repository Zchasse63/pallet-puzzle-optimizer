/**
 * A simple script to upload product data from CSV to Supabase
 * 
 * To run this script:
 * node scripts/upload-products.js
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the CSV file
const csvFilePath = path.join(__dirname, '..', 'data', 'products.csv');

/**
 * Create products table if it doesn't exist
 */
async function createProductsTable() {
  console.log('Checking if products table exists...');
  
  try {
    // Try to get product count to check if table exists
    const { error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      // Table might not exist, so let's create it
      console.log('Products table does not exist. Creating it...');
      
      // SQL to create the products table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          sku TEXT NOT NULL UNIQUE,
          description TEXT,
          price DECIMAL(10, 2),
          dimensions JSONB,
          weight DECIMAL(10, 2),
          units_per_pallet INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      // Execute the SQL directly, note this requires admin rights
      console.log('You need to create the table manually in the Supabase dashboard.');
      console.log('Please follow these steps:');
      console.log('1. Go to Supabase dashboard at https://app.supabase.com');
      console.log('2. Select your project');
      console.log('3. Go to "Table Editor" in the left sidebar');
      console.log('4. Click "New Table"');
      console.log('5. Set the table name to "products"');
      console.log('6. Add these columns:');
      console.log('   - id: UUID (primary key, default: gen_random_uuid())');
      console.log('   - name: Text (required)');
      console.log('   - sku: Text (required, unique)');
      console.log('   - description: Text');
      console.log('   - price: Numeric (10,2)');
      console.log('   - dimensions: JSON');
      console.log('   - weight: Numeric (10,2)');
      console.log('   - units_per_pallet: Integer');
      console.log('   - created_at: Timestamp with time zone (default: now())');
      console.log('   - updated_at: Timestamp with time zone (default: now())');
      console.log('7. Click "Save"');
      
      return false;
    }
    
    console.log('Products table already exists.');
    return true;
  } catch (err) {
    console.error('Error checking/creating products table:', err);
    return false;
  }
}

/**
 * Read product data from CSV file
 */
async function readProductsFromCSV() {
  return new Promise((resolve, reject) => {
    const products = [];
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        // Parse the dimensions JSON string
        let dimensions;
        try {
          dimensions = JSON.parse(row.dimensions);
        } catch (e) {
          dimensions = { length: 0, width: 0, height: 0 };
          console.warn(`Could not parse dimensions for ${row.sku}, using default.`);
        }
        
        // Convert string values to appropriate types
        const product = {
          name: row.name,
          sku: row.sku,
          description: row.description,
          price: parseFloat(row.price),
          dimensions: dimensions,
          weight: parseFloat(row.weight),
          units_per_pallet: parseInt(row.unitsPerPallet, 10),
          updated_at: new Date().toISOString()
        };
        
        products.push(product);
      })
      .on('end', () => {
        console.log(`Read ${products.length} products from CSV.`);
        resolve(products);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Upload products to Supabase
 */
async function uploadProducts(products) {
  console.log('Uploading products to Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .upsert(products, {
        onConflict: 'sku',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Error uploading products:', error);
      return false;
    }
    
    console.log(`Successfully uploaded ${products.length} products.`);
    return true;
  } catch (err) {
    console.error('Exception while uploading products:', err);
    return false;
  }
}

/**
 * Main function to run the script
 */
async function main() {
  console.log('Starting product upload process...');
  
  // 1. Check/create products table
  const tableExists = await createProductsTable();
  if (!tableExists) {
    console.log('Please create the table manually, then run this script again.');
    return;
  }
  
  // 2. Read products from CSV
  let products;
  try {
    products = await readProductsFromCSV();
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return;
  }
  
  if (!products || products.length === 0) {
    console.log('No products found in CSV file. Nothing to upload.');
    return;
  }
  
  // 3. Upload products to Supabase
  const success = await uploadProducts(products);
  
  if (success) {
    console.log('All done! Your products are now in Supabase.');
  } else {
    console.log('There was a problem uploading products. Check the errors above.');
  }
}

// Run the script
main();
