/**
 * @packageDocumentation
 * @module @use-africa-pay/react-native
 * 
 * WebView-based payment component for Monnify and Remita.
 */

import React, { useRef, useState } from 'react';
import { Modal, View, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { PaymentConfig, PaymentResponse } from '../types';

/**
 * Props for the WebViewPayment component.
 * 
 * @category Components
 */
interface WebViewPaymentProps {
  /** Payment configuration */
  config: PaymentConfig;
  /** Payment provider (monnify or remita) */
  provider: 'monnify' | 'remita';
  /** Whether the payment modal is visible */
  visible: boolean;
  /** Callback to dismiss the payment modal */
  onDismiss: () => void;
}

/**
 * WebView-based payment component for Monnify and Remita.
 * 
 * This component renders a WebView that loads the payment provider's
 * JavaScript SDK and handles the payment flow. It's used for providers
 * that don't have native React Native SDKs.
 * 
 * @category Components
 * @param props - Component props
 * @returns WebView payment modal
 * 
 * @example
 * ```tsx
 * import { WebViewPayment } from '@use-africa-pay/react-native';
 * 
 * function MonnifyPayment() {
 *   const [visible, setVisible] = useState(true);
 *   const config = {
 *     publicKey: 'MK_TEST_xxx',
 *     contractCode: 'CONTRACT_CODE',
 *     amount: 100000,
 *     currency: 'NGN',
 *     reference: `TXN_${Date.now()}`,
 *     user: { email: 'customer@example.com', name: 'John Doe' },
 *     onSuccess: (response) => console.log(response),
 *     onClose: () => setVisible(false)
 *   };
 * 
 *   return (
 *     <WebViewPayment
 *       config={config}
 *       provider="monnify"
 *       visible={visible}
 *       onDismiss={() => setVisible(false)}
 *     />
 *   );
 * }
 * ```
 */
export const WebViewPayment: React.FC<WebViewPaymentProps> = ({
  config,
  provider,
  visible,
  onDismiss,
}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  /**
   * Generates the HTML content for the payment WebView.
   * Includes the provider's SDK and initialization code.
   */
  const generatePaymentHTML = (): string => {
    if (provider === 'monnify') {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://sdk.monnify.com/plugin/monnify.js"></script>
</head>
<body>
  <div id="status">Initializing payment...</div>
  <script>
    window.MonnifySDK.initialize({
      amount: ${config.amount / 100},
      currency: "${config.currency}",
      reference: "${config.reference}",
      customerName: "${config.user.name || ''}",
      customerEmail: "${config.user.email}",
      apiKey: "${config.publicKey}",
      contractCode: "${config.contractCode}",
      paymentDescription: "${config.metadata?.description || 'Payment'}",
      metadata: ${JSON.stringify(config.metadata || {})},
      onComplete: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          data: response
        }));
      },
      onClose: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'close'
        }));
      }
    });
  </script>
</body>
</html>
      `;
    } else {
      // Remita
      // Default to Test Mode (Demo) if not explicitly set to false
      const isTestMode = config.testMode !== false;
      const remitaUrl = isTestMode
        ? 'https://remitademo.net/payment/v1/remita-pay-inline.bundle.js'
        : 'https://login.remita.net/payment/v1/remita-pay-inline.bundle.js';

      return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="${remitaUrl}"></script>
</head>
<body>
  <div id="status">Initializing payment...</div>
  <script>
    var paymentEngine = window.RmPaymentEngine.init({
      key: "${config.publicKey}",
      merchantId: "${config.merchantId}",
      serviceTypeId: "${config.serviceTypeId}",
      amount: ${config.amount / 100},
      currency: "${config.currency}",
      transactionId: "${config.reference}",
      customerId: "${config.user.email}",
      firstName: "${config.user.name?.split(' ')[0] || ''}",
      lastName: "${config.user.name?.split(' ').slice(1).join(' ') || ''}",
      email: "${config.user.email}",
      narration: "${config.metadata?.description || 'Payment'}",
      onSuccess: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'success',
          data: response
        }));
      },
      onError: function(response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          data: response
        }));
      },
      onClose: function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'close'
        }));
      }
    });
    paymentEngine.showPaymentWidget();
  </script>
</body>
</html>
      `;
    }
  };

  /**
   * Handles messages from the WebView.
   * Parses the message and triggers appropriate callbacks.
   */
  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'success') {
        const response = message.data;
        const paymentResponse: PaymentResponse = {
          status: 'success',
          message: 'Payment completed successfully',
          reference: config.reference,
          transactionId: response.transactionReference || response.transactionId || response.RRR,
          amount: config.amount,
          currency: config.currency,
          paidAt: new Date().toISOString(),
          customer: {
            email: config.user.email,
            name: config.user.name,
            phone: config.user.phonenumber || config.user.phone,
          },
          provider: provider,
          metadata: config.metadata,
          raw: response,
        };
        config.onSuccess(paymentResponse);
        onDismiss();
      } else if (message.type === 'close') {
        config.onClose();
        onDismiss();
      } else if (message.type === 'error') {
        if (config.onError) {
          config.onError({
            name: 'PaymentError',
            message: 'Payment failed',
            code: 'PAYMENT_FAILED',
            provider: provider,
          } as any);
        }
        onDismiss();
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: generatePaymentHTML() }}
          onMessage={handleMessage}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 1,
  },
});
