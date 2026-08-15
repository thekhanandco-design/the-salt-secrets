"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { ExternalLink, Globe2, Link2, Search, Target, TrendingUp } from "lucide-react";

type Opportunity = {
  domain: string;
  topic: string;
  authority: string;
  gap: string;
  action: string;
  url?: string;
};

function normalizeOpportunities(payload: unknown): Opportunity[] {
  if (!payload || typeof payload !== "object") return [];
  const source = payload as Record<string, unknown>;
  const candidates = [source.backlinks, source.opportunities, source.results, source.backlink_opportunities];
  const rows = candidates.find(Array.isArray);
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return [{
      domain: String(row.domain || row.source || row.site || row.publisher || "Opportunity"),
      topic: String(row.topic || row.keyword || row.title || "—"),
      authority: String(row.authority || row.authority_level || row.score || "—"),
      gap: String(row.gap || row.content_gap || row.reason || "—"),
      action: String(row.action || row.recommended_action || row.outreach || "Review opportunity"),
      url: row.url ? String(row.url) : undefined,
    }];
  });
}

export default function BacklinksPage() {
  const [seed, setSeed] = useState("Himalayan pink salt exporter");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Opportunity[]>([]);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/seo/keyword-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, includeCompetitors: true, includeBacklinks: true }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(payload?.error || "Research request failed."));
      setRows(normalizeOpportunities(payload));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Research request failed.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  return <AdminShell><div className="enterprise-page"><header className="enterprise-page-header"><div><p className="enterprise-kicker">OFF-PAGE SEO INTELLIGENCE</p><h1>BACKLINK & COMPETITOR INTELLIGENCE</h1></div></header>{error && <p className="os-alert">{error}</p>}<section className="research-command"><div><Search/><input value={seed} onChange={event => setSeed(event.target.value)}/></div><button onClick={() => void run()} className="cms-gradient-button" disabled={loading || !seed.trim()}>{loading ? "Researching…" : "Run worldwide research"}</button></section><section className="enterprise-stat-grid four"><article><Globe2/><strong>Worldwide</strong><span>MARKET COVERAGE</span></article><article><Target/><strong>Live</strong><span>CONTENT GAP RESEARCH</span></article><article><Link2/><strong>{rows.length}</strong><span>BACKLINK OPPORTUNITIES</span></article><article><TrendingUp/><strong>Tracked</strong><span>KEYWORD MOVEMENT</span></article></section><section className="enterprise-table-card"><table><thead><tr><th>Source</th><th>Ranking topic</th><th>Authority</th><th>Content gap</th><th>Recommended action</th><th/></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.domain}-${index}`}><td><b>{row.domain}</b></td><td>{row.topic}</td><td>{row.authority}</td><td>{row.gap}</td><td>{row.action}</td><td>{row.url ? <a className="icon-action" href={row.url} target="_blank" rel="noreferrer" aria-label={`Open ${row.domain}`}><ExternalLink/></a> : <span>—</span>}</td></tr>)}</tbody></table>{!loading && !rows.length && <div className="os-empty"><div className="os-empty-icon"><Link2/></div><h3>No backlink research loaded</h3><p>Run worldwide research to load current authority and outreach opportunities.</p></div>}</section></div></AdminShell>;
}
