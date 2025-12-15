# @use-africa-pay/core

The core logic for `use-africa-pay`, a unified React hook for African payment gateways.

> **Created and Maintained by [Idy Williams](https://github.com/idyWilliams)**

## Installation

```bash
npm install @use-africa-pay/core
```

## Usage

```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

const { initializePayment } = useAfricaPay();

const handlePayment = () => {
  initializePayment({
    provider: 'paystack',
    adapter: PaystackAdapter, // Pass the adapter instance
    publicKey: 'pk_test_...',
    amount: 5000,
    currency: 'NGN',
    reference: 'ref_' + Date.now(),
    user: {
      email: 'customer@example.com',
    },
    onSuccess: (response) => console.log('Success:', response),
    onClose: () => console.log('Closed'),
  });
};
```

See the [main repository](https://github.com/idyWilliams/use-africa-pay) for full documentation.
