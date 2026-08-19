import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type Payload = { adminId: string; issuedAt: number; nonce: string };
const TTL_MS = 10 * 60 * 1000;

function secret() {
  const value = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim() || process.env.YOUTUBE_CLIENT_SECRET?.trim();
  if (!value) throw new Error("YouTube OAuth state signing is not configured.");
  return value;
}
function sign(value: string) { return createHmac("sha256", secret()).update(value, "utf8").digest("base64url"); }
export function createYouTubeOAuthState(adminId: string) {
  const payload: Payload = { adminId, issuedAt: Date.now(), nonce: randomBytes(24).toString("base64url") };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}
export function verifyYouTubeOAuthState(value: string | null) {
  if (!value) throw new Error("YouTube authorization state is missing.");
  const [encoded, providedSignature] = value.split(".");
  if (!encoded || !providedSignature) throw new Error("YouTube authorization state is invalid.");
  const expected = Buffer.from(sign(encoded));
  const provided = Buffer.from(providedSignature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) throw new Error("YouTube authorization state validation failed.");
  let payload: Payload;
  try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as Payload; } catch { throw new Error("YouTube authorization state payload is invalid."); }
  if (!payload.adminId || !payload.nonce || !payload.issuedAt || payload.issuedAt > Date.now() + 60_000 || Date.now() - payload.issuedAt > TTL_MS) {
    throw new Error("YouTube authorization state has expired. Please reconnect.");
  }
  return payload;
}
