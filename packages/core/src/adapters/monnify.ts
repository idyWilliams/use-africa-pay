import { AdapterInterface, AdapterConfig, PaymentResponse, PaymentError } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface MonnifySDK {
    initialize: (config: any) => void;
  }
  interface Window {
    MonnifySDK: MonnifySDK;
  }
}

export const MonnifyAdapter: AdapterInterface = {
  loadScript: async () => {
    // Monnify uses the same URL for test and live
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
        const paymentResponse: PaymentResponse = {
          status,
          message: status === 'success' ? 'Payment completed successfully' : 'Payment failed',
          reference: response.paymentReference,
          transactionId: response.transactionReference,
          amount: config.amount,
          currency: config.currency,
          paidAt: new Date().toISOString(),
          customer: {
            email: config.user.email,
            name: config.user.name,
            phone: config.user.phonenumber || config.user.phone,
          },
          provider: 'monnify',
          metadata: config.metadata,
          raw: response,
        };
        if (status === 'success') {
          config.onSuccess(paymentResponse);
        } else {
          const error = new PaymentError(
            paymentResponse.message,
            'PAYMENT_FAILED',
            'monnify',
            'The payment was not successful. Please try again.',
            response
          );
          if (config.onError) config.onError(error);
        }
      },
      onClose: (data: any) => {
        config.onClose();
      },
    });
  },
  getInstance: () => {
    return window.MonnifySDK;
  },
};
