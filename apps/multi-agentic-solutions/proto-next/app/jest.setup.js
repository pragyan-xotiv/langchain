// Mock the env variables required for tests
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-supabase-key';

// Load polyfills happens automatically as they're referenced in jest.config.mjs

// Silence console logs during tests
// Uncomment if needed for debugging: 
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// }; 