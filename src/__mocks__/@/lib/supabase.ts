// Mock Supabase client and helpers for testing
export const supabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    signUp: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    onAuthStateChange: jest.fn().mockImplementation((callback) => {
      // Return an unsubscribe function
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    }),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockImplementation(callback => Promise.resolve({ data: [], error: null })),
  }),
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
      getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://test-url.com/image.jpg' } }),
    }),
  },
};

export const supabaseHelpers = {
  getUser: jest.fn().mockResolvedValue({ user: null, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  signIn: jest.fn().mockResolvedValue({ user: { id: 'test-user-id' }, error: null }),
  signUp: jest.fn().mockResolvedValue({ user: { id: 'test-user-id' }, error: null }),
  getProducts: jest.fn().mockResolvedValue({ 
    data: [
      { id: '1', name: 'Test Product 1', width: 10, height: 10, depth: 10, weight: 5 },
      { id: '2', name: 'Test Product 2', width: 20, height: 20, depth: 20, weight: 10 }
    ], 
    error: null 
  }),
  createProduct: jest.fn().mockResolvedValue({ 
    data: { id: '3', name: 'New Product', width: 15, height: 15, depth: 15, weight: 7 }, 
    error: null 
  }),
  updateProduct: jest.fn().mockResolvedValue({ 
    data: { id: '1', name: 'Updated Product', width: 10, height: 10, depth: 10, weight: 5 }, 
    error: null 
  }),
  deleteProduct: jest.fn().mockResolvedValue({ error: null }),
  getProductById: jest.fn().mockResolvedValue({ 
    data: { id: '1', name: 'Test Product 1', width: 10, height: 10, depth: 10, weight: 5 }, 
    error: null 
  }),
};
