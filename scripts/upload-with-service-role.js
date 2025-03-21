/**
 * Upload products to Supabase using service role key
 * This bypasses RLS policies for initial data loading
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get directory path for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
// Using service role key to bypass RLS
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTk1NzAwOCwiZXhwIjoyMDU3NTMzMDA4fQ.4Z6nYj-OR7i24NiK-FoV7vfizX2QgYWW_wmwK1VDNgA';
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'products.csv');

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/**
 * Read products from CSV file
 */
async function readProductsFromCSV() {
  return new Promise((resolve, reject) => {
    const products = [];
    
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Parse dimensions from JSON string
        let dimensions;
        try {
          dimensions = JSON.parse(row.dimensions);
        } catch (error) {
          console.warn(`⚠️ Could not parse dimensions for ${row.sku}. Using empty object.`);
          dimensions = {};
        }
        
        // Convert CSV fields to match database schema
        const product = {
          name: row.name,
          sku: row.sku,
          description: row.description,
          price: parseFloat(row.price) || 0,
          dimensions,
          weight: parseFloat(row.weight) || 0,
          // Converting from camelCase to snake_case for PostgreSQL convention
          units_per_pallet: parseInt(row.unitsPerPallet, 10) || 0,
          updated_at: new Date().toISOString(),
        };
        
        products.push(product);
      })
      .on('end', () => {
        console.log(`✅ Read ${products.length} products from CSV file`);
        resolve(products);
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV file:', error);
        reject(error);
      });
  });
}

/**
 * Upload products to Supabase
 */
async function uploadProducts(products) {
  if (!products || products.length === 0) {
    console.log('⚠️ No products to upload');
    return;
  }
  
  console.log(`📤 Uploading ${products.length} products to Supabase using service role key...`);
  
  try {
    // Check if we can access the products table
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Unable to access products table:', countError.message);
      console.log('Make sure you have created the table using SQL Editor first');
      return;
    }
    
    console.log(`ℹ️ Current products count: ${count}`);
    
    // Insert products
    const { data, error } = await supabase
      .from('products')
      .upsert(products, {
        onConflict: 'sku',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('❌ Error uploading products:', error.message);
      return;
    }
    
    const successCount = data?.length || 0;
    console.log(`✅ Successfully uploaded ${successCount} products`);
    
    // Show first uploaded product for verification
    if (data && data.length > 0) {
      console.log('\n📋 First uploaded product:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } catch (error) {
    console.error('❌ Unexpected error during upload:', error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting product upload process with service role key...');
  
  try {
    // Read products from CSV
    const products = await readProductsFromCSV();
    
    // Upload to Supabase
    await uploadProducts(products);
    
    console.log('\n✨ Process completed!');
    console.log('🔒 IMPORTANT: Remember to remove the service role key from this script after use!');
  } catch (error) {
    console.error('❌ Unhandled error:', error);
  }
}

// Execute the script
main();
