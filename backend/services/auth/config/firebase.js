import { cert, initializeApp } from "firebase-admin"
import { existsSync, readFileSync } from "node:fs";

// The key is never committed. Load it from (in order):
// 1. FIREBASE_SERVICE_ACCOUNT env var (raw JSON)
// 2. a Render secret file at /etc/secrets/serviceAccountKey.json
// 3. a local serviceAccountKey.json next to this service (dev)
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  const candidates = [
    "/etc/secrets/serviceAccountKey.json",
    new URL("../serviceAccountKey.json", import.meta.url),
  ];
  for (const file of candidates) {
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  }
  throw new Error("Firebase service account not found: set FIREBASE_SERVICE_ACCOUNT or add serviceAccountKey.json");
}

export const app = initializeApp({
  credential: cert(loadServiceAccount())
});
