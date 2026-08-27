import { useState, useCallback, useRef } from 'react';
import { PaymentProvider, PaymentStatus } from './types';

export interface PaymentMetric {
  provider: PaymentProvider;
  status: PaymentStatus;
  timestamp: number;
  amount: number;
  duration?: number; // Time from init to completion
  error?: string;
}

export interface ProviderStats {
  provider: PaymentProvider;
  totalAttempts: number;
  successful: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDuration?: number;
  lastUsed: number;
}

export interface AnalyticsConfig {
  maxHistorySize?: number;
  persistToStorage?: boolean;
  storageKey?: string;
}

/**
 * Lightweight payment analytics hook for tracking success rates
 * Helps identify which providers perform best for your use case
 */
export const usePaymentAnalytics = (config: AnalyticsConfig = {}) => {
  const {
    maxHistorySize = 100,
    persistToStorage = false,
    storageKey = 'use-africa-pay-analytics',
  } = config;

  const [metrics, setMetrics] = useState<PaymentMetric[]>(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const startTimeRef = useRef<number | null>(null);

  const persistMetrics = useCallback((newMetrics: PaymentMetric[]) => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMetrics));
      } catch (e) {
        // Silently fail if storage is not available
      }
    }
  }, [persistToStorage, storageKey]);

  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const recordPayment = useCallback(
    (metric: Omit<PaymentMetric, 'timestamp' | 'duration'>) => {
      const duration = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
      startTimeRef.current = null;

      const newMetric: PaymentMetric = {
        ...metric,
        timestamp: Date.now(),
        duration,
      };

      setMetrics((prev) => {
        const updated = [newMetric, ...prev].slice(0, maxHistorySize);
        persistMetrics(updated);
        return updated;
      });
    },
    [maxHistorySize, persistMetrics]
  );

  const getProviderStats = useCallback(
    (provider?: PaymentProvider): ProviderStats[] => {
      const providerMetrics = provider
        ? metrics.filter((m) => m.provider === provider)
        : metrics;

      const statsByProvider = providerMetrics.reduce(
        (acc, metric) => {
          if (!acc[metric.provider]) {
            acc[metric.provider] = {
              provider: metric.provider,
              totalAttempts: 0,
              successful: 0,
              failed: 0,
              cancelled: 0,
              successRate: 0,
              durations: [],
              lastUsed: 0,
            };
          }

          const stats = acc[metric.provider];
          stats.totalAttempts++;
          stats.lastUsed = Math.max(stats.lastUsed, metric.timestamp);

          if (metric.status === 'success') {
            stats.successful++;
          } else if (metric.status === 'failed') {
            stats.failed++;
          } else if (metric.status === 'cancelled') {
            stats.cancelled++;
          }

          if (metric.duration) {
            stats.durations.push(metric.duration);
          }

          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(statsByProvider).map((stats: any) => ({
        provider: stats.provider,
        totalAttempts: stats.totalAttempts,
        successful: stats.successful,
        failed: stats.failed,
        cancelled: stats.cancelled,
        successRate: stats.totalAttempts > 0 
          ? (stats.successful / stats.totalAttempts) * 100 
          : 0,
        avgDuration: stats.durations.length > 0
          ? stats.durations.reduce((a: number, b: number) => a + b, 0) / stats.durations.length
          : undefined,
        lastUsed: stats.lastUsed,
      }));
    },
    [metrics]
  );

  const getBestProvider = useCallback((): PaymentProvider | null => {
    const stats = getProviderStats();
    if (stats.length === 0) return null;

    // Find provider with highest success rate and minimum attempts
    const eligible = stats.filter((s) => s.totalAttempts >= 3);
    if (eligible.length === 0) {
      // If not enough data, return the most used provider
      return stats.reduce((best, current) => 
        current.totalAttempts > best.totalAttempts ? current : best
      ).provider;
    }

    return eligible.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    ).provider;
  }, [getProviderStats]);

  const clearHistory = useCallback(() => {
    setMetrics([]);
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        // Silently fail
      }
    }
  }, [persistToStorage, storageKey]);

  const getRecentFailures = useCallback((count = 5): PaymentMetric[] => {
    return metrics
      .filter((m) => m.status === 'failed')
      .slice(0, count);
  }, [metrics]);

  return {
    recordPayment,
    startTracking,
    getProviderStats,
    getBestProvider,
    clearHistory,
    getRecentFailures,
    metrics,
  };
};
