import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export const FlutterwaveAdapter: AdapterInterface = {
  loadScript: async () => {
    await loadScript('https://checkout.flutterwave.com/v3.js');
  },
  initialize: (config: AdapterConfig) => {
    if (!config.user.phonenumber) {
      console.warn('Flutterwave requires a phone number for some payment methods.');
    }

    window.FlutterwaveCheckout({
      public_key: config.publicKey,
      tx_ref: config.reference,
      amount: config.amount / 100, // Flutterwave expects major denomination (e.g. NGN)
      currency: config.currency,
      payment_options: 'card,mobilemoney,ussd',
      customer: {
        email: config.user.email,
        phone_number: config.user.phonenumber,
        name: config.user.name,
      },
      meta: config.metadata,
      callback: (data: any) => {
        if (data.status === 'successful') {
          const response: PaymentResponse = {
            status: 'success',
            reference: data.tx_ref,
            transactionId: data.transaction_id,
            provider: 'flutterwave',
            raw: data,
          };
          config.onSuccess(response);
        }
      },
      onclose: () => {
        config.onClose();
      },
      customizations: {
        title: config.metadata?.title || 'Payment',
        description: config.metadata?.description || 'Payment',
        logo: config.metadata?.logo,
      },
    });
  },
};
