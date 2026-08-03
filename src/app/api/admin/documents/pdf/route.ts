import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth";
import { buildExportDocumentPdf, type ExportDocumentPayload } from "@/lib/export-document-pdf";

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const payload = await request.json() as ExportDocumentPayload;
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate PDF." }, { status: 500 });
  }
}
