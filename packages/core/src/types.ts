export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface UserConfig {
  email: string;
  name?: string;
  phonenumber?: string;
  phone?: string;
}

// Base configuration shared by all providers
export interface BaseConfig {
  amount: number; // In lowest denomination (kobo/cents)
  currency: 'NGN' | 'USD' | 'GHS' | 'KES';
  reference: string;
  publicKey: string;
  user: UserConfig;
  metadata?: Record<string, any>;
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
  onError?: (error: PaymentError) => void;
  // onError?: (error: PaymentError) => void;
  adapter?: AdapterInterface; // Allow passing adapter instance directly
  testMode?: boolean; // Toggle between Test/See-Sandbox and Live environments (Crucial for Remita)
}

// Provider-specific configurations
export interface PaystackConfig extends BaseConfig {
  provider: 'paystack';
  channels?: string[]; // Paystack specific
}

export interface FlutterwaveConfig extends BaseConfig {
  provider: 'flutterwave';
  payment_options?: string; // Flutterwave specific
}

export interface MonnifyConfig extends BaseConfig {
  provider: 'monnify';
  contractCode: string;
  user: UserConfig & { name: string }; // Name is required for Monnify
}

export interface RemitaConfig extends BaseConfig {
  provider: 'remita';
  merchantId: string;
  serviceTypeId: string;
  user: UserConfig & { name: string }; // Name is required for Remita
}

// Discriminated Union for Initialization Props
export type InitializePaymentProps =
  | PaystackConfig
  | FlutterwaveConfig
  | MonnifyConfig
  | RemitaConfig;

// Adapter Config (Internal use, normalized)
export interface AdapterConfig extends BaseConfig {
  user: UserConfig;
  provider: PaymentProvider;
  onSuccess: (response: PaymentResponse) => void;
  onClose: () => void;
  [key: string]: any; // Allow extra properties for provider specifics
}

// Enhanced Payment Response
export interface PaymentResponse {
  status: PaymentStatus;
  message: string;
  reference: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string; // ISO 8601 timestamp
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  provider: PaymentProvider;
  metadata?: Record<string, any>;
  raw: any; // Original provider response
}

// Custom Error Types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: PaymentProvider,
    public suggestion?: string,
    public rawError?: any // Keep the original provider response
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, suggestion?: string) {
    super(message, 'VALIDATION_ERROR', undefined, suggestion);
    this.name = 'ValidationError';
  }
}

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

export class ProviderError extends PaymentError {
  constructor(message: string, provider: PaymentProvider, suggestion?: string, rawError?: any) {
    super(message, 'PROVIDER_ERROR', provider, suggestion, rawError);
    this.name = 'ProviderError';
  }
}

export interface AdapterInterface {
  loadScript: (options?: { testMode?: boolean }) => Promise<void>;
  initialize: (config: AdapterConfig) => void;
  getInstance: () => any; // Escape hatch to get underlying provider instance
}
