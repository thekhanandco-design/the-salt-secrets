import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function encryptionKey() {
  const secret = process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "INTEGRATION_TOKEN_ENCRYPTION_KEY is missing or too short. Use a secure random value of at least 32 characters.",
    );
  }

  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptIntegrationToken(value: string) {
  if (!value) {
    throw new Error("Cannot encrypt an empty integration token.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptIntegrationToken(payload: string) {
  const [version, ivValue, authTagValue, ciphertextValue] =
    payload.split(":");

  if (
    version !== VERSION ||
    !ivValue ||
    !authTagValue ||
    !ciphertextValue
  ) {
    throw new Error("Invalid encrypted integration token format.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
