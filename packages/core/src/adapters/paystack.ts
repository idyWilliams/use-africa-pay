/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Paystack payment adapter for web applications.
 */

import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface PaystackPop {
    setup: (config: any) => { openIframe: () => void };
  }
  interface Window {
    PaystackPop: PaystackPop;
  }
}

/**
 * Paystack payment adapter for web applications.
 * 
 * Integrates with Paystack's inline JavaScript SDK to provide
 * seamless payment processing for Nigerian and Ghanaian merchants.
 * 
 * @category Adapters
 * @see {@link https://paystack.com/docs/payments/accept-payments | Paystack Documentation}
 * 
 * @example
 * ```tsx
 * import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'paystack',
 *       adapter: PaystackAdapter,
 *       publicKey: 'pk_test_xxx',
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: { email: 'customer@example.com' },
 *       channels: ['card', 'bank', 'ussd'],
 *       onSuccess: (response) => console.log('Success:', response),
 *       onClose: () => console.log('Closed')
 *     });
 *   };
 * 
 *   return <button onClick={handlePayment}>Pay with Paystack</button>;
 * }
 * ```
 */
export const PaystackAdapter: AdapterInterface = {
  /**
   * Loads the Paystack inline JavaScript SDK.
   * The same URL is used for both test and live environments.
   * 
   * @returns Promise that resolves when the SDK is loaded
   */
  loadScript: async () => {
    // Paystack uses the same URL for test and live
    await loadScript('https://js.paystack.co/v1/inline.js');
  },

  /**
   * Initializes the Paystack payment popup.
   * 
   * @param config - Payment configuration
   */
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

  /**
   * Returns the PaystackPop SDK instance.
   * 
   * @returns The PaystackPop global object
   */
  getInstance: () => {
    return window.PaystackPop;
  },
};
