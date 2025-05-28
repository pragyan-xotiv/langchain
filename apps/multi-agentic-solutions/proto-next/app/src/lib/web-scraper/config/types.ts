/**
 * Configuration types for the Web Application Scraper
 */

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /** URL of the login page */
  loginUrl?: string;
  /** Credentials for authentication */
  credentials?: {
    /** Username or email */
    username: string;
    /** Password */
    password: string;
  };
  /** OTP handler configuration */
  otpHandler?: {
    /** Whether OTP handling is enabled */
    enabled: boolean;
    /** Timeout in milliseconds for OTP input */
    timeout: number;
  };
}

/**
 * Content extraction configuration
 */
export interface ExtractionConfig {
  /** Whether to capture screenshots */
  captureScreenshots: boolean;
  /** Whether to detect user workflows */
  detectWorkflows: boolean;
  /** CSS selectors for text extraction */
  textSelectors?: string[];
  /** Maximum screenshot size */
  maxScreenshotWidth?: number;
  /** Maximum depth for workflow detection */
  maxWorkflowDepth?: number;
}

/**
 * Crawler configuration
 */
export interface CrawlerConfig {
  /** Base URL to start crawling from */
  baseUrl: string;
  /** Maximum depth to crawl */
  maxDepth: number;
  /** Maximum number of pages to crawl */
  maxPages?: number;
  /** Delay between requests in milliseconds */
  requestDelay?: number;
  /** URLs to exclude from crawling (as regex strings) */
  excludeUrls?: string[];
  /** Whether to respect robots.txt */
  respectRobotsTxt?: boolean;
  /** User agent to use */
  userAgent?: string;
}

/**
 * Complete scraper configuration
 */
export interface ScraperConfig {
  /** Crawler configuration */
  crawler: CrawlerConfig;
  /** Authentication configuration */
  authentication?: AuthConfig;
  /** Extraction configuration */
  extraction: ExtractionConfig;
  /** Output configuration */
  output?: {
    /** Directory to save documentation */
    directory?: string;
    /** Format of the documentation */
    format?: 'markdown' | 'json' | 'html';
  };
  /** Whether to use LLM for content enhancement */
  useLLM?: boolean;
  /** Logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Default crawler configuration values
 */
export const DEFAULT_CRAWLER_CONFIG: Omit<CrawlerConfig, 'baseUrl'> = {
  maxDepth: 3,
  maxPages: 100,
  requestDelay: 500,
  respectRobotsTxt: true,
  userAgent: 'Web-App-Scraper/1.0',
};

/**
 * Default configuration values (without crawler which requires baseUrl)
 */
export const DEFAULT_CONFIG: Omit<Partial<ScraperConfig>, 'crawler'> = {
  extraction: {
    captureScreenshots: true,
    detectWorkflows: true,
    textSelectors: [
      'h1, h2, h3, h4, h5, h6',
      'p, li, td, th',
      'label, button, input[type="submit"]',
      '.content, .description, .help-text'
    ],
    maxScreenshotWidth: 1200,
    maxWorkflowDepth: 5
  },
  output: {
    format: 'markdown'
  },
  useLLM: true,
  logLevel: 'info'
}; 