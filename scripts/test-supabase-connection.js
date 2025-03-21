/**
 * A simple script to test Supabase connection and view table structure
 * Run with: node scripts/test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test connection by checking for system schema info
    const { data, error } = await supabase
      .from('products')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection error:', error);
      return false;
    }
    
    console.log('Connection successful! Products count:', data);
    return true;
  } catch (err) {
    console.error('Exception during connection test:', err);
    return false;
  }
}

// Function to manually insert a single product
async function insertSingleProduct() {
  try {
    console.log('Trying to insert a single test product...');
    
    const testProduct = {
      name: 'Test Product',
      sku: 'TEST-001',
      description: 'This is a test product',
      price: 9.99,
      dimensions: { length: 10, width: 10, height: 10 },
      weight: 1.0,
      units_per_pallet: 100,
      updated_at: new Date().toISOString()
    };
    
    // First try to select to ensure table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing products table:', tableError);
      return false;
    }
    
    console.log('Successfully accessed products table. Found records:', tableCheck.length);
    
    // Insert test product
    const { data, error } = await supabase
      .from('products')
      .upsert(testProduct)
      .select();
    
    if (error) {
      console.error('Error inserting test product:', error);
      return false;
    }
    
    console.log('Successfully inserted test product:', data);
    return true;
  } catch (err) {
    console.error('Exception during test insert:', err);
    return false;
  }
}

// Function to check the products table structure
async function checkTableStructure() {
  try {
    console.log('Checking products table structure...');
    
    // Query to get table structure (this is approximate and may not work in all Supabase setups)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error checking table structure:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Sample product record structure:');
      console.log(JSON.stringify(data[0], null, 2));
      
      // Analyze the structure
      const record = data[0];
      const fields = Object.keys(record);
      console.log('Available fields:', fields);
    } else {
      console.log('No records found in products table to analyze structure.');
    }
  } catch (err) {
    console.error('Exception during structure check:', err);
  }
}

// Main function
async function main() {
  // 1. Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('Could not connect to Supabase. Please check your credentials.');
    return;
  }
  
  // 2. Check table structure
  await checkTableStructure();
  
  // 3. Try to insert a test product
  await insertSingleProduct();
}

// Run the script
main();
