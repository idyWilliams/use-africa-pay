# @use-africa-pay/next

Official Next.js App Router integrations for `@use-africa-pay/core`. 

This package bridges the gap between secure server-side payment verification and client-side widget rendering. It exports strictly separated modules to ensure your secret keys never leak to the browser.

## Installation

```bash
npm install @use-africa-pay/next @use-africa-pay/core
```

## Architecture

This package provides two specific entry points:

- **`@use-africa-pay/next/client`**: Client Components and Hooks (`"use client"`).
- **`@use-africa-pay/next/server`**: Server Actions for secure backend execution (`"use server"`).

## Usage Guide

### 1. The Client Component (Checkout Button)

Wrap your payment UI in the `AfricaPayProvider` to initialize the payment widget. You can seamlessly call Server Actions directly inside your `onSuccess` callback.

```tsx
// app/components/CheckoutButton.tsx
"use client";

import { AfricaPayProvider, useAfricaPayNext } from '@use-africa-pay/next/client';
import { verifyTransaction } from '@use-africa-pay/next/server';

function PayButton() {
  const { initializePayment } = useAfricaPayNext();
  return <button onClick={initializePayment}>Pay Now</button>;
}

export default function CheckoutWidget() {
  return (
    <AfricaPayProvider 
      provider="paystack"
      publicKey={process.env.NEXT_PUBLIC_PAYSTACK_KEY as string}
      amount={5000}
      customer={{ email: "user@example.com" }}
      onSuccess={async (response) => {
        // Securely verify the transaction on the server!
        const verification = await verifyTransaction(response.reference, 'paystack');
        
        if (verification.success) {
          alert('Payment verified securely!');
        }
      }}
    >
      <PayButton/>
    </AfricaPayProvider>
  );
}
```

### 2. Environment Variables

To use the `verifyTransaction` Server Action, ensure your backend secret keys are securely stored in your `.env.local` file. **Never expose these to the browser (do not prefix with `NEXT_PUBLIC_`).**

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_secret_key
MONNIFY_SECRET_KEY=your_secret_key
REMITA_SECRET_KEY=your_secret_key
```
