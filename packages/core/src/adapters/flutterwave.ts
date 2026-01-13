/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Flutterwave payment adapter for web applications.
 */

import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface Window {
    FlutterwaveCheckout: (config: any) => void;
  }
}

/**
 * Flutterwave payment adapter for web applications.
 * 
 * Integrates with Flutterwave's checkout JavaScript SDK to provide
 * payment processing across multiple African countries including
 * Nigeria, Ghana, Kenya, South Africa, and more.
 * 
 * @category Adapters
 * @see {@link https://developer.flutterwave.com/docs/collecting-payments/inline | Flutterwave Documentation}
 * 
 * @example
 * ```tsx
 * import { useAfricaPay, FlutterwaveAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'flutterwave',
 *       adapter: FlutterwaveAdapter,
 *       publicKey: 'FLWPUBK_TEST-xxx',
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: {
 *         email: 'customer@example.com',
 *         name: 'John Doe',
 *         phonenumber: '+2348012345678' // Required for Flutterwave
 *       },
 *       payment_options: 'card,mobilemoney,ussd',
 *       metadata: {
 *         title: 'My Store',
 *         description: 'Payment for order #123',
 *         logo: 'https://example.com/logo.png'
 *       },
 *       onSuccess: (response) => console.log('Success:', response),
 *       onClose: () => console.log('Closed')
 *     });
 *   };
 * 
 *   return <button onClick={handlePayment}>Pay with Flutterwave</button>;
 * }
 * ```
 */
export const FlutterwaveAdapter: AdapterInterface = {
  /**
   * Loads the Flutterwave checkout JavaScript SDK.
   * The same URL is used for both test and live environments.
   * 
   * @returns Promise that resolves when the SDK is loaded
   */
  loadScript: async () => {
    // Flutterwave uses the same URL for test and live
    await loadScript('https://checkout.flutterwave.com/v3.js');
  },

  /**
   * Initializes the Flutterwave checkout modal.
   * 
   * Note: Flutterwave expects the amount in major currency units (e.g., NGN),
   * so the adapter automatically converts from kobo by dividing by 100.
   * 
   * @param config - Payment configuration
   */
  initialize: (config: AdapterConfig) => {
    if (!config.user.phonenumber) {
      console.warn('Flutterwave requires a phone number for some payment methods.');
    }

    window.FlutterwaveCheckout({
      public_key: config.publicKey,
      tx_ref: config.reference,
      amount: config.amount / 100, // Flutterwave expects major denomination (e.g. NGN)
      currency: config.currency,
      payment_options: config.payment_options || 'card,mobilemoney,ussd',
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

  /**
   * Returns the FlutterwaveCheckout function.
   * 
   * @returns The FlutterwaveCheckout global function
   */
  getInstance: () => {
    return window.FlutterwaveCheckout;
  },
};
