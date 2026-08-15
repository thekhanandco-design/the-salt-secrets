export function stripResearchLinks(value: unknown) {
  return String(value || "")
    .replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]+\)/gi, "$1")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1")
    .replace(/https?:\/\/[^\s)\]}>,]+/gi, "")
    .replace(/www\.[^\s)\]}>,]+/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeGeneratedArticle(value: unknown) {
  return stripResearchLinks(value)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s*#{1,6}\s+/gm, "- ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function semanticText(value: string) {
  return normalizeGeneratedArticle(value)
    .replace(/<\/(?:h2|h3|p|li)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "• ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function words(value: string) {
  return semanticText(value).trim().split(/\s+/).filter(Boolean);
}

function includesKeyword(text: string, keyword: string) {
  return Boolean(keyword.trim()) && text.toLowerCase().includes(keyword.trim().toLowerCase());
}

export function calculateSeoScore(input: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  featuredImage?: string;
}) {
  const content = normalizeGeneratedArticle(input.content);
  const readable = semanticText(content);
  const wordCount = words(readable).length;
  const lines = readable.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const questionCount = lines.filter(line => line.endsWith("?")).length;
  const listCount = lines.filter(line => /^[-*•]|^\d+[.)]\s/.test(line)).length;
  let score = 0;
  if (input.title.length >= 35 && input.title.length <= 75) score += 10;
  else if (input.title.length >= 20) score += 6;
  if (input.seoTitle.length >= 35 && input.seoTitle.length <= 65) score += 10;
  else if (input.seoTitle.length) score += 5;
  if (input.seoDescription.length >= 110 && input.seoDescription.length <= 165) score += 12;
  else if (input.seoDescription.length >= 70) score += 7;
  if (input.slug && input.slug.length <= 85) score += 6;
  if (includesKeyword(input.title, input.primaryKeyword)) score += 10;
  if (includesKeyword(content.slice(0, 650), input.primaryKeyword)) score += 8;
  if (includesKeyword(input.seoDescription, input.primaryKeyword)) score += 7;
  if (wordCount >= 900) score += 14;
  else if (wordCount >= 650) score += 9;
  else if (wordCount >= 400) score += 5;
  if (input.secondaryKeywords.filter(keyword => includesKeyword(content, keyword)).length >= Math.min(3, input.secondaryKeywords.length)) score += 8;
  if (questionCount >= 2) score += 5;
  if (listCount >= 3) score += 4;
  if (input.featuredImage) score += 6;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function calculateGeoScore(input: {
  title: string;
  excerpt: string;
  content: string;
  primaryKeyword: string;
  targetCountry: string;
}) {
  const content = normalizeGeneratedArticle(input.content);
  const readable = semanticText(content);
  const lines = readable.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const wordCount = words(readable).length;
  const questions = lines.filter(line => line.endsWith("?")).length;
  const conciseAnswers = lines.filter(line => {
    const count = words(line).length;
    return count >= 12 && count <= 55;
  }).length;
  const factualSignals = (readable.match(/\b(MOQ|Incoterm|FOB|CIF|COA|MSDS|HACCP|Halal|packaging|lead time|granulation|mesh|origin|export)\b/gi) || []).length;
  const provenanceSignals = (readable.match(/\b(Pakistan|Punjab|Salt Range|Khewra|provenance|traceability|origin|mine)\b/gi) || []).length;
  const structureSignals = lines.filter(line => /^[-*•]|^\d+[.)]\s/.test(line)).length;
  let score = 0;
  if (input.excerpt.length >= 90 && input.excerpt.length <= 260) score += 12;
  if (includesKeyword(`${input.title} ${input.excerpt}`, input.primaryKeyword)) score += 10;
  if (input.targetCountry) score += 6;
  if (questions >= 3) score += 14;
  else if (questions >= 1) score += 8;
  if (conciseAnswers >= 6) score += 16;
  else if (conciseAnswers >= 3) score += 10;
  if (factualSignals >= 8) score += 16;
  else if (factualSignals >= 4) score += 10;
  if (structureSignals >= 4) score += 10;
  if (/\b(importer|distributor|wholesaler|private label|food manufacturer|buyer)\b/i.test(readable)) score += 10;
  if (provenanceSignals >= 3) score += 8;
  else if (provenanceSignals >= 1) score += 4;
  if (wordCount >= 800) score += 8;
  if (/\b(contact|quotation|request a quote|inquiry)\b/i.test(readable)) score += 4;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function normalizeKeywordList(primaryKeyword: unknown, secondary: unknown, title = "") {
  const primary = String(primaryKeyword || "").trim();
  const raw = Array.isArray(secondary)
    ? secondary
    : String(secondary || "").split(/[,\n]/);
  const values = raw.map(String).map(value => value.trim()).filter(Boolean);
  if (primary) values.unshift(primary);
  if (!values.length && title) {
    values.push(...title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").split(/\s+/).filter(word => word.length > 4).slice(0, 6));
  }
  return Array.from(new Set(values.map(value => value.toLowerCase()))).slice(0, 20);
}
