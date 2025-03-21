/**
 * Simple script to verify Supabase connection
 */
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with hardcoded credentials for testing
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';

console.log('Connecting to Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey.substring(0, 10)}...${supabaseKey.substring(supabaseKey.length - 5)}`);

const supabase = createClient(supabaseUrl, supabaseKey);

// Perform a simple query
async function checkConnection() {
  try {
    console.log('\nTesting connection...');
    
    // Simple query to check if we can connect
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    
    // Try to access the 'products' table if it exists
    console.log('\nChecking for products table...');
    const { error: tableError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (tableError) {
      if (tableError.code === '42P01') {
        console.log('❌ Products table does not exist yet. You need to create it.');
      } else {
        console.log('❌ Error accessing products table:', tableError.message);
      }
    } else {
      console.log('✅ Products table exists and is accessible!');
    }
    
  } catch (err) {
    console.error('❌ Exception during test:', err);
  }
}

checkConnection();
