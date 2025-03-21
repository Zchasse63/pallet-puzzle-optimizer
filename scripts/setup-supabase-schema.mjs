/**
 * Script to set up the Supabase database schema
 * Run with: node scripts/setup-supabase-schema.mjs
 */
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = 'https://kzpatsbjixgtoskfrwzh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cGF0c2JqaXhndG9za2Zyd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NTcwMDgsImV4cCI6MjA1NzUzMzAwOH0.thjdvcS_aYrbQhmAMT2hYvoCBgQujk9CtYaOyDi4EVI';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create tables using SQL
async function setupSchema() {
  console.log('Setting up Supabase database schema...');
  
  try {
    // Create products table
    const { error: productsError } = await supabase.rpc('exec_sql', {
      query: `
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
    
    if (productsError) {
      console.error('Error creating products table:', productsError);
      return;
    }
    
    console.log('Products table created successfully');
    
    // Create quotes table
    const { error: quotesError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS quotes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          quote_number TEXT UNIQUE NOT NULL,
          status TEXT NOT NULL,
          products JSONB NOT NULL,
          container_utilization NUMERIC(5, 2),
          total_pallets INTEGER,
          expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    if (quotesError) {
      console.error('Error creating quotes table:', quotesError);
      return;
    }
    
    console.log('Quotes table created successfully');
    
    // Create email_logs table
    const { error: emailLogsError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS email_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          quote_id UUID REFERENCES quotes(id),
          recipient TEXT NOT NULL,
          subject TEXT NOT NULL,
          status TEXT NOT NULL,
          error_message TEXT,
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `
    });
    
    if (emailLogsError) {
      console.error('Error creating email_logs table:', emailLogsError);
      return;
    }
    
    console.log('Email logs table created successfully');
    
    console.log('Database schema setup complete!');
  } catch (err) {
    console.error('Exception during schema setup:', err);
  }
}

// Execute the function
setupSchema();
