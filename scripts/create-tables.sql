-- Supabase Schema Creation for Pallet Puzzle Optimizer
-- Run this SQL in the Supabase SQL Editor to create your database tables

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  products JSONB NOT NULL,
  container_utilization NUMERIC(5, 2),
  total_pallets INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days')
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for products table
CREATE POLICY "Anyone can view products" 
  ON products FOR SELECT USING (true);

-- Create RLS Policies for quotes table
CREATE POLICY "Anyone can view quotes" 
  ON quotes FOR SELECT USING (true);
  
CREATE POLICY "Anyone can insert quotes" 
  ON quotes FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Anyone can update quotes" 
  ON quotes FOR UPDATE USING (true);

-- Create RLS Policies for email_logs table
CREATE POLICY "Anyone can view email_logs" 
  ON email_logs FOR SELECT USING (true);
  
CREATE POLICY "Anyone can insert email_logs" 
  ON email_logs FOR INSERT WITH CHECK (true);

-- Confirm success
SELECT 'Tables created successfully!' as result;
