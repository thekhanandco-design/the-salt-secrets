export type CommercialSheetRow = {
  id: string;
  product_id?: number | null;
  product_name: string;
  export_reference: string;
  pack_size: string;
  packaging: string;
  currency: string;
  cost_price: number | null;
  ex_factory_price: number | null;
  fob_price: number | null;
  private_label_price: number | null;
  moq: string;
  lead_time: string;
  notes: string;
  status: string;
  updated_at?: string;
};

export function emptyCommercialRow(): CommercialSheetRow {
  return { id: crypto.randomUUID(), product_id: null, product_name: "", export_reference: "", pack_size: "", packaging: "", currency: "USD", cost_price: null, ex_factory_price: null, fob_price: null, private_label_price: null, moq: "", lead_time: "", notes: "", status: "active", updated_at: new Date().toISOString() };
}

export function readCommercialRows(content: unknown): CommercialSheetRow[] {
  const value = content && typeof content === "object" && !Array.isArray(content) ? content as Record<string, unknown> : {};
  const rows = Array.isArray(value.rows) ? value.rows : [];
  return rows.map((row, index) => {
    const source = row && typeof row === "object" && !Array.isArray(row) ? row as Record<string, unknown> : {};
    return {
      id: String(source.id || `legacy-${index}`), product_id: source.product_id ? Number(source.product_id) : null,
      product_name: String(source.product_name || ""), export_reference: String(source.export_reference || ""), pack_size: String(source.pack_size || ""), packaging: String(source.packaging || ""), currency: String(source.currency || "USD"),
      cost_price: source.cost_price === null || source.cost_price === "" || source.cost_price === undefined ? null : Number(source.cost_price),
      ex_factory_price: source.ex_factory_price === null || source.ex_factory_price === "" || source.ex_factory_price === undefined ? null : Number(source.ex_factory_price),
      fob_price: source.fob_price === null || source.fob_price === "" || source.fob_price === undefined ? null : Number(source.fob_price),
      private_label_price: source.private_label_price === null || source.private_label_price === "" || source.private_label_price === undefined ? null : Number(source.private_label_price),
      moq: String(source.moq || ""), lead_time: String(source.lead_time || ""), notes: String(source.notes || ""), status: String(source.status || "active"), updated_at: String(source.updated_at || ""),
    };
  });
}
