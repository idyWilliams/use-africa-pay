# @use-africa-pay/core

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
