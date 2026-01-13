/**
 * @packageDocumentation
 * @module @use-africa-pay/react-native
 * 
 * Type definitions for the React Native payment integration.
 */

/**
 * Supported payment providers in Africa.
 * 
 * @category Types
 */
export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

/**
 * Possible states of a payment transaction.
 * 
 * @category Types
 */
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

/**
 * Customer/user configuration for payment transactions.
 * 
 * @category Types
 */
export interface UserConfig {
  /** Customer's email address (required for all providers) */
  email: string;
  /** Customer's full name (required for Monnify and Remita) */
  name?: string;
  /** Customer's phone number (alternative field) */
  phonenumber?: string;
  /** Customer's phone number */
  phone?: string;
}

/**
 * Base configuration for payment transactions.
 * 
 * @category Types
 */
export interface BaseConfig {
  /** Amount in lowest denomination (kobo for NGN, cents for USD) */
  amount: number;
  /** Currency code */
  currency: 'NGN' | 'USD' | 'GHS' | 'KES';
  /** Unique transaction reference */
  reference: string;
  /** Provider's public/API key */
  publicKey: string;
  /** Monnify contract code (required for Monnify) */
  contractCode?: string;
  /** Remita merchant ID (required for Remita) */
  merchantId?: string;
  /** Remita service type ID (required for Remita) */
  serviceTypeId?: string;
  /** Additional metadata to attach to the transaction */
  metadata?: Record<string, any>;
  /** Toggle between test/sandbox and live environments */
  testMode?: boolean;
}

/**
 * Complete payment configuration including callbacks.
 * 
 * @category Types
 * @example
 * ```typescript
 * const config: PaymentConfig = {
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: 'TXN_123',
 *   publicKey: 'pk_test_xxx',
 *   user: { email: 'customer@example.com' },
 *   onSuccess: (response) => console.log(response),
 *   onClose: () => console.log('closed')
 * };
 * ```
 */
export interface PaymentConfig extends BaseConfig {
  /** Customer information */
  user: UserConfig;
  /** Callback fired on successful payment */
  onSuccess: (response: PaymentResponse) => void;
  /** Callback fired when payment modal is closed */
  onClose: () => void;
  /** Callback fired on payment error */
  onError?: (error: PaymentError) => void;
}

/**
 * Standardized payment response returned by all providers.
 * 
 * @category Types
 */
export interface PaymentResponse {
  /** Payment status */
  status: PaymentStatus;
  /** Human-readable status message */
  message: string;
  /** Transaction reference */
  reference: string;
  /** Provider's transaction ID */
  transactionId?: string;
  /** Amount in lowest denomination */
  amount: number;
  /** Currency code */
  currency: string;
  /** ISO 8601 timestamp of payment completion */
  paidAt?: string;
  /** Customer information */
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  /** Payment provider used */
  provider: PaymentProvider;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Original provider response (for debugging) */
  raw: any;
}

/**
 * Base error class for all payment-related errors.
 * 
 * @category Errors
 */
export class PaymentError extends Error {
  /**
   * Creates a new PaymentError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param provider - Payment provider that caused the error
   * @param suggestion - Suggested action to resolve the error
   */
  constructor(
    message: string,
    public code: string,
    public provider?: PaymentProvider,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Error thrown when payment configuration validation fails.
 * 
 * @category Errors
 */
export class ValidationError extends PaymentError {
  constructor(message: string, suggestion?: string) {
    super(message, 'VALIDATION_ERROR', undefined, suggestion);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when network-related issues occur.
 * 
 * @category Errors
 */
export class NetworkError extends PaymentError {
  constructor(message: string, provider?: PaymentProvider) {
    super(
      message,
      'NETWORK_ERROR',
      provider,
      'Check your internet connection and try again.'
    );
    this.name = 'NetworkError';
  }
}

/**
 * Error thrown when the payment provider returns an error.
 * 
 * @category Errors
 */
export class ProviderError extends PaymentError {
  constructor(message: string, provider: PaymentProvider, suggestion?: string) {
    super(message, 'PROVIDER_ERROR', provider, suggestion);
    this.name = 'ProviderError';
  }
}

/**
 * Interface that all payment adapters must implement.
 * 
 * @category Adapters
 */
export interface AdapterInterface {
  /**
   * Initializes the payment flow with the provider.
   * 
   * @param config - Payment configuration
   */
  initialize: (config: PaymentConfig) => Promise<void>;
}
