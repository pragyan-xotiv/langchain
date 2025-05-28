import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { Document as LangChainDocument } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { VectorStoreService } from '@/lib/rag/vectorStore';
import { EmbeddingService } from '@/lib/rag/embeddingService';
import { isSupabaseConfigured } from '@/lib/services/supabase/client';

// Simplified config for Next.js - in a real app, you would use environment variables
const config = {
  llm: {
    modelName: process.env.LLM_MODEL_NAME || 'gpt-3.5-turbo',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
  }
};

// Simple logger for Next.js
const logger = {
  info: (message: string, data?: Record<string, unknown>) => console.log(`INFO: ${message}`, data || ''),
  warn: (message: string, data?: Record<string, unknown>) => console.warn(`WARN: ${message}`, data || ''),
  error: (message: string, data?: Record<string, unknown>) => console.error(`ERROR: ${message}`, data || ''),
};

/**
 * Knowledge Agent that uses RAG to answer questions
 */
export class KnowledgeAgent {
  private llm: ChatOpenAI;
  private vectorStore: VectorStoreService;
  private embeddingService: EmbeddingService;
  private outputParser: StringOutputParser;
  
  constructor() {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      logger.error('Supabase is not properly configured. Check environment variables.');
    }
    
    this.llm = new ChatOpenAI({
      modelName: config.llm.modelName,
      temperature: 0.1,
      openAIApiKey: config.llm.openaiApiKey,
    });
    
    this.vectorStore = new VectorStoreService();
    this.embeddingService = new EmbeddingService();
    this.outputParser = new StringOutputParser();
  }
  
  /**
   * Query the knowledge base and generate a response
   */
  async query(question: string, k: number = 5): Promise<string> {
    try {
      logger.info('Processing knowledge query', { question });
      
      // Verify Supabase configuration before making queries
      if (!isSupabaseConfigured()) {
        throw new Error('Database is not properly configured. Check your environment variables.');
      }
      
      // Retrieve relevant documents
      const docs = await this.vectorStore.similaritySearch(question, k);
      
      // If no documents found, return a fallback response
      if (!docs || docs.length === 0) {
        logger.warn('No relevant documents found', { question });
        return "I don't have enough information to answer this question.";
      }
      
      // Build context from documents
      const context = this.buildContext(docs);
      
      // Create prompt template
      const prompt = PromptTemplate.fromTemplate(
        `Answer the question based on the following context:
        
        Context: {context}
        
        Question: {question}
        
        When answering, cite your sources using [Doc X] notation where X is the document number.
        If the context doesn't contain the answer, say "I don't have enough information to answer this question."
        `
      );
      
      // Generate response
      const chain = prompt.pipe(this.llm).pipe(this.outputParser);
      const response = await chain.invoke({
        context,
        question
      });
      
      logger.info('Generated knowledge response', { 
        question, 
        docsCount: docs.length,
        responseLength: response.length 
      });
      
      return response;
    } catch (error) {
      logger.error('Error in knowledge query', { error, question });
      throw new Error('Failed to process knowledge query: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
  
  /**
   * Build context string from documents with citation markers
   */
  private buildContext(docs: LangChainDocument[]): string {
    return docs.map((doc, index) => {
      const sourceInfo = doc.metadata.source 
        ? ` (Source: ${doc.metadata.source})`
        : '';
      
      return `[Doc ${index + 1}]${sourceInfo}: ${doc.pageContent}`;
    }).join('\n\n');
  }
  
  /**
   * Manage context window to avoid exceeding token limits
   */
  private manageContextWindow(docs: LangChainDocument[], maxTokens: number = 4000): LangChainDocument[] {
    // Simple approach: just take documents until we reach the approximate token limit
    // In a production system, you would use a tokenizer to count tokens accurately
    
    const estimatedTokensPerChar = 0.25; // Rough estimate: 4 chars per token
    let totalTokens = 0;
    const selectedDocs: LangChainDocument[] = [];
    
    for (const doc of docs) {
      const estimatedTokens = doc.pageContent.length * estimatedTokensPerChar;
      
      if (totalTokens + estimatedTokens > maxTokens) {
        break;
      }
      
      selectedDocs.push(doc);
      totalTokens += estimatedTokens;
    }
    
    return selectedDocs;
  }
} 