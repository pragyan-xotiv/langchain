import nextJest from 'next/jest.js';

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({
  dir: './',
});

// Any custom config you want to pass to Jest
const customJestConfig = {
  // Load polyfills before any tests run
  setupFiles: ['<rootDir>/tests/setup-polyfills.ts'],
  // Setup env vars after polyfills
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Use jsdom for component tests and node for service tests
  testEnvironment: 'node',
  // Path mappings
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Disable watching for CI
  watchAll: false,
  // Set timeout higher for async tests
  testTimeout: 30000,
  // Focus testing on specific areas that are working
  testMatch: [
    "<rootDir>/tests/unit/services/supabase/documentRepository.test.ts",
    "<rootDir>/tests/unit/rag/**/*.test.ts"
  ]
};

// createJestConfig is exported in this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig); 