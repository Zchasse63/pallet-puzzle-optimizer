/**
 * Script to insert product data into an existing Supabase products table
 * Run with: node scripts/insert-products.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Demo products data - adjusted to match the table structure in SUPABASE_SETUP.md
const demoProducts = [
  {
    name: 'Standard Cardboard Box',
    sku: 'BOX-STD-001',
    description: 'Standard corrugated cardboard box suitable for most shipping needs.',
    price: 2.99,
    dimensions: { length: 30, width: 20, height: 15 },
    weight: 0.5,
    units_per_pallet: 50, // Changed from unitsPerPallet to units_per_pallet
    updated_at: new Date().toISOString() // Added updated_at field
  },
  {
    name: 'Heavy Duty Shipping Box',
    sku: 'BOX-HD-002',
    description: 'Reinforced cardboard box designed for heavier items up to 25kg.',
    price: 4.99,
    dimensions: { length: 40, width: 30, height: 25 },
    weight: 0.8,
    units_per_pallet: 50,
    updated_at: new Date().toISOString()
  },
  {
    name: 'Small Mailer Box',
    sku: 'BOX-SM-003',
    description: 'Compact box perfect for small items and e-commerce shipping.',
    price: 1.99,
    dimensions: { length: 20, width: 15, height: 10 },
    weight: 0.3,
    units_per_pallet: 50,
    updated_at: new Date().toISOString()
  },
  {
    name: 'Document Shipping Box',
    sku: 'BOX-DOC-004',
    description: 'Flat box designed specifically for documents and paperwork.',
    price: 2.49,
    dimensions: { length: 35, width: 25, height: 5 },
    weight: 0.4,
    units_per_pallet: 50,
    updated_at: new Date().toISOString()
  }
];

// Function to insert products
async function insertProducts() {
  console.log('Inserting products into Supabase...');
  
  try {
    // First check if the table exists by trying to count records
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error checking products table:', countError);
      console.log('\nIMPORTANT: Please ensure the "products" table exists in your Supabase database.');
      console.log('Follow the instructions in SUPABASE_SETUP.md to create the table structure first.');
      return;
    }
    
    console.log(`Products table exists. Current count: ${count}`);
    
    // Insert products
    const { data, error } = await supabase
      .from('products')
      .upsert(demoProducts, { 
        onConflict: 'sku',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Error inserting products:', error);
      return;
    }
    
    console.log(`Successfully inserted/updated ${data?.length || 0} products:`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    
    return data;
  } catch (err) {
    console.error('Exception while inserting products:', err);
  }
}

// Execute the function
insertProducts();
