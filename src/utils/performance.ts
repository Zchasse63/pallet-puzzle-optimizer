/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit how often a function can be called
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
};

/**
 * Throttle function to limit how often a function can be called
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const elapsed = now - lastCall;
    
    if (elapsed >= limit) {
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, limit - elapsed);
    }
  };
};

/**
 * Memoize a function to cache its results
 * @param fn - Function to memoize
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Measure execution time of a function
 * @param fn - Function to measure
 * @param label - Label for console output
 * @returns Wrapped function
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    
    return result;
  };
}

/**
 * Creates a resource loader with retry capability
 * @param loadFn - Function that loads the resource
 * @param options - Configuration options
 * @returns Function that loads the resource with retries
 */
export function createResourceLoader<T>(
  loadFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): () => Promise<T> {
  const { 
    maxRetries = 3, 
    retryDelay = 1000,
    onRetry = () => {} 
  } = options;
  
  return async function(): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await loadFn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          onRetry(attempt + 1, error);
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
        }
      }
    }
    
    throw lastError;
  };
}

/**
 * Batch multiple requests into a single request
 * @param batchFn - Function that processes a batch of requests
 * @param options - Configuration options
 * @returns Function that adds items to the batch
 */
export function createBatcher<T, R>(
  batchFn: (items: T[]) => Promise<R[]>,
  options: {
    maxBatchSize?: number;
    maxWaitTime?: number;
  } = {}
): (item: T) => Promise<R> {
  const { 
    maxBatchSize = 10, 
    maxWaitTime = 50 
  } = options;
  
  let batch: T[] = [];
  let pendingPromises: Array<{ resolve: (value: R) => void, reject: (reason: any) => void }> = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const processBatch = async () => {
    const currentBatch = [...batch];
    const currentPromises = [...pendingPromises];
    
    batch = [];
    pendingPromises = [];
    timeoutId = null;
    
    try {
      const results = await batchFn(currentBatch);
      
      if (results.length !== currentBatch.length) {
        throw new Error('Batch function returned a different number of results than inputs');
      }
      
      results.forEach((result, index) => {
        currentPromises[index].resolve(result);
      });
    } catch (error) {
      currentPromises.forEach(promise => {
        promise.reject(error);
      });
    }
  };
  
  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      batch.push(item);
      pendingPromises.push({ resolve, reject });
      
      if (batch.length >= maxBatchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        processBatch();
      } else if (!timeoutId) {
        timeoutId = setTimeout(processBatch, maxWaitTime);
      }
    });
  };
}

export default {
  debounce,
  throttle,
  memoize,
  measurePerformance,
  createResourceLoader,
  createBatcher
};
