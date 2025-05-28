import { useState, FormEvent } from 'react';
import { TextField, Button, Box, Card, CardContent } from '@mui/material';
import { DEFAULT_CONFIG, DEFAULT_CRAWLER_CONFIG, ScraperConfig } from '@/lib/web-scraper/config/types';
import { ConfigPanel } from './ConfigPanel';

interface ScraperFormProps {
  onSubmit: (config: ScraperConfig) => void;
  disabled?: boolean;
}

export const ScraperForm = ({ onSubmit, disabled }: ScraperFormProps) => {
  const [url, setUrl] = useState('');
  const [config, setConfig] = useState<ScraperConfig>({
    ...DEFAULT_CONFIG,
    crawler: {
      ...DEFAULT_CRAWLER_CONFIG,
      baseUrl: ''
    },
    extraction: {
      captureScreenshots: true,
      detectWorkflows: true
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...config,
      crawler: {
        ...config.crawler,
        baseUrl: url
      }
    });
  };

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ '& > *': { mb: 2 } }}>
          <TextField
            fullWidth
            label="Website URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            disabled={disabled}
          />
          
          <ConfigPanel
            config={config}
            onChange={setConfig}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            fullWidth
            disabled={disabled || !url}
          >
            Start Scraping
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}; 