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
    const paystack = new window.PaystackPop();
    paystack.newTransaction({
      key: config.publicKey,
      email: config.user.email,
      amount: config.amount, // Paystack expects kobo/lowest denomination
      currency: config.currency,
      ref: config.reference,
      metadata: config.metadata,
      onSuccess: (transaction: any) => {
        const response: PaymentResponse = {
          status: 'success',
          reference: transaction.reference,
          transactionId: transaction.transaction,
          provider: 'paystack',
          raw: transaction,
        };
        config.onSuccess(response);
      },
      onCancel: () => {
        config.onClose();
      },
    });
  },
};
