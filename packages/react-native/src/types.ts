export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify' | 'remita';

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface UserConfig {
  email: string;
  name?: string;
  phonenumber?: string;
  phone?: string;
}

export interface BaseConfig {
  amount: number; // In lowest denomination (kobo/cents)
  currency: 'NGN' | 'USD' | 'GHS' | 'KES';
  reference: string;
  publicKey: string;
  contractCode?: string; // Specific to Monnify
  merchantId?: string; // Specific to Remita
  serviceTypeId?: string; // Specific to Remita
  metadata?: Record<string, any>;
  testMode?: boolean; // Toggle between Test (Demo) and Live environments
}

export interface PaymentConfig extends BaseConfig {
  user: UserConfig;
  onSuccess: (response: PaymentResponse) => void;
  onClose: () => void;
  onError?: (error: PaymentError) => void;
}

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
    public suggestion?: string
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
  constructor(message: string, provider: PaymentProvider, suggestion?: string) {
    super(message, 'PROVIDER_ERROR', provider, suggestion);
    this.name = 'ProviderError';
  }
}

export interface AdapterInterface {
  initialize: (config: PaymentConfig) => Promise<void>;
}
