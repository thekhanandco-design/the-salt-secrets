import { KHAN_CO_LOGO_HEIGHT, KHAN_CO_LOGO_JPEG_BASE64, KHAN_CO_LOGO_WIDTH } from "@/lib/khan-co-logo-pdf";

export type ExportLineItem = {
  product?: string;
  export_reference?: string;
  specification?: string;
  packaging?: string;
  moq?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  origin?: string;
  hs_code?: string;
  cartons?: number;
  net_weight?: number;
  gross_weight?: number;
  dimensions?: string;
  shipping_marks?: string;
};

export type ExportDocumentPayload = {
  document_type?: string;
  document_number?: string;
  issue_date?: string;
  valid_until?: string;
  currency?: string;
  incoterm?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  payment_terms?: string;
  delivery_terms?: string;
  shipment_method?: string;
  certifications?: string[];
  notes?: string;
  buyer_name?: string;
  buyer_company?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_address?: string;
  shipping_address?: string;
  buyer_country?: string;
  company_name?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_website?: string;
  authorized_by?: string;
  authorized_title?: string;
  bank_details?: string;
  freight?: number;
  discount?: number;
  insurance?: number;
  tax_rate?: number;
  items?: ExportLineItem[];
};

function safeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFor(type = "quotation") {
  return type.replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
}

function money(value: number, currency: string) {
  return `${currency} ${Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function lineWrap(value: string, maxChars: number) {
  const words = safeText(value).split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  return [((number >> 16) & 255) / 255, ((number >> 8) & 255) / 255, (number & 255) / 255];
}

class PdfPage {
  commands: string[] = [];
  y = 790;
  readonly pink = rgb("#d94f72");
  text(text: unknown, x: number, y: number, size = 9, bold = false, color: number[] = [0.12, 0.14, 0.18]) {
    const font = bold ? "F2" : "F1";
    this.commands.push(`${color.join(" ")} rg BT /${font} ${size} Tf ${x} ${y} Td (${safeText(text)}) Tj ET`);
  }
  line(x1: number, y1: number, x2: number, y2: number, color: number[] = [0.88, 0.89, 0.92], width = 0.6) {
    this.commands.push(`${color.join(" ")} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  }
  rect(x: number, y: number, w: number, h: number, fill?: number[], stroke: number[] = [0.88, 0.89, 0.92]) {
    if (fill) this.commands.push(`${fill.join(" ")} rg ${x} ${y} ${w} ${h} re f`);
    this.commands.push(`${stroke.join(" ")} RG 0.5 w ${x} ${y} ${w} ${h} re S`);
  }
}

