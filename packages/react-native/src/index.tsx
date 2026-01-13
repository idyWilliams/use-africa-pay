/**
 * @packageDocumentation
 * @module @use-africa-pay/react-native
 * 
 * React Native unified payment integration for African payment gateways.
 * 
 * This package provides components and hooks for integrating Paystack,
 * Flutterwave, Monnify, and Remita payment providers into React Native
 * applications.
 * 
 * @example
 * Basic usage:
 * ```tsx
 * import {
 *   useAfricaPayRN,
 *   PaymentGateway
 * } from '@use-africa-pay/react-native';
 * 
 * function PaymentScreen() {
 *   const {
 *     initializePayment,
 *     paymentConfig,
 *     showPayment,
 *     hidePayment
 *   } = useAfricaPayRN();
 * 
 *   const handlePayment = () => {
 *     initializePayment({
 *       provider: 'paystack',
 *       publicKey: 'pk_test_xxx',
 *       amount: 100000,
 *       currency: 'NGN',
 *       reference: `TXN_${Date.now()}`,
 *       user: { email: 'customer@example.com' },
 *       onSuccess: (response) => console.log(response)
 *     });
 *   };
 * 
 *   return (
 *     <View>
 *       <Button title="Pay" onPress={handlePayment} />
 *       {paymentConfig && (
 *         <PaymentGateway
 *           config={paymentConfig}
 *           provider="paystack"
 *           visible={showPayment}
 *           onDismiss={hidePayment}
 *         />
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import { useAfricaPayRN } from './useAfricaPayRN';
import { PaystackPayment } from './adapters/paystack';
import { FlutterwavePayment } from './adapters/flutterwave';
import { WebViewPayment } from './components/WebViewPayment';
import { PaymentConfig, PaymentProvider } from './types';

/**
 * Props for the AfricaPayProvider component.
 * 
 * @category Components
 */
interface AfricaPayProviderProps {
  /** Child components */
  children: React.ReactNode;
}

/**
 * Provider component that wraps your app to enable payment functionality.
 * 
 * @category Components
 * @param props - Provider props
 * @returns Provider component
 * 
 * @example
 * ```tsx
 * import { AfricaPayProvider } from '@use-africa-pay/react-native';
 * 
 * function App() {
 *   return (
 *     <AfricaPayProvider>
 *       <YourApp />
 *     </AfricaPayProvider>
 *   );
 * }
 * ```
 */
export const AfricaPayProvider: React.FC<AfricaPayProviderProps> = ({ children }) => {
  return <View style={{ flex: 1 }}>{children}</View>;
};

// Re-export everything
export { useAfricaPayRN } from './useAfricaPayRN';
export { PaystackPayment } from './adapters/paystack';
export { FlutterwavePayment } from './adapters/flutterwave';
export { WebViewPayment } from './components/WebViewPayment';
export * from './types';

/**
 * Props for the PaymentGateway component.
 * 
 * @category Components
 */
interface PaymentGatewayProps {
  /** Payment configuration */
  config: PaymentConfig;
  /** Payment provider to use */
  provider: PaymentProvider;
  /** Whether the payment modal is visible */
  visible: boolean;
  /** Callback to dismiss the payment modal */
  onDismiss: () => void;
}

/**
 * Universal payment gateway component that renders the appropriate
 * payment UI based on the selected provider.
 * 
 * - Paystack: Uses react-native-paystack-webview
 * - Flutterwave: Uses react-native-flutterwave
 * - Monnify/Remita: Uses WebView-based implementation
 * 
 * @category Components
 * @param props - Payment gateway props
 * @returns Payment component for the selected provider
 * 
 * @example
 * ```tsx
 * <PaymentGateway
 *   config={paymentConfig}
 *   provider="paystack"
 *   visible={showPayment}
 *   onDismiss={hidePayment}
 * />
 * ```
 */
export const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  config,
  provider,
  visible,
  onDismiss,
}) => {
  if (!visible || !config) return null;

  switch (provider) {
    case 'paystack':
      return <PaystackPayment config={config} />;
    case 'flutterwave':
      return <FlutterwavePayment config={config} />;
    case 'monnify':
    case 'remita':
      return (
        <WebViewPayment
          config={config}
          provider={provider}
          visible={visible}
          onDismiss={onDismiss}
        />
      );
    default:
      return null;
  }
};
