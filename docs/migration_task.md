# Migration Task: Convert Multi-Agentic Solutions Proto App to Next.js

## Context

We are migrating our multi-agentic solutions prototype application from its current Node.js/Express structure to a Next.js full-stack architecture. The application includes:

1. A knowledge layer with RAG capabilities using LangChain
2. Supabase pgvector integration for embedding storage
3. Various agents and tools for multi-agent workflows
4. Documentation and testing infrastructure

The migration will improve our developer experience, add a modern UI for interacting with agents and knowledge, and maintain compatibility with existing functionality.

## Objective

Create a new Next.js application side-by-side with the existing app while:
- Preserving all existing functionality including the knowledge layer
- Adding a modern UI for interacting with agents and knowledge
- Maintaining compatibility with LangChain components
- Following best practices for Next.js architecture
- Migrating all test scripts and maintaining test coverage

## Current Application Structure

Key directories and files in the current application:

```
app/
├── src/
│   ├── agents/           # Agent implementations
│   ├── rag/              # RAG components (documentProcessor, embeddingService, etc.)
│   ├── services/         # External services (Supabase)
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── tests/                # Test files
├── examples/             # Example usage scripts
├── supabase/             # Supabase configuration
├── KNOWLEDGE_LAYER.md    # Documentation
└── package.json          # Dependencies and scripts
```

## Current Scripts in package.json

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js",
  "dev": "nodemon --exec tsx src/server.ts",
  "test": "NODE_OPTIONS=--experimental-vm-modules jest",
  "test:knowledge": "tsx ./tests/test-knowledge-layer.ts",
  "test:unit": "NODE_OPTIONS=--experimental-vm-modules jest tests/rag/documentProcessor.test.ts tests/rag/embeddingService.test.ts tests/agents/knowledgeAgent.test.ts tests/environment.test.ts tests/knowledge-layer.test.ts",
  "test:integration": "NODE_OPTIONS=--experimental-vm-modules jest tests/knowledge-layer.test.ts",
  "lint": "eslint . --ext .ts",
  "format": "prettier --write \"src/**/*.ts\"",
  "setup-db": "ts-node scripts/setup-db.ts"
}
```

## Technical Requirements

1. Use the Next.js App Router architecture
2. Maintain TypeScript throughout the application
3. Convert any Express endpoints to Next.js API routes
4. Develop a responsive dashboard UI for knowledge and agent interaction
5. Ensure the knowledge layer continues to function with Supabase
6. Maintain test coverage for core functionality
7. Set up parallel testing infrastructure with equivalent functionality

## Migration Tasks

### 1. Project Setup and Structure

```bash
# Navigate to the parent directory
cd /Users/pragyan/Documents/WORK/LANGCHAIN/langchain/apps/multi-agentic-solutions/

# Create new directory for Next.js app
mkdir -p proto-next

# Initialize a new Next.js project in the new directory
cd proto-next
npx create-next-app@latest app --typescript --eslint --app --src-dir --import-alias "@/*"

# Move into the app directory
cd app

