'use client';

import { useState } from 'react';
import { Container, Typography, Alert } from '@mui/material';
import { ScraperForm } from '@/components/scraper/ScraperForm';
import { ScraperConfig } from '@/lib/web-scraper/config/types';

export default function ScraperDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleStartScraping = async (config: ScraperConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      setJobId(null);

      const response = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to start scraping');
      }

      const data = await response.json();
      setJobId(data.jobId);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Web Scraper
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4 }}>
        Enter a URL and configure scraping options to begin extracting content for the knowledge base.
      </Typography>

      <ScraperForm 
        onSubmit={handleStartScraping}
        disabled={isLoading}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {jobId && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Scraping job started successfully! Job ID: {jobId}
        </Alert>
      )}
    </Container>
  );
} 