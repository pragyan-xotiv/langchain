# Knowledge Layer

This module implements the Knowledge Layer for the Multi-Agent Support System using RAG (Retrieval Augmented Generation). It enables agents to access and query external knowledge stored in vector databases.

## Components

The Knowledge Layer consists of the following components:

1. **Document Processing Pipeline**: Processes documents, splits them into chunks, and enriches them with metadata.
2. **Vector Embedding Generation**: Generates embeddings for document chunks and queries.
3. **Vector Storage**: Stores document chunks and their embeddings in a Supabase pgvector database.
4. **Knowledge Agent**: Provides an interface for querying the knowledge base and generating answers with citations.

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

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Supabase account with pgvector extension enabled

### Environment Variables

Create a `.env` file in the project root with:

```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### Database Setup

Run the database setup script to create the necessary tables and vector extension:

```bash
npm run setup-db
```

## Usage

### Indexing Documents

```typescript
import { Document } from './src/types';
import { Retriever } from './src/rag/retriever';

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

```typescript
import { KnowledgeAgent } from './src/agents/knowledgeAgent';

// Create knowledge agent
const knowledgeAgent = new KnowledgeAgent();

// Query
const answer = await knowledgeAgent.query('What is LangChain?');
console.log(answer);
// Output: LangChain is a framework for developing applications powered by language models [Doc 1].
```

## Testing

You can run the test suite for the Knowledge Layer with:

```bash
npm run test:knowledge
```

This will test:
1. Document processing
2. Embedding generation (requires OpenAI API key)
3. Vector storage (requires Supabase setup)
4. Knowledge agent queries (requires both OpenAI API key and Supabase setup)

By default, only the document processing test runs without external dependencies. Uncomment the other tests in `test-knowledge-layer.ts` if you have the necessary API keys and database setup.

### Unit Tests

Unit tests are available with:

```bash
npm test
```

For more detailed information about testing approaches, please see [KNOWLEDGE_LAYER_TESTING.md](./KNOWLEDGE_LAYER_TESTING.md).

## API Reference

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