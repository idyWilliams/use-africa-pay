import { useState } from 'react';
import { PaymentProvider, AdapterConfig, AdapterInterface } from './types';
import { PaystackAdapter } from './adapters/paystack';
import { FlutterwaveAdapter } from './adapters/flutterwave';
import { MonnifyAdapter } from './adapters/monnify';

const ADAPTERS: Record<PaymentProvider, AdapterInterface> = {
  paystack: PaystackAdapter,
  flutterwave: FlutterwaveAdapter,
  monnify: MonnifyAdapter,
};

export interface UseAfricaPayProps {
  provider: PaymentProvider;
  config: Omit<AdapterConfig, 'onSuccess' | 'onClose'> & {
    onSuccess?: (response: any) => void;
    onClose?: () => void;
  };
}

export const useAfricaPay = ({ provider, config }: UseAfricaPayProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adapter = ADAPTERS[provider];

  const pay = async () => {
    setLoading(true);
    setError(null);

    try {
      // Lazy load the script
      await adapter.loadScript();

      // Validation
      if (provider === 'monnify' && !config.contractCode) {
        throw new Error('Contract Code is required for Monnify');
      }
      if (provider === 'flutterwave' && !config.user.phonenumber) {
        throw new Error('Phone number is required for Flutterwave');
      }

      adapter.initialize({
        ...config,
        onSuccess: (response) => {
          setLoading(false);
          if (config.onSuccess) config.onSuccess(response);
        },
        onClose: () => {
          setLoading(false);
          if (config.onClose) config.onClose();
        },
      });
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Payment initialization failed');
      console.error(err);
    }
  };

  return { pay, loading, error };
};
