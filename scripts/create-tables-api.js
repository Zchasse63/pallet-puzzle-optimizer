/**
 * Create Supabase Tables Using Management API
 * 
 * This script uses Supabase's management API to create the required tables.
 * Run with: node scripts/create-tables-api.js
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import csv from 'csv-parser';

// Get current directory path (ESM compatible)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const SUPABASE_URL = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTk1NzAwOCwiZXhwIjoyMDU3NTMzMDA4fQ.4Z6nYj-OR7i24NiK-FoV7vfizX2QgYWW_wmwK1VDNgA';
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'products.csv');

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/**
 * Create Products Table
 */
async function createProductsTable() {
  console.log('Creating products table...');
  
  try {
    // Check if table already exists
    const { error: existsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (!existsError) {
      console.log('✅ Products table already exists');
      return true;
    }
    
    // Create table directly using Supabase JS client
    // Note: We're going to create this using table creator
    // This is a different approach from SQL execution
    
    console.log('Creating products table via API...');
    
    // First, check if we have permissions to create tables
    const { data: schemas, error: schemaError } = await supabase
      .from('_schemas')
      .select('*')
      .limit(1);
    
    if (schemaError) {
      console.log('⚠️ Unable to access schema information with service role key');
      console.log('Please create the products table manually with the following structure:');
      console.log(`
        - id: UUID (primary key with default gen_random_uuid())
        - name: TEXT (required)
        - sku: TEXT (required, unique)
        - description: TEXT
        - price: NUMERIC(10,2)
        - dimensions: JSONB
        - weight: NUMERIC(10,2)
        - units_per_pallet: INTEGER
        - created_at: TIMESTAMPTZ (default: now())
        - updated_at: TIMESTAMPTZ (default: now())
      `);
      return false;
    }
    
    // Attempt to create table using Supabase's REST API
    // Note: This approach may not work as expected because Supabase JS client
    // doesn't directly support table creation. This is more of a "best effort" attempt.
    
    const { error: createError } = await supabase.rpc('create_table', {
      table_name: 'products',
      columns: [
        { name: 'id', type: 'uuid', is_primary: true, default_value: 'gen_random_uuid()' },
        { name: 'name', type: 'text', is_nullable: false },
        { name: 'sku', type: 'text', is_nullable: false, is_unique: true },
        { name: 'description', type: 'text' },
        { name: 'price', type: 'numeric', precision: 10, scale: 2 },
        { name: 'dimensions', type: 'jsonb' },
        { name: 'weight', type: 'numeric', precision: 10, scale: 2 },
        { name: 'units_per_pallet', type: 'integer' },
        { name: 'created_at', type: 'timestamptz', default_value: 'now()' },
        { name: 'updated_at', type: 'timestamptz', default_value: 'now()' }
      ]
    });
    
    if (createError) {
      console.log('⚠️ Unable to create products table via API:', createError.message);
      return false;
    }
    
    console.log('✅ Products table created successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating products table:', error);
    return false;
  }
}

/**
 * Read product data from CSV file
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
          console.warn(`Warning: Could not parse dimensions for ${row.sku}. Using empty object.`);
          dimensions = {};
        }
        
        // Map CSV fields to database columns
        const product = {
          name: row.name,
          sku: row.sku,
          description: row.description,
          price: parseFloat(row.price) || 0,
          dimensions,
          weight: parseFloat(row.weight) || 0,
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
}

/**
 * Upload products to Supabase
 */
async function uploadProducts(products) {
  if (!products || products.length === 0) {
    console.log('⚠️ No products to upload');
    return false;
  }
  
  console.log(`\nUploading ${products.length} products to Supabase...`);
  
  try {
    // Check if table exists by trying a query
    const { error: tableError } = await supabase
      .from('products')
      .select('count(*)', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Products table does not exist or cannot be accessed');
      console.log('Please verify the table exists before uploading data');
      return false;
    }
    
    // Insert products in batches to avoid request size limitations
    const batchSize = 50;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('products')
        .upsert(batch, {
          onConflict: 'sku',
          ignoreDuplicates: false,
        });
      
      if (error) {
        console.error(`❌ Error uploading batch ${i / batchSize + 1}:`, error);
        return false;
      }
      
      console.log(`✅ Uploaded batch ${i / batchSize + 1} of ${Math.ceil(products.length / batchSize)}`);
    }
    
    console.log('✅ All products uploaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception during product upload:', error);
    return false;
  }
}

