import { randomUUID } from "node:crypto";

export type AdminUploadKind =
  | "website-image"
  | "product-image"
  | "blog-image"
  | "cms-image"
  | "favicon"
  | "certificate"
  | "document";

type DetectedType = { mime: string; extension: string };

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

export function detectUploadType(bytes: Uint8Array): DetectedType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", extension: "png" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { mime: "image/jpeg", extension: "jpg" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return { mime: "image/webp", extension: "webp" };
  if (startsWith(bytes, [0x00, 0x00, 0x01, 0x00])) return { mime: "image/x-icon", extension: "ico" };
  if (ascii(bytes, 0, 5) === "%PDF-") return { mime: "application/pdf", extension: "pdf" };
  return null;
}

export function allowedUploadTypes(kind: AdminUploadKind) {
  if (kind === "certificate" || kind === "document") return new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
  if (kind === "favicon") return new Set(["image/png", "image/jpeg", "image/webp", "image/x-icon"]);
  return new Set(["image/png", "image/jpeg", "image/webp"]);
}

export function uploadLimit(kind: AdminUploadKind) {
  return kind === "certificate" || kind === "document" ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES;
}

export function safeUploadFolder(value: unknown) {
  return String(value || "general")
    .split("/")
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, ""))
    .filter(Boolean)
    .slice(0, 6)
    .join("/") || "general";
}

export function uploadDestination(kind: AdminUploadKind) {
  switch (kind) {
    case "website-image": return { bucket: "site-media", prefix: "website", isPrivate: false };
    case "product-image": return { bucket: "product-images", prefix: "products", isPrivate: false };
    case "blog-image": return { bucket: "cms-media", prefix: "blog", isPrivate: false };
    case "favicon": return { bucket: "site-media", prefix: "branding", isPrivate: false };
    case "certificate": return { bucket: "cms-private", prefix: "certifications", isPrivate: true };
    case "document": return { bucket: "cms-private", prefix: "documents", isPrivate: true };
    default: return { bucket: "cms-media", prefix: "cms", isPrivate: false };
  }
}

export function buildUploadPath(kind: AdminUploadKind, folder: unknown, extension: string) {
  const destination = uploadDestination(kind);
  const safeFolder = safeUploadFolder(folder);
  return `${destination.prefix}/${safeFolder}/${Date.now()}-${randomUUID()}.${extension}`;
}

export async function validateAdminUpload(file: File, kind: AdminUploadKind) {
  const limit = uploadLimit(kind);
  if (!file || file.size <= 0) throw new Error("EMPTY_FILE");
  if (file.size > limit) throw new Error("FILE_TOO_LARGE");

  const declared = String(file.type || "").toLowerCase();
  if (declared.includes("svg") || declared.includes("html") || declared.includes("javascript") || declared.includes("xml")) {
    throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const head = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const detected = detectUploadType(head);
  if (!detected || !allowedUploadTypes(kind).has(detected.mime)) throw new Error("UNSUPPORTED_FILE_TYPE");

  // MIME is attacker-controlled, but when supplied it must still agree with the
  // detected binary type. Common JPEG aliases are normalized.
  if (declared) {
    const normalized = declared === "image/jpg" || declared === "image/pjpeg" ? "image/jpeg" : declared;
    const icoAlias = normalized === "image/vnd.microsoft.icon" && detected.mime === "image/x-icon";
    if (!icoAlias && normalized !== detected.mime) throw new Error("MIME_MISMATCH");
  }

  return { ...detected, limit };
}
