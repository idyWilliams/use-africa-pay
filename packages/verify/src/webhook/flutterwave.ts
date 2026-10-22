export function verifyFlutterwaveWebhook({
  secretHash,
  headers,
}: {
  secretHash: string;
  headers: Record<string, any>;
}) {
  const signature = headers["verif-hash"];
  if (!signature) return false;

  return signature === secretHash;
}
