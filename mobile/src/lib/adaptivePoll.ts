import { useRef, useCallback } from 'react';

export interface AdaptivePollOptions {
  baseIntervalMs: number;
  maxIntervalMs: number;
  backoffMultiplier: number;
  shouldPoll: () => boolean;
  onError?: (error: unknown) => void;
}

export interface AdaptivePollState {
  intervalMs: number;
  consecutiveErrors: number;
  isPolling: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  shouldPoll: () => boolean;
  setIsPolling: (v: boolean) => void;
}

/**
 * Hook for adaptive polling with exponential backoff.
 * Increases interval on consecutive errors, resets on success.
 */
export function useAdaptivePoll(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  queryKey: unknown[],
  options: AdaptivePollOptions,
): AdaptivePollState {
  const intervalRef = useRef(options.baseIntervalMs);
  const consecutiveErrorsRef = useRef(0);
  const isPollingRef = useRef(true);

  const reset = useCallback(() => {
    intervalRef.current = options.baseIntervalMs;
    consecutiveErrorsRef.current = 0;
  }, [options.baseIntervalMs]);

  const handleSuccess = useCallback(() => {
    reset();
  }, [reset]);

  const handleError = useCallback((error: unknown) => {
    consecutiveErrorsRef.current += 1;
    const nextInterval = Math.min(
      intervalRef.current * options.backoffMultiplier,
      options.maxIntervalMs,
    );
    intervalRef.current = nextInterval;
    options.onError?.(error);
  }, [options.backoffMultiplier, options.maxIntervalMs, options.onError]);

  // Check if we should poll on each refetch cycle
  const shouldPoll = useCallback(() => {
    if (!isPollingRef.current) return false;
    return options.shouldPoll();
  }, [options.shouldPoll]);

  return {
    intervalMs: intervalRef.current,
    consecutiveErrors: consecutiveErrorsRef.current,
    isPolling: isPollingRef.current,
    onSuccess: handleSuccess,
    onError: handleError,
    shouldPoll,
    setIsPolling: (v: boolean) => { isPollingRef.current = v; },
  };
}

/**
 * Creates a refetchInterval function for useQuery that implements adaptive polling.
 * The interval increases exponentially on consecutive errors, resets on success.
 */
export function createAdaptiveRefetchInterval(
  adaptivePoll: AdaptivePollState,
): (query: { state: { data?: unknown; error?: unknown } }) => number | false {
  return (query) => {
    if (!adaptivePoll.shouldPoll()) return false;
    if (query.state.error) {
      adaptivePoll.onError(query.state.error);
      return adaptivePoll.intervalMs;
    }
    if (query.state.data) {
      adaptivePoll.onSuccess();
    }
    return adaptivePoll.intervalMs;
  };
}