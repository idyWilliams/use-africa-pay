/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Monnify payment adapter for web applications.
 */

import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface MonnifySDK {
    initialize: (config: any) => void;
  }
  interface Window {
    MonnifySDK: MonnifySDK;
  }
}

/**
 * Monnify payment adapter for web applications.
 * 
 * Integrates with Monnify's JavaScript SDK to provide payment processing
 * for Nigerian merchants with support for card payments, bank transfers,
 * and USSD payments.
 * 
 * @category Adapters
 * @see {@link https://docs.monnify.com/docs/web-sdk | Monnify Documentation}
 * 
 * @example
 * ```tsx
 * import { useAfricaPay, MonnifyAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'monnify',
 *       adapter: MonnifyAdapter,
 *       publicKey: 'MK_TEST_xxx',
 *       contractCode: 'YOUR_CONTRACT_CODE', // Required for Monnify
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: {
 *         email: 'customer@example.com',
 *         name: 'John Doe' // Required for Monnify
 *       },
 *       metadata: {
 *         description: 'Payment for order #123'
 *       },
 *       onSuccess: (response) => console.log('Success:', response),
 *       onClose: () => console.log('Closed')
 *     });
 *   };
 * 
 *   return <button onClick={handlePayment}>Pay with Monnify</button>;
 * }
 * ```
 */
export const MonnifyAdapter: AdapterInterface = {
  /**
   * Loads the Monnify JavaScript SDK.
   * The same URL is used for both test and live environments.
   * 
   * @returns Promise that resolves when the SDK is loaded
   */
  loadScript: async () => {
    // Monnify uses the same URL for test and live
    await loadScript('https://sdk.monnify.com/plugin/monnify.js');
  },

  /**
   * Initializes the Monnify payment modal.
   * 
   * Note: Monnify expects the amount in major currency units (Naira),
   * so the adapter automatically converts from kobo by dividing by 100.
   * 
   * @param config - Payment configuration
   * @throws Error if contractCode or user.name is missing
   */
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
        }
      },
      onClose: (data: any) => {
        config.onClose();
      },
    });
  },

  /**
   * Returns the MonnifySDK instance.
   * 
   * @returns The MonnifySDK global object
   */
  getInstance: () => {
    return window.MonnifySDK;
  },
};
