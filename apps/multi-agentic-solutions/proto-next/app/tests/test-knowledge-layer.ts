import { KnowledgeAgent } from '../src/lib/agents/knowledgeAgent';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

/**
 * This script tests the Knowledge Layer by running a sample query
 */
async function testKnowledgeLayer() {
  console.log('Testing Knowledge Layer...');
  
  try {
    // Create a knowledge agent
    const knowledgeAgent = new KnowledgeAgent();
    
    // Test question
    const question = 'What is LangChain?';
    console.log(`Question: ${question}`);
    
    // Query the knowledge agent
    console.log('Querying knowledge agent...');
    const answer = await knowledgeAgent.query(question);
    
    // Output the answer
    console.log('\nAnswer:');
    console.log(answer);
    
    console.log('\nKnowledge Layer test completed successfully!');
  } catch (error) {
    console.error('Error testing Knowledge Layer:', error);
    process.exit(1);
  }
}

// Run the test
testKnowledgeLayer(); 