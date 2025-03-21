/**
 * Script to test Supabase connection and retrieve products
 * Run with: node scripts/test-supabase-connection.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch products
async function fetchProducts() {
  console.log('Fetching products from Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`Successfully retrieved ${data.length} products:`);
    console.log(JSON.stringify(data, null, 2));
    
    return data;
  } catch (err) {
    console.error('Exception while fetching products:', err);
  }
}

// Execute the function
fetchProducts();
