# Security Policy

## Overview

`use-africa-pay` is designed with security as a top priority. This document outlines our security practices, compliance guidelines, and how to report vulnerabilities.

## Security Features

### 🔒 Built-in Security Measures

1. **No Secret Keys Client-Side**
   - Only public keys are used in the browser
   - Secret keys must NEVER be exposed to the client
   - All sensitive operations handled by payment provider servers

2. **Input Sanitization**
   - All user inputs are sanitized before processing
   - Email, name, phone, and metadata are cleaned to prevent XSS attacks
   - Transaction references validated to prevent injection

3. **HTTPS Enforcement**
   - All payment provider scripts loaded over HTTPS only
   - Localhost exemption for development

4. **Error Message Redaction**
   - Sensitive data automatically redacted from error logs
   - API keys, emails, and phone numbers masked in console output

5. **Script Loading Security**
   - 30-second timeout prevents hanging
   - Retry logic with exponential backoff
   - CSP (Content Security Policy) nonce support
   - Duplicate script prevention

## PCI-DSS Compliance

### What This Library Does

✅ **Compliant Practices:**
- Never stores card data
- Never transmits card data through our code
- Uses PCI-DSS compliant payment providers (Paystack, Flutterwave, Monnify, Remita)
- All payment data handled by provider SDKs
- HTTPS-only script loading

### What You Must Do

To maintain PCI-DSS compliance when using this library:

1. **Never Log Sensitive Data**
   ```typescript
   // ❌ DON'T DO THIS
   console.log('Payment config:', config);

   // ✅ DO THIS
   console.log('Payment initiated for reference:', config.reference);
   ```

2. **Use HTTPS in Production**
   - Your application MUST run on HTTPS
   - Never use HTTP in production

3. **Secure Your API Keys**
   - Store public keys in environment variables
   - Never commit keys to version control
   - Rotate keys regularly

4. **Implement Server-Side Verification**
   - Always verify payments on your server
   - Never trust client-side success callbacks alone
   - Use webhook verification

## Security Best Practices

### ✅ DO

1. **Validate on Server**
   ```typescript
   // Client-side
   onSuccess: async (response) => {
     // Send to server for verification
     await fetch('/api/verify-payment', {
       method: 'POST',
       body: JSON.stringify({ reference: response.reference })
     });
   }
   ```

2. **Use Environment Variables**
   ```typescript
   initializePayment({
     publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
     // ...
   });
   ```

3. **Handle Errors Gracefully**
   ```typescript
   onError: (error) => {
     // Show user-friendly message
     setUserMessage('Payment failed. Please try again.');

     // Log for debugging (sensitive data already redacted)
     console.error('Payment error:', error.code);
   }
   ```

4. **Implement Rate Limiting**
   - Limit payment initialization attempts
   - Prevent abuse and DoS attacks

### ❌ DON'T

1. **Never Use Secret Keys**
   ```typescript
   // ❌ NEVER DO THIS
   initializePayment({
     secretKey: 'sk_live_xxx', // WRONG!
   });
   ```

2. **Never Store Card Data**
   - Don't create custom card input forms
   - Always use provider SDKs

3. **Never Skip Server Verification**
   ```typescript
   // ❌ DON'T DO THIS
   onSuccess: (response) => {
     // Trusting client-side success
     grantAccess(); // DANGEROUS!
   }

   // ✅ DO THIS
   onSuccess: async (response) => {
     const verified = await verifyOnServer(response.reference);
     if (verified) grantAccess();
   }
   ```

4. **Never Log Full Responses**
   ```typescript
   // ❌ DON'T DO THIS
   console.log('Full response:', response);

   // ✅ DO THIS
   console.log('Payment successful:', response.reference);
   ```

## Content Security Policy (CSP)

If you use CSP headers, you need to allow payment provider scripts:

```http
Content-Security-Policy:
  script-src 'self'
    https://js.paystack.co
    https://checkout.flutterwave.com
    https://sdk.monnify.com
    https://remitademo.net
    'nonce-{YOUR_NONCE}';
```

### Using CSP Nonce

```typescript
// Get nonce from your server
const nonce = document.querySelector('meta[name="csp-nonce"]')?.content;

// Pass to script loader (future feature)
initializePayment({
  // ... config
  nonce: nonce,
});
```

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email us at:

**widorenyin0@gmail.com**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to resolve the issue.

## Security Checklist

Before going to production, ensure:

- [ ] Using HTTPS in production
- [ ] Public keys stored in environment variables
- [ ] Server-side payment verification implemented
- [ ] Webhook verification configured
- [ ] Error logging doesn't expose sensitive data
- [ ] Rate limiting implemented
- [ ] CSP headers configured (if applicable)
- [ ] Regular security audits scheduled
- [ ] Payment provider webhooks secured with signature verification

## Updates and Patches

We regularly update dependencies and address security issues:

- Security patches released immediately
- Regular dependency audits
- Automated vulnerability scanning

## Compliance Resources

- [PCI-DSS Quick Reference](https://www.pcisecuritystandards.org/pci_security/)
- [Paystack Security](https://paystack.com/security)
- [Flutterwave Security](https://flutterwave.com/security)
- [Monnify Security](https://monnify.com/security)

## License

This security policy is part of the MIT-licensed use-africa-pay project.
