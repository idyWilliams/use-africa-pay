/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Main React hook for integrating African payment gateways.
 */

import { useState, useRef } from 'react';
import {
  InitializePaymentProps,
  PaymentResponse,
  PaymentError,
  ValidationError,
  NetworkError,
  AdapterInterface,
} from './types';
import {
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  sanitizeReference,
  sanitizeMetadata,
  redactSensitiveData,
} from './utils/sanitize';

/**
 * Return type for the useAfricaPay hook.
 * 
 * @category Hooks
 */
export interface UseAfricaPayReturn {
  /** Initializes a payment transaction */
  initializePayment: (props: InitializePaymentProps) => Promise<void>;
  /** Whether a payment is currently being processed */
  loading: boolean;
  /** The last error that occurred, if any */
  error: PaymentError | null;
  /** Resets the hook state (loading and error) */
  reset: () => void;
  /** Returns the underlying provider SDK instance */
  getProviderInstance: () => any;
}

/**
 * React hook for integrating African payment gateways.
 * 
 * Provides a unified interface for Paystack, Flutterwave, Monnify, and Remita
 * payment integrations with automatic input sanitization and error handling.
 * 
 * @category Hooks
 * @returns Hook state and methods for payment processing
 * 
 * @example
 * Basic usage with Paystack:
 * ```tsx
 * import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading, error } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'paystack',
 *       adapter: PaystackAdapter,
 *       publicKey: 'pk_test_xxx',
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: {
 *         email: 'customer@example.com',
 *         name: 'John Doe'
 *       },
 *       onSuccess: (response) => {
 *         console.log('Payment successful:', response);
 *       },
 *       onClose: () => {
 *         console.log('Payment modal closed');
 *       }
 *     });
 *   };
 * 
 *   return (
 *     <button onClick={handlePayment} disabled={loading}>
 *       {loading ? 'Processing...' : 'Pay Now'}
 *     </button>
 *   );
 * }
 * ```
 * 
 * @example
 * Using with Monnify:
 * ```tsx
 * initializePayment({
 *   provider: 'monnify',
 *   adapter: MonnifyAdapter,
 *   publicKey: 'MK_TEST_xxx',
 *   contractCode: 'CONTRACT_CODE',
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: `TXN_${Date.now()}`,
 *   user: {
 *     email: 'customer@example.com',
 *     name: 'John Doe' // Required for Monnify
 *   },
 *   onSuccess: (response) => console.log(response)
 * });
 * ```
 */
