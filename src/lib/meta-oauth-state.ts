import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

type MetaOAuthStatePayload = {
  adminId: string;
  issuedAt: number;
  nonce: string;
};

const STATE_TTL_MS = 15 * 60 * 1000;

function signingSecret() {
  const secret = process.env.META_APP_SECRET?.trim();

  if (!secret) {
    throw new Error("META_APP_SECRET is missing from the server environment.");
  }

  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", signingSecret())
    .update(payload, "utf8")
    .digest("base64url");
}

export function createMetaOAuthState(adminId: string) {
  const payload: MetaOAuthStatePayload = {
    adminId,
    issuedAt: Date.now(),
    nonce: randomBytes(24).toString("base64url"),
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload),
    "utf8",
  ).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyMetaOAuthState(value: string | null) {
  if (!value) {
    throw new Error("Meta authorization state is missing.");
  }

  const [encodedPayload, providedSignature] = value.split(".");

  if (!encodedPayload || !providedSignature) {
    throw new Error("Meta authorization state is invalid.");
  }

  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature, "utf8");
  const provided = Buffer.from(providedSignature, "utf8");

  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("Meta authorization state validation failed.");
  }

  let payload: MetaOAuthStatePayload;

  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as MetaOAuthStatePayload;
  } catch {
    throw new Error("Meta authorization state payload is invalid.");
  }

  if (
    !payload.adminId ||
    !payload.issuedAt ||
    !payload.nonce ||
    Date.now() - payload.issuedAt > STATE_TTL_MS ||
    payload.issuedAt > Date.now() + 60_000
  ) {
    throw new Error("Meta authorization state has expired. Please reconnect.");
  }

  return payload;
}
