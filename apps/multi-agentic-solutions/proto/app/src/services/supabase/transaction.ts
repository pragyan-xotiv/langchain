import supabaseClient from './client.js';
import { logger } from '../../utils/logger.js';

/**
 * Transaction result type
 */
export type TransactionResult<T> = {
  success: boolean;
  data?: T;
  error?: Error;
};

/**
 * Execute a function within a database transaction
 * 
 * @param callback Function to execute within transaction
 * @param useTransaction Whether to use an explicit transaction (default: true)
 * @returns Result object with success status and data or error
 */
export async function withTransaction<T>(
  callback: () => Promise<T>,
  useTransaction: boolean = true
): Promise<TransactionResult<T>> {
  let result: TransactionResult<T> = { success: false };

  try {
    // Begin transaction if requested
    if (useTransaction) {
      const { error: beginError } = await supabaseClient.rpc('begin_transaction');
      if (beginError) {
        logger.warn('Transaction begin notice', { 
          message: beginError.message,
          details: JSON.stringify(beginError)
        });
        // Continue anyway as client will handle the transaction if needed
      }
    }

    try {
      // Execute the callback function
      const data = await callback();
      result = { success: true, data };

      // Commit transaction if requested
      if (useTransaction) {
        const { error: commitError } = await supabaseClient.rpc('commit_transaction');
        if (commitError) {
          logger.warn('Transaction commit notice', { 
            message: commitError.message,
            details: JSON.stringify(commitError)
          });
          // Continue anyway as client will handle the transaction
        }
      }
    } catch (callbackError) {
      // Rollback transaction on error if requested
      if (useTransaction) {
        const { error: rollbackError } = await supabaseClient.rpc('rollback_transaction');
        if (rollbackError) {
          logger.warn('Transaction rollback notice', { 
            message: rollbackError.message,
            details: JSON.stringify(rollbackError)
          });
        }
      }

      // Re-throw to be caught by outer catch
      throw callbackError;
    }
  } catch (error) {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : { rawError: JSON.stringify(error) };
      
    logger.error('Transaction error', errorDetails);
    result.error = error instanceof Error ? error : new Error(JSON.stringify(error));
  }

  return result;
} 