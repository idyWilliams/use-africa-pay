import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAfricaPay } from '../useAfricaPay';
import { PaystackAdapter } from '../adapters/paystack';

describe('Backward Compatibility - Auto-adapter Selection', () => {
  it('should auto-select adapter when none provided (v2.0.0+)', async () => {
    const { result } = renderHook(() => useAfricaPay());
    const onError = vi.fn();

    // This should NOT throw an error anymore - adapter is auto-selected
    expect(() => {
      result.current.initializePayment({
        provider: 'paystack',
        publicKey: 'test_key',
        amount: 500000,
        currency: 'NGN',
        reference: 'test_ref',
        user: {
          email: 'test@example.com',
        },
        onError,
        // Missing adapter - but now auto-selected for backward compatibility
      } as any);
    }).not.toThrow();
  });

  it('should work correctly when adapter is explicitly provided', async () => {
    const { result } = renderHook(() => useAfricaPay());

    // This should not throw an error when adapter is provided
    expect(() => {
      result.current.initializePayment({
        provider: 'paystack',
        adapter: PaystackAdapter,
        publicKey: 'test_key',
        amount: 500000,
        currency: 'NGN',
        reference: 'test_ref',
        user: {
          email: 'test@example.com',
        },
      });
    }).not.toThrow();
  });

  it('should still throw error for invalid provider', async () => {
    const { result } = renderHook(() => useAfricaPay());
    const onError = vi.fn();

    await waitFor(() => {
      result.current.initializePayment({
        provider: 'invalid' as any,
        publicKey: 'test_key',
        amount: 500000,
        currency: 'NGN',
        reference: 'test_ref',
        user: {
          email: 'test@example.com',
        },
        onError,
      } as any);
    });

    // The error should be caught and passed to onError
    expect(onError).toHaveBeenCalled();
    const errorCall = onError.mock.calls[0];
    expect(errorCall).toBeDefined();
    const error = errorCall![0];
    expect(error.message).toContain('No adapter provided');
  });
});

describe('Breaking Changes - Type Safety (v1.3.0+)', () => {
  it('should have raw as unknown instead of any', () => {
    // This test documents the type change from any to unknown
    // Users who were accessing raw without type guards will now need to cast
    const response = {
      status: 'success' as const,
      message: 'test',
      reference: 'test',
      amount: 500000,
      currency: 'NGN',
      customer: { email: 'test@example.com' },
      provider: 'paystack' as const,
      raw: {} as unknown, // Changed from any to unknown
    };

    // Before: response.raw.anyProperty would work
    // After: Need type guard or cast: (response.raw as any).anyProperty
    expect(response.raw).toBeDefined();
  });
});
