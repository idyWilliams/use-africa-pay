import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const PaystackAdapter: AdapterInterface = {
  loadScript: async () => {
    await loadScript('https://js.paystack.co/v1/inline.js');
  },
  initialize: (config: AdapterConfig) => {
    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.user.email,
      amount: config.amount, // Paystack expects kobo/lowest denomination
      currency: config.currency,
      ref: config.reference,
      metadata: config.metadata,
      callback: (response: any) => {
        const paymentResponse: PaymentResponse = {
          status: 'success',
          reference: response.reference,
          transactionId: response.trans || response.transaction,
          provider: 'paystack',
          raw: response,
        };
        config.onSuccess(paymentResponse);
      },
      onClose: () => {
        config.onClose();
      },
    });

    handler.openIframe();
  },
};
