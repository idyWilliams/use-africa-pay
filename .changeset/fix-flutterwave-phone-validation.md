---
'@use-africa-pay/core': patch
---

Fix Flutterwave phone number validation: enforce phone number in `validateConfig()` to throw `ValidationError` when missing, and remove legacy `console.warn` from `FlutterwaveAdapter`.

