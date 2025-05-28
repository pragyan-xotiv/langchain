import { BrowserManager } from './crawler/browserManager';
import { NavigationEngine } from './crawler/navigationEngine';
import { StateTracker } from './crawler/stateTracker';
import { CrawlerConfig, DEFAULT_CRAWLER_CONFIG, DEFAULT_CONFIG, ScraperConfig } from './config/types';
import { Document } from '@/types';

/**
 * Statistics about the scraping process
 */
interface ScraperStats {
  /** Number of pages visited */
  pagesVisited: number;
  /** Base URL of the scrape */
  baseUrl: string;
  /** When the stats were generated */
  timestamp: string;
}

/**
 * Main WebAppScraper class that integrates all components
 */
export class WebAppScraper {
  private config: ScraperConfig;
  private browserManager: BrowserManager;
  private stateTracker: StateTracker;
  private navigationEngine: NavigationEngine;
  
  /**
   * Create a new WebAppScraper
   */
  constructor(config: Partial<ScraperConfig> & { crawler: { baseUrl: string } & Partial<CrawlerConfig> }) {
    // Merge with default configurations
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      crawler: {
        ...DEFAULT_CRAWLER_CONFIG,
        ...config.crawler
      }
    } as ScraperConfig;
    
    // Initialize components
    this.browserManager = new BrowserManager(this.config.crawler);
    this.stateTracker = new StateTracker();
    this.navigationEngine = new NavigationEngine(
      this.browserManager,
      this.stateTracker,
      this.config.crawler
    );
    
    console.log(`WebAppScraper initialized for ${this.config.crawler.baseUrl}`);
  }
  
  /**
   * Start the scraping process
   */
  async start(): Promise<void> {
    console.log('Starting web application scraping...');
    await this.navigationEngine.startCrawling();
  }
  
  /**
   * Generate documentation from scraped content
   * This is a placeholder implementation for now
   */
  async generateDocumentation(): Promise<Document[]> {
    const states = this.stateTracker.getAllStates();
    
    // For now, just convert each page state to a document
    const documents: Document[] = states.map(state => {
      return {
        id: `page-${state.url.replace(/[^a-zA-Z0-9]/g, '_')}`,
        content: `# ${state.title}\n\nURL: ${state.url}\n\nScraped at: ${state.timestamp.toISOString()}`,
        metadata: {
          source: state.url,
          title: state.title,
          timestamp: state.timestamp.toISOString(),
          type: 'web-page'
        }
      };
    });
    
    console.log(`Generated ${documents.length} documents from scraped content`);
    return documents;
  }
  
  /**
   * Get statistics about the scraping process
   */
  getStats(): ScraperStats {
    return {
      pagesVisited: this.navigationEngine.getVisitedUrls().length,
      baseUrl: this.config.crawler.baseUrl,
      timestamp: new Date().toISOString()
    };
  }
} 