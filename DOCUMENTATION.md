# use-africa-pay Documentation

> **Comprehensive documentation for building interactive web documentation with sandbox environment**

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core API](#core-api)
5. [Provider Configuration](#provider-configuration)
6. [Advanced Features](#advanced-features)
7. [Error Handling](#error-handling)
8. [Security Best Practices](#security-best-practices)
9. [Type Reference](#type-reference)
10. [Examples](#examples)
11. [Migration Guide](#migration-guide)
12. [FAQ](#faq)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**use-africa-pay** is a unified, type-safe React hook for integrating African payment gateways into your application. It provides a single API to work with multiple payment providers while maintaining consistency in responses, error handling, and security.

### Key Features

- **Unified API**: Switch between Paystack, Flutterwave, Monnify, and Remita with minimal code changes
- **Type-Safe**: Full TypeScript support with discriminated unions for provider configs
- **Standardized Responses**: Consistent response structure across all providers
- **Robust Error Handling**: Custom error types with helpful recovery suggestions
- **Smart Preflight Validation**: Validate payment configuration before showing UI
- **Payment Analytics**: Track success rates to optimize provider selection
- **Automatic Retry Logic**: Exponential backoff for transient failures
- **Production-Ready Security**: Input sanitization, HTTPS enforcement, error redaction
- **Lazy Loading**: SDKs loaded only when needed

### Supported Providers

| Provider | Countries | Currencies |
|----------|-----------|------------|
| Paystack | Nigeria, Ghana, Kenya, South Africa | NGN, GHS, KES, USD, ZAR |
| Flutterwave | 30+ African countries | NGN, GHS, KES, USD, ZAR, XOF, XAF, etc. |
| Monnify | Nigeria | NGN |
| Remita | Nigeria | NGN |

---

## Installation

### npm

```bash
npm install @use-africa-pay/core
```

### yarn

```bash
yarn add @use-africa-pay/core
```

### pnpm

```bash
pnpm add @use-africa-pay/core
```

### Requirements

- React 16.8 or higher (hooks support)
- TypeScript 4.0 or higher (recommended)
- Modern browser with ES6 support

---

## Quick Start

### Basic Payment Integration

```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

const PaymentButton = () => {
  const { initializePayment, loading, error, reset } = useAfricaPay();

  const handlePayment = () => {
    initializePayment({
      provider: 'paystack',
      adapter: PaystackAdapter,
      publicKey: 'YOUR_PUBLIC_KEY',
      amount: 500000, // Amount in kobo (₦5,000)
      currency: 'NGN',
      reference: 'unique_ref_' + Date.now(),
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
        console.error('Payment error:', error.message);
      },
    });
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay ₦5,000'}
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

### Live Sandbox Example

**Illustration**: Show a live interactive payment button component with:
- Payment amount input
- Provider selector dropdown
- Customer email/name inputs
- Pay button with loading state
- Success/error state display
- Console output panel showing response

---

## Core API

### useAfricaPay Hook

The main hook for initializing payments.

#### Returns

```typescript
{
  initializePayment: (props: InitializePaymentProps) => void;
  loading: boolean;
  error: PaymentError | null;
  reset: () => void;
  getProviderInstance: () => any;
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `props` | `InitializePaymentProps` | Yes | Payment configuration object |

#### Example

```tsx
const { initializePayment, loading, error, reset } = useAfricaPay();
```

---

### usePaymentPreflight Hook

Validate payment configuration before showing UI to prevent user frustration.

#### Returns

```typescript
{
  checkPreflight: (config: PreflightConfig) => PreflightCheckResult;
  simulatePayment: (config: PreflightConfig) => Promise<boolean>;
  checking: boolean;
}
```

#### PreflightCheckResult

```typescript
{
  isValid: boolean;
  issues: string[];
  warnings: string[];
  canProceed: boolean;
}
```

#### Example

```tsx
import { usePaymentPreflight } from '@use-africa-pay/core';

const CheckoutForm = () => {
  const { checkPreflight } = usePaymentPreflight();

  const handleValidation = () => {
    const result = checkPreflight({
      amount: 500000,
      currency: 'NGN',
      provider: 'paystack',
      user: { email: 'customer@example.com' }
    });

    if (!result.isValid) {
      console.error('Validation issues:', result.issues);
      return;
    }

    if (result.warnings.length > 0) {
      console.warn('Warnings:', result.warnings);
    }

    // Proceed with payment
  };
};
```

**Illustration**: Show a form with real-time validation feedback as user types.

---

### usePaymentAnalytics Hook

Track payment success rates to optimize provider strategy.

#### Returns

```typescript
{
  recordPayment: (metric: Omit<PaymentMetric, 'timestamp' | 'duration'>) => void;
  startTracking: () => void;
  getProviderStats: (provider?: PaymentProvider) => ProviderStats[];
  getBestProvider: () => PaymentProvider | null;
  clearHistory: () => void;
  getRecentFailures: (count?: number) => PaymentMetric[];
  metrics: PaymentMetric[];
}
```

#### ProviderStats

```typescript
{
  provider: PaymentProvider;
  totalAttempts: number;
  successful: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDuration?: number;
  lastUsed: number;
}
```

#### Example

```tsx
import { usePaymentAnalytics } from '@use-africa-pay/core';

const PaymentDashboard = () => {
  const { recordPayment, startTracking, getProviderStats, getBestProvider } = usePaymentAnalytics({
    maxHistorySize: 100,
    persistToStorage: true
  });

  const handlePayment = async () => {
    startTracking();
    // ... initialize payment
  };

  const handleSuccess = (response) => {
    recordPayment({
      provider: 'paystack',
      status: 'success',
      amount: 500000,
    });
  };

  const stats = getProviderStats();
  const bestProvider = getBestProvider();
};
```

**Illustration**: Show a dashboard with:
- Success rate charts per provider
- Transaction volume over time
- Average payment duration
- Best performing provider indicator

---

### usePaymentRetry Hook

Automatic retry logic with exponential backoff for transient failures.

#### Returns

```typescript
{
  executeWithRetry: <T>(operation: () => Promise<T>, onError?: (error: PaymentError) => void) => Promise<T>;
  manualRetry: <T>(operation: () => Promise<T>) => Promise<T>;
  reset: () => void;
  retryState: RetryState;
}
```

#### RetryState

```typescript
{
  attempt: number;
  isRetrying: boolean;
  canRetry: boolean;
  nextRetryIn?: number;
}
```

#### Example

```tsx
import { usePaymentRetry } from '@use-africa-pay/core';

const PaymentComponent = () => {
  const { executeWithRetry, retryState, reset } = usePaymentRetry({
    maxAttempts: 3,
    exponentialBackoff: true,
    onRetryAttempt: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    }
  });

  const handlePayment = async () => {
    try {
      await executeWithRetry(async () => {
        await initializePayment({ /* config */ });
      });
    } catch (error) {
      console.error('Failed after all retries:', error);
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={retryState.isRetrying}>
        {retryState.isRetrying ? `Retrying (${retryState.attempt})` : 'Pay Now'}
      </button>
      {retryState.nextRetryIn && (
        <span>Retrying in {retryState.nextRetryIn}ms...</span>
      )}
    </div>
  );
};
```

**Illustration**: Show retry animation with countdown timer and attempt counter.

---

## Provider Configuration

### Paystack

#### Required Fields

- `publicKey`: Your Paystack public key
- `user.email`: Customer email address
- `amount`: Amount in kobo (10000 = ₦100)
- `currency`: Currency code (NGN, GHS, KES, USD, ZAR)
- `reference`: Unique transaction reference

#### Optional Fields

- `channels`: Payment channels (card, bank, etc.)
- `user.name`: Customer name
- `user.phonenumber`: Customer phone number
- `metadata`: Additional metadata

#### Example

```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

initializePayment({
  provider: 'paystack',
  adapter: PaystackAdapter,
  publicKey: 'pk_test_xxxx',
  amount: 500000,
  currency: 'NGN',
  reference: 'PAY_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe',
  },
  channels: ['card', 'bank'],
});
```

**Illustration**: Show Paystack payment modal screenshot.

---

### Flutterwave

#### Required Fields

- `publicKey`: Your Flutterwave public key
- `user.email`: Customer email address
- `user.phonenumber` or `user.phone`: Customer phone number
- `amount`: Amount in kobo
- `currency`: Currency code
- `reference`: Unique transaction reference

#### Optional Fields

- `payment_options`: Payment options (card, banktransfer, etc.)
- `user.name`: Customer name
- `metadata`: Additional metadata

#### Example

```tsx
import { useAfricaPay, FlutterwaveAdapter } from '@use-africa-pay/core';

initializePayment({
  provider: 'flutterwave',
  adapter: FlutterwaveAdapter,
  publicKey: 'FLWPUBK_TEST-xxxx',
  amount: 500000,
  currency: 'NGN',
  reference: 'FLW_' + Date.now(),
  user: {
    email: 'customer@example.com',
    phonenumber: '08012345678',
    name: 'John Doe',
  },
  payment_options: 'card, banktransfer',
});
```

**Illustration**: Show Flutterwave payment modal screenshot.

---

### Monnify

#### Required Fields

- `publicKey`: Your Monnify public key
- `contractCode`: Your Monnify contract code
- `user.email`: Customer email address
- `user.name`: Customer name (required)
- `amount`: Amount in kobo
- `currency`: Currency code
- `reference`: Unique transaction reference

#### Optional Fields

- `metadata`: Additional metadata

#### Example

```tsx
import { useAfricaPay, MonnifyAdapter } from '@use-africa-pay/core';

initializePayment({
  provider: 'monnify',
  adapter: MonnifyAdapter,
  publicKey: 'MK_TEST_xxxx',
  contractCode: 'YOUR_CONTRACT_CODE',
  amount: 500000,
  currency: 'NGN',
  reference: 'MON_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe',
  },
});
```

**Illustration**: Show Monnify payment modal screenshot.

---

### Remita

#### Required Fields

- `publicKey`: Your Remita public key
- `merchantId`: Your Remita merchant ID
- `serviceTypeId`: Your Remita service type ID
- `user.email`: Customer email address
- `user.name`: Customer name (required)
- `amount`: Amount in kobo
- `currency`: Currency code
- `reference`: Unique transaction reference

#### Important: Test Mode

Remita requires explicit test mode configuration:
- `testMode: true` for Demo/Sandbox (default)
- `testMode: false` for Live production

#### Name Handling

Remita requires both first and last name. You can provide:
- `name`: Full name (auto-parsed into firstName/lastName)
- `firstName` and `lastName`: Explicit names

Titles like "Mr.", "Dr.", "Chief" are automatically stripped.

#### Example

```tsx
import { useAfricaPay, RemitaAdapter } from '@use-africa-pay/core';

initializePayment({
  provider: 'remita',
  adapter: RemitaAdapter,
  testMode: true, // Set to false for Live
  publicKey: 'YOUR_REMITA_PUBLIC_KEY',
  merchantId: 'YOUR_MERCHANT_ID',
  serviceTypeId: 'YOUR_SERVICE_TYPE_ID',
  amount: 500000,
  currency: 'NGN',
  reference: 'RMT_' + Date.now(),
  user: {
    email: 'customer@example.com',
    name: 'John Doe',
    // Or use: firstName: 'John', lastName: 'Doe'
  },
});
```

**Illustration**: Show Remita payment modal screenshot with test/live toggle.

---

## Advanced Features

### Custom Adapter Implementation

You can create custom adapters for other payment providers.

```typescript
import { AdapterInterface, AdapterConfig } from '@use-africa-pay/core';

const CustomAdapter: AdapterInterface = {
  loadScript: async (options?: { testMode?: boolean }) => {
    // Load provider script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = options?.testMode 
        ? 'https://test.provider.com/sdk.js'
        : 'https://provider.com/sdk.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load script'));
      document.head.appendChild(script);
    });
  },

  initialize: (config: AdapterConfig) => {
    // Initialize payment with provider SDK
    window.ProviderSDK.initialize({
      key: config.publicKey,
      amount: config.amount,
      email: config.user.email,
      onSuccess: config.onSuccess,
      onClose: config.onClose,
      onError: config.onError,
    });
  },

  getInstance: () => {
    return window.ProviderSDK;
  },
};

// Use custom adapter
initializePayment({
  provider: 'custom' as any,
  adapter: CustomAdapter,
  // ... other config
});
```

**Illustration**: Show adapter architecture diagram.

---

### Server-Side Verification

Always verify payments on your backend before granting access.

```typescript
// Example backend verification (Node.js/Express)
app.post('/verify-payment', async (req, res) => {
  const { reference, provider } = req.body;

  try {
    let verified = false;

    if (provider === 'paystack') {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
      );
      verified = response.data.data.status === 'success';
    } else if (provider === 'flutterwave') {
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${reference}/verify`,
        { headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` } }
      );
      verified = response.data.data.status === 'successful';
    }

    if (verified) {
      // Grant access to user
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});
```

**Illustration**: Show payment flow diagram with server verification.

---

### Multi-Provider Strategy

Implement intelligent provider switching based on analytics.

```tsx
const SmartPayment = () => {
  const { getBestProvider, recordPayment, startTracking } = usePaymentAnalytics();
  const { initializePayment } = useAfricaPay();

  const handlePayment = async () => {
    const bestProvider = getBestProvider() || 'paystack';
    
    startTracking();
    
    initializePayment({
      provider: bestProvider,
      adapter: bestProvider === 'paystack' ? PaystackAdapter :
               bestProvider === 'flutterwave' ? FlutterwaveAdapter :
               bestProvider === 'monnify' ? MonnifyAdapter : RemitaAdapter,
      // ... config
      onSuccess: (response) => {
        recordPayment({
          provider: bestProvider,
          status: 'success',
          amount: 500000,
        });
      },
      onError: (error) => {
        recordPayment({
          provider: bestProvider,
          status: 'failed',
          amount: 500000,
          error: error.message,
        });
      },
    });
  };
};
```

**Illustration**: Show provider selection flowchart.

---

## Error Handling

### Error Types

#### PaymentError

Base error class for all payment errors.

```typescript
{
  message: string;
  code: string;
  provider?: PaymentProvider;
  suggestion?: string;
  rawError?: unknown;
}
```

#### ValidationError

Thrown when required fields are missing or invalid.

```typescript
{
  message: string;
  code: 'VALIDATION_ERROR';
  suggestion?: string;
}
```

#### NetworkError

Thrown when script loading fails or network issues occur.

```typescript
{
  message: string;
  code: 'NETWORK_ERROR';
  provider?: PaymentProvider;
  suggestion: 'Check your internet connection and try again.';
}
```

#### ProviderError

Thrown when provider-specific errors occur.

```typescript
{
  message: string;
  code: 'PROVIDER_ERROR';
  provider: PaymentProvider;
  suggestion?: string;
  rawError?: any;
}
```

### Error Handling Example

```tsx
initializePayment({
  // ... config
  onError: (error) => {
    if (error instanceof ValidationError) {
      // Show validation error to user
      alert(`Validation Error: ${error.suggestion}`);
    } else if (error instanceof NetworkError) {
      // Show network error with retry option
      alert(`Network Error: ${error.suggestion}`);
    } else if (error instanceof ProviderError) {
      // Log provider error for debugging
      console.error('Provider Error:', {
        code: error.code,
        provider: error.provider,
        message: error.message,
        raw: error.rawError,
      });
    } else {
      // Handle unknown errors
      alert('An unexpected error occurred');
    }
  },
});
```

### Error Recovery

Use the ErrorRecovery utility for context-aware suggestions.

```tsx
import { ErrorRecovery } from '@use-africa-pay/core';

const handleError = (error: PaymentError) => {
  const suggestion = ErrorRecovery.getSuggestion(error, 'paystack');
  
  console.log(suggestion.title);      // "Connection Issue"
  console.log(suggestion.message);    // Detailed explanation
  console.log(suggestion.actions);    // Suggested actions
  console.log(suggestion.severity);   // "low" | "medium" | "high"

  // Check if error is retryable
  if (ErrorRecovery.isRetryable(error)) {
    // Implement retry logic
  }
};
```

**Illustration**: Show error handling flow diagram with user-friendly messages.

---

## Security Best Practices

### Built-in Security Features

- ✅ **Input Sanitization**: All user inputs automatically sanitized
- ✅ **HTTPS Enforcement**: Scripts loaded over HTTPS only
- ✅ **Error Redaction**: Sensitive data automatically removed from logs
- ✅ **Timeout Protection**: 30-second timeout with retry logic
- ✅ **No Secret Keys**: Only public keys used client-side
- ✅ **PCI-DSS Ready**: Follows payment security best practices

### Recommended Practices

1. **Never expose secret keys**: Only use public keys in client-side code
2. **Always verify on server**: Never trust client-side callbacks alone
3. **Use HTTPS**: Ensure your application is served over HTTPS
4. **Validate references**: Generate unique references and verify them server-side
5. **Sanitize user inputs**: The library does this automatically, but double-check
6. **Implement rate limiting**: Prevent abuse on your payment endpoints
7. **Monitor for fraud**: Track suspicious payment patterns
8. **Keep SDKs updated**: Regularly update to the latest version
9. **Use test keys in development**: Never use live keys in development
10. **Log securely**: Ensure logs don't contain sensitive data

### Server-Side Verification

Always verify payments on your backend:

```typescript
// Verify payment server-side before granting access
app.post('/verify-payment', async (req, res) => {
  const { reference, provider } = req.body;
  
  // Verify with provider API using secret key
  const verification = await verifyWithProvider(reference, provider);
  
  if (verification.success) {
    // Check amount matches expected amount
    if (verification.amount === expectedAmount) {
      // Grant access
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Amount mismatch' });
    }
  } else {
    res.json({ success: false, message: 'Payment not verified' });
  }
});
```

**Illustration**: Show security checklist infographic.

---

## Type Reference

### PaymentProvider

```typescript
type PaymentProvider = "paystack" | "flutterwave" | "monnify" | "remita";
```

### PaymentStatus

```typescript
type PaymentStatus = "pending" | "success" | "failed" | "cancelled";
```

### UserConfig

```typescript
interface UserConfig {
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phonenumber?: string;
  phone?: string;
}
```

### BaseConfig

```typescript
interface BaseConfig {
  amount: number; // In lowest denomination (kobo/cents)
  currency: "NGN" | "USD" | "GHS" | "KES";
  reference: string;
  publicKey: string;
  user: UserConfig;
  metadata?: Record<string, any>;
  onSuccess?: (response: PaymentResponse) => void;
  onClose?: () => void;
  onError?: (error: PaymentError) => void;
  adapter?: AdapterInterface;
  testMode?: boolean;
}
```

### PaystackConfig

```typescript
interface PaystackConfig extends BaseConfig {
  provider: "paystack";
  channels?: string[];
}
```

### FlutterwaveConfig

```typescript
interface FlutterwaveConfig extends BaseConfig {
  provider: "flutterwave";
  payment_options?: string;
}
```

### MonnifyConfig

```typescript
interface MonnifyConfig extends BaseConfig {
  provider: "monnify";
  contractCode: string;
  user: UserConfig & { name: string };
}
```

### RemitaConfig

```typescript
interface RemitaConfig extends BaseConfig {
  provider: "remita";
  merchantId: string;
  serviceTypeId: string;
  user: UserConfig & { name: string };
}
```

### PaymentResponse

```typescript
interface PaymentResponse {
  status: PaymentStatus;
  message: string;
  reference: string;
  transactionId?: string;
  amount: number;
  currency: string;
  paidAt?: string; // ISO 8601 timestamp
  customer: {
    email: string;
    name?: string;
    phone?: string;
  };
  provider: PaymentProvider;
  metadata?: Record<string, any>;
  raw: unknown;
}
```

### InitializePaymentProps

```typescript
type InitializePaymentProps =
  | PaystackConfig
  | FlutterwaveConfig
  | MonnifyConfig
  | RemitaConfig;
```

---

## Examples

### E-commerce Checkout

```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

const CheckoutPage = () => {
  const { initializePayment, loading, error, reset } = useAfricaPay();
  const [cart] = useState([
    { id: 1, name: 'Product 1', price: 15000 },
    { id: 2, name: 'Product 2', price: 35000 },
  ]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const handleCheckout = () => {
    initializePayment({
      provider: 'paystack',
      adapter: PaystackAdapter,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      amount: total * 100, // Convert to kobo
      currency: 'NGN',
      reference: `ORDER_${Date.now()}`,
      user: {
        email: 'customer@example.com',
        name: 'John Doe',
      },
      metadata: {
        cartItems: cart,
        orderId: 'ORDER_' + Date.now(),
      },
      onSuccess: async (response) => {
        // Verify payment on server
        const verified = await fetch('/api/verify-payment', {
          method: 'POST',
          body: JSON.stringify({ reference: response.reference }),
        }).then(r => r.json());

        if (verified.success) {
          // Clear cart and redirect
          window.location.href = '/order-success';
        }
      },
    });
  };

  return (
    <div>
      <h1>Checkout</h1>
      <div>Total: ₦{total.toLocaleString()}</div>
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {error && <ErrorDisplay error={error} onRetry={reset} />}
    </div>
  );
};
```

**Illustration**: Show complete e-commerce checkout flow.

---

### Subscription Payment

```tsx
import { useAfricaPay, FlutterwaveAdapter } from '@use-africa-pay/core';

const SubscriptionPage = () => {
  const { initializePayment } = useAfricaPay();

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    const amount = plan === 'monthly' ? 500000 : 5000000; // ₦5,000 or ₦50,000

    initializePayment({
      provider: 'flutterwave',
      adapter: FlutterwaveAdapter,
      publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_KEY,
      amount,
      currency: 'NGN',
      reference: `SUB_${plan}_${Date.now()}`,
      user: {
        email: 'customer@example.com',
        phonenumber: '08012345678',
      },
      metadata: {
        plan,
        billingCycle: plan,
      },
      onSuccess: (response) => {
        // Activate subscription on server
        fetch('/api/activate-subscription', {
          method: 'POST',
          body: JSON.stringify({ 
            reference: response.reference,
            plan,
          }),
        });
      },
    });
  };

  return (
    <div>
      <h2>Choose a Plan</h2>
      <button onClick={() => handleSubscribe('monthly')}>
        Monthly - ₦5,000
      </button>
      <button onClick={() => handleSubscribe('yearly')}>
        Yearly - ₦50,000 (Save 17%)
      </button>
    </div>
  );
};
```

**Illustration**: Show subscription pricing cards with payment integration.

---

### Donation Form

```tsx
import { useAfricaPay, MonnifyAdapter } from '@use-africa-pay/core';

const DonationForm = () => {
  const { initializePayment, loading } = useAfricaPay();
  const [amount, setAmount] = useState(10000); // Default ₦100

  const handleDonate = () => {
    initializePayment({
      provider: 'monnify',
      adapter: MonnifyAdapter,
      publicKey: process.env.NEXT_PUBLIC_MONNIFY_KEY,
      contractCode: process.env.NEXT_PUBLIC_MONNIFY_CONTRACT_CODE,
      amount: amount * 100,
      currency: 'NGN',
      reference: `DONATE_${Date.now()}`,
      user: {
        email: 'donor@example.com',
        name: 'John Doe',
      },
      metadata: {
        type: 'donation',
        campaign: 'charity-drive',
      },
      onSuccess: (response) => {
        // Show thank you message
        alert('Thank you for your donation!');
      },
    });
  };

  return (
    <div>
      <h2>Make a Donation</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        placeholder="Amount in Naira"
      />
      <button onClick={handleDonate} disabled={loading}>
        Donate ₦{amount.toLocaleString()}
      </button>
    </div>
  );
};
```

**Illustration**: Show donation form with preset amounts and custom input.

---

## Migration Guide

### From Direct Provider SDKs

#### Paystack Direct SDK

**Before:**
```tsx
import PaystackPop from '@paystack/inline-js';

const paystack = new PaystackPop();
paystack.newTransaction({
  key: 'pk_test_xxxx',
  amount: 500000,
  email: 'customer@example.com',
  onSuccess: (response) => console.log(response),
});
```

**After:**
```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

const { initializePayment } = useAfricaPay();

initializePayment({
  provider: 'paystack',
  adapter: PaystackAdapter,
  publicKey: 'pk_test_xxxx',
  amount: 500000,
  currency: 'NGN',
  reference: 'unique_ref',
  user: { email: 'customer@example.com' },
  onSuccess: (response) => console.log(response),
});
```

#### Flutterwave Direct SDK

**Before:**
```tsx
import Flutterwave from 'flutterwave-react-v3';

<Flutterwave
  publicKey="FLWPUBK_TEST-xxxx"
  amount={500000}
  email="customer@example.com"
  callback={(response) => console.log(response)}
/>
```

**After:**
```tsx
import { useAfricaPay, FlutterwaveAdapter } from '@use-africa-pay/core';

const { initializePayment } = useAfricaPay();

initializePayment({
  provider: 'flutterwave',
  adapter: FlutterwaveAdapter,
  publicKey: 'FLWPUBK_TEST-xxxx',
  amount: 500000,
  currency: 'NGN',
  reference: 'unique_ref',
  user: { 
    email: 'customer@example.com',
    phonenumber: '08012345678',
  },
  onSuccess: (response) => console.log(response),
});
```

### Key Changes

1. **Unified API**: All providers use the same `initializePayment` function
2. **Adapter Pattern**: Pass adapter instance for type safety
3. **Standardized Response**: All providers return consistent response structure
4. **Enhanced Error Handling**: Custom error types with suggestions
5. **Amount in Kobo**: Always specify amount in lowest denomination
6. **Required Reference**: Unique transaction reference is now required

---

## FAQ

### General Questions

**Q: Which payment provider should I use?**

A: It depends on your needs:
- **Paystack**: Best for Nigeria, Ghana, Kenya - excellent documentation and reliability
- **Flutterwave**: Supports 30+ African countries - best for pan-African coverage
- **Monnify**: Nigeria-focused with strong bank transfer support
- **Remita**: Nigeria-focused, popular for government and enterprise payments

Use the `usePaymentAnalytics` hook to track which provider performs best for your use case.

---

**Q: Can I use multiple providers simultaneously?**

A: Yes, you can implement provider switching based on analytics or user preference. See the "Multi-Provider Strategy" example above.

---

**Q: Is this library free to use?**

A: Yes, this library is open-source and free to use. However, each payment provider has their own transaction fees which you'll need to pay directly to them.

---

### Technical Questions

**Q: Why is amount required in kobo?**

A: This follows payment industry best practices to avoid floating-point errors. Always multiply your Naira amount by 100 before passing to the library.

---

**Q: How do I handle test vs live mode?**

A: Use the `testMode` parameter:
- `testMode: true` (default) - Uses sandbox/test environment
- `testMode: false` - Uses live production environment

For Remita, this is crucial as it requires explicit configuration.

---

**Q: Can I use this with Next.js?**

A: Yes, this library works with Next.js. Ensure you:
1. Use dynamic imports for the hook in server components
2. Store public keys in environment variables
3. Implement server-side payment verification

---

**Q: How do I get the underlying provider instance?**

A: Use the `getProviderInstance()` method:

```tsx
const { getProviderInstance } = useAfricaPay();
const provider = getProviderInstance();
// Access provider-specific methods
```

---

### Security Questions

**Q: Is it safe to use public keys in client-side code?**

A: Yes, public keys are designed to be used client-side. Never use secret keys in client-side code. Always verify payments on your server using secret keys.

---

**Q: How do I verify payments server-side?**

A: Use your provider's verification API with your secret key. See the "Server-Side Verification" example above.

---

**Q: What security features are built-in?**

A: The library includes:
- Input sanitization
- HTTPS enforcement
- Error redaction
- Timeout protection
- No secret keys in client-side code

---

## Troubleshooting

### Common Issues

#### Script Loading Failed

**Error**: "Failed to load [provider] payment script"

**Solution**:
1. Check your internet connection
2. Verify you're not blocking the provider's CDN
3. Check if the provider's CDN is down
4. Try using a different provider temporarily

---

#### Invalid Public Key

**Error**: "Public key is required" or "Invalid public key"

**Solution**:
1. Verify you're using the correct public key (not secret key)
2. Ensure the key matches the environment (test vs live)
3. Check for typos in the key

---

#### Amount Validation Error

**Error**: "Amount must be greater than 0"

**Solution**:
1. Ensure amount is in kobo (multiply Naira by 100)
2. Check that amount is a number, not a string
3. Verify amount is not 0 or negative

---

#### Phone Number Required

**Error**: "Phone number is required for Flutterwave"

**Solution**:
1. Provide `user.phonenumber` or `user.phone`
2. Ensure phone number is 10-15 digits
3. Include country code if needed (e.g., +234)

---

#### Name Required

**Error**: "Customer name is required for Monnify/Remita"

**Solution**:
1. Provide `user.name` for Monnify and Remita
2. For Remita, you can also provide `firstName` and `lastName`
3. Ensure name is not empty

---

#### Remita Test/Live Mode

**Issue**: Remita payments not working in production

**Solution**:
1. Explicitly set `testMode: false` for live payments
2. Verify you're using live merchant ID and service type ID
3. Check Remita dashboard for account status

---

### Debug Mode

Enable debug logging to troubleshoot issues:

```tsx
// Add this before initializing payment
if (process.env.NODE_ENV === 'development') {
  console.log('[use-africa-pay] Debug mode enabled');
}

initializePayment({
  // ... config
  onError: (error) => {
    console.error('[use-africa-pay] Error details:', {
      code: error.code,
      provider: error.provider,
      message: error.message,
      suggestion: error.suggestion,
      raw: error.rawError,
    });
  },
});
```

---

### Getting Help

If you're still experiencing issues:

1. Check the [GitHub Issues](https://github.com/idyWilliams/use-africa-pay/issues)
2. Review provider-specific documentation
3. Enable debug logging and check console
4. Contact provider support if it's a provider-specific issue

---

## Additional Resources

- [GitHub Repository](https://github.com/idyWilliams/use-africa-pay)
- [NPM Package](https://www.npmjs.com/package/@use-africa-pay/core)
- [Paystack Documentation](https://paystack.com/docs)
- [Flutterwave Documentation](https://developer.flutterwave.com/docs)
- [Monnify Documentation](https://docs.monnify.com)
- [Remita Documentation](https://remita.net)

---

## License

MIT © [Idy Williams](https://idorenyinwilliams.com/)

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

**Note**: This documentation is designed to be converted into an interactive web documentation site with:
- Live code sandboxes for each example
- Interactive API reference
- Visual illustrations and diagrams
- Search functionality
- Dark/light mode toggle
- Responsive design for mobile devices
