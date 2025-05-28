# Next.js Migration Documentation Updates

This document outlines the changes needed to update the documentation files in the multi-agentic-solutions prototype application to reflect the Next.js migration.

## Files Requiring Updates

1. `KNOWLEDGE_LAYER.md`
2. `README.md`

## Updated Documentation

### KNOWLEDGE_LAYER.md Updates

```markdown
# Knowledge Layer

This module implements the Knowledge Layer for the Multi-Agent Support System using RAG (Retrieval Augmented Generation). It enables agents to access and query external knowledge stored in vector databases.

## Components

The Knowledge Layer consists of the following components:

1. **Document Processing Pipeline**: Processes documents, splits them into chunks, and enriches them with metadata.
2. **Vector Embedding Generation**: Generates embeddings for document chunks and queries.
3. **Vector Storage**: Stores document chunks and their embeddings in a Supabase pgvector database.
4. **Knowledge Agent**: Provides an interface for querying the knowledge base and generating answers with citations.
5. **UI Components**: React components for interacting with the knowledge layer (Next.js only).

## Architecture

### Backend Architecture

```
                                    +---------------------+
                                    |                     |
                                    |   Knowledge Agent   |
                                    |                     |
                                    +----------+----------+
                                               |
                                               v
+------------------+    +--------------+    +------------+    +-------------+
|                  |    |              |    |            |    |             |
|  Raw Documents   +--->+  Processor   +--->+  Embedder  +--->+  Supabase   |
|                  |    |              |    |            |    |  pgvector   |
+------------------+    +--------------+    +------------+    +-------------+
```

### Next.js Integration

```
+------------------+    +--------------------+
|                  |    |                    |
| React Components +--->+ Next.js API Routes |
|                  |    |                    |
+------------------+    +---------+----------+
                                  |
                                  v
                        +-------------------+
                        |                   |
                        | Knowledge Layer   |
                        | (Backend)         |
                        |                   |
                        +-------------------+
```

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Supabase account with pgvector extension enabled

### Environment Variables

Create a `.env.local` file in the project root with:

```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### TypeScript Configuration

If you're using decorators in your codebase, you'll need to enable experimental decorator support in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    // ... other options
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

> **Note:** Decorators are experimental in TypeScript and can cause issues in Next.js, especially in API routes. Consider using simpler class patterns without decorators for API routes.

### Database Setup

Run the database setup script to create the necessary tables and vector extension:

```bash
npm run setup-db
```

## Usage

### Indexing Documents

```typescript
// Original Node.js
import { Document } from './src/types';
import { Retriever } from './src/rag/retriever';

// Next.js
import { Document } from '@/types';
import { Retriever } from '@/lib/rag/retriever';

// Create documents
const documents: Document[] = [
  {
    id: 'doc-1',
    content: 'LangChain is a framework for developing applications powered by language models.',
    metadata: { source: 'langchain-docs.pdf', page: 1 }
  }
];

// Index documents
const retriever = new Retriever();
await retriever.indexDocuments(documents);
```

### Querying the Knowledge Base

#### Backend (Node.js or Next.js API Route)

```typescript
// Original Node.js
import { KnowledgeAgent } from './src/agents/knowledgeAgent';

// Next.js
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';

// Create knowledge agent
const knowledgeAgent = new KnowledgeAgent();

// Query
const answer = await knowledgeAgent.query('What is LangChain?');
console.log(answer);
// Output: LangChain is a framework for developing applications powered by language models [Doc 1].
```

#### Frontend (Next.js Only)

```typescript
// Next.js API Route
// src/app/api/knowledge/query/route.ts
import { NextResponse } from 'next/server';
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';

// Simple handler class without decorators (recommended for Next.js API routes)
class KnowledgeQueryHandler {
  private knowledgeAgent: KnowledgeAgent;
  
  constructor() {
    this.knowledgeAgent = new KnowledgeAgent();
  }

  async handleQuery(question: string): Promise<string> {
    return this.knowledgeAgent.query(question);
  }
}

export async function POST(request: Request) {
  try {
    const { question } = await request.json();
    const handler = new KnowledgeQueryHandler();
    const answer = await handler.handleQuery(question);
    return NextResponse.json({ success: true, answer });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// React Component
// src/components/knowledge/KnowledgeSearch.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

function KnowledgeSearch() {
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

  const handleSubmit = (e) => {
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

## Testing

### Node.js Testing

You can run the test suite for the Knowledge Layer with:

```bash
npm run test:knowledge
```

### Next.js Testing

For the Next.js implementation, tests are structured differently:

```bash
# Run all tests
npm test

