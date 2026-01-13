/**
 * @packageDocumentation
 * @module @use-africa-pay/react-native
 * 
 * React Native hook for integrating African payment gateways.
 */

import { useState, useCallback } from 'react';
import {
  PaymentProvider,
  PaymentConfig,
  PaymentResponse,
  PaymentError,
  ValidationError,
} from './types';

/**
 * Props for initializing a payment transaction.
 * 
 * @category Hooks
 */
interface InitializePaymentProps extends Omit<PaymentConfig, 'onSuccess' | 'onClose' | 'onError'> {
  /** Payment provider to use */
  provider: PaymentProvider;
  /** Callback fired on successful payment */
  onSuccess?: (response: PaymentResponse) => void;
  /** Callback fired when payment modal is closed */
  onClose?: () => void;
  /** Callback fired on payment error */
  onError?: (error: PaymentError) => void;
}

/**
 * Return type for the useAfricaPayRN hook.
 * 
 * @category Hooks
 */
interface UseAfricaPayRNReturn {
  /** Initializes a payment transaction */
  initializePayment: (props: InitializePaymentProps) => void;
  /** Whether a payment is currently being processed */
  loading: boolean;
  /** The last error that occurred, if any */
  error: PaymentError | null;
  /** Resets the hook state */
  reset: () => void;
  /** Current payment configuration (for rendering payment components) */
  paymentConfig: PaymentConfig | null;
  /** Whether the payment modal should be shown */
  showPayment: boolean;
  /** Hides the payment modal */
  hidePayment: () => void;
}

/**
 * React Native hook for integrating African payment gateways.
 * 
 * Provides a unified interface for Paystack, Flutterwave, Monnify, and Remita
 * payment integrations in React Native applications.
 * 
 * @category Hooks
 * @returns Hook state and methods for payment processing
 * 
 * @example
 * ```tsx
 * import { useAfricaPayRN, PaymentGateway } from '@use-africa-pay/react-native';
 * 
 * function PaymentScreen() {
 *   const {
 *     initializePayment,
 *     loading,
 *     error,
 *     paymentConfig,
 *     showPayment,
 *     hidePayment
 *   } = useAfricaPayRN();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'paystack',
 *       publicKey: 'pk_test_xxx',
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: { email: 'customer@example.com' },
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
 *     <View>
 *       <Button title="Pay Now" onPress={handlePayment} disabled={loading} />
 *       {paymentConfig && (
 *         <PaymentGateway
 *           config={paymentConfig}
 *           provider="paystack"
 *           visible={showPayment}
 *           onDismiss={hidePayment}
 *         />
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export const useAfricaPayRN = (): UseAfricaPayRNReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  /**
   * Resets the hook state to initial values.
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setPaymentConfig(null);
    setShowPayment(false);
  }, []);

  /**
   * Hides the payment modal.
   */
  const hidePayment = useCallback(() => {
    setShowPayment(false);
    setLoading(false);
  }, []);

  /**
   * Validates the payment configuration.
   * @param props - Payment configuration to validate
   * @throws {ValidationError} When configuration is invalid
   */
  const validateConfig = (props: InitializePaymentProps): void => {
    const { provider, user, amount, publicKey, contractCode, merchantId, serviceTypeId } = props;

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
    if (provider === 'monnify') {
      if (!contractCode) {
        throw new ValidationError(
          'Contract Code is required for Monnify',
          'Please provide your Monnify contract code'
        );
      }
      if (!user.name) {
        throw new ValidationError(
          'Customer name is required for Monnify',
          'Please provide the customer name'
        );
      }
    }

    if (provider === 'flutterwave') {
      if (!user.phonenumber && !user.phone) {
        throw new ValidationError(
          'Phone number is required for Flutterwave',
          'Please provide the customer phone number'
        );
      }
    }

    if (provider === 'remita') {
      if (!merchantId) {
        throw new ValidationError(
          'Merchant ID is required for Remita',
          'Please provide your Remita merchant ID'
        );
      }
      if (!serviceTypeId) {
        throw new ValidationError(
          'Service Type ID is required for Remita',
          'Please provide your Remita service type ID'
        );
      }
      if (!user.name) {
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
   */
  const initializePayment = useCallback((props: InitializePaymentProps) => {
    setLoading(true);
    setError(null);

    try {
      validateConfig(props);

      const config: PaymentConfig = {
        ...props,
        onSuccess: (response) => {
          setLoading(false);
          setShowPayment(false);
          if (props.onSuccess) props.onSuccess(response);
        },
        onClose: () => {
          setLoading(false);
          setShowPayment(false);
          if (props.onClose) props.onClose();
        },
        onError: (error) => {
          setLoading(false);
          setError(error);
          setShowPayment(false);
          if (props.onError) props.onError(error);
        },
      };

      setPaymentConfig(config);
      setShowPayment(true);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const paymentError = err instanceof PaymentError ? err : new PaymentError(
        err.message || 'Payment initialization failed',
        'UNKNOWN_ERROR',
        props.provider
      );
      setError(paymentError);
      if (props.onError) props.onError(paymentError);
    }
  }, []);

  return {
    initializePayment,
    loading,
    error,
    reset,
    paymentConfig,
    showPayment,
    hidePayment,
  };
};
