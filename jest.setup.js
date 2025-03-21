// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock import.meta.env
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://mock-supabase-url.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'mock-anon-key',
      VITE_API_BASE_URL: 'https://mock-api-url.com',
      NODE_ENV: 'test'
    }
  }
};

// Mock next/navigation with exposed functions for testing
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
};

// Export for use in tests
global.mockRouter = mockRouter;

jest.mock('next/navigation', () => {
  return {
    useRouter: jest.fn().mockImplementation(() => mockRouter),
    usePathname: jest.fn().mockImplementation(() => '/'),
    useSearchParams: jest.fn().mockImplementation(() => new URLSearchParams()),
    useParams: jest.fn().mockImplementation(() => ({})),
    redirect: jest.fn(),
    notFound: jest.fn(),
  };
});

// Mock Supabase
jest.mock('@supabase/supabase-js', () => {
  const createClientMock = jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
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
    }),
  });

  return {
    createClient: createClientMock,
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: 'div',
      form: 'form',
      button: 'button',
      table: 'table',
      tbody: 'tbody',
      tr: 'tr',
      td: 'td',
      span: 'span',
    },
    AnimatePresence: ({ children }) => children,
  };
});

// Mock sonner toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock accessibility utils
jest.mock('@/utils/accessibility', () => ({
  generateA11yId: jest.fn().mockReturnValue('test-id'),
  announceToScreenReader: jest.fn(),
}));

// Mock error handling utils
jest.mock('@/utils/errorHandling', () => ({
  handleError: jest.fn().mockImplementation((err, options) => ({
    message: err.message || options?.defaultMessage || 'An error occurred',
    originalError: err,
  })),
}));

// Set up window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
