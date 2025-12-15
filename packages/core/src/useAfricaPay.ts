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

export const useAfricaPay = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PaymentError | null>(null);
  const adapterRef = useRef<AdapterInterface | null>(null);

  const reset = () => {
    setLoading(false);
    setError(null);
  };

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
    } catch (err: any) {
      setLoading(false);

      let paymentError: PaymentError;

      if (err instanceof PaymentError) {
        paymentError = err;
      } else if (err.message?.includes('Failed to load script') || err.message?.includes('timeout')) {
        paymentError = new NetworkError(
          `Failed to load ${provider} payment script`,
          provider
        );
      } else {
        // Redact sensitive data from error messages
        const safeMessage = redactSensitiveData(err.message || 'Payment initialization failed');
        paymentError = new PaymentError(
          safeMessage,
          'UNKNOWN_ERROR',
          provider,
          'Please try again or contact support if the issue persists',
          err // Pass raw error
        );
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

  const getProviderInstance = () => {
    return adapterRef.current?.getInstance();
  };

  return { initializePayment, loading, error, reset, getProviderInstance };
};
