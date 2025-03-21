-- Update RLS policies for quotes tables with proper error handling

-- Add user_id column to quotes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'quotes'::regclass AND attname = 'user_id') THEN
    ALTER TABLE quotes ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added user_id column to quotes table';
  ELSE
    RAISE NOTICE 'user_id column already exists in quotes table, skipping...';
  END IF;
END $$;

-- Allow anyone to view quotes (public access)
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Anyone can view quotes" 
      ON quotes FOR SELECT USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Anyone can view quotes" already exists, skipping...';
  END;
END $$;

-- Allow authenticated users to create quotes
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Authenticated users can create quotes" 
      ON quotes FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Authenticated users can create quotes" already exists, skipping...';
  END;
END $$;

-- Allow authenticated users to update their own quotes
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Users can update their own quotes" 
      ON quotes FOR UPDATE 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'Policy "Users can update their own quotes" already exists, skipping...';
  END;
END $$;

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

-- Create quote_events table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'quote_events') THEN
    CREATE TABLE quote_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      quote_id UUID NOT NULL REFERENCES quotes(id),
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      CONSTRAINT valid_event_type CHECK (event_type IN ('view', 'share', 'email', 'print'))
    );
    
    -- Add RLS policy for quote events
    CREATE POLICY "Insert quote events" ON quote_events
      FOR INSERT WITH CHECK (true);
      
    -- Enable RLS on the table
    ALTER TABLE quote_events ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Created quote_events table and policies';
  ELSE
    RAISE NOTICE 'quote_events table already exists, skipping creation';
    
    -- Ensure the policy exists
    BEGIN
      CREATE POLICY "Insert quote events" ON quote_events
        FOR INSERT WITH CHECK (true);
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Insert quote events" already exists, skipping...';
    END;
  END IF;
END $$;

-- Confirm success
SELECT 'Quote policies and tables updated successfully!' as result;
