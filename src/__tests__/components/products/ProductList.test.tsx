import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from '@/components/products/ProductList.refactored';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { announceToScreenReader } from '@/utils/accessibility';

// Mock dependencies
jest.mock('@/hooks/useProducts', () => ({
  useProducts: jest.fn(),
}));

// Create mocks for Next.js navigation hooks
const mockRouterPush = jest.fn();

// Mock all navigation hooks completely
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockImplementation(() => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn().mockImplementation(() => '/products'),
  useSearchParams: jest.fn().mockImplementation(() => new URLSearchParams()),
  useParams: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/utils/accessibility', () => ({
  generateA11yId: jest.fn().mockReturnValue('test-id'),
  announceToScreenReader: jest.fn(),
}));

describe('ProductList Component', () => {
  // Mock data
  const mockProducts = [
    {
      id: 'prod-1',
      created_at: '2023-01-01T00:00:00.000Z',
      name: 'Product A',
      description: 'Description A',
      dimensions: { length: 10, width: 10, height: 10 },
      weight: 5,
      user_id: 'user-123',
      is_active: true,
      category: 'Category 1',
      sku: 'SKU-001',
    },
    {
      id: 'prod-2',
      created_at: '2023-01-02T00:00:00.000Z',
      name: 'Product B',
      description: 'Description B',
      dimensions: { length: 20, width: 20, height: 20 },
      weight: 10,
      user_id: 'user-123',
      is_active: false,
      category: 'Category 2',
      sku: 'SKU-002',
    },
  ];

  const mockDeleteProduct = jest.fn();
  const mockFormatDate = jest.fn().mockImplementation((date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useProducts as jest.Mock).mockReturnValue({
      products: mockProducts,
      isLoading: false,
      error: null,
      deleteProduct: mockDeleteProduct,
      formatDate: mockFormatDate,
    });

    // Mock window.confirm
    window.confirm = jest.fn().mockImplementation(() => true);
  });

  test('renders loading state correctly', () => {
    // Override the default mock to show loading state
    (useProducts as jest.Mock).mockReturnValue({
      products: [],
      isLoading: true,
      error: null,
      deleteProduct: mockDeleteProduct,
      formatDate: mockFormatDate,
    });

    // Add wrapper with SupabaseProvider
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('renders error state correctly', () => {
    // Override the default mock to show error state
    (useProducts as jest.Mock).mockReturnValue({
      products: [],
      isLoading: false,
      error: 'Failed to load products',
      deleteProduct: mockDeleteProduct,
      formatDate: mockFormatDate,
    });

    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    expect(screen.getByText('Please try again later')).toBeInTheDocument();
  });

  test('renders empty state correctly', () => {
    // Override the default mock to show empty state
    (useProducts as jest.Mock).mockReturnValue({
      products: [],
      isLoading: false,
      error: null,
      deleteProduct: mockDeleteProduct,
      formatDate: mockFormatDate,
    });

    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByText('Create your first product to get started')).toBeInTheDocument();
  });

  test('renders product list correctly', () => {
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Check if products are rendered
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    
    // Check if table headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    
    // Check if actions are rendered
    expect(screen.getAllByText('Edit').length).toBe(2);
    expect(screen.getAllByText('Delete').length).toBe(2);
  });

  test('filters products by search term', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'Product A');
    
    // Only Product A should be visible
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.queryByText('Product B')).not.toBeInTheDocument();
  });

  test('sorts products when clicking on column header', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Click on Name column header to sort
    const nameHeader = screen.getByText('Name').closest('th');
    await user.click(nameHeader!);
    
    // Check if sorting indicator is displayed
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    
    // Click again to reverse sort order
    await user.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });

  test('deletes a product when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Click on delete button for first product
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Confirm deletion
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this product?');
    
    // Check if deleteProduct was called with correct ID
    expect(mockDeleteProduct).toHaveBeenCalledWith('prod-1');
    
    // Check if success toast was shown
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Product deleted successfully');
    });
    
    // Check if screen reader announcement was made
    expect(announceToScreenReader).toHaveBeenCalledWith('Product deleted successfully', 'polite');
  });

  test('handles cancel during product deletion', async () => {
    const user = userEvent.setup();
    
    // Override confirm to return false (cancel)
    window.confirm = jest.fn().mockImplementation(() => false);
    
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Click on delete button for first product
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Confirm deletion dialog was shown
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that deleteProduct was NOT called
    expect(mockDeleteProduct).not.toHaveBeenCalled();
  });

  test('handles error during product deletion', async () => {
    const user = userEvent.setup();
    
    // Mock deleteProduct to return an error
    mockDeleteProduct.mockResolvedValue({
      success: false,
      error: 'Failed to delete product',
    });
    
    render(
      <div data-testid="supabase-provider-mock">
        <ProductList />
      </div>
    );
    
    // Click on delete button for first product
    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);
    
    // Check if error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to delete product', {
        description: expect.any(String),
      });
    });
    
    // Check if screen reader announcement was made
    expect(announceToScreenReader).toHaveBeenCalledWith(expect.stringContaining('Error'), 'assertive');
  });
});
