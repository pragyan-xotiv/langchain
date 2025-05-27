import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, validateEnvironment } from './config/environment.js';
import { logger } from './utils/logger.js';

// Validate that all required environment variables are present
try {
  validateEnvironment();
} catch (error) {
  if (error instanceof Error) {
    logger.error('Environment validation failed', { message: error.message });
  }
  process.exit(1);
}

// Create Express application
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Multi-Agent Support System API is running'
  });
});

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT} in ${config.server.environment} mode`);
}); 