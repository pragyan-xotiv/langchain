import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KnowledgeSearch from '@/components/knowledge/KnowledgeSearch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, answer: 'Test answer' }),
  } as Response)
);

describe('KnowledgeSearch Component', () => {
  beforeEach(() => {
    // Create a new QueryClient for each test
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeSearch />
      </QueryClientProvider>
    );
    
    // Reset mocks
    jest.clearAllMocks();
  });

  it('renders the search input', () => {
    const input = screen.getByPlaceholderText('Ask a question...');
    expect(input).toBeInTheDocument();
  });

  it('handles search submission', async () => {
    // Fill and submit the form
    const input = screen.getByPlaceholderText('Ask a question...');
    fireEvent.change(input, { target: { value: 'What is LangChain?' } });
    fireEvent.click(screen.getByText('Search'));

    // Wait for the results
    await waitFor(() => {
      expect(screen.getByText('Test answer')).toBeInTheDocument();
    });
  });
}); 