# Run only knowledge layer tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run the knowledge layer test script
npm run test:knowledge
```

## API Reference

The API remains largely the same, with import paths being the main difference between Node.js and Next.js implementations.

### Document Processor

```typescript
processDocuments(documents: Document[], options?: ProcessorOptions): Promise<LangChainDocument[]>
```

### Embedding Service

```typescript
embedDocuments(documents: LangChainDocument[]): Promise<DocumentWithEmbedding[]>
embedQuery(query: string): Promise<number[]>
```

### Vector Store Service

```typescript
storeDocuments(documents: DocumentWithEmbedding[]): Promise<void>
similaritySearch(query: string, k: number = 4): Promise<LangChainDocument[]>
withCache(ttl: number = 60000): VectorStoreService
```

### Retriever

```typescript
indexDocuments(documents: Document[], options?: ProcessorOptions): Promise<void>
retrieveRelevantDocuments(query: string, k: number = 4): Promise<LangChainDocument[]>
getCachedVectorStore(): VectorStoreService
```

### Knowledge Agent

```typescript
query(question: string): Promise<string>
```
```

### README.md Updates

```markdown
# Multi-Agent Support System: Knowledge Layer

This repository contains both the original Node.js/Express implementation and the Next.js implementation of the Knowledge Layer for the Multi-Agent Support System.

## Implementations

This project now has two implementations:

1. **Node.js/Express Implementation** (Located in `/app`)
2. **Next.js Implementation** (Located in `/proto-next/app`)

Both implementations provide the same core functionality, with the Next.js version adding a modern UI for interacting with the knowledge layer.

## Components

The Knowledge Layer consists of the following components:

1. **Document Processing Pipeline**: Processes documents, splits them into chunks, and enriches them with metadata.
2. **Vector Embedding Generation**: Generates embeddings for document chunks and queries.
3. **Vector Storage**: Stores document chunks and their embeddings in a Supabase pgvector database.
4. **Knowledge Agent**: Provides an interface for querying the knowledge base and generating answers with citations.
5. **UI Components** (Next.js only): React components for interacting with the knowledge layer.

## Getting Started

### Node.js/Express Implementation

```bash
# Navigate to the Node.js implementation
cd app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up the database
npm run setup-db

# Run tests
npm test

# Start the server
npm run dev
```

### Next.js Implementation

```bash
# Navigate to the Next.js implementation
cd proto-next/app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Set up the database
npm run setup-db

# Run tests
npm test

# Start the development server
npm run dev
```

## TypeScript Configuration

If you're using the Next.js implementation and encounter issues with decorators, ensure your `tsconfig.json` has the proper decorator support enabled:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
    // ... other options
  }
}
```

## Usage

Please refer to the [KNOWLEDGE_LAYER.md](./KNOWLEDGE_LAYER.md) document for detailed usage instructions for both implementations.

## Architecture

```
                                    +---------------------+
                                    |                     |
                                    |   Knowledge Agent   |
                                    |                     |
                                    +----------+----------+
                                               |
                                               v
+------------------+    +--------------+    +------------+    +-------------+
|                  |    |              |    |            |    |             |
|  Raw Documents   +--->+  Processor   +--->+  Embedder  +--->+  Supabase   |
|                  |    |              |    |            |    |  pgvector   |
+------------------+    +--------------+    +------------+    +-------------+
```

## Testing

### Node.js Implementation

```bash
# Run all tests
npm test

# Run knowledge layer tests only
npm run test:knowledge

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

### Next.js Implementation

```bash
# Navigate to Next.js implementation
cd proto-next/app

# Run all tests
npm test

# Run knowledge layer tests only
npm run test:knowledge

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## API Reference

See [KNOWLEDGE_LAYER.md](./KNOWLEDGE_LAYER.md) for a complete API reference.

## License

MIT
```

## Implementation Plan

1. Create the new Next.js implementation following the migration task document
2. Update `KNOWLEDGE_LAYER.md` to include Next.js integration details
3. Update `README.md` to reflect both implementations
4. Create additional documentation as needed for the Next.js UI components
5. Configure TypeScript for decorator support if needed
6. Consider refactoring code that uses decorators in API routes to simpler patterns

These documentation updates should be created once the initial Next.js implementation is complete, to ensure accuracy and completeness of the documentation. 