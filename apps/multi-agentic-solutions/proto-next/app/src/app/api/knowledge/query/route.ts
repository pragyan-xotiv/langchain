import { NextResponse } from 'next/server';
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';

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
    const { question } = await request.json();
    
    // Create the handler and query the knowledge agent
    const handler = new KnowledgeQueryHandler();
    const answer = await handler.handleQuery(question);
    
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