function buildPage(payload: ExportDocumentPayload, items: ExportLineItem[], pageIndex: number, totalPages: number, hasLogo: boolean) {
  const page = new PdfPage();
  const navy = rgb("#1b2f52");
  const red = rgb("#d43a31");
  const lightGray = rgb("#eef0f2");
  const paleGray = rgb("#f8f8f9");
  const currency = safeText(payload.currency || "USD");
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const freight = Number(payload.freight || 0);
  const insurance = Number(payload.insurance || 0);
  const discount = Number(payload.discount || 0);
  const taxable = Math.max(0, subtotal + freight + insurance - discount);
  const tax = taxable * (Number(payload.tax_rate || 0) / 100);
  const total = taxable + tax;

  if (hasLogo) page.commands.push("q 66 0 0 55 48 756 cm /Im1 Do Q");
  page.text(payload.company_name || "KHAN & CO.", hasLogo ? 120 : 48, 798, 15, true, navy);
  page.text("HIMALAYAN PINK SALT EXPORTER & PRIVATE LABEL PARTNER", hasLogo ? 121 : 49, 784, 5.8, true, [0.34, 0.39, 0.47]);
  page.text(titleFor(payload.document_type), 398, 798, 19, true, navy);
  page.line(48, 746, 547, 746, red, 1.4);

  const contact = [payload.company_address, payload.company_email, payload.company_phone, payload.company_website].filter(Boolean).join("  •  ");
  page.text(contact, 547 - Math.min(420, safeText(contact).length * 2.65), 734, 5.3, false, [0.39, 0.43, 0.5]);

  page.rect(48, 618, 238, 98, lightGray, lightGray);
  page.text("QUOTE TO:", 60, 696, 7.5, true, navy);
  page.text(payload.buyer_company || payload.buyer_name || "", 60, 678, 9, true);
  page.text(payload.buyer_name || "", 60, 664, 7.3, true);
  let buyerY = 650;
  for (const line of lineWrap(payload.buyer_address || "", 46).slice(0, 3)) { page.text(line, 60, buyerY, 6.4); buyerY -= 11; }
  page.text(payload.buyer_country || "", 60, buyerY, 6.4); buyerY -= 11;
  page.text(payload.buyer_email || "", 60, buyerY, 6.1); buyerY -= 10;
  page.text(payload.buyer_phone || "", 60, buyerY, 6.1);

  const meta = [
    ["Document No.", payload.document_number || "DRAFT"], ["Date", payload.issue_date], ["Valid Until", payload.valid_until],
    ["Incoterms", payload.incoterm], ["Payment", payload.payment_terms], ["Currency", currency],
    ["Origin", items.find(item => item.origin)?.origin || "Pakistan"], ["Page", `${pageIndex + 1} / ${totalPages}`],
  ];
  meta.forEach(([label, value], index) => { const y = 700 - index * 13; page.text(label, 326, y, 6.2, true, [0.22, 0.25, 0.31]); page.text(value || "", 414, y, 6.2); });

  const tableTop = 590;
  const cols = [48, 70, 200, 247, 291, 330, 423, 483, 547];
  page.rect(48, tableTop - 24, 499, 24, navy, navy);
  ["#", "Product Description", "MOQ", "Qty", "Unit", "Packaging", "Unit Price", "Total"].forEach((label, index) => page.text(label, cols[index] + 4, tableTop - 16, index === 1 ? 6.2 : 5.6, true, [1, 1, 1]));
  let y = tableTop - 24;
  items.forEach((item, index) => {
    const rowH = 39;
    y -= rowH;
    page.rect(48, y, 499, rowH, index % 2 ? paleGray : lightGray, [0.82, 0.84, 0.87]);
    page.text(index + 1 + pageIndex * 8, cols[0] + 7, y + 23, 6.2);
    const productLines = lineWrap(`${item.product || ""}${item.specification ? ` — ${item.specification}` : ""}`, 37).slice(0, 3);
    productLines.forEach((line, lineIndex) => page.text(line, cols[1] + 5, y + 27 - lineIndex * 9, 5.8, lineIndex === 0));
    page.text(item.moq || "", cols[2] + 4, y + 22, 5.8);
    page.text(Number(item.quantity || 0), cols[3] + 7, y + 22, 5.8);
    page.text(item.unit || "", cols[4] + 7, y + 22, 5.8);
    const packingText = [item.packaging || "", payload.document_type === "packing_list" && item.cartons ? `${item.cartons} pkgs` : "", payload.document_type === "packing_list" && item.net_weight ? `NW ${item.net_weight}kg` : "", payload.document_type === "packing_list" && item.gross_weight ? `GW ${item.gross_weight}kg` : "", payload.document_type === "packing_list" ? item.dimensions || "" : ""].filter(Boolean).join(" / ");
    const packagingLines = lineWrap(packingText, 17).slice(0, 2);
    packagingLines.forEach((line, lineIndex) => page.text(line, cols[5] + 4, y + 25 - lineIndex * 9, 5.4));
    page.text(money(Number(item.unit_price || 0), currency), cols[6] + 4, y + 22, 5.2);
    page.text(money(Number(item.quantity || 0) * Number(item.unit_price || 0), currency), cols[7] + 4, y + 22, 5.2);
  });

  if (pageIndex === totalPages - 1) {
    const sectionTop = Math.max(205, y - 18);
    page.text("Terms & Conditions", 48, sectionTop, 7.5, true, navy);
    const termLines = [
      payload.payment_terms ? `Payment: ${payload.payment_terms}` : "",
      payload.delivery_terms ? `Delivery: ${payload.delivery_terms}` : "",
      payload.shipment_method ? `Shipment: ${payload.shipment_method}` : "",
      payload.certifications?.length ? `Certifications: ${payload.certifications.join(", ")}` : "",
      payload.notes || "",
      payload.bank_details ? `Bank: ${payload.bank_details}` : "",
    ].filter(Boolean).flatMap(value => lineWrap(String(value), 70).slice(0, 3));
    let termY = sectionTop - 15;
    for (const line of termLines.slice(0, 10)) { page.text(`• ${line}`, 52, termY, 5.4); termY -= 10; }

    const totals: Array<[string, number, boolean]> = [
      ["Subtotal", subtotal, false], ["Freight / Logistics", freight, false], ["Insurance", insurance, false],
      ["Discount", -discount, false], ["Tax", tax, false], ["Grand Total", total, true],
    ].filter(([, value, important]) => important || value !== 0) as Array<[string, number, boolean]>;
    const totalsTop = sectionTop + 3;
    totals.forEach(([label, value, important], index) => {
      const rowY = totalsTop - index * 18;
      page.rect(385, rowY - 8, 162, 18, important ? navy : paleGray, important ? navy : [0.84, 0.86, 0.89]);
      page.text(label, 394, rowY - 1, important ? 6.8 : 5.8, true, important ? [1, 1, 1] : [0.25, 0.29, 0.35]);
      page.text(money(value, currency), 470, rowY - 1, important ? 6.8 : 5.8, true, important ? [1, 1, 1] : [0.16, 0.19, 0.25]);
    });

    page.text("For & On Behalf of:", 50, 89, 5.7, false, [0.3, 0.34, 0.41]);
    page.text(payload.company_name || "Khan & Co.", 50, 74, 8, true, navy);
    if (hasLogo) page.commands.push("q 48 0 0 40 50 30 cm /Im1 Do Q");
    page.text(payload.authorized_by || "Authorized Representative", 105, 50, 6.3, true);
    page.text(payload.authorized_title || "Authorized Signature / Stamp", 105, 39, 5.2);
    page.text("We look forward to doing business with you!", 375, 43, 6.2, true, red);
  }

  page.line(48, 22, 547, 22, red, 1.2);
  page.text(payload.company_name || "Khan & Co.", 48, 10, 5.1, true, navy);
  page.text(payload.document_number || "Draft Document", 480, 10, 5.1, false, [0.4, 0.43, 0.49]);
  return page.commands.join("\n");
}

