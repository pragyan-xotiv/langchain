// @ts-nocheck - TODO: Fix type errors later
import { WebAppScraper } from '../index';
import { BrowserManager } from '../crawler/browserManager';
import { NavigationEngine } from '../crawler/navigationEngine';
import { StateTracker } from '../crawler/stateTracker';
import { Browser, BrowserContext, Page } from 'playwright';
import { jest } from '@jest/globals';
import type { Mock } from 'jest-mock';

// Default config for testing
const defaultConfig = {
  baseUrl: 'https://example.com',
  maxDepth: 2,
  userAgent: 'Mozilla/5.0 Test Agent',
  respectRobotsTxt: false,
  requestDelay: 1000,
  maxPages: 10
};

// Create properly typed mock functions
const mockPage = {
  goto: jest.fn().mockResolvedValue(undefined),
  content: jest.fn().mockResolvedValue('<html><body>Test</body></html>'),
  close: jest.fn().mockResolvedValue(undefined),
  setDefaultTimeout: jest.fn(),
  on: jest.fn(),
  title: jest.fn().mockResolvedValue('Test Page'),
  waitForTimeout: jest.fn().mockResolvedValue(undefined),
  screenshot: jest.fn().mockResolvedValue(Buffer.from('test')),
  $$eval: jest.fn().mockResolvedValue([])
} as unknown as Page;

const mockContext = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined)
} as unknown as BrowserContext;

const mockBrowser = {
  newContext: jest.fn().mockResolvedValue(mockContext),
  close: jest.fn().mockResolvedValue(undefined)
} as unknown as Browser;

// Mock Playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue(mockBrowser)
  }
}));

describe('WebAppScraper', () => {
  let scraper: WebAppScraper;
  
  beforeEach(() => {
    scraper = new WebAppScraper({
      crawler: defaultConfig,
      extraction: {
        captureScreenshots: true,
        detectWorkflows: true
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BrowserManager', () => {
    let browserManager: BrowserManager;

    beforeEach(() => {
      browserManager = new BrowserManager(defaultConfig);
    });

    afterEach(async () => {
      await browserManager.close();
    });

    it('should initialize browser successfully', async () => {
      await expect(browserManager.initialize()).resolves.not.toThrow();
    });

    it('should create new page', async () => {
      await browserManager.initialize();
      const page = await browserManager.newPage();
      expect(page).toBeDefined();
    });

    it('should take screenshots', async () => {
      await browserManager.initialize();
      const page = await browserManager.newPage();
      const screenshot = await browserManager.takeScreenshot(page, 'test');
      expect(screenshot).toBeDefined();
    });

    it('should cleanup resources', async () => {
      await browserManager.initialize();
      await expect(browserManager.close()).resolves.not.toThrow();
    });
  });

  describe('StateTracker', () => {
    let stateTracker: StateTracker;

    beforeEach(() => {
      stateTracker = new StateTracker();
    });

    it('should track page state', async () => {
      const state = await stateTracker.trackState(mockPage, 'https://example.com/page1');
      expect(state.url).toBe('https://example.com/page1');
      expect(state.title).toBe('Test Page');
    });

    it('should detect content changes', async () => {
      await stateTracker.trackState(mockPage, 'https://example.com/page1');
      
      // Change the content
      const modifiedPage = {
        ...mockPage,
        content: jest.fn().mockResolvedValue('<html><body>Changed</body></html>')
      } as unknown as Page;
      
      const hasChanged = await stateTracker.hasContentChanged(modifiedPage, 'https://example.com/page1');
      expect(hasChanged).toBe(true);
    });

    it('should track visited pages', async () => {
      const url = 'https://example.com/page1';
      await stateTracker.trackState(mockPage, url);
      expect(stateTracker.hasVisited(url)).toBe(true);
    });
  });

  describe('NavigationEngine', () => {
    let browserManager: BrowserManager;
    let stateTracker: StateTracker;
    let navigationEngine: NavigationEngine;

    beforeEach(() => {
      browserManager = new BrowserManager(defaultConfig);
      stateTracker = new StateTracker();
      navigationEngine = new NavigationEngine(browserManager, stateTracker, defaultConfig);
    });

    afterEach(async () => {
      await browserManager.close();
    });

    it('should start crawling process', async () => {
      await expect(navigationEngine.startCrawling()).resolves.not.toThrow();
    });

    it('should track visited URLs', async () => {
      await navigationEngine.startCrawling();
      const visitedUrls = navigationEngine.getVisitedUrls();
      expect(visitedUrls).toContain(defaultConfig.baseUrl);
    });
  });

  describe('WebAppScraper Integration', () => {
    it('should start crawling process', async () => {
      await expect(scraper.start()).resolves.not.toThrow();
    });

    it('should generate documentation', async () => {
      await scraper.start();
      const docs = await scraper.generateDocumentation();
      expect(Array.isArray(docs)).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Simulate a network error
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      
      await expect(scraper.start()).resolves.not.toThrow();
    });
  });
}); 