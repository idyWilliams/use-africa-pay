# use-africa-pay

A unified, type-safe React hook for integrating African payment gateways (Paystack, Flutterwave, Monnify) into your application.

## Features

- 🌍 **Unified API**: Switch between providers (Paystack, Flutterwave, Monnify) with a single config change.
- 🚀 **Lazy Loading**: SDKs are loaded only when needed, keeping your bundle size small.
- 🛡️ **Type-Safe**: Full TypeScript support for configuration and responses.
- 🧩 **Extensible**: Easy to add more providers in the future.

## Installation

```bash
npm install @use-africa-pay/core
# or
pnpm add @use-africa-pay/core
# or
yarn add @use-africa-pay/core
```

## Usage

```tsx
import { useAfricaPay } from '@use-africa-pay/core';

const PaymentComponent = () => {
  const { initializePayment, loading, error } = useAfricaPay();

  const handlePayment = () => {
    initializePayment({
      provider: 'paystack', // or 'flutterwave', 'monnify'
      publicKey: 'YOUR_PUBLIC_KEY',
      amount: 500000, // Amount in kobo (or lowest denomination)
      currency: 'NGN',
      reference: 'unique_ref_' + Date.now(),
      user: {
        email: 'customer@example.com',
        name: 'John Doe',
        phone: '08012345678',
      },
      metadata: {
        custom_field: 'value',
      },
      onSuccess: (response) => {
        console.log('Payment successful:', response);
      },
      onClose: () => {
        console.log('Payment closed');
      },
    });
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Processing...' : 'Pay Now'}
    </button>
  );
};
```

## Supported Providers

| Provider | Key | Notes |
| :--- | :--- | :--- |
| **Paystack** | `paystack` | Amount in kobo (e.g., 10000 = 100 NGN) |
| **Flutterwave** | `flutterwave` | Amount in major unit (e.g., 100 = 100 NGN) - handled automatically |
| **Monnify** | `monnify` | Requires `contractCode`. Amount in major unit - handled automatically |

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT © [Your Name]
