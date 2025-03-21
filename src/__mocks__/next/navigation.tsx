// Mock for Next.js navigation hooks
const useRouter = jest.fn().mockReturnValue({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
});

const usePathname = jest.fn().mockReturnValue('/');
const useSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
const useParams = jest.fn().mockReturnValue({});

// Mock for navigation functions
const redirect = jest.fn();
const notFound = jest.fn();

// Export all functions as default and named exports
export { 
  useRouter, 
  usePathname, 
  useSearchParams, 
  useParams, 
  redirect, 
  notFound 
};

export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound
};
