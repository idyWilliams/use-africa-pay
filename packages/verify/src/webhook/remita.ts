import { verifyWebhookSignature } from "./verifyWebHook";

export function verifyRemitaWebhook({
  secretKey,
  payload,
  headers,
}: {
  secretKey: string;
  payload: string | Buffer;
  headers: Record<string, any>;
}) {
  const signature = headers["x-remita-signature"];
  if (!signature) return false;

  return verifyWebhookSignature({
    secret: secretKey,
    signature,
    payload,
    algorithm: "sha256",
  });
}
