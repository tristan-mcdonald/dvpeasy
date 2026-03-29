import { ContractErrorType } from '../types/errors';
import { DEFAULT_POLLING_CONFIG, PollingConfig, PollingState } from '../types/data-fetching';
import { errorManager } from '../lib/error-manager';
import { logger } from '../lib/logger';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Generic polling hook that manages automatic data fetching with configurable intervals,
 * retry logic, and exponential backoff.
 *
 * @param fetchFunction - Async function to execute on each poll
 * @param config - Polling configuration options
 * @returns Polling state and control functions
 */
export function usePolling<T> (
  fetchFunction: () => Promise<T>,
  config: Partial<PollingConfig> = {},
) {
  const fullConfig = useMemo(() => ({ ...DEFAULT_POLLING_CONFIG, ...config }), [config]);

  const [state, setState] = useState<PollingState>({
    isPolling: false,
    intervalId: null,
    retryCount: 0,
    lastPollAt: null,
    nextPollAt: null,
  });

  const [lastError, setLastError] = useState<ContractErrorType | null>(null);

  // Use refs to avoid stale closures in intervals.
  const fetchFunctionRef = useRef(fetchFunction);
  const configRef = useRef(fullConfig);
  const stateRef = useRef(state);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep refs updated.
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
    configRef.current = fullConfig;
    stateRef.current = state;
  }, [fetchFunction, fullConfig, state]);


  const scheduleNextPoll = useCallback((delay: number = configRef.current.interval) => {
    // Clear existing polling interval.
    if (stateRef.current.intervalId !== null) {
      clearTimeout(stateRef.current.intervalId);
      setState(prevState => ({
        ...prevState,
        intervalId: null,
        nextPollAt: null,
      }));
    }

    const nextPollTime = Date.now() + delay;
    const intervalId = window.setTimeout(async () => {
      if (!configRef.current.enabled) return;

      // Check stop condition.
      if (configRef.current.stopCondition?.()) {
        setState(prevState => ({
          ...prevState,
          isPolling: false,
          intervalId: null,
          nextPollAt: null,
        }));
        return;
      }

      try {
        // Create new abort controller for this poll.
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setState(prevState => ({
          ...prevState,
          lastPollAt: Date.now(),
        }));

        await fetchFunctionRef.current();

        // Reset retry count on successful poll.
        setState(prevState => ({
          ...prevState,
          retryCount: 0,
        }));
        setLastError(null);

        // Schedule next poll.
        scheduleNextPoll();
      } catch (error) {
        const contractError = error as ContractErrorType;
        setLastError(contractError);

        const newRetryCount = stateRef.current.retryCount + 1;

        if (
          errorManager.isRetryable(contractError) &&
          newRetryCount <= configRef.current.maxRetries
        ) {
          const retryDelay = Math.min(
            configRef.current.interval * Math.pow(configRef.current.backoffMultiplier, newRetryCount - 1),
            configRef.current.maxBackoffDelay,
          );

          logger.warn(`Polling failed, retrying in ${retryDelay}ms (attempt ${newRetryCount}/${configRef.current.maxRetries})`, {
            error: contractError.message,
            retryCount: newRetryCount,
          });

          setState(prevState => ({
            ...prevState,
            retryCount: newRetryCount,
          }));

          // Schedule retry.
          scheduleNextPoll(retryDelay);
        } else {
          // Max retries reached or non-retryable error.
          logger.error('Polling failed permanently', {
            error: contractError.message,
            retryCount: newRetryCount,
            isRetryable: errorManager.isRetryable(contractError),
          });

          setState(prevState => ({
            ...prevState,
            isPolling: false,
            intervalId: null,
            nextPollAt: null,
            retryCount: 0,
          }));
        }
      }
    }, delay);

    setState(prevState => ({
      ...prevState,
      intervalId,
      nextPollAt: nextPollTime,
    }));
  }, []);

  const startPolling = useCallback(() => {
    if (stateRef.current.isPolling || !configRef.current.enabled) return;

    setState(prevState => ({
      ...prevState,
      isPolling: true,
      retryCount: 0,
    }));

    scheduleNextPoll(0); // Start immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = useCallback(() => {
    if (stateRef.current.intervalId !== null) {
      clearTimeout(stateRef.current.intervalId);
      setState(prevState => ({
        ...prevState,
        intervalId: null,
        nextPollAt: null,
      }));
    }

    // Cancel any ongoing request.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prevState => ({
      ...prevState,
      isPolling: false,
      retryCount: 0,
    }));
  }, []);

  const restartPolling = useCallback(() => {
    stopPolling();
    setTimeout(() => startPolling(), 100); // Small delay to ensure cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (stateRef.current.intervalId !== null) {
        clearTimeout(stateRef.current.intervalId);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-start polling if enabled - use refs to avoid dependency issues.
  useEffect(() => {
    if (fullConfig.enabled && !state.isPolling) {
      // Use setTimeout to break potential synchronous loops.
      const timeoutId = setTimeout(() => {
        if (configRef.current.enabled && !stateRef.current.isPolling) {
          startPolling();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    } else if (!fullConfig.enabled && state.isPolling) {
      const timeoutId = setTimeout(() => {
        if (!configRef.current.enabled && stateRef.current.isPolling) {
          stopPolling();
        }
      }, 0);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullConfig.enabled, state.isPolling]);

  return {
    ...state,
    lastError,
    startPolling,
    stopPolling,
    restartPolling,
    timeUntilNextPoll: state.nextPollAt ? Math.max(0, state.nextPollAt - Date.now()) : 0,
  };
}
