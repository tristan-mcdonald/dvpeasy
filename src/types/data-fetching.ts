import { ContractErrorType } from './errors';

/**
 * Base interface for all data fetching operations.
 */
export interface DataFetchingState<T> {
  data: T | null
  isLoading: boolean
  error: ContractErrorType | null
  lastFetched: number | null
  isRefreshing: boolean
}

/**
 * Configuration options for polling behavior.
 */
export interface PollingConfig {
  /** Polling interval in milliseconds. Default: 10000 (10 seconds) */
  interval: number
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries: number
  /** Whether polling is enabled. Default: true */
  enabled: boolean
  /** Custom condition to stop polling */
  stopCondition?: () => boolean
  /** Exponential backoff multiplier for retries. Default: 2 */
  backoffMultiplier: number
  /** Maximum backoff delay in milliseconds. Default: 30000 (30 seconds) */
  maxBackoffDelay: number
}

/**
 * Configuration for request deduplication.
 */
export interface DeduplicationConfig {
  /** Unique key for the operation */
  key: string
  /** Time in milliseconds to cache the result. Default: 5000 (5 seconds) */
  cacheDuration: number
  /** Whether to deduplicate concurrent requests. Default: true */
  deduplicateRequests: boolean
}

/**
 * Retry configuration options.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Base delay between retries in milliseconds */
  baseDelay: number
  /** Exponential backoff multiplier */
  backoffMultiplier: number
  /** Maximum delay between retries */
  maxDelay: number
  /** Custom retry condition */
  shouldRetry?: (error: ContractErrorType, retryCount: number) => boolean
}

/**
 * Options for data fetching operations.
 */
export interface DataFetchingOptions {
  /** Whether to show loading state during the operation */
  showLoadingState?: boolean
  /** Request deduplication configuration */
  deduplication?: DeduplicationConfig
  /** Retry configuration */
  retry?: Partial<RetryConfig>
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

/**
 * Result of a data fetching operation.
 */
export interface DataFetchingResult<T> {
  data: T | null
  error: ContractErrorType | null
  wasFromCache: boolean
  retryCount: number
}

/**
 * Internal cache entry for request deduplication.
 */
export interface CacheEntry<T> {
  data: T | null
  error: ContractErrorType | null
  timestamp: number
  promise?: Promise<DataFetchingResult<T>>
}

/**
 * Polling state management.
 */
export interface PollingState {
  isPolling: boolean
  intervalId: number | null
  retryCount: number
  lastPollAt: number | null
  nextPollAt: number | null
}

/**
 * Hook return type for data fetching with polling.
 */
export interface DataFetchingHookResult<T> extends DataFetchingState<T> {
  /** Manually trigger a data refresh */
  refresh: () => Promise<void>
  /** Force refresh ignoring cache */
  forceRefresh: () => Promise<void>
  /** Start polling */
  startPolling: () => void
  /** Stop polling */
  stopPolling: () => void
  /** Reset all state */
  reset: () => void
}

/**
 * Default configurations.
 */
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  interval: 10000,
  maxRetries: 3,
  enabled: true,
  backoffMultiplier: 2,
  maxBackoffDelay: 30000,
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
};

export const DEFAULT_DEDUPLICATION_CONFIG: Partial<DeduplicationConfig> = {
  cacheDuration: 5000,
  deduplicateRequests: true,
};
