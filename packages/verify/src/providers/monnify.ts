import axios from "axios";
import { createVerifier } from "./createVerifier";

export const verifyMonnify = createVerifier({
  // Step 1: get auth token
  getToken: async (secretKey) => {
    const res = await axios.post(
      "https://api.monnify.com/api/v1/auth/login",
      {},
      {
        headers: {
          Authorization: `Basic ${secretKey}`,
        },
      }
    );

    return res.data.responseBody.accessToken;
  },

  // Step 2: verify transaction
  buildUrl: (reference) =>
    `https://api.monnify.com/api/v2/transactions/${reference}`,

  buildHeaders: (_secretKey, token) => ({
    Authorization: `Bearer ${token}`,
  }),

  extractData: (res) => res.responseBody,

  statusMap: {
    success: ["paid", "successful"],
    pending: ["pending"],
    failed: ["failed", "expired"],
  },

  getAmount: (tx) => Number(tx.amountPaid),
  getCurrency: (tx) => tx.currency,
});
