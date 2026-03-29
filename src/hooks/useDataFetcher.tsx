import { useCallback, useRef, useState } from 'react';
import {
  DataFetchingState,
  DataFetchingOptions,
  DataFetchingResult,
  CacheEntry,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_DEDUPLICATION_CONFIG,
} from '../types/data-fetching';
import { ContractErrorType } from '../types/errors';
import { errorManager } from '../lib/error-manager';
import { logger } from '../lib/logger';

/**
 * Global cache for request deduplication.
 */
const globalCache = new Map<string, CacheEntry<unknown>>();

/**
 * Clear expired cache entries.
 */
function clearExpiredCache () {
  const now = Date.now();
  for (const [key, entry] of globalCache.entries()) {
    if (now - entry.timestamp > (5 * 60 * 1000)) { // 5 minutes
      globalCache.delete(key);
    }
  }
}

// Periodically clear expired cache entries
setInterval(clearExpiredCache, 60 * 1000); // Every minute

/**
 * Unified data fetching hook with consistent error handling, retry logic,
 * and request deduplication.
 *
 * @param fetchFunction - Async function to fetch data
 * @param options - Configuration options
 * @returns Data fetching state and control functions
 */
export function useDataFetcher<T> (
  fetchFunction: () => Promise<T>,
  options: DataFetchingOptions = {},
) {
  const [state, setState] = useState<DataFetchingState<T>>({
    data: null,
    isLoading: false,
    error: null,
    lastFetched: null,
    isRefreshing: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchFunctionRef = useRef(fetchFunction);

  // Keep ref updated
  fetchFunctionRef.current = fetchFunction;

  const performFetch = useCallback(async (
    fetchOptions: DataFetchingOptions = {},
  ): Promise<DataFetchingResult<T>> => {
    const mergedOptions = { ...options, ...fetchOptions };
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...(mergedOptions.retry || {}) };
    const deduplicationConfig = {
      ...DEFAULT_DEDUPLICATION_CONFIG,
      ...mergedOptions.deduplication,
    };

    // Check cache if deduplication is enabled
    if (deduplicationConfig.deduplicateRequests && deduplicationConfig.key) {
      const cacheKey = deduplicationConfig.key;
      const cached = globalCache.get(cacheKey);

      if (cached && deduplicationConfig.cacheDuration) {
        const isExpired = Date.now() - cached.timestamp > deduplicationConfig.cacheDuration;

        if (!isExpired) {
          // Return cached data
          if (cached.promise) {
            // Ongoing request, wait for it
            return await cached.promise;
          } else {
            // Cached result available
            return {
              data: cached.data,
              error: cached.error,
              wasFromCache: true,
              retryCount: 0,
            };
          }
        }
      }
    }

    const executeRequest = async (): Promise<DataFetchingResult<T>> => {
      let retryCount = 0;
      let lastError: ContractErrorType | null = null;

      while (retryCount <= retryConfig.maxRetries) {
        try {
          // Cancel previous request if exists
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }

          // Create new abort controller
          abortControllerRef.current = new AbortController();

          if (mergedOptions.signal?.aborted || abortControllerRef.current.signal.aborted) {
            throw new Error('Request aborted');
          }

          const data = await fetchFunctionRef.current();

          const result: DataFetchingResult<T> = {
            data,
            error: null,
            wasFromCache: false,
            retryCount,
          };

          // Cache successful result
          if (deduplicationConfig.deduplicateRequests && deduplicationConfig.key) {
            globalCache.set(deduplicationConfig.key, {
              data,
              error: null,
              timestamp: Date.now(),
            });
          }

          return result;
        } catch (error) {
          const contractError = errorManager.parse(error);
          lastError = contractError;

          // Check if we should retry
          const shouldRetry = retryConfig.shouldRetry
            ? retryConfig.shouldRetry(contractError, retryCount)
            : errorManager.isRetryable(contractError);

          if (shouldRetry && retryCount < retryConfig.maxRetries) {
            retryCount++;
            const delay = errorManager.retryDelay(contractError, retryCount);
            logger.warn(`Request failed, retrying in ${delay}ms (attempt ${retryCount}/${retryConfig.maxRetries})`, {
              error: contractError.message,
              retryCount,
            });

            // Wait for retry delay
            await new Promise(resolve => setTimeout(resolve, delay));

            // Check if aborted during delay
            if (mergedOptions.signal?.aborted || abortControllerRef.current?.signal.aborted) {
              throw new Error('Request aborted during retry delay');
            }
          } else {
            break;
          }
        }
      }

      const result: DataFetchingResult<T> = {
        data: null,
        error: lastError,
        wasFromCache: false,
        retryCount,
      };

      // Cache failed result for a shorter duration
      if (deduplicationConfig.deduplicateRequests && deduplicationConfig.key && lastError) {
        globalCache.set(deduplicationConfig.key, {
          data: null,
          error: lastError,
          timestamp: Date.now(),
        });
      }

      return result;
    };

    // If deduplication is enabled, cache the promise to prevent concurrent requests
    if (deduplicationConfig.deduplicateRequests && deduplicationConfig.key) {
      const cacheKey = deduplicationConfig.key;
      const promise = executeRequest();

      globalCache.set(cacheKey, {
        data: null,
        error: null,
        timestamp: Date.now(),
        promise,
      });

      const result = await promise;

      // Update cache with final result (remove promise)
      globalCache.set(cacheKey, {
        data: result.data,
        error: result.error,
        timestamp: Date.now(),
      });

      return result;
    }

    return executeRequest();
  }, [options]);

  const fetch = useCallback(async (fetchOptions: DataFetchingOptions = {}) => {
    const mergedOptions = { ...options, ...fetchOptions };

    setState(prevState => ({
      ...prevState,
      isLoading: mergedOptions.showLoadingState !== false,
      error: null,
      ...(mergedOptions.showLoadingState !== false ? { isRefreshing: prevState.data !== null } : {}),
    }));

    try {
      const result = await performFetch(fetchOptions);

      setState(prevState => ({
        ...prevState,
        data: result.data,
        error: result.error,
        isLoading: false,
        isRefreshing: false,
        lastFetched: Date.now(),
      }));

      return result;
    } catch (error) {
      const contractError = errorManager.parse(error);
      setState(prevState => ({
        ...prevState,
        data: null,
        error: contractError,
        isLoading: false,
        isRefreshing: false,
      }));

      return {
        data: null,
        error: contractError,
        wasFromCache: false,
        retryCount: 0,
      };
    }
  }, [options, performFetch]);

  const forceRefresh = useCallback(async () => {
    // Clear cache entry
    if (options.deduplication?.key) {
      globalCache.delete(options.deduplication.key);
    }

    return fetch({ ...options, showLoadingState: true });
  }, [fetch, options]);

  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear cache entry
    if (options.deduplication?.key) {
      globalCache.delete(options.deduplication.key);
    }

    setState({
      data: null,
      isLoading: false,
      error: null,
      lastFetched: null,
      isRefreshing: false,
    });
  }, [options.deduplication?.key]);

  return {
    ...state,
    fetch,
    forceRefresh,
    reset,
  };
}
