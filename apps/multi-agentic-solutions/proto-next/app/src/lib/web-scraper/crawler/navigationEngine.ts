import { Page } from 'playwright';
import { CrawlerConfig } from '../config/types';
import { BrowserManager } from './browserManager';
import { StateTracker } from './stateTracker';

/**
 * URL with additional metadata for crawling
 */
interface CrawlUrl {
  /** The URL to crawl */
  url: string;
  /** The depth from the starting point */
  depth: number;
  /** The parent URL that led to this URL */
  parent?: string;
}

/**
 * NavigationEngine handles the crawling process
 */
export class NavigationEngine {
  private browserManager: BrowserManager;
  private stateTracker: StateTracker;
  private config: CrawlerConfig;
  private urlQueue: CrawlUrl[] = [];
  private visitedUrls: Set<string> = new Set();
  private excludePatterns: RegExp[] = [];
  
  /**
   * Create a new NavigationEngine
   */
  constructor(
    browserManager: BrowserManager, 
    stateTracker: StateTracker, 
    config: CrawlerConfig
  ) {
    this.browserManager = browserManager;
    this.stateTracker = stateTracker;
    this.config = config;
    
    // Initialize exclude patterns
    if (config.excludeUrls && config.excludeUrls.length > 0) {
      this.excludePatterns = config.excludeUrls.map(pattern => new RegExp(pattern));
    }
    
    // Add the base URL to the queue
    this.addToQueue({
      url: config.baseUrl,
      depth: 0
    });
  }
  
  /**
   * Start the crawling process
   */
  async startCrawling(): Promise<void> {
    console.log(`Starting crawl at ${this.config.baseUrl}`);
    
    try {
      let pageCount = 0;
      
      while (this.urlQueue.length > 0 && 
             (this.config.maxPages === undefined || pageCount < this.config.maxPages)) {
        const currentUrl = this.urlQueue.shift();
        
        if (!currentUrl || this.visitedUrls.has(currentUrl.url)) {
          continue;
        }
        
        // Mark as visited
        this.visitedUrls.add(currentUrl.url);
        
        try {
          // Process the current URL
          await this.processUrl(currentUrl);
          pageCount++;
          
          // Respect rate limits
          if (this.config.requestDelay && this.config.requestDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.requestDelay));
          }
        } catch (error) {
          console.error(`Error processing ${currentUrl.url}:`, error);
        }
      }
      
      console.log(`Crawling complete. Visited ${this.visitedUrls.size} pages.`);
    } finally {
      // Ensure browser is closed
      await this.browserManager.close();
    }
  }
  
  /**
   * Process a single URL
   */
  private async processUrl(crawlUrl: CrawlUrl): Promise<void> {
    console.log(`Processing ${crawlUrl.url} (depth: ${crawlUrl.depth})`);
    
    // Skip if we've exceeded max depth
    if (crawlUrl.depth > this.config.maxDepth) {
      console.log(`Skipping ${crawlUrl.url} - max depth reached`);
      return;
    }
    
    const page = await this.browserManager.newPage();
    
    try {
      // Navigate to URL
      await page.goto(crawlUrl.url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      // Let the page settle
      await page.waitForTimeout(1000);
      
      // Track state for this URL
      await this.stateTracker.trackState(page, crawlUrl.url);
      
      // Extract links if not at max depth
      if (crawlUrl.depth < this.config.maxDepth) {
        await this.extractLinks(page, crawlUrl);
      }
      
      // Take screenshot
      await this.browserManager.takeScreenshot(
        page, 
        `page-${crawlUrl.url.replace(/[^a-zA-Z0-9]/g, '_')}`
      );
      
    } catch (error) {
      console.error(`Error navigating to ${crawlUrl.url}:`, error);
    } finally {
      await page.close();
    }
  }
  
  /**
   * Extract links from a page and add them to the queue
   */
  private async extractLinks(page: Page, currentCrawl: CrawlUrl): Promise<void> {
    // Get all links on the page
    const links = await page.$$eval('a[href]', elements => 
      elements.map(el => ({
        href: el.getAttribute('href') || '',
        text: el.textContent || ''
      }))
    );
    
    // Process each link
    for (const link of links) {
      if (!link.href) continue;
      
      try {
        // Resolve relative URLs
        const url = new URL(link.href, currentCrawl.url).href;
        
        // Skip if not same origin
        if (new URL(url).origin !== new URL(this.config.baseUrl).origin) {
          continue;
        }
        
        // Skip if matches exclude patterns
        if (this.excludePatterns.some(pattern => pattern.test(url))) {
          continue;
        }
        
        // Normalize URL (remove fragments, etc.)
        const normalizedUrl = this.normalizeUrl(url);
        
        // Add to queue if not already visited
        if (!this.visitedUrls.has(normalizedUrl)) {
          this.addToQueue({
            url: normalizedUrl,
            depth: currentCrawl.depth + 1,
            parent: currentCrawl.url
          });
        }
      } catch (err) {
        console.error(`Error processing link ${link.href}:`, err);
      }
    }
  }
  
  /**
   * Normalize a URL (remove fragments, trailing slashes, etc.)
   */
  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      
      // Remove fragment
      parsed.hash = '';
      
      // Convert to string and remove trailing slash if present
      let normalized = parsed.toString();
      if (normalized.endsWith('/')) {
        normalized = normalized.slice(0, -1);
      }
      
      return normalized;
    } catch {
      return url;
    }
  }
  
  /**
   * Add a URL to the crawl queue
   */
  private addToQueue(crawlUrl: CrawlUrl): void {
    // Don't add if already visited or in queue
    if (this.visitedUrls.has(crawlUrl.url)) {
      return;
    }
    
    // Add to queue based on strategy (breadth-first by default)
    this.urlQueue.push(crawlUrl);
  }
  
  /**
   * Get the list of visited URLs
   */
  getVisitedUrls(): string[] {
    return Array.from(this.visitedUrls);
  }
} 