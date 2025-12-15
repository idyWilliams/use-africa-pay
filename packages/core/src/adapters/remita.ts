import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    RmPaymentEngine: any;
  }
}

export const RemitaAdapter: AdapterInterface = {
  loadScript: async () => {
    await loadScript('https://remitademo.net/payment/v1/remita-pay-inline.bundle.js');
  },
  initialize: (config: AdapterConfig) => {
    if (!config.merchantId) {
      throw new Error('Merchant ID is required for Remita');
    }
    if (!config.serviceTypeId) {
      throw new Error('Service Type ID is required for Remita');
    }

    const paymentEngine = window.RmPaymentEngine.init({
      key: config.publicKey,
      merchantId: config.merchantId,
      serviceTypeId: config.serviceTypeId,
      amount: config.amount / 100, // Remita expects major currency unit (Naira)
      currency: config.currency,
      transactionId: config.reference,
      customerId: config.user.email,
      firstName: config.user.name?.split(' ')[0] || '',
      lastName: config.user.name?.split(' ').slice(1).join(' ') || '',
      email: config.user.email,
      narration: config.metadata?.description || 'Payment',
      onSuccess: (response: any) => {
        const paymentResponse: PaymentResponse = {
          status: 'success',
          message: 'Payment completed successfully',
          reference: config.reference,
          transactionId: response.transactionId || response.RRR,
          amount: config.amount,
          currency: config.currency,
          paidAt: new Date().toISOString(),
          customer: {
            email: config.user.email,
            name: config.user.name,
            phone: config.user.phonenumber || config.user.phone,
          },
          provider: 'remita',
          metadata: config.metadata,
          raw: response,
        };
        config.onSuccess(paymentResponse);
      },
      onError: (response: any) => {
        console.error('Remita payment error:', response);
      },
      onClose: () => {
        config.onClose();
      },
    });

    paymentEngine.showPaymentWidget();
  },
  getInstance: () => {
    return window.RmPaymentEngine;
  },
};
