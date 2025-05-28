import { NextRequest } from 'next/server';
import { POST } from '@/app/api/knowledge/query/route';
import { KnowledgeAgent } from '@/lib/agents/knowledgeAgent';

// Mock KnowledgeAgent
jest.mock('@/lib/agents/knowledgeAgent', () => {
  return {
    KnowledgeAgent: jest.fn().mockImplementation(() => {
      return {
        query: jest.fn().mockResolvedValue('Mocked answer')
      };
    })
  };
});

describe('Knowledge Query API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a successful response with an answer', async () => {
    // Create a mock request with a question
    const req = new NextRequest('http://localhost:3000/api/knowledge/query', {
      method: 'POST',
      body: JSON.stringify({ question: 'What is LangChain?' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Call the POST handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      answer: 'Mocked answer'
    });

    // Verify KnowledgeAgent query was called with the right parameters
    const knowledgeAgentInstance = (KnowledgeAgent as jest.Mock).mock.instances[0];
    expect(knowledgeAgentInstance.query).toHaveBeenCalledWith('What is LangChain?');
  });

  it('should return an error response when an error occurs', async () => {
    // Mock KnowledgeAgent to throw an error
    (KnowledgeAgent as jest.Mock).mockImplementationOnce(() => {
      return {
        query: jest.fn().mockRejectedValue(new Error('Test error'))
      };
    });

    // Create a mock request
    const req = new NextRequest('http://localhost:3000/api/knowledge/query', {
      method: 'POST',
      body: JSON.stringify({ question: 'Error test' }),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Call the POST handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Test error'
    });
  });
}); 