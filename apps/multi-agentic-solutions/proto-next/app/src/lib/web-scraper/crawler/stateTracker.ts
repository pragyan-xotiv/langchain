import { Page } from 'playwright';

/**
 * PageState represents the captured state of a page
 */
export interface PageState {
  /** The URL of the page */
  url: string;
  /** The title of the page */
  title: string;
  /** When the page was visited */
  timestamp: Date;
  /** HTML content hash for detecting changes */
  contentHash: string;
}

/**
 * Tracks page states during crawling
 */
export class StateTracker {
  private states: Map<string, PageState> = new Map();
  
  /**
   * Create a new StateTracker
   */
  constructor() {
    console.log('State tracker initialized');
  }
  
  /**
   * Track the state of a page
   */
  async trackState(page: Page, url: string): Promise<PageState> {
    // Get page title
    const title = await page.title();
    
    // Get current HTML for hashing
    const content = await page.content();
    const contentHash = await this.hashContent(content);
    
    // Create state object
    const state: PageState = {
      url,
      title,
      timestamp: new Date(),
      contentHash
    };
    
    // Store state
    this.states.set(url, state);
    
    return state;
  }
  
  /**
   * Check if a URL has been visited
   */
  hasVisited(url: string): boolean {
    return this.states.has(url);
  }
  
  /**
   * Get the state for a URL
   */
  getState(url: string): PageState | undefined {
    return this.states.get(url);
  }
  
  /**
   * Get all tracked states
   */
  getAllStates(): PageState[] {
    return Array.from(this.states.values());
  }
  
  /**
   * Check if content has changed since last visit
   */
  async hasContentChanged(page: Page, url: string): Promise<boolean> {
    const previousState = this.states.get(url);
    
    if (!previousState) {
      return true; // No previous state, so consider it changed
    }
    
    const content = await page.content();
    const currentHash = await this.hashContent(content);
    
    return currentHash !== previousState.contentHash;
  }
  
  /**
   * Create a simple hash of content for change detection
   * Note: In a production system, use a proper hashing algorithm
   */
  private async hashContent(content: string): Promise<string> {
    // Simple hash function for demo purposes
    // In production, use crypto.createHash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return String(Math.abs(hash));
  }
} 