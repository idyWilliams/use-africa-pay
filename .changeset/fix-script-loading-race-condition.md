---
"@use-africa-pay/core": patch
---

fix(core): resolve script loading race condition and improve retry logic. This ensures that failed script loads can be retried and prevents returning a rejected promise for subsequent calls.
