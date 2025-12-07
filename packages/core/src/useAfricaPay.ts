import { useState } from 'react';
import {
  PaymentProvider,
  AdapterConfig,
  AdapterInterface,
  PaymentResponse,
  PaymentError,
  ValidationError,
  NetworkError,
} from './types';
import { PaystackAdapter } from './adapters/paystack';
import { FlutterwaveAdapter } from './adapters/flutterwave';
import { MonnifyAdapter } from './adapters/monnify';
import { RemitaAdapter } from './adapters/remita';

const ADAPTERS: Record<PaymentProvider, AdapterInterface> = {
  paystack: PaystackAdapter,
  flutterwave: FlutterwaveAdapter,
  monnify: MonnifyAdapter,
  remita: RemitaAdapter,
};

export interface InitializePaymentProps extends Omit<AdapterConfig, 'onSuccess' | 'onClose'> {
  provider: PaymentProvider;
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
  onError?: (error: PaymentError) => void;
}

export const useAfricaPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
  };

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

  const initializePayment = async (props: InitializePaymentProps) => {
    setLoading(true);
    setError(null);

    const { provider, onError, ...config } = props;
    const adapter = ADAPTERS[provider];

    if (!adapter) {
      const err = new ValidationError(
        `Invalid provider: ${provider}`,
        'Please use one of: paystack, flutterwave, monnify, remita'
      );
      setLoading(false);
      setError(err);
      if (onError) onError(err);
      return;
    }

    try {
      // Validate configuration
      validateConfig(props);

      // Lazy load the script
      await adapter.loadScript();

      adapter.initialize({
        ...config,
        onSuccess: (response) => {
          setLoading(false);
          if (props.onSuccess) props.onSuccess(response);
        },
        onClose: () => {
          setLoading(false);
          if (props.onClose) props.onClose();
        },
      });
    } catch (err: any) {
      setLoading(false);

      let paymentError: PaymentError;

      if (err instanceof PaymentError) {
        paymentError = err;
      } else if (err.message?.includes('Failed to load script')) {
        paymentError = new NetworkError(
          `Failed to load ${provider} payment script`,
          provider
        );
      } else {
        paymentError = new PaymentError(
          err.message || 'Payment initialization failed',
          'UNKNOWN_ERROR',
          provider,
          'Please try again or contact support if the issue persists'
        );
      }

      setError(paymentError);
      console.error('[use-africa-pay]', paymentError);

      if (onError) onError(paymentError);
    }
  };

  return { initializePayment, loading, error, reset };
};
