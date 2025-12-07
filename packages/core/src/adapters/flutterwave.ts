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
      callback: (response: any) => {
        if (response.status === 'successful') {
          const paymentResponse: PaymentResponse = {
            status: 'success',
            message: 'Payment completed successfully',
            reference: response.tx_ref,
            transactionId: response.transaction_id,
            amount: config.amount,
            currency: config.currency,
            paidAt: new Date().toISOString(),
            customer: {
              email: config.user.email,
              name: config.user.name,
              phone: config.user.phonenumber || config.user.phone,
            },
            provider: 'flutterwave',
            metadata: config.metadata,
            raw: response,
          };
          config.onSuccess(paymentResponse);
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
