import { Box, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { ScraperConfig } from '@/lib/web-scraper/config/types';

interface ConfigPanelProps {
  config: ScraperConfig;
  onChange: (config: ScraperConfig) => void;
}

export const ConfigPanel = ({ config, onChange }: ConfigPanelProps) => {
  const handleCrawlerChange = (key: keyof ScraperConfig['crawler'], value: number | boolean) => {
    onChange({
      ...config,
      crawler: {
        ...config.crawler,
        [key]: value
      }
    });
  };

  const handleExtractionChange = (key: keyof ScraperConfig['extraction'], value: boolean) => {
    onChange({
      ...config,
      extraction: {
        ...config.extraction,
        [key]: value
      }
    });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Crawler Configuration
      </Typography>

      <Box sx={{ '& > *': { mb: 2 } }}>
        <TextField
          fullWidth
          type="number"
          label="Maximum Depth"
          value={config.crawler.maxDepth}
          onChange={(e) => handleCrawlerChange('maxDepth', parseInt(e.target.value))}
          inputProps={{ min: 1, max: 10 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Maximum Pages"
          value={config.crawler.maxPages}
          onChange={(e) => handleCrawlerChange('maxPages', parseInt(e.target.value))}
          inputProps={{ min: 1 }}
        />

        <TextField
          fullWidth
          type="number"
          label="Request Delay (ms)"
          value={config.crawler.requestDelay}
          onChange={(e) => handleCrawlerChange('requestDelay', parseInt(e.target.value))}
          inputProps={{ min: 0 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={config.crawler.respectRobotsTxt}
              onChange={(e) => handleCrawlerChange('respectRobotsTxt', e.target.checked)}
            />
          }
          label="Respect robots.txt"
        />
      </Box>

      <Typography variant="h6" sx={{ mb: 2, mt: 4 }}>
        Extraction Settings
      </Typography>

      <Box>
        <FormControlLabel
          control={
            <Switch
              checked={config.extraction.captureScreenshots}
              onChange={(e) => handleExtractionChange('captureScreenshots', e.target.checked)}
            />
          }
          label="Capture Screenshots"
        />

        <FormControlLabel
          control={
            <Switch
              checked={config.extraction.detectWorkflows}
              onChange={(e) => handleExtractionChange('detectWorkflows', e.target.checked)}
            />
          }
          label="Detect Workflows"
        />
      </Box>
    </Box>
  );
}; 