/**
 * Script to upload product data to Supabase
 * Run with: node scripts/upload-products-to-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Supabase client
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Function to create tables in Supabase
async function createTables() {
  console.log('Creating tables in Supabase...');
  
  try {
    // Create products table using SQL query
    const { error: sqlError } = await supabase.rpc('create_tables', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          sku TEXT UNIQUE NOT NULL,
          description TEXT,
          price NUMERIC(10, 2),
          dimensions JSONB,
          weight NUMERIC(10, 2),
          "unitsPerPallet" INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    if (sqlError) {
      console.log('Note: SQL execution via RPC might not be enabled. Will try direct insertion instead.');
      console.log('SQL Error:', sqlError);
    } else {
      console.log('Products table created successfully');
    }
    
    return true;
  } catch (err) {
    console.log('Note: Table creation via SQL failed. Will try direct insertion instead.');
    console.log('Error:', err);
    return false;
  }
}

// Function to upload products to Supabase
async function uploadProducts() {
  console.log('Uploading products to Supabase...');
  
  try {
    // Try to create tables first (this may fail if SQL execution is not enabled)
    await createTables();
    
    // Insert products directly - this will create the table if it doesn't exist
    // with default structure based on the data
    const { data, error } = await supabase
      .from('products')
      .insert(demoProducts)
      .select();
    
    if (error) {
      console.error('Error uploading products:', error);
      
      // If the error is that the table doesn't exist, we need to create it manually
      // through the Supabase dashboard
      if (error.code === '42P01') { // relation does not exist
        console.log('\nIMPORTANT: The "products" table does not exist.');
        console.log('Please create it manually in the Supabase dashboard:');
        console.log('1. Go to https://app.supabase.com/ and log in');
        console.log('2. Select your project');
        console.log('3. Navigate to "Table Editor" in the left sidebar');
        console.log('4. Click "New Table"');
        console.log('5. Set table name: "products"');
        console.log('6. Add the following columns:');
        console.log('   - id: UUID (primary key, default: gen_random_uuid())');
        console.log('   - name: Text (required)');
        console.log('   - sku: Text (required, unique)');
        console.log('   - description: Text');
        console.log('   - price: Numeric (10,2)');
        console.log('   - dimensions: JSON');
        console.log('   - weight: Numeric (10,2)');
        console.log('   - unitsPerPallet: Integer');
        console.log('   - created_at: Timestamp with time zone (default: now())');
        console.log('7. Click "Save"');
        console.log('8. Run this script again after creating the table');
      }
      
      return;
    }
    
    console.log(`Successfully uploaded ${data.length} products:`);
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (err) {
    console.error('Exception while uploading products:', err);
  }
}

// Execute the function
uploadProducts();
