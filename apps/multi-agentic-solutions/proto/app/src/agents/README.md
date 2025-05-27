# Agents

This directory contains agent implementations for the Multi-Agent Support System.

## Knowledge Agent

The `KnowledgeAgent` class implements a RAG (Retrieval Augmented Generation) system to answer questions based on retrieved knowledge.

### Flow Diagram

```
+-------------------+     +--------------------+     +---------------------+
| 1. Receive Query  | --> | 2. Retrieve Docs   | --> | 3. Build Context    |
+-------------------+     +--------------------+     +---------------------+
                                                              |
                                                              v
+-------------------+     +--------------------+     +---------------------+
| 6. Return Answer  | <-- | 5. Parse Output    | <-- | 4. Generate Response|
+-------------------+     +--------------------+     +---------------------+
```

### Implementation Details

#### 1. Query Processing
- The `query(question: string, k: number = 5)` method initiates the RAG process
- Logs the incoming question for monitoring
- Parameter `k` controls how many documents to retrieve

#### 2. Document Retrieval
- Uses `VectorStoreService.similaritySearch()` to find relevant documents
- Performs semantic search based on query embeddings
- Returns early with fallback response if no relevant documents found

#### 3. Context Building
- `buildContext()` method transforms documents into a formatted context
- Adds citation markers (`[Doc X]`) to each document
- Includes source information when available

#### 4. Response Generation
- Uses LangChain's `PromptTemplate` to create a structured prompt
- Combines retrieved context with original question
- Instructs the LLM to use citation format and handle missing information cases
- Uses a chain pipeline: `prompt → llm → outputParser`

#### 5. Output Parsing
- Processes LLM response through `StringOutputParser`
- Handles any formatting needed for final response

#### 6. Response Delivery
- Returns the formatted answer with citations
- Logs metrics about response generation
- Includes error handling for failed queries

### Additional Features

#### Context Window Management
- `manageContextWindow()` method prevents token limit overflows
- Uses character count as a proxy for token estimation
- Can be extended with a proper tokenizer for production use

#### Error Handling
- Try/catch pattern ensures errors are properly logged
- Returns meaningful error messages when RAG pipeline fails

### Usage Example

```typescript
// Initialize the agent
const knowledgeAgent = new KnowledgeAgent();

// Query the knowledge base
const answer = await knowledgeAgent.query("What is LangChain?");
console.log(answer);
// Output: "LangChain is a framework for developing applications powered by language models. [Doc 1]"
```

### Dependencies

- `@langchain/core/prompts`: For creating structured prompts
- `@langchain/openai`: For LLM access
- `@langchain/core/documents`: For document type definitions
- `@langchain/core/output_parsers`: For processing LLM outputs
- Local services:
  - `VectorStoreService`: For document retrieval
  - `EmbeddingService`: For query embedding generation 