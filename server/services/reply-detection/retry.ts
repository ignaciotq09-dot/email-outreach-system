/**
 * Retry logic with exponential backoff for Gmail API rate limiting
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

/**
 * Execute a Gmail API call with exponential backoff retry logic
 * Handles rate limiting (429) and temporary errors (500, 502, 503)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T | null> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const statusCode = error?.response?.status || error?.code;
      const isRetryable = 
        statusCode === 429 || // Rate limit
        statusCode === 500 || // Internal server error
        statusCode === 502 || // Bad gateway
        statusCode === 503 || // Service unavailable
        error?.message?.includes('ECONNRESET') ||
        error?.message?.includes('ETIMEDOUT');
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[Retry] ${operationName} failed permanently after ${attempt + 1} attempts:`, error?.message);
        return null;
      }
      
      // Calculate next delay with jitter
      const jitter = Math.random() * 0.3 * delay; // 30% jitter
      const nextDelay = Math.min(delay * backoffFactor + jitter, maxDelay);
      
      console.log(`[Retry] ${operationName} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(nextDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      
      delay = nextDelay;
    }
  }
  
  console.error(`[Retry] ${operationName} exhausted all retries:`, lastError?.message);
  return null;
}