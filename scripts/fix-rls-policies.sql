-- Fix RLS policies for products and quotes tables

-- Create insert policy for products table
CREATE POLICY "Anyone can insert products" 
  ON products FOR INSERT WITH CHECK (true);

-- Allow anyone to view quotes (public access)
CREATE POLICY "Anyone can view quotes" 
  ON quotes FOR SELECT USING (true);

-- Allow authenticated users to create quotes
CREATE POLICY "Authenticated users can create quotes" 
  ON quotes FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own quotes
CREATE POLICY "Users can update their own quotes" 
  ON quotes FOR UPDATE 
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create a view counter function
CREATE OR REPLACE FUNCTION increment_quote_view_count(quote_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE quotes
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = quote_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow anyone to call the view counter function
GRANT EXECUTE ON FUNCTION increment_quote_view_count TO anon, authenticated;

-- Confirm success
SELECT 'RLS policies updated successfully!' as result;