# Install existing dependencies from the current app
npm install @langchain/community @langchain/core @langchain/langgraph @langchain/openai @supabase/supabase-js dotenv typedi uuid winston zod
```

Create the following directory structure in the new Next.js app:

```
proto-next/app/
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API Routes (replacing any Express endpoints)
│   │   │   ├── agents/    # Agent-related endpoints
│   │   │   ├── knowledge/ # Knowledge-related endpoints
│   │   │   └── rag/       # RAG-related endpoints
│   │   ├── dashboard/     # Dashboard UI routes
│   │   │   ├── knowledge/ # Knowledge dashboard
│   │   │   └── agents/    # Agents dashboard
│   │   ├── layout.tsx     # Main layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── agents/        # Agent-related components
│   │   ├── knowledge/     # Knowledge-related components
│   │   └── ui/            # Shared UI components
│   ├── lib/               # Core library code (migrated from current app)
│   │   ├── agents/        # Migrate from src/agents/
│   │   ├── rag/           # Migrate from src/rag/
│   │   ├── services/      # Migrate from src/services/
│   │   └── utils/         # Migrate from src/utils/
│   └── types/             # Migrate from src/types/
├── public/                # Static assets
├── supabase/              # Migrate from supabase/
├── tests/                 # Migrated test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   ├── e2e/               # End-to-end tests
│   └── mocks/             # Test mocks and fixtures
└── scripts/               # Utility scripts (including db setup)
```

### 2. Core Functionality Migration

#### 2.1 Knowledge Layer Migration

Migrate the knowledge layer components while maintaining functionality:

1. Copy all files from `src/rag/` to `src/lib/rag/`
2. Update imports to match new file structure
3. Ensure compatibility with Next.js environment

For example, migrate `documentProcessor.ts`:

```typescript
// Current: src/rag/documentProcessor.ts
// New: src/lib/rag/documentProcessor.ts

// Update any imports to match new file structure
import { Document } from '../types/index.js';
// Becomes
import { Document } from '@/types';

// Rest of the file remains largely unchanged
```

#### 2.2 Agent Migration

1. Copy all files from `src/agents/` to `src/lib/agents/`
2. Update imports to match new file structure
3. Create UI components for agent interaction in `src/components/agents/`

#### 2.3 Services Migration

1. Copy all files from `src/services/` to `src/lib/services/`
2. Update Supabase configuration for Next.js environment
3. Create environment variable setup for Next.js

### 3. API Route Implementation

Convert any existing endpoints to Next.js API routes:

```typescript
// src/app/api/knowledge/query/route.ts
import { NextResponse } from 'next/server';
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    
    const knowledgeAgent = new KnowledgeAgent();
    const answer = await knowledgeAgent.query(question);
    
    return NextResponse.json({ 
      success: true, 
      answer 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
```

### 4. UI Development

Create React components for interacting with the knowledge layer and agents:

1. Implement a knowledge search interface:

```typescript
// src/components/knowledge/KnowledgeSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function KnowledgeSearch() {
  const [question, setQuestion] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge', submittedQuestion],
    queryFn: async () => {
      if (!submittedQuestion) return null;
      
      const response = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: submittedQuestion }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to query knowledge base');
      }
      
      return response.json();
    },
    enabled: !!submittedQuestion,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuestion(question);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="w-full p-2 border rounded"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          {(error as Error).message}
        </div>
      )}

      {data && data.success && (
        <div className="p-4 bg-gray-100 rounded">
          <h3 className="font-bold">Answer:</h3>
          <p>{data.answer}</p>
        </div>
      )}
    </div>
  );
}
```

2. Implement pages for the dashboard:

```typescript
// src/app/dashboard/knowledge/page.tsx
import KnowledgeSearch from '@/components/knowledge/KnowledgeSearch';

export default function KnowledgeDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Knowledge Dashboard</h1>
      <KnowledgeSearch />
    </div>
  );
}
```

### 5. Testing Infrastructure Migration

#### 5.1 Jest Configuration

Create a Next.js compatible Jest configuration:

```javascript
// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const config = {
  // Match the current app's configuration as much as possible
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Setup files to load environment variables and mocks
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
  // Add specific directories for different test types
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/unit/**/*.test.tsx',
    '<rootDir>/tests/integration/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.tsx',
  ],
  // For React components testing
  testEnvironment: 'jest-environment-jsdom',
};

// createJestConfig is exported so we can use it in scripts
export default createJestConfig(config);
```

#### 5.2 Test Scripts

Update package.json to include equivalent test scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:knowledge": "tsx ./tests/test-knowledge-layer.ts",
  "test:unit": "jest tests/unit",
  "test:integration": "jest tests/integration",
  "test:e2e": "playwright test",
  "setup-db": "tsx scripts/setup-db.ts"
}
```

#### 5.3 Migrating Test Files