export const useAfricaPay = (): UseAfricaPayReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const adapterRef = useRef<AdapterInterface | null>(null);

  /**
   * Resets the hook state to initial values.
   */
  const reset = () => {
    setLoading(false);
    setError(null);
  };

  /**
   * Validates the payment configuration.
   * @param props - Payment configuration to validate
   * @throws {ValidationError} When configuration is invalid
   */
  const validateConfig = (props: InitializePaymentProps): void => {
    const { provider, user, amount, publicKey } = props;

    // Basic validation
    if (!publicKey) {
      throw new ValidationError('Public key is required', 'Please provide your payment provider public key');
    }

    if (!user.email) {
      throw new ValidationError('Customer email is required', 'Please provide a valid customer email address');
    }

    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0', 'Please provide a valid payment amount');
    }

    // Provider-specific validation
    if (props.provider === 'monnify') {
      if (!props.contractCode) {
        throw new ValidationError(
          'Contract Code is required for Monnify',
          'Please provide your Monnify contract code'
        );
      }
      if (!props.user.name) {
        throw new ValidationError(
          'Customer name is required for Monnify',
          'Please provide the customer name'
        );
      }
    }

    if (props.provider === 'flutterwave') {
      if (!props.user.phonenumber && !props.user.phone) {
        throw new ValidationError(
          'Phone number is required for Flutterwave',
          'Please provide the customer phone number'
        );
      }
    }

    if (props.provider === 'remita') {
      if (!props.merchantId) {
        throw new ValidationError(
          'Merchant ID is required for Remita',
          'Please provide your Remita merchant ID'
        );
      }
      if (!props.serviceTypeId) {
        throw new ValidationError(
          'Service Type ID is required for Remita',
          'Please provide your Remita service type ID'
        );
      }
      if (!props.user.name) {
        throw new ValidationError(
          'Customer name is required for Remita',
          'Please provide the customer name'
        );
      }
    }
  };

  /**
   * Initializes a payment transaction with the specified provider.
   * 
   * @param props - Payment configuration including provider, amount, and callbacks
   * @returns Promise that resolves when payment is initialized
   */
  const initializePayment = async (props: InitializePaymentProps) => {
    setLoading(true);
    setError(null);

    const { provider, onError, adapter, ...config } = props;

    // Use passed adapter or fallback to what's in ref (if any)
    const currentAdapter = adapter || adapterRef.current;

    if (!currentAdapter) {
      const err = new ValidationError(
        `No adapter provided for ${provider}`,
        'Please pass an adapter instance (e.g. adapter: PaystackAdapter) to initializePayment'
      );
      setLoading(false);
      setError(err);
      if (onError) onError(err);
      return;
    }

    adapterRef.current = currentAdapter;

    try {
      // Sanitize all user inputs before validation
      const sanitizedConfig = {
        ...config,
        reference: sanitizeReference(config.reference),
        user: {
          email: sanitizeEmail(config.user.email),
          name: config.user.name ? sanitizeName(config.user.name) : undefined,
          phonenumber: config.user.phonenumber ? sanitizePhone(config.user.phonenumber) : undefined,
          phone: config.user.phone ? sanitizePhone(config.user.phone) : undefined,
        },
        metadata: config.metadata ? sanitizeMetadata(config.metadata) : undefined,
      };

      // Validate configuration with sanitized data
      // We cast to any because sanitizedConfig might have slightly different types but it's safe here
      validateConfig({ ...props, ...sanitizedConfig } as any);

      // Lazy load the script with testMode option
      await currentAdapter.loadScript({ testMode: props.testMode });

      currentAdapter.initialize({
        ...sanitizedConfig,
        provider, // Explicitly pass provider
        amount: config.amount,
        currency: config.currency,
        publicKey: config.publicKey,
        onSuccess: (response) => {
          setLoading(false);
          if (props.onSuccess) props.onSuccess(response);
        },
        onClose: () => {
          setLoading(false);
          if (props.onClose) props.onClose();
        },
      });
    } catch (err: unknown) {
      setLoading(false);

      let paymentError: PaymentError;

      if (err instanceof PaymentError) {
        paymentError = err;
      } else {
        const error = err as Error | undefined;
        const message = error?.message || 'Payment initialization failed';

        if (message.includes('Failed to load script') || message.includes('timeout')) {
          paymentError = new NetworkError(
            `Failed to load ${provider} payment script`,
            provider
          );
        } else {
          // Redact sensitive data from error messages
          const safeMessage = redactSensitiveData(message);
          paymentError = new PaymentError(
            safeMessage,
            'UNKNOWN_ERROR',
            provider,
            'Please try again or contact support if the issue persists',
            err // Pass raw error
          );
        }
      }

      setError(paymentError);
      // Redact sensitive data from console logs
      console.error('[use-africa-pay]', {
        code: paymentError.code,
        provider: paymentError.provider,
        message: redactSensitiveData(paymentError.message),
        raw: paymentError.rawError
      });

      if (onError) onError(paymentError);
    }
  };

  /**
   * Returns the underlying payment provider SDK instance.
   * Useful for advanced customization or debugging.
   * 
   * @returns The provider SDK instance or undefined if not initialized
   */
  const getProviderInstance = () => {
    return adapterRef.current?.getInstance();
  };

  return { initializePayment, loading, error, reset, getProviderInstance };
};
