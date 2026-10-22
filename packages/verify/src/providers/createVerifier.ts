import axios from "axios";
import { VerifyPaymentResult, VerifyStatus } from "../index";

type StatusMap = {
  success: string[];
  pending?: string[];
  failed?: string[];
};

interface CreateVerifierConfig {
  buildUrl: (reference: string) => string;
  buildHeaders: (secretKey: string, token?: string) => Record<string, string>;
  extractData: (response: any) => any;
  statusMap: StatusMap;
  getAmount: (data: any) => number;
  getCurrency: (data: any) => string;
  getToken?: (secretKey: string) => Promise<string>;
}

export function createVerifier(config: CreateVerifierConfig) {
  return async function verify({
    reference,
    secretKey,
  }: {
    reference: string;
    secretKey: string;
  }): Promise<VerifyPaymentResult> {
    try {
      let token: string | undefined;

      if (config.getToken) {
        token = await config.getToken(secretKey);
      }

      const res = await axios.get(config.buildUrl(reference), {
        headers: config.buildHeaders(secretKey, token),
      });

      const tx = config.extractData(res.data);

      const rawStatus = String(
        tx.status || tx.paymentStatus || ""
      ).toLowerCase();

      let status: VerifyStatus = "failed";

      if (
        config.statusMap.success.map((s) => s.toLowerCase()).includes(rawStatus)
      ) {
        status = "success";
      } else if (
        config.statusMap.pending
          ?.map((s) => s.toLowerCase())
          .includes(rawStatus)
      ) {
        status = "pending";
      }

      return {
        success: status === "success",
        status,
        amount: config.getAmount(tx),
        currency: config.getCurrency(tx),
        raw: res.data,
      };
    } catch (error: any) {
      const errData = error.response?.data || error.message;

      return {
        success: false,
        status: "failed", // now TypeScript knows this is a literal
        error: errData?.message || "Verification failed",
        raw: errData,
      };
    }
  };
}
