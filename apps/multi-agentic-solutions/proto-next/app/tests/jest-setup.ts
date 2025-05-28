import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load environment variables from .env.test file if it exists, otherwise from .env.local
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

// Set up test environment variables if they aren't already defined
if (!process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = 'sk-test-key';
}
if (!process.env.LLM_MODEL_NAME) {
  process.env.LLM_MODEL_NAME = 'gpt-3.5-turbo';
}
if (!process.env.EMBEDDING_MODEL) {
  process.env.EMBEDDING_MODEL = 'text-embedding-3-large';
}

// Mock fetch globally with a more complete implementation
global.fetch = jest.fn(() => 
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
  })
) as unknown as typeof fetch;

// Set up crypto.randomUUID if needed
if (!global.crypto) {
  global.crypto = {} as Crypto;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => '123e4567-e89b-12d3-a456-426614174000';
}

// Mock console methods to keep test output clean in CI environments
// Uncomment these lines when running in CI to reduce noise
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});

// This file runs before each test file
// See https://jestjs.io/docs/configuration#setupfilesafterenv-array

// Cleanup mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 