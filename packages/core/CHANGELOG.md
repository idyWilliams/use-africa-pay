# @use-africa-pay/core

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
