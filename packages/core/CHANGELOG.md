# @use-africa-pay/core

## 2.0.0

### Major Changes

- Add usePaymentPreflight, usePaymentAnalytics, usePaymentRetry, and ErrorRecovery utilities

## 1.4.0

### Minor Changes

- Add Vitest testing infrastructure, improve input sanitization, and standardize error boundaries for Monnify and Remita adapters.

## 1.3.2

### Patch Changes

- fix(core): add missing error handling in Monnify, Flutterwave, and Remita adapters. This ensures that the `onError` callback is correctly called when a payment fails, preventing the UI from getting stuck in a loading state.

## 1.3.1

### Patch Changes

- f1b5bf7: fix(core): resolve script loading race condition and improve retry logic. This ensures that failed script loads can be retried and prevents returning a rejected promise for subsequent calls.
- 02f045e: feat: add testMode support, SEO keywords, and fix Remita environments
- 93de93d: feat(remita): add smart name

## 1.3.0

### Minor Changes

- **Improved Type Safety**: Refined types for external provider SDK globals (`RmPaymentEngine`, `MonnifySDK`, `PaystackPop`, `FlutterwaveCheckout`).
- **Safer Error Handling**: Updated `useAfricaPay` to use `unknown` in catch blocks with safer error extraction.

### Breaking Changes ⚠️

- **Stricter Raw Responses**: Changed `raw` and `rawError` types from `any` to `unknown` in `PaymentResponse` and `PaymentError`. Consumers must now cast or use type guards to access provider-specific fields.

## 1.2.1

### Patch Changes

- **Test Mode Support**: Added `testMode` prop to configuration.
- **Remita Environment**: Fixed Remita defaulting to Demo URL. Set `testMode: false` to use Live URL.

## 1.2.0

### Minor Changes

- **Modular Architecture**: Decoupled adapters to allow for tree-shaking. You must now pass the adapter instance to `initializePayment`.
- **Type Safety**: Implemented Discriminated Unions for stricter type checking of provider-specific props.
- **Escape Hatches**: Added `getProviderInstance()` to access the underlying provider SDK.
- **Enhanced Error Handling**: `PaymentError` now includes the `rawError` from the provider.

## 1.1.1

### Patch Changes

- Republish v1.1.0 changes as v1.1.1 due to previous publish issue

## 1.1.0

### Minor Changes

- ## New Features
  - Added Remita payment provider support
  - Enhanced security with input sanitization and error redaction
  - Improved error handling with custom error types (ValidationError, NetworkError, ProviderError)
  - Added script loading retry logic with exponential backoff
  - Added CSP nonce support for Content Security Policy compliance
  - Added HTTPS enforcement for script loading

  ## Improvements
  - Standardized payment response format across all providers
  - Enhanced documentation with security best practices
  - Added comprehensive type definitions
  - Improved amount handling across providers

  ## Bug Fixes
  - Fixed script loading timeout handling
  - Improved error message redaction for sensitive data
