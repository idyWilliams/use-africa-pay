import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    MonnifySDK: any;
  }
}

export const MonnifyAdapter: AdapterInterface = {
  loadScript: async () => {
    await loadScript('https://sdk.monnify.com/plugin/monnify.js');
  },
  initialize: (config: AdapterConfig) => {
    if (!config.contractCode) {
      throw new Error('Contract Code is required for Monnify');
    }
    if (!config.user.name) {
      throw new Error('User name is required for Monnify');
    }

    window.MonnifySDK.initialize({
      // Monnify: Needs Naira. Divide by 100.
      amount: config.amount / 100,

      currency: config.currency,
      reference: config.reference,
      customerName: config.user.name,
      customerEmail: config.user.email,
      apiKey: config.publicKey,
      contractCode: config.contractCode,
      paymentDescription: config.metadata?.description || 'Payment',
      metadata: config.metadata,
      onComplete: (response: any) => {
        // Monnify response
        const status = response.status === 'PAID' || response.status === 'SUCCESS' ? 'success' : 'failed';
        const res: PaymentResponse = {
          status,
          reference: response.paymentReference,
          transactionId: response.transactionReference,
          provider: 'monnify',
          raw: response,
        };
        if (status === 'success') {
          config.onSuccess(res);
        }
      },
      onClose: (data: any) => {
        config.onClose();
      },
    });
  },
};
