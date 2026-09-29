import { verifyFlutterwaveWebhook } from "../src/webhook/flutterwave";

const realHash = "flutterwave-secret-hash";
const serverHash = "flutterwave-secret-hash"; // change to test

const isValid = verifyFlutterwaveWebhook({
  secretHash: serverHash,
  headers: {
    "verif-hash": realHash,
  },
});

console.log("Flutterwave webhook valid:", isValid);
