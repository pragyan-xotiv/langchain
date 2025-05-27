// Simple test script to demonstrate the knowledge layer
import { processDocuments } from '../src/rag/documentProcessor.js';
import { EmbeddingService } from '../src/rag/embeddingService.js';
import { Retriever } from '../src/rag/retriever.js';
import { KnowledgeAgent } from '../src/agents/knowledgeAgent.js';
import { Document as AppDocument } from '../src/types/index.js';
import { Document as LangChainDocument } from '@langchain/core/documents';

// Sample documents
const sampleDocuments: AppDocument[] = [
  {
    id: 'doc-1',
    content: 'LangChain is a framework for developing applications powered by language models.',
    metadata: { source: 'langchain-docs.pdf', page: 1 }
  },
  {
    id: 'doc-2',
    content: 'Supabase is an open source Firebase alternative that provides database, authentication, and storage services.',
    metadata: { source: 'supabase-docs.pdf', page: 1 }
  },
  {
    id: 'doc-3',
    content: 'LangGraph is a library for building stateful, multi-actor applications with LLMs, built on top of LangChain.',
    metadata: { source: 'langgraph-docs.pdf', page: 1 }
  }
];

// Test 1: Process documents
async function testDocumentProcessing() {
  console.log('\n=== Test 1: Document Processing ===');
  try {
    const processedDocs = await processDocuments(sampleDocuments);
    console.log(`✅ Successfully processed ${processedDocs.length} documents`);
    console.log(`Sample processed document: ${JSON.stringify(processedDocs[0].metadata, null, 2)}`);
  } catch (error) {
    console.error('❌ Document processing failed:', error);
  }
}

// Test 2: Generate embeddings (requires OpenAI API key)
async function testEmbeddingGeneration() {
  console.log('\n=== Test 2: Embedding Generation ===');
  try {
    const processedDocs = await processDocuments(sampleDocuments);
    const embeddingService = new EmbeddingService();
    const embeddedDocs = await embeddingService.embedDocuments(processedDocs);
    console.log(`✅ Successfully generated embeddings for ${embeddedDocs.length} documents`);
    console.log(`Embedding dimension: ${embeddedDocs[0].embedding.length}`);
  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
  }
}

// Test 3: Retriever functionality (requires Supabase setup)
async function testRetriever() {
  console.log('\n=== Test 3: Retriever Functionality ===');
  try {
    const retriever = new Retriever();
    
    // This will fail if Supabase is not properly set up
    console.log('Indexing documents...');
    await retriever.indexDocuments(sampleDocuments);
    console.log('✅ Successfully indexed documents');
    
    console.log('Retrieving relevant documents...');
    const relevantDocs = await retriever.retrieveRelevantDocuments('LangChain', 2);
    console.log(`✅ Retrieved ${relevantDocs.length} relevant documents`);
  } catch (error) {
    console.error('❌ Retriever functionality failed:', error);
  }
}

// Test 4: Knowledge Agent (requires OpenAI API key and Supabase setup)
async function testKnowledgeAgent() {
  console.log('\n=== Test 4: Knowledge Agent ===');
  try {
    const knowledgeAgent = new KnowledgeAgent();
    console.log('Querying knowledge agent...');
    const answer = await knowledgeAgent.query('What is LangChain?');
    console.log('✅ Knowledge agent response:');
    console.log(answer);
  } catch (error) {
    console.error('❌ Knowledge agent failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🔍 Running Knowledge Layer Tests');
  
  // You can comment out tests that require external dependencies
  await testDocumentProcessing();
  // Uncomment the following tests if you have the required API keys and database setup
  // await testEmbeddingGeneration();
  // await testRetriever();
  // await testKnowledgeAgent();
  
  console.log('\n🏁 Tests completed');
}

runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
}); 