/**
 * @packageDocumentation
 * @module @use-africa-pay/react-native
 * 
 * Paystack payment adapter for React Native applications.
 */

import React from 'react';
import { Paystack, paystackProps } from 'react-native-paystack-webview';
import { PaymentConfig, PaymentResponse, AdapterInterface } from '../types';

/**
 * Paystack adapter implementing the AdapterInterface.
 * Used internally for component-based payment flow.
 * 
 * @category Adapters
 * @internal
 */
export const PaystackAdapter: AdapterInterface = {
  initialize: async (config: PaymentConfig) => {
    return new Promise((resolve, reject) => {
      // This will be used with the PaystackPayment component
      // The component handles the actual payment flow
      resolve();
    });
  },
};

/**
 * Props for the PaystackPayment component.
 * 
 * @category Components
 */
interface PaystackPaymentProps {
  /** Payment configuration */
  config: PaymentConfig;
}

/**
 * Paystack payment component for React Native.
 * 
 * Uses react-native-paystack-webview to render the Paystack payment modal.
 * The component automatically starts the payment flow when rendered.
 * 
 * @category Components
 * @param props - Component props
 * @returns Paystack payment component
 * 
 * @example
 * ```tsx
 * import { PaystackPayment } from '@use-africa-pay/react-native';
 * 
 * function PaymentScreen() {
 *   const config = {
 *     publicKey: 'pk_test_xxx',
 *     amount: 100000,
 *     currency: 'NGN',
 *     reference: `TXN_${Date.now()}`,
 *     user: { email: 'customer@example.com' },
 *     onSuccess: (response) => console.log(response),
 *     onClose: () => console.log('closed')
 *   };
 * 
 *   return <PaystackPayment config={config} />;
 * }
 * ```
 */
export const PaystackPayment: React.FC<PaystackPaymentProps> = ({ config }) => {
  /**
   * Handles successful payment response from Paystack.
   * Normalizes the response to the standard PaymentResponse format.
   */
  const handleSuccess = (response: any) => {
    const paymentResponse: PaymentResponse = {
      status: 'success',
      message: 'Payment completed successfully',
      reference: response.reference || config.reference,
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
  };

  /**
   * Handles payment cancellation.
   */
  const handleCancel = () => {
    config.onClose();
  };

  return (
    <Paystack
      paystackKey={config.publicKey}
      amount={config.amount / 100} // Paystack RN expects Naira
      billingEmail={config.user.email}
      billingName={config.user.name}
      billingMobile={config.user.phonenumber || config.user.phone}
      channels={['card', 'bank', 'ussd', 'qr', 'mobile_money']}
      currency={config.currency}
      refNumber={config.reference}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      autoStart={true}
    />
  );
};
