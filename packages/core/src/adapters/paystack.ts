import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export const PaystackAdapter: AdapterInterface = {
  loadScript: async () => {
    // Paystack uses the same URL for test and live
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
      channels: config.channels, // Pass channels if available
      callback: (response: any) => {
        const paymentResponse: PaymentResponse = {
          status: 'success',
          message: 'Payment completed successfully',
          reference: response.reference,
          transactionId: response.trans || response.transaction,
          amount: config.amount,
          currency: config.currency,
          paidAt: new Date().toISOString(),
          customer: {
            email: config.user.email,
            name: config.user.name,
            phone: config.user.phonenumber || config.user.phone,
          },
          provider: 'paystack',
          metadata: config.metadata,
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
  getInstance: () => {
    return window.PaystackPop;
  },
};
