import crypto from "crypto";

export interface WebhookVerifyConfig {
  secret: string;
  signature: string;
  payload: string | Buffer;
  algorithm?: "sha256" | "sha512";
}

export function verifyWebhookSignature({
  secret,
  signature,
  payload,
  algorithm = "sha256",
}: WebhookVerifyConfig): boolean {
  const hash = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
