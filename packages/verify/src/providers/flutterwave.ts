import { createVerifier } from "./createVerifier";

export const verifyFlutterwave = createVerifier({
  buildUrl: (reference) =>
    `https://api.flutterwave.com/v3/transactions/${reference}/verify`,

  buildHeaders: (secretKey) => ({
    Authorization: `Bearer ${secretKey}`,
  }),

  extractData: (res) => res.data,

  statusMap: {
    success: ["successful"],
    pending: ["pending"],
  },

  getAmount: (tx) => tx.amount,
  getCurrency: (tx) => tx.currency,
});
