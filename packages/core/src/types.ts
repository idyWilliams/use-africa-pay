/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Core type definitions for the use-africa-pay library.
 * This module contains all TypeScript interfaces, types, and error classes
 * used across the payment integration.
 */

/**
 * Supported payment providers in Africa.
 * 
 * @category Types
 * @example
 * ```typescript
 * const provider: PaymentProvider = 'paystack';
 * ```
 */
export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

/**
 * Possible states of a payment transaction.
 * 
 * @category Types
 * @example
 * ```typescript
 * const status: PaymentStatus = 'success';
 * ```
 */
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

/**
 * Customer/user configuration for payment transactions.
 * 
 * @category Types
 * @example
 * ```typescript
 * const user: UserConfig = {
 *   email: 'customer@example.com',
 *   name: 'John Doe',
 *   phone: '+2348012345678'
 * };
 * ```
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
 * Base configuration shared by all payment providers.
 * 
 * @category Types
 * @example
 * ```typescript
 * const config: BaseConfig = {
 *   amount: 100000, // 1000 NGN in kobo
 *   currency: 'NGN',
 *   reference: 'TXN_123456',
 *   publicKey: 'pk_test_xxx',
 *   user: { email: 'customer@example.com' }
 * };
 * ```
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
  /** Customer information */
  user: UserConfig;
  /** Additional metadata to attach to the transaction */
  metadata?: Record<string, any>;
  /** Callback fired on successful payment */
  onSuccess?: (response: PaymentResponse) => void;
  /** Callback fired when payment modal is closed */
  onClose?: () => void;
  /** Callback fired on payment error */
  onError?: (error: PaymentError) => void;
  /** Custom adapter instance (for advanced usage) */
  adapter?: AdapterInterface;
  /** Toggle between test/sandbox and live environments */
  testMode?: boolean;
}

/**
 * Paystack-specific payment configuration.
 * 
 * @category Types
 * @see {@link https://paystack.com/docs/api/transaction | Paystack API Documentation}
 * @example
 * ```typescript
 * const config: PaystackConfig = {
 *   provider: 'paystack',
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: 'TXN_123',
 *   publicKey: 'pk_test_xxx',
 *   user: { email: 'customer@example.com' },
 *   channels: ['card', 'bank', 'ussd']
 * };
 * ```
 */
export interface PaystackConfig extends BaseConfig {
  /** Provider identifier */
  provider: 'paystack';
  /** Payment channels to enable (card, bank, ussd, qr, mobile_money) */
  channels?: string[];
}

/**
 * Flutterwave-specific payment configuration.
 * 
 * @category Types
 * @see {@link https://developer.flutterwave.com/docs | Flutterwave API Documentation}
 * @example
 * ```typescript
 * const config: FlutterwaveConfig = {
 *   provider: 'flutterwave',
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: 'TXN_123',
 *   publicKey: 'FLWPUBK_TEST-xxx',
 *   user: { email: 'customer@example.com', phonenumber: '+2348012345678' },
 *   payment_options: 'card,mobilemoney,ussd'
 * };
 * ```
 */
export interface FlutterwaveConfig extends BaseConfig {
  /** Provider identifier */
  provider: 'flutterwave';
  /** Comma-separated payment options */
  payment_options?: string;
}

/**
 * Monnify-specific payment configuration.
 * 
 * @category Types
 * @see {@link https://docs.monnify.com | Monnify API Documentation}
 * @example
 * ```typescript
 * const config: MonnifyConfig = {
 *   provider: 'monnify',
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: 'TXN_123',
 *   publicKey: 'MK_TEST_xxx',
 *   contractCode: 'CONTRACT_CODE',
 *   user: { email: 'customer@example.com', name: 'John Doe' }
 * };
 * ```
 */
export interface MonnifyConfig extends BaseConfig {
  /** Provider identifier */
  provider: 'monnify';
  /** Monnify contract code (required) */
  contractCode: string;
  /** User config with required name field */
  user: UserConfig & { name: string };
}

/**
 * Remita-specific payment configuration.
 * 
 * @category Types
 * @see {@link https://www.remita.net/developers | Remita API Documentation}
 * @example
 * ```typescript
 * const config: RemitaConfig = {
 *   provider: 'remita',
 *   amount: 100000,
 *   currency: 'NGN',
 *   reference: 'TXN_123',
 *   publicKey: 'REMITA_PUBLIC_KEY',
 *   merchantId: 'MERCHANT_ID',
 *   serviceTypeId: 'SERVICE_TYPE_ID',
 *   user: { email: 'customer@example.com', name: 'John Doe' },
 *   testMode: true
 * };
 * ```
 */
export interface RemitaConfig extends BaseConfig {
  /** Provider identifier */
  provider: 'remita';
  /** Remita merchant ID (required) */
  merchantId: string;
  /** Remita service type ID (required) */
  serviceTypeId: string;
  /** User config with required name field */
  user: UserConfig & { name: string };
}

