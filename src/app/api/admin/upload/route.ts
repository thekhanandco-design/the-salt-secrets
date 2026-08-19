import { requireAdminUser } from "@/lib/admin-auth";
import { distributedRateLimit, secureJson } from "@/lib/security/http";
import { buildUploadPath, uploadDestination, validateAdminUpload, type AdminUploadKind } from "@/lib/security/upload";
import { logAdminSecurityEvent } from "@/lib/security/audit";

const KINDS = new Set<AdminUploadKind>([
  "website-image", "product-image", "blog-image", "cms-image", "favicon", "certificate", "document",
]);

export async function POST(request: Request) {
  try {
    const { client, identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `admin-upload:${identity.id}`, limit: 30, windowMs: 10 * 60_000 });
    if (limited) return limited;

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(contentLength) && contentLength > 22 * 1024 * 1024) {
      return secureJson({ error: "Upload is too large." }, { status: 413 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "cms-image") as AdminUploadKind;
    const folder = String(form.get("folder") || "general");
    if (!(file instanceof File) || !KINDS.has(kind)) return secureJson({ error: "A valid file and upload type are required." }, { status: 400 });

    let detected;
    try { detected = await validateAdminUpload(file, kind); }
    catch (reason) {
      const code = reason instanceof Error ? reason.message : "INVALID_FILE";
      const status = code === "FILE_TOO_LARGE" ? 413 : 415;
      return secureJson({ error: status === 413 ? "Upload is too large." : "This file type is not allowed." }, { status });
    }

    const destination = uploadDestination(kind);
    const path = buildUploadPath(kind, folder, detected.extension);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await client.storage.from(destination.bucket).upload(path, bytes, {
      contentType: detected.mime,
      upsert: false,
      cacheControl: destination.isPrivate ? "no-store" : "31536000",
    });
    if (uploadError) return secureJson({ error: "File upload failed." }, { status: 500 });

    let value: string;
    let previewUrl: string | null = null;
    if (destination.isPrivate) {
      value = `supabase://${destination.bucket}/${path}`;
      const signed = await client.storage.from(destination.bucket).createSignedUrl(path, 10 * 60);
      previewUrl = signed.data?.signedUrl || null;
    } else {
      value = client.storage.from(destination.bucket).getPublicUrl(path).data.publicUrl;
      previewUrl = value;
    }

    await logAdminSecurityEvent(client, identity, "file_uploaded", {
      kind,
      bucket: destination.bucket,
      path,
      bytes: file.size,
      mime: detected.mime,
    });

    return secureJson({ success: true, value, previewUrl, bucket: destination.bucket, path, mime: detected.mime, size: file.size });
  } catch (error) {
    if (error instanceof Response) return error;
    return secureJson({ error: "File upload failed." }, { status: 500 });
  }
}
