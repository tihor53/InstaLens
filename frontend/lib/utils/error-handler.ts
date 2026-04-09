/**
 * Custom error classes and error handling utilities
 */

export class InstagramExtractionError extends Error {
  constructor(message: string, public code: string = 'EXTRACTION_ERROR') {
    super(message);
    this.name = 'InstagramExtractionError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AIAnalysisError extends Error {
  constructor(message: string, public agentId?: string) {
    super(message);
    this.name = 'AIAnalysisError';
  }
}

export class IntegrationError extends Error {
  constructor(message: string, public provider?: string) {
    super(message);
    this.name = 'IntegrationError';
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Simple logger utility
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  },
};