export function buildExportDocumentPdf(payload: ExportDocumentPayload) {
  const allItems = payload.items?.length ? payload.items : [];
  const chunks: ExportLineItem[][] = [];
  if (!allItems.length) chunks.push([]);
  else for (let i = 0; i < allItems.length; i += 8) chunks.push(allItems.slice(i, i + 8));

  const objects: string[] = [];
  const add = (body: string) => { objects.push(body); return objects.length; };
  const catalogId = add("");
  const pagesId = add("");
  const fontRegularId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const fontBoldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  const logoBytes = Buffer.from(KHAN_CO_LOGO_JPEG_BASE64, "base64");
  const logoId = logoBytes.length ? add(`<< /Type /XObject /Subtype /Image /Width ${KHAN_CO_LOGO_WIDTH} /Height ${KHAN_CO_LOGO_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoBytes.length} >>\nstream\n${logoBytes.toString("latin1")}\nendstream`) : 0;
  const pageIds: number[] = [];

  chunks.forEach((items, index) => {
    const content = buildPage(payload, items, index, chunks.length, Boolean(logoId));
    const contentBytes = Buffer.from(content, "latin1");
    const contentId = add(`<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`);
    const xObject = logoId ? ` /XObject << /Im1 ${logoId} 0 R >>` : "";
    const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >>${xObject} >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const header = "%PDF-1.4\n%TSO\n";
  let body = header;
  const offsets = [0];
  objects.forEach((object, index) => { offsets[index + 1] = Buffer.byteLength(body, "latin1"); body += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xrefOffset = Buffer.byteLength(body, "latin1");
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body, "latin1");
}
