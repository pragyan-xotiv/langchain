# Knowledge Layer Testing

This document outlines the testing approach for the Knowledge Layer in the Multi-Agent Support System.

## Testing Approach

The Knowledge Layer testing strategy includes both unit tests and integration tests to ensure comprehensive test coverage.

### Unit Tests

We have created individual unit tests for all components of the Knowledge Layer:

1. **documentProcessor.test.ts**: Tests document chunking and metadata handling
2. **embeddingService.test.ts**: Tests embedding generation functionality
3. **vectorStore.test.ts**: Tests Supabase pgvector integration
4. **retriever.test.ts**: Tests the document indexing and retrieval workflow
5. **knowledgeAgent.test.ts**: Tests query generation with context

#### Running Unit Tests

```bash
npm test
```

### Integration Test

The `knowledge-layer.test.ts` provides a comprehensive test that demonstrates the entire RAG workflow with mocked dependencies, making it suitable for CI/CD pipelines.

#### Running Integration Tests

```bash
npm run test:integration
```

### Manual Testing Script

A simpler integration test script is available in `test-knowledge-layer.ts`. This script can run with or without external dependencies and is useful for manual testing.

#### Running Manual Tests

```bash
npm run test:knowledge
```

## Running Specific Tests

You can run specific test files or groups of tests based on your needs:

```bash
# Run only tests that don't require external dependencies
npm test -- tests/rag/documentProcessor.test.ts tests/agents/knowledgeAgent.test.ts

# Run a specific test file
npm test -- tests/rag/documentProcessor.test.ts
```

### Handling Database-Dependent Tests

Tests involving Supabase (vectorStore.test.ts and retriever.test.ts) require:

1. A properly configured Supabase instance with pgvector extension
2. Valid Supabase credentials in the .env file
3. Properly set up database tables and functions

If you don't have these dependencies set up, these tests will fail with errors like:
- "Could not find the function public.match_documents"
- "Failed to store documents"

In CI/CD environments, it's recommended to use the mocked integration tests instead.

## Test Mocking Strategy

### Jest Configuration

The Jest configuration has been updated to support ESM modules and TypeScript:

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }]
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFilesAfterEnv: ['./tests/jest-setup.ts']
};
```

### Mock Setup

The `jest-setup.ts` file extends Jest types for better mock support:

```typescript
// jest-setup.ts
import { expect } from '@jest/globals';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(a: number, b: number): R;
    }
  }
}

expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});
```

### Test Data

The `mocks.ts` file provides utility functions for creating test data:

```typescript
// mocks.ts
import { Document, LangChainDocument, DocumentWithEmbedding } from '../src/types';

export const createTestDocuments = (count: number = 3): Document[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `doc-${i + 1}`,
    content: `Test document content ${i + 1}`,
    metadata: { source: `source-${i + 1}`, page: i + 1 }
  }));
};

export const createTestLangChainDocuments = (count: number = 3): LangChainDocument[] => {
  return Array.from({ length: count }, (_, i) => ({
    pageContent: `Test document content ${i + 1}`,
    metadata: { id: `doc-${i + 1}`, source: `source-${i + 1}`, page: i + 1 }
  }));
};

export const createTestEmbeddings = (count: number = 3, dimensions: number = 1536): DocumentWithEmbedding[] => {
  return Array.from({ length: count }, (_, i) => ({
    pageContent: `Test document content ${i + 1}`,
    metadata: { id: `doc-${i + 1}`, source: `source-${i + 1}`, page: i + 1 },
    embedding: Array.from({ length: dimensions }, () => Math.random())
  }));
};
```

## Testing Challenges and Solutions

### TypeScript Typing in Mocks

We resolved challenges with TypeScript typing in mocks by:
1. Defining clear interfaces for all components
2. Creating typed mock factory functions
3. Using Jest's typed mocking capabilities

### ESM Compatibility with Jest

We addressed ESM compatibility issues with Jest by:
1. Configuring Jest for ESM support
2. Using proper import/export syntax
3. Setting up proper module path mapping

### External Dependencies in Tests

For tests involving external dependencies (OpenAI API, Supabase):
1. Created mock implementations for unit tests
2. Added configuration options to skip tests requiring external services
3. Provided clear documentation for setting up test environment variables 