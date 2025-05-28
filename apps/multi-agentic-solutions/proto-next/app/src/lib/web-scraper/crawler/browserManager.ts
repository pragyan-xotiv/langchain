import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { CrawlerConfig } from '../config/types';

/**
 * Manages browser instances and provides session handling
 */
export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private config: CrawlerConfig;
  
  /**
   * Create a new BrowserManager
   */
  constructor(config: CrawlerConfig) {
    this.config = config;
  }
  
  /**
   * Initialize the browser
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }
    
    console.log('Initializing browser...');
    this.browser = await chromium.launch({
      headless: true
    });
    
    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: true
    });
    
    // Set up request interception for respecting robots.txt if configured
    if (this.config.respectRobotsTxt) {
      await this.setupRobotsHandler();
    }
  }
  
  /**
   * Create a new page
   */
  async newPage(): Promise<Page> {
    if (!this.context) {
      await this.initialize();
    }
    
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    
    const page = await this.context.newPage();
    
    // Setup common page behaviors
    await this.setupPage(page);
    
    return page;
  }
  
  /**
   * Configure page behaviors
   */
  private async setupPage(page: Page): Promise<void> {
    // Set default timeout
    page.setDefaultTimeout(30000);
    
    // Add event listeners for console messages
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`Page console ${msg.type()}: ${msg.text()}`);
      }
    });
    
    // Handle dialog interactions (alerts, confirms)
    page.on('dialog', async dialog => {
      console.log(`Dialog: ${dialog.type()} - ${dialog.message()}`);
      await dialog.dismiss();
    });
  }
  
  /**
   * Setup robots.txt handling
   */
  private async setupRobotsHandler(): Promise<void> {
    if (!this.context) {
      return;
    }
    
    // To be implemented: robots.txt parsing and request filtering
    console.log('Robots.txt handling enabled');
  }
  
  /**
   * Take a screenshot
   * @param page - The page to screenshot
   * @param name - The name identifier for the screenshot (used in filename)
   */
  async takeScreenshot(page: Page, name: string): Promise<Buffer> {
    console.log(`Taking screenshot: ${name}`);
    return page.screenshot({
      fullPage: true,
      type: 'png',
      path: `screenshots/${name}.png` // Save to disk if needed
    });
  }
  
  /**
   * Close all browser resources
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    
    console.log('Browser closed');
  }
} 