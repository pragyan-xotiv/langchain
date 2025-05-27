// Core application types

// User request and response types
export interface UserQuery {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  id: string;
  queryId: string;
  agentId: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Agent types
export interface Agent {
  id: string;
  name: string;
  description: string;
  role: string;
  configuration: Record<string, unknown>;
}

// Tool types
export interface Tool {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

// Document types for RAG
export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
}

export interface DocumentMetadata {
  source: string;
  title?: string;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
  [key: string]: unknown;
}

// Error types
export interface ApplicationError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, unknown>;
} 