1. Copy and update knowledge layer tests:

```bash
# Create directory structure
mkdir -p tests/unit/rag tests/unit/agents tests/integration

# Copy test files
cp ../app/tests/rag/documentProcessor.test.ts tests/unit/rag/
cp ../app/tests/rag/embeddingService.test.ts tests/unit/rag/
cp ../app/tests/agents/knowledgeAgent.test.ts tests/unit/agents/
cp ../app/tests/knowledge-layer.test.ts tests/integration/
```

2. Update import paths in test files:

```typescript
// Old path in test
import { processDocuments } from '../../src/rag/documentProcessor.js';

// New path in Next.js
import { processDocuments } from '@/lib/rag/documentProcessor';
```

3. Add UI component tests:

```typescript
// tests/unit/components/KnowledgeSearch.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KnowledgeSearch from '@/components/knowledge/KnowledgeSearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock fetch for testing API calls
global.fetch = jest.fn();

describe('KnowledgeSearch Component', () => {
  beforeEach(() => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeSearch />
      </QueryClientProvider>
    );
  });

  it('renders the search input', () => {
    const input = screen.getByPlaceholderText('Ask a question...');
    expect(input).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, answer: 'Test answer' }),
    });

    // Fill and submit the form
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'What is LangChain?' } });
    fireEvent.click(screen.getByText('Search'));

    // Wait for the results
    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/knowledge/query',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ question: 'What is LangChain?' }),
      })
    );
  });
});
```

### 6. Documentation Updates

1. Update `KNOWLEDGE_LAYER.md` to reflect Next.js architecture
2. Create additional documentation for UI components
3. Update examples to show usage in Next.js context

## File-by-File Migration Map

| Current File/Directory | New Location | Changes Needed |
|------------------------|--------------|----------------|
| src/agents/knowledgeAgent.ts | src/lib/agents/knowledgeAgent.ts | Update imports |
| src/rag/documentProcessor.ts | src/lib/rag/documentProcessor.ts | Update imports |
| src/rag/embeddingService.ts | src/lib/rag/embeddingService.ts | Update imports |
| src/rag/vectorStore.ts | src/lib/rag/vectorStore.ts | Update imports |
| src/rag/retriever.ts | src/lib/rag/retriever.ts | Update imports |
| src/services/supabase/* | src/lib/services/supabase/* | Update client initialization |
| src/types/* | src/types/* | Minimal changes |
| src/utils/* | src/lib/utils/* | Minimal changes |
| tests/rag/* | tests/unit/rag/* | Update imports, adapt for Next.js |
| tests/agents/* | tests/unit/agents/* | Update imports, adapt for Next.js |
| tests/knowledge-layer.test.ts | tests/integration/knowledge-layer.test.ts | Update imports |
| tests/test-knowledge-layer.ts | tests/test-knowledge-layer.ts | Minimal changes |
| jest.config.js | jest.config.mjs | Convert to Next.js compatible config |
| scripts/setup-db.ts | scripts/setup-db.ts | Minimal changes |

## Expected Deliverables

1. Fully functional Next.js application with all knowledge layer capabilities
2. Modern UI for interacting with the knowledge base and agents
3. Comprehensive test suite with equivalent coverage to the original app
4. Updated documentation reflecting the new architecture
5. Deployment configuration for hosting the Next.js application

## Timeline

- Week 1: Project setup and knowledge layer migration
- Week 2: Agent migration and API route implementation
- Week 3: UI development and component creation
- Week 4: Testing, documentation, and optimization

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [LangChain Documentation](https://js.langchain.com/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Testing Next.js Applications](https://nextjs.org/docs/testing)

## Migration Success Criteria

1. All knowledge layer operations work in the Next.js environment
2. Agent functionality is preserved and accessible via UI
3. All tests pass in the new environment with equivalent coverage
4. Documentation is updated to reflect the new architecture
5. UI provides intuitive access to system capabilities
6. Original app functionality remains untouched during parallel development 