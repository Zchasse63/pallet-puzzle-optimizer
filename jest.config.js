export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock specific modules
    '^@/lib/supabase$': '<rootDir>/src/__mocks__/@/lib/supabase.ts',
    '^@/contexts/SupabaseContext$': '<rootDir>/src/__mocks__/@/contexts/SupabaseContext.tsx',
    '^@/components/products/ProductList$': '<rootDir>/src/__mocks__/@/components/products/ProductList.tsx',
    '^@/components/products/ProductList.refactored$': '<rootDir>/src/__mocks__/@/components/products/ProductList.refactored.tsx',
    '^@/components/products/ProductForm.refactored$': '<rootDir>/src/__mocks__/@/components/products/ProductForm.refactored.tsx',
    // Mock Next.js modules
    '^next/navigation$': '<rootDir>/src/__mocks__/next/navigation.tsx',
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    // Use ts-jest to transpile tests
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', { 
      tsconfig: 'tsconfig.jest.json',
      isolatedModules: true 
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
  ],
  moduleDirectories: ['node_modules', 'src'],
};
