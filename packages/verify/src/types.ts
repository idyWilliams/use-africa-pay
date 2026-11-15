export type VerifyStatus = "success" | "pending" | "failed";

/**
 * Standard result returned by all payment verifiers
 */
export interface VerifyPaymentResult {
  /**
   * True only when payment is confirmed successful
   */
  success: boolean;

  /**
   * Normalized payment status
   */
  status: VerifyStatus;

  /**
   * Amount paid (if available from provider)
   */
  amount?: number;

  /**
   * Currency code e.g. NGN, USD
   */
  currency?: string;

  /**
   * Raw response returned by the provider
   * Useful for debugging or advanced use cases
   */
  raw: any;

  /**
   * Error message if verification fails
   */
  error?: string;
}

/**
 * Input type for all payment verifiers
 */
export interface VerifyPaymentInput {
  provider?: string; // optional if you use provider-specific functions
  reference: string;
  secretKey: string;
}

/**
 * Webhook verification result
 */
export interface VerifyWebhookResult {
  valid: boolean;
  error?: string;
}
