import { verifyWebhookSignature } from "./verifyWebHook";

export function verifyMonnifyWebhook({
  secretKey,
  payload,
  headers,
}: {
  secretKey: string;
  payload: string | Buffer;
  headers: Record<string, any>;
}) {
  const signature = headers["monnify-signature"];
  if (!signature) return false;

  return verifyWebhookSignature({
    secret: secretKey,
    signature,
    payload,
    algorithm: "sha512",
  });
}
