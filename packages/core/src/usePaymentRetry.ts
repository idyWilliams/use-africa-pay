import { useState, useCallback, useRef } from 'react';
import { PaymentError } from './types';
import { ErrorRecovery } from './utils/errorRecovery';

export interface RetryConfig {
  maxAttempts?: number;
  delayMs?: number;
  exponentialBackoff?: boolean;
  onRetryAttempt?: (attempt: number, error: PaymentError) => void;
  shouldRetry?: (error: PaymentError) => boolean;
}

export interface RetryState {
  attempt: number;
  isRetrying: boolean;
  canRetry: boolean;
  nextRetryIn?: number;
}

/**
 * Automatic retry logic with exponential backoff for transient payment failures
 * Smart retry only for recoverable errors (network, timeout, provider issues)
 */
export const usePaymentRetry = (config: RetryConfig = {}) => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    exponentialBackoff = true,
    onRetryAttempt,
    shouldRetry,
  } = config;

  const [retryState, setRetryState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    canRetry: true,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);

  const calculateDelay = useCallback(
    (attempt: number): number => {
      if (exponentialBackoff) {
        return ErrorRecovery.getRetryDelay(attempt);
      }
      return delayMs;
    },
    [delayMs, exponentialBackoff]
  );

  const canRetryError = useCallback(
    (error: PaymentError): boolean => {
      if (shouldRetry) {
        return shouldRetry(error);
      }
      return ErrorRecovery.isRetryable(error);
    },
    [shouldRetry]
  );

  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    attemptRef.current = 0;
    setRetryState({
      attempt: 0,
      isRetrying: false,
      canRetry: true,
    });
  }, []);

  const executeWithRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      onError?: (error: PaymentError) => void
    ): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const attemptOperation = async (currentAttempt: number) => {
          try {
            const result = await operation();
            reset();
            resolve(result);
          } catch (error) {
            const paymentError = error as PaymentError;
            
            if (!canRetryError(paymentError) || currentAttempt >= maxAttempts) {
              setRetryState((prev) => ({
                ...prev,
                isRetrying: false,
                canRetry: false,
              }));
              if (onError) onError(paymentError);
              reject(paymentError);
              return;
            }

            const nextAttempt = currentAttempt + 1;
            attemptRef.current = nextAttempt;
            const delay = calculateDelay(nextAttempt);

            setRetryState({
              attempt: nextAttempt,
              isRetrying: true,
              canRetry: nextAttempt < maxAttempts,
              nextRetryIn: delay,
            });

            if (onRetryAttempt) {
              onRetryAttempt(nextAttempt, paymentError);
            }

            retryTimeoutRef.current = setTimeout(() => {
              attemptOperation(nextAttempt);
            }, delay);
          }
        };

        attemptOperation(attemptRef.current);
      });
    },
    [maxAttempts, calculateDelay, canRetryError, onRetryAttempt, reset]
  );

  const manualRetry = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T> => {
      if (attemptRef.current >= maxAttempts) {
        reset();
      }
      return executeWithRetry(operation);
    },
    [maxAttempts, executeWithRetry, reset]
  );

  return {
    executeWithRetry,
    manualRetry,
    reset,
    retryState,
  };
};
