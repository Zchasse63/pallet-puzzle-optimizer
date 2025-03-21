import { createClient } from '@supabase/supabase-js';

// These environment variables are set in the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export type Tables = {
  products: {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    weight: number;
    unitsPerPallet: number;
    created_at: string;
    updated_at: string;
  };
  quotes: {
    id: string;
    user_id: string | null;
    quote_number: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    products: {
      product_id: string;
      quantity: number;
      price: number;
    }[];
    container_utilization: number;
    total_pallets: number;
    created_at: string;
    updated_at: string;
    expires_at: string;
  };
  users: {
    id: string;
    email: string;
    full_name: string;
    company: string | null;
    role: 'admin' | 'user';
    created_at: string;
  };
};

// Helper functions for common Supabase operations
export const supabaseHelpers = {
  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }
    
    return data;
  },
  
  async searchProducts(query: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`);
    
    if (error) {
      console.error('Error searching products:', error);
      return [];
    }
    
    return data;
  },
  
  // Quotes
  async saveQuote(quoteData: Omit<Tables['quotes'], 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single();
    
    if (error) {
      console.error('Error saving quote:', error);
      return null;
    }
    
    return data;
  },
  
  async getQuote(id: string) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching quote:', error);
      return null;
    }
    
    return data;
  },
  
  // Authentication
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      return { user: null, error };
    }
    
    return { user: data.user, error: null };
  },
  
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    
    if (error) {
      console.error('Error resetting password:', error);
      return { error };
    }
    
    return { error: null };
  },
  
  async signUp(email: string, password: string, userData: Partial<Tables['users']>) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    
    if (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }
    
    return { user: data.user, error: null };
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return false;
    }
    
    return true;
  },
  
  // User session
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data?.user) {
      return null;
    }
    
    return data.user;
  },
};

export default supabase;
