# Migration Guide

This guide helps you migrate your existing integration to the latest version of `@use-africa-pay/core`.

## Version 2.0.1 - Backward Compatibility Fix

**Good news!** If you're experiencing production breakage after upgrading to v2.0.0, **you don't need to change your code**.

We've added backward compatibility in v2.0.1 that automatically selects the appropriate adapter based on your `provider` setting. Your existing integrations will continue to work without any code changes.

### What was fixed?

In v2.0.0, we introduced a breaking change that required passing an adapter instance explicitly. This broke existing integrations for users who had integrated before v1.2.0.

**v2.0.1 now includes:**
- ✅ Auto-adapter selection based on provider
- ✅ No code changes required for existing users
- ✅ Next.js 16 support

### Your existing code will work as-is:

```tsx
import { useAfricaPay } from '@use-africa-pay/core';

const { initializePayment } = useAfricaPay();

initializePayment({
  provider: 'paystack',
  publicKey: 'YOUR_PUBLIC_KEY',
  amount: 500000,
  currency: 'NGN',
  reference: 'unique_ref_' + Date.now(),
  user: {
    email: 'customer@example.com',
  },
  // Adapter is now auto-selected - no changes needed!
});
```

### Optional: Explicit Adapter (Recommended for New Projects)

While not required, you can still explicitly pass an adapter for better type safety and tree-shaking:

```tsx
import { useAfricaPay, PaystackAdapter } from '@use-africa-pay/core';

const { initializePayment } = useAfricaPay();

initializePayment({
  provider: 'paystack',
  adapter: PaystackAdapter, // Optional but recommended
  publicKey: 'YOUR_PUBLIC_KEY',
  amount: 500000,
  currency: 'NGN',
  reference: 'unique_ref_' + Date.now(),
  user: {
    email: 'customer@example.com',
  },
});
```

**Available Adapters:**
- `PaystackAdapter` - for Paystack payments
- `FlutterwaveAdapter` - for Flutterwave payments
- `MonnifyAdapter` - for Monnify payments
- `RemitaAdapter` - for Remita payments

### Type Safety Changes (v1.3.0+)

**What changed?**
The `raw` and `rawError` properties in `PaymentResponse` and `PaymentError` now have type `unknown` instead of `any`. This improves type safety but requires you to use type guards or type assertions when accessing provider-specific fields.

**Before (v1.2.x and earlier):**
```tsx
onSuccess: (response) => {
  // This worked but was unsafe
  console.log(response.raw.transaction); // No type checking
}
```

**After (v1.3.0+):**
```tsx
onSuccess: (response) => {
  // Option 1: Use type assertion
  const raw = response.raw as any;
  console.log(raw.transaction);

  // Option 2: Use type guard (recommended)
  if (response.raw && typeof response.raw === 'object' && 'transaction' in response.raw) {
    console.log(response.raw.transaction);
  }
}
```

### New Features in v2.0.0

Version 2.0.0 introduces several new utilities that you can optionally use:

- `usePaymentPreflight` - Check payment feasibility before showing UI
- `usePaymentAnalytics` - Track success rates per provider
- `usePaymentRetry` - Automatic retry logic with exponential backoff
- `ErrorRecovery` utilities - Context-aware error recovery suggestions

These are optional and don't require changes to existing integrations.

## Next.js 16 Support

The `@use-africa-pay/next` package now supports Next.js 16. If you're using Next.js 16, simply update your dependencies:

```bash
npm install @use-africa-pay/next@latest
# or
pnpm add @use-africa-pay/next@latest
# or
yarn add @use-africa-pay/next@latest
```

No code changes are required for Next.js 16 compatibility.

## Quick Migration Checklist

- [ ] Update to v2.0.1 (no code changes required!)
- [ ] Test your payment flow in a development environment
- [ ] Deploy to production after successful testing

**Optional improvements:**
- [ ] Import the appropriate adapter for your payment provider
- [ ] Add the `adapter` prop to your `initializePayment` call (for better type safety)
- [ ] Update any code that accesses `raw` or `rawError` to use type guards or assertions

## Need Help?

If you encounter issues during migration:
1. Check the error message - it will include helpful suggestions
2. Review the examples in the main README
3. Open an issue on GitHub with your error details and code snippet
