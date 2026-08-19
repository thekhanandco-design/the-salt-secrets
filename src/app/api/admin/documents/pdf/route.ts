import { publicApiError } from "@/lib/api-errors";
import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { buildExportDocumentPdf, type ExportDocumentPayload } from "@/lib/export-document-pdf";
import { distributedRateLimit, readJson } from "@/lib/security/http";

export async function POST(request: Request) {
  try {
    const { identity } = await requireAdminUser(request);
    const limited = await distributedRateLimit(request, { key: `document-pdf:${identity.id}`, limit: 60, windowMs: 10 * 60_000 });
    if (limited) return limited;
    const payload = await readJson(request, 180_000) as ExportDocumentPayload;
    const pdf = buildExportDocumentPdf(payload);
    const filename = `${String(payload.document_number || "draft-document").replace(/[^a-zA-Z0-9_-]/g, "-")}.pdf`;
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    const status = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? 413 : 500;
    return NextResponse.json({ error: status === 413 ? "Request is too large." : publicApiError(error, "Unable to generate PDF.") }, { status });
  }
}
