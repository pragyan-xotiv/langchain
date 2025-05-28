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