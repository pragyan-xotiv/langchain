import { NextResponse } from 'next/server';
import { WebAppScraper } from '@/lib/web-scraper';
import { ScraperConfig } from '@/lib/web-scraper/config/types';

// Store active scraping jobs
const activeJobs = new Map<string, WebAppScraper>();

export async function POST(request: Request) {
  try {
    const config: ScraperConfig = await request.json();
    
    // Validate the config
    if (!config.crawler?.baseUrl) {
      return NextResponse.json(
        { error: 'Base URL is required' },
        { status: 400 }
      );
    }

    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a new scraper instance
    const scraper = new WebAppScraper(config);
    
    // Store the scraper instance
    activeJobs.set(jobId, scraper);
    
    // Start scraping in the background
    scraper.start().catch((error) => {
      console.error(`Error in scraping job ${jobId}:`, error);
      activeJobs.delete(jobId);
    });
    
    // Return the job ID to the client
    return NextResponse.json({ jobId });
    
  } catch (error) {
    console.error('Error starting scraper:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return list of active jobs (for monitoring)
  const jobs = Array.from(activeJobs.keys());
  return NextResponse.json({ jobs });
} 