/**
 * Discriminated union type for all provider configurations.
 * Use this type when initializing payments to get proper type checking
 * based on the selected provider.
 * 
 * @category Types
 * @example
 * ```typescript
 * function processPayment(config: InitializePaymentProps) {
 *   if (config.provider === 'monnify') {
 *     // TypeScript knows contractCode is available here
 *     console.log(config.contractCode);
 *   }
 * }
 * ```
 */
export type InitializePaymentProps =
  | PaystackConfig
  | FlutterwaveConfig
  | MonnifyConfig
  | RemitaConfig;

/**
 * Internal adapter configuration with normalized fields.
 * Used by adapters to process payment requests.
 * 
 * @category Types
 * @internal
 */
export interface AdapterConfig extends BaseConfig {
  /** Customer information */
  user: UserConfig;
  /** Payment provider */
  provider: PaymentProvider;
  /** Success callback (required internally) */
  onSuccess: (response: PaymentResponse) => void;
  /** Close callback (required internally) */
  onClose: () => void;
  /** Allow additional provider-specific properties */
  [key: string]: any;
}


/**
 * Standardized payment response returned by all providers.
 * This interface normalizes the response format across different payment gateways.
 * 
 * @category Types
 * @example
 * ```typescript
 * const handleSuccess = (response: PaymentResponse) => {
 *   console.log(`Payment ${response.status} for ${response.reference}`);
 *   console.log(`Amount: ${response.amount} ${response.currency}`);
 *   console.log(`Transaction ID: ${response.transactionId}`);
 * };
 * ```
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
  raw: unknown;
}

/**
 * Base error class for all payment-related errors.
 * Extends the native Error class with additional context.
 * 
 * @category Errors
 * @example
 * ```typescript
 * try {
 *   await initializePayment(config);
 * } catch (error) {
 *   if (error instanceof PaymentError) {
 *     console.log(`Error Code: ${error.code}`);
 *     console.log(`Provider: ${error.provider}`);
 *     console.log(`Suggestion: ${error.suggestion}`);
 *   }
 * }
 * ```
 */
export class PaymentError extends Error {
  /**
   * Creates a new PaymentError instance.
   * 
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param provider - Payment provider that caused the error
   * @param suggestion - Suggested action to resolve the error
   * @param rawError - Original error from the provider
   */
  constructor(
    message: string,
    public code: string,
    public provider?: PaymentProvider,
    public suggestion?: string,
    public rawError?: unknown
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

/**
 * Error thrown when payment configuration validation fails.
 * 
 * @category Errors
 * @example
 * ```typescript
 * if (!config.publicKey) {
 *   throw new ValidationError(
 *     'Public key is required',
 *     'Please provide your payment provider public key'
 *   );
 * }
 * ```
 */
export class ValidationError extends PaymentError {
  /**
   * Creates a new ValidationError instance.
   * 
   * @param message - Description of the validation failure
   * @param suggestion - How to fix the validation error
   */
  constructor(message: string, suggestion?: string) {
    super(message, 'VALIDATION_ERROR', undefined, suggestion);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when network-related issues occur.
 * 
 * @category Errors
 * @example
 * ```typescript
 * if (!navigator.onLine) {
 *   throw new NetworkError('No internet connection', 'paystack');
 * }
 * ```
 */
export class NetworkError extends PaymentError {
  /**
   * Creates a new NetworkError instance.
   * 
   * @param message - Description of the network error
   * @param provider - Payment provider affected
   */
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
 * @example
 * ```typescript
 * throw new ProviderError(
 *   'Transaction declined',
 *   'paystack',
 *   'Please try a different payment method',
 *   providerResponse
 * );
 * ```
 */
export class ProviderError extends PaymentError {
  /**
   * Creates a new ProviderError instance.
   * 
   * @param message - Error message from the provider
   * @param provider - Payment provider that returned the error
   * @param suggestion - Suggested action to resolve the error
   * @param rawError - Original error response from the provider
   */
  constructor(message: string, provider: PaymentProvider, suggestion?: string, rawError?: unknown) {
    super(message, 'PROVIDER_ERROR', provider, suggestion, rawError);
    this.name = 'ProviderError';
  }
}

/**
 * Interface that all payment adapters must implement.
 * Adapters handle provider-specific logic for loading scripts and initializing payments.
 * 
 * @category Adapters
 * @example
 * ```typescript
 * const CustomAdapter: AdapterInterface = {
 *   loadScript: async (options) => {
 *     await loadScript('https://provider.com/sdk.js');
 *   },
 *   initialize: (config) => {
 *     window.ProviderSDK.pay(config);
 *   },
 *   getInstance: () => window.ProviderSDK
 * };
 * ```
 */
export interface AdapterInterface {
  /**
   * Loads the payment provider's JavaScript SDK.
   * 
   * @param options - Load options including testMode flag
   * @returns Promise that resolves when the script is loaded
   */
  loadScript: (options?: { testMode?: boolean }) => Promise<void>;
  
  /**
   * Initializes the payment flow with the provider.
   * 
   * @param config - Normalized adapter configuration
   */
  initialize: (config: AdapterConfig) => void;
  
  /**
   * Returns the underlying provider SDK instance.
   * Useful for advanced customization or debugging.
   * 
   * @returns The provider's SDK instance
   */
  getInstance: () => any;
}
