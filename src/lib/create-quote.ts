import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Product } from './types';

interface CreateQuoteParams {
  products: Product[];
  containerUtilization: number;
  totalPallets: number;
}

/**
 * Creates a new quote in the database
 * Sets the user_id to the current authenticated user
 * Returns the created quote data
 */
export async function createQuote({
  products,
  containerUtilization,
  totalPallets
}: CreateQuoteParams) {
  const supabase = createClientComponentClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated to create a quote');
  }
  
  // Generate a unique quote number
  const quoteNumber = `Q-${Date.now().toString().slice(-6)}`;
  
  // Set expiration date (30 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Create the quote
  const { data, error } = await supabase
    .from('quotes')
    .insert({
      quote_number: quoteNumber,
      products: products,
      container_utilization: containerUtilization,
      total_pallets: totalPallets,
      user_id: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating quote:', error);
    throw new Error(`Failed to create quote: ${error.message}`);
  }
  
  return data;
}
