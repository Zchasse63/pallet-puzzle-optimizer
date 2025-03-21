/**
 * Supabase Database Schema Setup Script
 * 
 * This script creates the necessary tables and RLS policies for the Pallet Puzzle Optimizer app.
 * It should be run only once during initial setup.
 * 
 * IMPORTANT: Run with the service role key as an argument:
 * node scripts/setup-supabase-schema.js <SERVICE_ROLE_KEY>
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
const CSV_FILE_PATH = path.join(__dirname, '..', 'data', 'products.csv');

// Get service role key from command-line arguments
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: Service role key is required');
  console.log('Usage: node scripts/setup-supabase-schema.js <SERVICE_ROLE_KEY>');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Table definitions
const TABLES = {
  products: `
    CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      price NUMERIC(10, 2),
      dimensions JSONB,
      weight NUMERIC(10, 2),
      units_per_pallet INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `,
  quotes: `
    CREATE TABLE IF NOT EXISTS quotes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      quote_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      products JSONB NOT NULL,
      container_utilization NUMERIC(5, 2),
      total_pallets INTEGER,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
    );
  `,
  email_logs: `
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      quote_id UUID REFERENCES quotes(id),
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      error_message TEXT,
      sent_at TIMESTAMPTZ DEFAULT now()
    );
  `
};

// RLS policies
const RLS_POLICIES = {
  products: [
    {
      name: "Allow public read access to products",
      using: "true",
      check: "",
      for: "SELECT"
    }
  ],
  quotes: [
    {
      name: "Allow public read access to quotes",
      using: "true",
      check: "",
      for: "SELECT"
    },
    {
      name: "Allow public insert to quotes",
      using: "",
      check: "true",
      for: "INSERT"
    },
    {
      name: "Allow public update to quotes",
      using: "true",
      check: "",
      for: "UPDATE"
    }
  ],
  email_logs: [
    {
      name: "Allow public read access to email_logs",
      using: "true",
      check: "",
      for: "SELECT"
    },
    {
      name: "Allow public insert to email_logs",
      using: "",
      check: "true",
      for: "INSERT"
    }
  ]
};

/**
 * Executes an SQL query directly through Supabase's pg_dump
 * @param {string} sql - SQL query to execute
 * @returns {Promise<{success: boolean, error: any}>}
 */
async function executeSQL(sql) {
  try {
    const { error } = await supabase.rpc('pg_dump', { query: sql });
    
    if (error) {
      // Fallback to another method if pg_dump function isn't available
      console.log('Direct SQL execution failed, trying alternative method...');
      return await executeSQLAlternative(sql);
    }
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error executing SQL:', error);
    return { success: false, error };
  }
}

/**
 * Alternative method to execute SQL using Supabase's REST API
 * This is a limited fallback and may not work for all SQL statements
 */
async function executeSQLAlternative(sql) {
  // This is a fallback method - we won't implement it fully as we'll see if pg_dump works
  console.log('Alternative SQL execution is limited. May need to create tables manually.');
  return { success: false, error: 'SQL execution not fully supported' };
}

/**
 * Creates database tables
 */
async function createTables() {
  console.log('Creating database tables...');
  
  for (const [tableName, sqlStatement] of Object.entries(TABLES)) {
    console.log(`Creating table: ${tableName}`);
    
    // First, check if table already exists
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (!error) {
      console.log(`✅ Table ${tableName} already exists, skipping creation`);
      continue;
    }
    
    // Table doesn't exist, create it
    const result = await executeSQL(sqlStatement);
    
    if (result.success) {
      console.log(`✅ Successfully created table: ${tableName}`);
    } else {
      console.error(`❌ Failed to create table ${tableName}:`, result.error);
      console.log('\nFallback: Create tables manually using this SQL:');
      console.log(sqlStatement);
    }
  }
}

/**
 * Enables Row Level Security on tables
 */
async function enableRLS() {
  console.log('\nEnabling Row Level Security...');
  
  for (const tableName of Object.keys(TABLES)) {
    const sql = `ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`;
    const result = await executeSQL(sql);
    
    if (result.success) {
      console.log(`✅ Enabled RLS on table: ${tableName}`);
    } else {
      console.error(`❌ Failed to enable RLS on ${tableName}:`, result.error);
    }
  }
}

/**
 * Creates RLS policies for tables
 */
async function createRLSPolicies() {
  console.log('\nCreating RLS policies...');
  
  for (const [tableName, policies] of Object.entries(RLS_POLICIES)) {
    for (const policy of policies) {
      const usingClause = policy.using ? `USING (${policy.using})` : '';
      const checkClause = policy.check ? `WITH CHECK (${policy.check})` : '';
      
      const sql = `
        CREATE POLICY "${policy.name}"
        ON ${tableName}
        FOR ${policy.for}
        ${usingClause}
        ${checkClause};
      `;
      
      const result = await executeSQL(sql);
      
      if (result.success) {
        console.log(`✅ Created policy "${policy.name}" on table: ${tableName}`);
      } else {
        console.error(`❌ Failed to create policy on ${tableName}:`, result.error);
      }
    }
  }
}

/**
 * Read product data from CSV file
 * @returns {Promise<Array>} Array of product objects
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
 * @param {Array} products - Array of product objects
 */
async function uploadProducts(products) {
  if (!products || products.length === 0) {
    console.log('⚠️ No products to upload');
    return;
  }
  
  console.log(`\nUploading ${products.length} products to Supabase...`);
  
  const { data, error } = await supabase
    .from('products')
    .upsert(products, {
      onConflict: 'sku',
      ignoreDuplicates: false,
    })
    .select();
  
  if (error) {
    console.error('❌ Error uploading products:', error);
    return;
  }
  
  console.log(`✅ Successfully uploaded ${data?.length || 0} products`);
}

/**
 * Main function to set up the database schema
 */
async function main() {
  console.log('🚀 Starting Supabase schema setup...');
  console.log(`🔑 Using service role key (first 10 chars): ${SERVICE_ROLE_KEY.substring(0, 10)}...`);
  
  try {
    // Step 1: Create tables
    await createTables();
    
    // Step 2: Enable RLS
    await enableRLS();
    
    // Step 3: Create RLS policies
    await createRLSPolicies();
    
    // Step 4: Read and upload products
    const products = await readProductsFromCSV();
    await uploadProducts(products);
    
    console.log('\n✨ Database setup completed! Your Supabase database is ready to use.');
    console.log('🔒 IMPORTANT: Do not commit or share your service role key!');
    
  } catch (error) {
    console.error('❌ Unhandled error during setup:', error);
    process.exit(1);
  }
}

// Execute the script
main();