/**
 * Create Quotes Table
 */
async function createQuotesTable() {
  console.log('\nCreating quotes table...');
  
  try {
    // Check if table already exists
    const { error: existsError } = await supabase
      .from('quotes')
      .select('*')
      .limit(1);
    
    if (!existsError) {
      console.log('✅ Quotes table already exists');
      return true;
    }
    
    // Similar limitations as with products table
    console.log('⚠️ Unable to create quotes table automatically');
    console.log('Please create the quotes table manually with the following structure:');
    console.log(`
      - id: UUID (primary key with default gen_random_uuid())
      - quote_number: TEXT (required, unique)
      - status: TEXT (required, default: 'draft')
      - products: JSONB (required)
      - container_utilization: NUMERIC(5,2)
      - total_pallets: INTEGER
      - created_at: TIMESTAMPTZ (default: now())
      - updated_at: TIMESTAMPTZ (default: now())
      - expires_at: TIMESTAMPTZ (default: now() + interval '30 days')
    `);
    
    return false;
  } catch (error) {
    console.error('❌ Error creating quotes table:', error);
    return false;
  }
}

/**
 * Create Email Logs Table
 */
async function createEmailLogsTable() {
  console.log('\nCreating email_logs table...');
  
  try {
    // Check if table already exists
    const { error: existsError } = await supabase
      .from('email_logs')
      .select('*')
      .limit(1);
    
    if (!existsError) {
      console.log('✅ Email logs table already exists');
      return true;
    }
    
    // Similar limitations as with other tables
    console.log('⚠️ Unable to create email_logs table automatically');
    console.log('Please create the email_logs table manually with the following structure:');
    console.log(`
      - id: UUID (primary key with default gen_random_uuid())
      - quote_id: UUID (foreign key to quotes.id)
      - recipient: TEXT (required)
      - subject: TEXT (required)
      - status: TEXT (required, default: 'pending')
      - error_message: TEXT
      - sent_at: TIMESTAMPTZ (default: now())
    `);
    
    return false;
  } catch (error) {
    console.error('❌ Error creating email_logs table:', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Supabase setup process...');
  
  try {
    // Create tables first
    const productsCreated = await createProductsTable();
    const quotesCreated = await createQuotesTable();
    const emailLogsCreated = await createEmailLogsTable();
    
    // If products table exists or was created, upload data
    if (productsCreated) {
      const products = await readProductsFromCSV();
      await uploadProducts(products);
    }
    
    console.log('\n✨ Supabase setup process completed');
    
    // Report summary of what was done
    console.log('\n📋 Summary:');
    console.log(`- Products table: ${productsCreated ? 'Created/Exists' : 'Failed to create'}`);
    console.log(`- Quotes table: ${quotesCreated ? 'Created/Exists' : 'Failed to create'}`);
    console.log(`- Email logs table: ${emailLogsCreated ? 'Created/Exists' : 'Failed to create'}`);
    
    // Show next steps
    console.log('\n⏭️ Next steps:');
    if (!productsCreated || !quotesCreated || !emailLogsCreated) {
      console.log('1. Create any missing tables manually in the Supabase dashboard');
      console.log('2. Run this script again to upload product data once tables are created');
    } else {
      console.log('✅ All set! Your Supabase database is ready to use');
    }
    
  } catch (error) {
    console.error('❌ Unhandled error during setup:', error);
  }
}

// Execute the script
main();
