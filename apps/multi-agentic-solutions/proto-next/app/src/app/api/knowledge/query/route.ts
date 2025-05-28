import { NextResponse } from 'next/server';
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';
import { isSupabaseConfigured } from '@/lib/services/supabase/client';

// Simple handler without using decorators
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
    // Check Supabase configuration first
    if (!isSupabaseConfigured()) {
      console.error('Supabase is not properly configured');
      return NextResponse.json(
        { success: false, error: 'Database configuration error. Please check server environment variables.' },
        { status: 500 }
      );
    }

    const { question } = await request.json();
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid request: question parameter is required' },
        { status: 400 }
      );
    }
    
    // Create the handler and query the knowledge agent
    const handler = new KnowledgeQueryHandler();
    const answer = await handler.handleQuery(question);
    
    return NextResponse.json({ 
      success: true, 
      answer 
    });
  } catch (error) {
    console.error('Error in knowledge query route:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'An unknown error occurred';
      
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 