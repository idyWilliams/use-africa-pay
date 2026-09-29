import { createVerifier } from "./createVerifier";

export const verifyPaystack = createVerifier({
  buildUrl: (reference) =>
    `https://api.paystack.co/transaction/verify/${reference}`,

  buildHeaders: (secretKey) => ({
    Authorization: `Bearer ${secretKey}`,
  }),

  extractData: (res) => res.data,

  statusMap: {
    success: ["success"],
    failed: ["failed", "abandoned"],
  },

  getAmount: (tx) => tx.amount / 100,
  getCurrency: (tx) => tx.currency,
});
