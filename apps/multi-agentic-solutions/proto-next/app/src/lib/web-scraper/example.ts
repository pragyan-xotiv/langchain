import { WebAppScraper } from './index';
import { Retriever } from '@/lib/rag/retriever';

/**
 * Example script demonstrating how to use the WebAppScraper
 */
async function main() {
  try {
    // Create a scraper instance
    const scraper = new WebAppScraper({
      crawler: {
        baseUrl: 'https://example.com',
        maxDepth: 2,
        maxPages: 5, // Limit for demonstration
        requestDelay: 1000 // 1 second between requests
      },
      extraction: {
        captureScreenshots: true,
        detectWorkflows: true,
        textSelectors: [
          'h1, h2, h3, h4, h5, h6',
          'p, li, td, th',
          'label, button, input[type="submit"]',
          '.content, .description, .help-text'
        ]
      }
    });
    
    console.log('Starting scraper...');
    
    // Start the scraping process
    await scraper.start();
    
    // Get stats
    const stats = scraper.getStats();
    console.log('Scraping completed with stats:', stats);
    
    // Generate documentation
    const documents = await scraper.generateDocumentation();
    console.log(`Generated ${documents.length} documents`);
    
    // Example of integration with the RAG system
    const retriever = new Retriever();
    await retriever.indexDocuments(documents);
    
    // Test a query
    const results = await retriever.retrieveRelevantDocuments('example query');
    console.log(`Found ${results.length} relevant documents for query`);
    
  } catch (error) {
    console.error('Error in web scraper example:', error);
  }
}

// Only run when called directly
if (require.main === module) {
  main().catch(console.error);
}

export default main; 