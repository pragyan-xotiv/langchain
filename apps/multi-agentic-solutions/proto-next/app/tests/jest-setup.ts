import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables from .env.test file if it exists, otherwise from .env.local
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

// Mock fetch globally
global.fetch = jest.fn() as unknown as typeof fetch;

// This file will run before each test file
// See https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Cleanup mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 