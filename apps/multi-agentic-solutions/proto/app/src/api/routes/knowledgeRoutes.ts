import { Router, Request, Response } from 'express';
import { KnowledgeAgent } from '../../agents/knowledgeAgent.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const knowledgeAgent = new KnowledgeAgent();

/**
 * Route to query the knowledge agent
 */
router.post('/query', async (req: Request, res: Response) => {
  const { query } = req.body;
  const requestId = uuidv4();
  
  if (!query) {
    return res.status(400).json({ 
      error: 'Missing query parameter'
    });
  }
  
  try {
    logger.info('Knowledge query received', { query, requestId });
    
    // Process query with knowledge agent
    const response = await knowledgeAgent.query(query);
    
    logger.info('Knowledge query processed', { requestId });
    
    return res.json({
      requestId,
      query,
      response
    });
  } catch (error) {
    logger.error('Error processing knowledge query', { 
      error: error instanceof Error ? error.message : String(error),
      requestId,
      query
    });
    
    return res.status(500).json({
      error: 'Failed to process query',
      requestId
    });
  }
});

export default router; 