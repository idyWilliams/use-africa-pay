import { createVerifier } from "./createVerifier";

export const verifyRemita = createVerifier({
  buildUrl: (reference) =>
    `https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/${reference}/status.reg`,

  buildHeaders: (secretKey) => ({
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  }),

  extractData: (res) => res,

  statusMap: {
    success: ["00", "01"], // Remita uses response codes
    pending: ["021"],
    failed: ["02", "03", "04"],
  },

  getAmount: (tx) => Number(tx.amount),
  getCurrency: (tx) => tx.currency || "NGN",
});
