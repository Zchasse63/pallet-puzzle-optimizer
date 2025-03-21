// Mock implementation for Next.js navigation hooks and functions
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

const mockPathname = '/';
const mockSearchParams = new URLSearchParams();
const mockParams = {};

export function resetNavigationMocks() {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
  mockRouter.forward.mockReset();
  mockRouter.refresh.mockReset();
  mockRouter.prefetch.mockReset();
}

// These functions must be manually imported in the test file before the component is rendered
export function mockNextNavigation() {
  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => mockPathname,
    useSearchParams: () => mockSearchParams,
    useParams: () => mockParams,
    redirect: jest.fn(),
    notFound: jest.fn(),
  }));
}
