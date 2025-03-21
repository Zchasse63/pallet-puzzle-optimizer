/**
 * Upload product data from CSV to Supabase
 * 
 * This script follows clean architecture principles with:
 * - Separation of concerns
 * - Functional programming patterns
 * - Proper error handling
 * - Clear logging
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Constants and Configuration
const CONFIG = {
  supabase: {
    url: 'https://kzpatsbjixgtoskfrwzh.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI',
  },
  table: 'products',
  batchSize: 50,
};

// Utility to get directory path in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// File paths
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'products.csv');

// Initialize Services
const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.key);

/**
 * Read CSV file and parse into product objects
 * @returns {Promise<Array>} Array of product objects
 */
const readProductsFromCsv = () => {
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
          console.warn(`Warning: Could not parse dimensions for ${row.sku}. Using empty object.`);
          dimensions = {};
        }
        
        // Map CSV fields to database columns (converting camelCase to snake_case where needed)
        const product = {
          name: row.name,
          sku: row.sku,
          description: row.description,
          price: parseFloat(row.price) || 0,
          dimensions,
          weight: parseFloat(row.weight) || 0,
          // Convert camelCase to snake_case for database compatibility
          units_per_pallet: parseInt(row.unitsPerPallet, 10) || 0,
          updated_at: new Date().toISOString(),
        };
        
        products.push(product);
      })
      .on('end', () => {
        console.log(`✅ Successfully read ${products.length} products from CSV`);
        resolve(products);
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
};

/**
 * Check if products table exists and is accessible
 * @returns {Promise<boolean>} True if table exists and is accessible
 */
const verifyTableExists = async () => {
  try {
    const { error } = await supabase
      .from(CONFIG.table)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`❌ Could not access ${CONFIG.table} table:`, error.message);
      console.log('\n👉 Please create the table first using the Supabase dashboard');
      console.log('   Refer to the README for instructions on creating the table structure');
      return false;
    }
    
    console.log(`✅ Successfully verified ${CONFIG.table} table exists`);
    return true;
  } catch (error) {
    console.error('❌ Error verifying table:', error);
    return false;
  }
};

/**
 * Upload products to Supabase
 * @param {Array} products - Array of product objects to upload
 * @returns {Promise<boolean>} True if upload was successful
 */
const uploadProductsToSupabase = async (products) => {
  if (!products || products.length === 0) {
    console.log('⚠️ No products to upload');
    return false;
  }
  
  try {
    console.log(`📤 Uploading ${products.length} products to Supabase...`);
    
    // Upsert products (insert or update based on SKU)
    const { data, error } = await supabase
      .from(CONFIG.table)
      .upsert(products, {
        onConflict: 'sku',
        ignoreDuplicates: false,
      })
      .select();
    
    if (error) {
      console.error('❌ Error uploading products:', error.message);
      console.error(error);
      return false;
    }
    
    const successCount = data?.length || 0;
    console.log(`✅ Successfully uploaded ${successCount} products`);
    
    // Log a sample product for verification
    if (data && data.length > 0) {
      console.log('\n📋 Sample product uploaded:');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception during upload:', error);
    return false;
  }
};

/**
 * Main function to orchestrate the upload process
 */
const main = async () => {
  console.log('🚀 Starting product upload process...');
  
  try {
    // Step 1: Verify table exists
    const tableExists = await verifyTableExists();
    if (!tableExists) {
      return;
    }
    
    // Step 2: Read products from CSV
    const products = await readProductsFromCsv();
    if (!products || products.length === 0) {
      console.log('⚠️ No products found in CSV. Nothing to upload.');
      return;
    }
    
    // Step 3: Upload products to Supabase
    const uploadSuccess = await uploadProductsToSupabase(products);
    
    // Step 4: Report results
    if (uploadSuccess) {
      console.log('\n✨ All done! Product data has been successfully uploaded to Supabase.');
      console.log('🔍 You can verify the data in the Supabase dashboard Table Editor.');
    } else {
      console.log('\n⚠️ There were issues uploading the products. Please check the errors above.');
    }
  } catch (error) {
    console.error('❌ Unhandled error:', error);
  }
};

// Execute the script
main();
