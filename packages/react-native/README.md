# @use-africa-pay/react-native

A unified, type-safe React Native payment integration SDK for African payment gateways. Seamlessly integrate **Paystack**, **Flutterwave**, **Monnify**, and **Remita** into your iOS and Android apps with a single API.

Supports **Nigeria**, **Ghana**, **Kenya**, **South Africa**, and more.

## Features

- ✅ **Native SDK Support**: Uses native SDKs for Paystack and Flutterwave
- ✅ **WebView Fallback**: WebView implementation for Monnify and Remita
- ✅ **Unified API**: Same API as the web version
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **iOS & Android**: Works on both platforms

## Installation

```bash
npm install @use-africa-pay/react-native
# or
yarn add @use-africa-pay/react-native
# or
pnpm add @use-africa-pay/react-native
```

### Additional Dependencies

```bash
# Required for all providers
npm install react-native-webview

# For Paystack
npm install react-native-paystack-webview

# For Flutterwave
npm install react-native-flutterwave
```

### iOS Setup

```bash
cd ios && pod install
```

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { View, Button } from 'react-native';
import { useAfricaPayRN, PaymentGateway } from '@use-africa-pay/react-native';

const PaymentScreen = () => {
  const { initializePayment, paymentConfig, showPayment, hidePayment } = useAfricaPayRN();

  const handlePayment = () => {
    initializePayment({
      provider: 'paystack',
      publicKey: 'pk_test_xxx',
      amount: 500000, // Amount in kobo (₦5,000)
      currency: 'NGN',
      reference: 'txn_' + Date.now(),
      user: {
        email: 'customer@example.com',
        name: 'John Doe',
      },
      onSuccess: (response) => {
        console.log('Payment successful:', response);
      },
      onClose: () => {
        console.log('Payment closed');
      },
      onError: (error) => {
        console.error('Payment error:', error);
      },
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Button title="Pay with Paystack" onPress={handlePayment} />

      {paymentConfig && (
        <PaymentGateway
          config={paymentConfig}
          provider={paymentConfig.provider}
          visible={showPayment}
          onDismiss={hidePayment}
        />
      )}
    </View>
  );
};
```

## Provider Examples

### Paystack

```tsx
initializePayment({
  provider: 'paystack',
  publicKey: 'pk_test_xxx',
  amount: 500000, // ₦5,000 in kobo
  currency: 'NGN',
  reference: 'PST_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe',
  },
  onSuccess: (response) => {
    console.log('Transaction ID:', response.transactionId);
  },
});
```

### Flutterwave

```tsx
initializePayment({
  provider: 'flutterwave',
  publicKey: 'FLWPUBK_TEST-xxx',
  amount: 500000,
  currency: 'NGN',
  reference: 'FLW_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe',
    phonenumber: '08012345678', // Required
  },
  metadata: {
    title: 'My Store',
    description: 'Payment for order #123',
  },
  onSuccess: (response) => {
    console.log('Payment successful');
  },
});
```

### Monnify (WebView)

```tsx
initializePayment({
  provider: 'monnify',
  publicKey: 'MK_TEST_xxx',
  contractCode: 'xxx', // Required
  amount: 500000,
  currency: 'NGN',
  reference: 'MON_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe', // Required
  },
  onSuccess: (response) => {
    console.log('Payment successful');
  },
});
```

### Remita (WebView)

```tsx
initializePayment({
  provider: 'remita',
  publicKey: 'pk_test_xxx',
  merchantId: 'xxx', // Required
  serviceTypeId: 'xxx', // Required
  amount: 500000,
  currency: 'NGN',
  reference: 'RMT_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe', // Required
  },
  onSuccess: (response) => {
    console.log('RRR:', response.transactionId);
  },
});
```

## API Reference

### `useAfricaPayRN()`

Returns an object with:

- `initializePayment(props)`: Function to start payment
- `loading`: Boolean indicating payment in progress
- `error`: PaymentError object if error occurred
- `reset()`: Function to clear error state
- `paymentConfig`: Current payment configuration
- `showPayment`: Boolean to show/hide payment UI
- `hidePayment()`: Function to hide payment UI

### Payment Configuration

```typescript
interface InitializePaymentProps {
  provider: 'paystack' | 'flutterwave' | 'monnify' | 'remita';
  publicKey: string;
  amount: number; // In kobo/lowest denomination
  currency: 'NGN' | 'USD' | 'GHS' | 'KES';
  reference: string;
  user: {
    email: string;
    name?: string;
    phonenumber?: string;
  };
  testMode?: boolean; // Optional: Set false for Live (Crucial for Remita). Defaults to true.
  // Provider-specific
  contractCode?: string; // Monnify
  merchantId?: string; // Remita
  serviceTypeId?: string; // Remita
  metadata?: Record<string, any>;
  // Callbacks
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
  onError?: (error: PaymentError) => void;
}
```

### Payment Response

```typescript
interface PaymentResponse {
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  message: string;
  reference: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string;
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  provider: PaymentProvider;
  metadata?: Record<string, any>;
  raw: any; // Original provider response
}
```

## Platform-Specific Notes

### iOS

- Ensure you have added the required permissions in `Info.plist`
- WebView requires `NSAppTransportSecurity` configuration for HTTP URLs (development only)

### Android

- Minimum SDK version: 21
- WebView requires internet permission in `AndroidManifest.xml`

## Implementation Details

### Native SDKs

- **Paystack**: Uses `react-native-paystack-webview`
- **Flutterwave**: Uses `react-native-flutterwave`

### WebView Providers

- **Monnify**: WebView with Monnify SDK
- **Remita**: WebView with Remita SDK

## Best Practices

1. **Always use unique references**: Generate unique transaction references
2. **Verify on server**: Never trust client-side success callbacks alone
3. **Handle all callbacks**: Implement onSuccess, onClose, and onError
4. **Test thoroughly**: Test on both iOS and Android
5. **Use sandbox keys**: Test with sandbox/test keys before production

## Troubleshooting

### Paystack not showing

- Ensure `react-native-paystack-webview` is installed
- Check that public key is correct
- Verify amount is in kobo

### Flutterwave button not appearing

- Ensure `react-native-flutterwave` is installed
- Check that phone number is provided
- Verify public key format

### WebView blank screen

- Check internet connection
- Verify provider scripts are loading
- Check console for errors

## Example App

See the `example/` directory for a complete React Native app demonstrating all providers.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

MIT © [Idy Williams]
