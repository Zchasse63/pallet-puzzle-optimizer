-- Create database functions for the Pallet Puzzle Optimizer

-- Function to increment the view count of a quote
CREATE OR REPLACE FUNCTION increment_quote_view_count(quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert view event
  INSERT INTO quote_events (quote_id, event_type, created_at)
  VALUES (quote_id, 'view', now());
  
  -- Update the view count in the quotes table
  UPDATE quotes
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = quote_id;
END;
$$;

-- Function to increment the share count of a quote
CREATE OR REPLACE FUNCTION increment_quote_share_count(quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the share count in the quotes table
  UPDATE quotes
  SET share_count = COALESCE(share_count, 0) + 1
  WHERE id = quote_id;
END;
$$;

-- Function to get quote statistics
CREATE OR REPLACE FUNCTION get_quote_statistics(quote_id UUID)
RETURNS TABLE (
  view_count INTEGER,
  share_count INTEGER,
  last_viewed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.view_count,
    q.share_count,
    (SELECT MAX(created_at) FROM quote_events WHERE quote_id = q.id AND event_type = 'view'),
    q.created_at,
    q.expires_at
  FROM quotes q
  WHERE q.id = quote_id;
END;
$$;

-- Function to check if a quote is expired
CREATE OR REPLACE FUNCTION is_quote_expired(quote_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT expires_at INTO expiry_date
  FROM quotes
  WHERE id = quote_id;
  
  -- If expires_at is null, the quote never expires
  IF expiry_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if current date is past expiry date
  RETURN now() > expiry_date;
END;
$$;

-- Function to extend quote expiry date
CREATE OR REPLACE FUNCTION extend_quote_expiry(
  quote_id UUID,
  days_to_extend INTEGER DEFAULT 30
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current expiry date or use current date if null
  SELECT COALESCE(expires_at, now()) INTO new_expiry
  FROM quotes
  WHERE id = quote_id;
  
  -- Add days to expiry
  new_expiry := new_expiry + (days_to_extend * INTERVAL '1 day');
  
  -- Update quote with new expiry
  UPDATE quotes
  SET expires_at = new_expiry
  WHERE id = quote_id;
  
  RETURN new_expiry;
END;
$$;
