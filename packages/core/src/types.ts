export type PaymentProvider = 'paystack' | 'flutterwave' | 'monnify';

export interface UserConfig {
  email: string;
  name?: string; // Required by Monnify
  phonenumber?: string; // Required by Flutterwave
}

export interface BaseConfig {
  amount: number; // In lowest denomination (kobo/cents)
  currency: 'NGN' | 'USD' | 'GHS' | 'KES';
  reference: string;
  publicKey: string;
  contractCode?: string; // Specific to Monnify
  metadata?: Record<string, any>;
}

export interface AdapterConfig extends BaseConfig {
  user: UserConfig;
  onSuccess: (response: PaymentResponse) => void;
  onClose: () => void;
}

export interface PaymentResponse {
  status: 'success' | 'failed';
  reference: string;
  transactionId?: string; // Provider's internal ID
  provider: PaymentProvider;
  raw: any; // The original response object
}

export interface AdapterInterface {
  loadScript: () => Promise<void>;
  initialize: (config: AdapterConfig) => void;
}
