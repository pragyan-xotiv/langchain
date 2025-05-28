import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFiles: ['<rootDir>/tests/setup-polyfills.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  watchAll: false,
  testTimeout: 30000,
  testMatch: [
    "<rootDir>/src/lib/web-scraper/__tests__/**/*.test.ts"
  ]
};

export default createJestConfig(customJestConfig); 