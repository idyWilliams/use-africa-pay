# use-africa-pay

<div align="center">
  <img src="./assets/icon.png" alt="use-africa-pay icon" width="120" />
  <h1>use-africa-pay</h1>
  <p>
    <b>The Unified Payment SDK for Africa</b><br/>
    Integrate Paystack, Flutterwave, Monnify, and Remita with a single, type-safe API.
  </p>
  <p>
    <a href="https://www.npmjs.com/package/@use-africa-pay/core">
      <img src="https://img.shields.io/npm/v/@use-africa-pay/core?style=flat-square" alt="NPM Version" />
    </a>
    <a href="https://www.npmjs.com/package/@use-africa-pay/core">
      <img src="https://img.shields.io/npm/dm/@use-africa-pay/core?style=flat-square" alt="Downloads" />
    </a>
    <a href="https://github.com/idyWilliams/use-africa-pay/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/idyWilliams/use-africa-pay?style=flat-square" alt="License" />
    </a>
  </p>
  <p>Created and Maintained by <a href="https://idorenyinwilliams.com/"><b>Idorenyin Williams</b></a></p>
</div>

A unified, type-safe React hook for integrating African payment gateways (Paystack, Flutterwave, Monnify, Remita) into your application.

## Features

-  **Unified API**: Switch between providers with a single config change
-  **Standardized Responses**: Rich, consistent response objects with customer details, timestamps, and metadata
-  **Robust Error Handling**: Custom error types with helpful recovery suggestions
-  **Production-Ready Security**: Input sanitization, HTTPS enforcement, error redaction, and timeout protection
-  **Lazy Loading**: SDKs loaded only when needed, keeping bundle size small
-  **Type-Safe**: Full TypeScript support for configuration and responses
-  **4 Major Providers**: Paystack, Flutterwave, Monnify, and Remita

## Installation

```bash
npm install @use-africa-pay/core
# or
pnpm add @use-africa-pay/core
# or
yarn add @use-africa-pay/core
```

## Quick Start

```tsx
import { useAfricaPay } from '@use-africa-pay/core';

const PaymentComponent = () => {
  const { initializePayment, loading, error, reset } = useAfricaPay();

  const handlePayment = () => {
    initializePayment({
      provider: 'paystack', // or 'flutterwave', 'monnify', 'remita'
      publicKey: 'YOUR_PUBLIC_KEY',
      amount: 500000, // Amount in kobo (lowest denomination)
      currency: 'NGN',
      reference: 'unique_ref_' + Date.now(),
      user: {
        email: 'customer@example.com',
        name: 'John Doe',
        phonenumber: '08012345678',
      },
      metadata: {
        custom_field: 'value',
      },
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        // Response includes: status, message, reference, transactionId,
        // amount, currency, paidAt, customer, provider, metadata, raw
      },
      onClose: () => {
        console.log('Payment closed');
      },
      onError: (error) => {
        console.error('Payment error:', error.message);
        console.log('Suggestion:', error.suggestion);
      },
    });
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && (
        <div>
          <p>Error: {error.message}</p>
          {error.suggestion && <p>Tip: {error.suggestion}</p>}
          <button onClick={reset}>Try Again</button>
        </div>
      )}
    </div>
  );
};
```

## Enhanced Response Structure

All providers return a standardized response:

```typescript
{
  status: 'success' | 'failed' | 'pending' | 'cancelled',
  message: string,
  reference: string,
  transactionId?: string,
  amount: number,
  currency: string,
  paidAt?: string, // ISO 8601 timestamp
  customer: {
    email: string,
    name?: string,
    phone?: string
  },
  provider: 'paystack' | 'flutterwave' | 'monnify' | 'remita',
  metadata?: Record<string, any>,
  raw: any // Original provider response
}
```

## Error Handling

The library provides custom error types with helpful suggestions:

```typescript
import { ValidationError, NetworkError, PaymentError } from '@use-africa-pay/core';

initializePayment({
  // ... config
  onError: (error) => {
    if (error instanceof ValidationError) {
      // Handle validation errors (missing required fields, invalid values)
      console.log(error.suggestion); // "Please provide your payment provider public key"
    } else if (error instanceof NetworkError) {
      // Handle network errors (script loading failures, connection issues)
      console.log(error.suggestion); // "Check your internet connection and try again."
    } else {
      // Handle other payment errors
      console.log(error.code); // Error code for logging
    }
  }
});
```

## Supported Providers

| Provider | Key | Required Fields | Notes |
| :--- | :--- | :--- | :--- |
| **Paystack** | `paystack` | `publicKey`, `user.email` | Amount in kobo (10000 = ₦100) |
| **Flutterwave** | `flutterwave` | `publicKey`, `user.email`, `user.phonenumber` | Amount in kobo, converted automatically |
| **Monnify** | `monnify` | `publicKey`, `contractCode`, `user.name` | Amount in kobo, converted automatically |
| **Remita** | `remita` | `publicKey`, `merchantId`, `serviceTypeId`, `user.name` | Amount in kobo, converted automatically |

## Provider-Specific Examples

### Remita

```tsx
initializePayment({
  provider: 'remita',
  publicKey: 'YOUR_REMITA_PUBLIC_KEY',
  merchantId: 'YOUR_MERCHANT_ID',
  serviceTypeId: 'YOUR_SERVICE_TYPE_ID',
  amount: 500000, // ₦5,000 in kobo
  currency: 'NGN',
  reference: 'RMT_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe', // Required for Remita
  },
  onSuccess: (response) => {
    console.log('Remita RRR:', response.transactionId);
  },
});
```

### Monnify

```tsx
initializePayment({
  provider: 'monnify',
  publicKey: 'YOUR_MONNIFY_PUBLIC_KEY',
  contractCode: 'YOUR_CONTRACT_CODE', // Required
  amount: 500000,
  currency: 'NGN',
  reference: 'MON_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe', // Required for Monnify
  },
  onSuccess: (response) => console.log(response),
});
```

## API Reference

### `useAfricaPay()`

Returns an object with:

- `initializePayment(props)`: Function to start payment
- `loading`: Boolean indicating payment in progress
- `error`: PaymentError object if error occurred
- `reset()`: Function to clear error state

### `InitializePaymentProps`

All providers require:
- `provider`: Payment provider to use
- `publicKey`: Your provider's public key
- `amount`: Amount in lowest denomination (kobo)
- `currency`: Currency code (e.g., 'NGN')
- `reference`: Unique transaction reference
- `user.email`: Customer email

Provider-specific requirements documented in table above.

## Best Practices

1. **Always use unique references**: Generate unique transaction references to avoid duplicates
2. **Handle all callbacks**: Implement `onSuccess`, `onClose`, and `onError` for complete UX
3. **Validate before payment**: Use the built-in validation or add your own checks
4. **Log errors properly**: Use `error.code` and `error.provider` for debugging
5. **Test with sandbox keys**: All providers offer test/sandbox environments
6. **Verify on server**: Always verify payments on your backend before granting access

## Security

This library is built with security as a top priority:

- ✅ **Input Sanitization**: All user inputs automatically sanitized
- ✅ **HTTPS Enforcement**: Scripts loaded over HTTPS only
- ✅ **Error Redaction**: Sensitive data automatically removed from logs
- ✅ **Timeout Protection**: 30-second timeout with retry logic
- ✅ **No Secret Keys**: Only public keys used client-side
- ✅ **PCI-DSS Ready**: Follows payment security best practices

**Important**: Always verify payments on your server. Never trust client-side callbacks alone.

For detailed security guidelines, see [SECURITY.md](SECURITY.md).

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT © [Idy Williams]
