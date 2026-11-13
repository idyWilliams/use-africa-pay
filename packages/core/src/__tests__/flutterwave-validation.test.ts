/**
 * @file Flutterwave Phone Number Validation Test Suite
 * @author Ibrahim Bamidele (@bamiebot-maker)
 *
 * Validates that Flutterwave checkout requests strictly enforce customer phone numbers,
 * replacing the legacy console warning with actionable ValidationErrors.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAfricaPay, validateConfig } from '../useAfricaPay';
import { FlutterwaveAdapter } from '../adapters/flutterwave';
import { ValidationError, FlutterwaveConfig } from '../types';

describe('Flutterwave Phone Number Validation (@bamiebot-maker)', () => {
  const baseFlutterwaveConfig: FlutterwaveConfig = {
    provider: 'flutterwave',
    publicKey: 'FLWPUBK_TEST-1234567890',
    amount: 150000, // ₦1,500.00
    currency: 'NGN',
    reference: 'FLW_REF_TEST_001',
    user: {
      email: 'customer@example.com',
      name: 'Bamidele Ibrahim',
    },
  };

  describe('validateConfig() function', () => {
    it('throws a ValidationError when both phonenumber and phone are missing', () => {
      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            name: 'Bamidele Ibrahim',
          },
        });
      }).toThrowError(ValidationError);

      try {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            name: 'Bamidele Ibrahim',
          },
        });
      } catch (err: any) {
        expect(err).toBeInstanceOf(ValidationError);
        expect(err.message).toBe('Phone number is required for Flutterwave');
        expect(err.suggestion).toBe('Please provide the customer phone number');
      }
    });

    it('throws a ValidationError when phone is an empty string or whitespace only', () => {
      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            phonenumber: '   ',
          },
        });
      }).toThrowError(ValidationError);

      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            phone: '',
          },
        });
      }).toThrowError(ValidationError);
    });

    it('passes validation when phonenumber is supplied', () => {
      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            phonenumber: '+2348012345678',
          },
        });
      }).not.toThrow();
    });

    it('passes validation when phone alias is supplied', () => {
      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
            phone: '08012345678',
          },
        });
      }).not.toThrow();
    });

    it('validates phone number when adapter is passed directly as FlutterwaveAdapter', () => {
      expect(() => {
        validateConfig({
          ...baseFlutterwaveConfig,
          adapter: FlutterwaveAdapter,
          user: {
            email: 'customer@example.com',
          },
        } as any);
      }).toThrowError(ValidationError);
    });
  });

  describe('useAfricaPay hook with Flutterwave', () => {
    it('catches missing phone number and invokes onError with ValidationError', async () => {
      const { result } = renderHook(() => useAfricaPay());
      const onError = vi.fn();

      await act(async () => {
        await result.current.initializePayment({
          ...baseFlutterwaveConfig,
          user: {
            email: 'customer@example.com',
          },
          onError,
        });
      });

      expect(onError).toHaveBeenCalledTimes(1);
      const errorCall = onError.mock.calls[0];
      expect(errorCall).toBeDefined();
      const passedError = errorCall![0];
      expect(passedError).toBeInstanceOf(ValidationError);
      expect(passedError.message).toBe('Phone number is required for Flutterwave');
      expect(passedError.code).toBe('VALIDATION_ERROR');
      expect(result.current.error).toBe(passedError);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('FlutterwaveAdapter - no deprecated warnings and proper customer mapping', () => {
    let mockCheckout: ReturnType<typeof vi.fn>;
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockCheckout = vi.fn();
      (window as any).FlutterwaveCheckout = mockCheckout;
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      delete (window as any).FlutterwaveCheckout;
    });

    it('does not log console.warn when initialize is called', () => {
      const onSuccess = vi.fn();
      const onClose = vi.fn();

      FlutterwaveAdapter.initialize({
        ...baseFlutterwaveConfig,
        user: {
          email: 'customer@example.com',
          phonenumber: '08012345678',
        },
        onSuccess,
        onClose,
      });

      expect(warnSpy).not.toHaveBeenCalled();
      expect(mockCheckout).toHaveBeenCalledTimes(1);
    });

    it('maps customer phone_number from phonenumber or fallback phone', () => {
      FlutterwaveAdapter.initialize({
        ...baseFlutterwaveConfig,
        user: {
          email: 'customer@example.com',
          phone: '08099887766',
        },
        onSuccess: vi.fn(),
        onClose: vi.fn(),
      });

      expect(mockCheckout).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: expect.objectContaining({
            phone_number: '08099887766',
          }),
        })
      );
    });
  });
});

