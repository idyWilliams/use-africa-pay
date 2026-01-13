/**
 * @packageDocumentation
 * @module @use-africa-pay/core
 * 
 * Remita payment adapter for web applications.
 */

import { AdapterInterface, AdapterConfig, PaymentResponse } from '../types';
import { loadScript } from '../scriptLoader';

declare global {
  interface RmPaymentEngine {
    init: (config: any) => { showPaymentWidget: () => void };
  }
  interface Window {
    RmPaymentEngine: RmPaymentEngine;
  }
}

/**
 * Remita payment adapter for web applications.
 * 
 * Integrates with Remita's payment engine to provide payment processing
 * for Nigerian merchants. Remita is widely used for government payments,
 * school fees, and corporate collections.
 * 
 * Important: Remita uses different URLs for test (demo) and live environments.
 * Set `testMode: true` for sandbox testing (default), or `testMode: false` for production.
 * 
 * @category Adapters
 * @see {@link https://www.remita.net/developers | Remita Documentation}
 * 
 * @example
 * ```tsx
 * import { useAfricaPay, RemitaAdapter } from '@use-africa-pay/core';
 * 
 * function PaymentButton() {
 *   const { initializePayment, loading } = useAfricaPay();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'remita',
 *       adapter: RemitaAdapter,
 *       publicKey: 'REMITA_PUBLIC_KEY',
 *       merchantId: 'YOUR_MERCHANT_ID', // Required for Remita
 *       serviceTypeId: 'YOUR_SERVICE_TYPE_ID', // Required for Remita
 *       amount: 100000, // 1000 NGN in kobo
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: {
 *         email: 'customer@example.com',
 *         name: 'John Doe' // Required for Remita
 *       },
 *       testMode: true, // Use demo environment (default)
 *       metadata: {
 *         description: 'Payment for service'
 *       },
 *       onSuccess: (response) => console.log('Success:', response),
 *       onClose: () => console.log('Closed')
 *     });
 *   };
 * 
 *   return <button onClick={handlePayment}>Pay with Remita</button>;
 * }
 * ```
 */
export const RemitaAdapter: AdapterInterface = {
  /**
   * Loads the Remita payment engine JavaScript SDK.
   * 
   * Note: Remita uses different URLs for test and live environments:
   * - Test: https://remitademo.net/payment/v1/remita-pay-inline.bundle.js
   * - Live: https://login.remita.net/payment/v1/remita-pay-inline.bundle.js
   * 
   * @param options - Load options including testMode flag
   * @returns Promise that resolves when the SDK is loaded
   */
  loadScript: async (options = { testMode: true }) => {
    // Default to Test Mode (Demo) if not specified, for safety
    const isTestMode = options.testMode !== false;
    const url = isTestMode
      ? 'https://remitademo.net/payment/v1/remita-pay-inline.bundle.js'
      : 'https://login.remita.net/payment/v1/remita-pay-inline.bundle.js';
    await loadScript(url);
  },

  /**
   * Initializes the Remita payment widget.
   * 
   * Note: Remita expects the amount in major currency units (Naira),
   * so the adapter automatically converts from kobo by dividing by 100.
   * 
   * @param config - Payment configuration
   * @throws Error if merchantId, serviceTypeId, or user.name is missing
   */
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

  /**
   * Returns the RmPaymentEngine instance.
   * 
   * @returns The RmPaymentEngine global object
   */
  getInstance: () => {
    return window.RmPaymentEngine;
  },
};
