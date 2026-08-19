export type CmsDomScope = {
  pageSlug: string;
  sectionSlug: string;
  root: HTMLElement;
};

export function normalizeCmsText(value: string | null | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function stableCmsHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function nthOfType(element: Element) {
  let position = 1;
  let sibling = element.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === element.tagName) position += 1;
    sibling = sibling.previousElementSibling;
  }
  return position;
}

export function cmsElementPath(root: Element, element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== root) {
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${nthOfType(current)})`);
    current = current.parentElement;
  }
  return parts.join(">");
}

/**
 * Optional namespace keeps structurally-identical dynamic variants independent.
 * Example: the six /products?family=... views share the same DOM positions but
 * must never overwrite one another's automatically discovered text fields.
 */
export function cmsTextNodeFieldKey(root: HTMLElement, node: Text, namespace = "") {
  const parent = node.parentElement;
  if (!parent) return "";
  const textSiblings = Array.from(parent.childNodes).filter(
    (child): child is Text => child.nodeType === Node.TEXT_NODE && Boolean(normalizeCmsText(child.nodeValue)),
  );
  const textIndex = Math.max(0, textSiblings.indexOf(node));
  return `live_text_${stableCmsHash(`${namespace}|${cmsElementPath(root, parent)}|text:${textIndex}`)}`;
}

export function cmsImageSlotKey(root: HTMLElement, image: HTMLImageElement) {
  return `live_img_${stableCmsHash(cmsElementPath(root, image))}`;
}

export function normalizeCmsImageUrl(value: string | null | undefined) {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("data:")) return raw;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://www.thesaltorigin.com";
    const parsed = new URL(raw, base);
    if (parsed.pathname === "/_next/image") {
      const original = parsed.searchParams.get("url");
      if (original) return decodeURIComponent(original);
    }
    if (parsed.origin === base) return `${parsed.pathname}${parsed.search}`;
    return parsed.toString();
  } catch {
    return raw.split("#")[0];
  }
}

function globalScopeForElement(element: HTMLElement): CmsDomScope | null {
  const footer = element.closest<HTMLElement>(".tso-public-footer");
  if (footer) return { pageSlug: "global", sectionSlug: "footer", root: footer };

  const header = element.closest<HTMLElement>(".tso-main-header,.tso-mobile-drawer");
  if (header) {
    const brand = element.closest<HTMLElement>(".tso-brand-lockup");
    return { pageSlug: "global", sectionSlug: brand ? "branding" : "navbar", root: header };
  }

  const announcement = element.closest<HTMLElement>(".tso-top-strip");
  if (announcement) return { pageSlug: "global", sectionSlug: "announcement", root: announcement };

  return null;
}

function topLevelMainSections(main: HTMLElement) {
  const all = Array.from(main.querySelectorAll<HTMLElement>("section"));
  return all.filter((section) => {
    const parentSection = section.parentElement?.closest<HTMLElement>("section");
    return !parentSection || !main.contains(parentSection);
  });
}

function automaticSectionScope(element: HTMLElement, pageSlug: string): CmsDomScope | null {
  const main = element.closest<HTMLElement>("main");
  if (!main) return null;

  let section = element.closest<HTMLElement>("section");
  if (section && main.contains(section)) {
    // Promote nested sections to the top-level page section so the structural
    // key remains stable and the Text Manager groups the entire visual section.
    let parentSection = section.parentElement?.closest<HTMLElement>("section") || null;
    while (parentSection && main.contains(parentSection)) {
      section = parentSection;
      parentSection = section.parentElement?.closest<HTMLElement>("section") || null;
    }
    const sections = topLevelMainSections(main);
    const index = Math.max(0, sections.indexOf(section));
    return {
      pageSlug,
      sectionSlug: `auto-${String(index + 1).padStart(2, "0")}`,
      root: section,
    };
  }

  return { pageSlug, sectionSlug: "content", root: main };
}

/**
 * Resolves the live editable scope for any visible text. Explicit
 * data-cms-section wrappers remain authoritative. For older/hard-coded pages
 * with no CMS markers, a deterministic automatic section is generated instead
 * of silently dropping the text from Visual/Text Manager.
 */
export function cmsScopeForElement(element: HTMLElement, pageSlug: string): CmsDomScope | null {
  const global = globalScopeForElement(element);
  if (global) return global;

  const section = element.closest<HTMLElement>("[data-cms-section]");
  if (section) {
    return {
      pageSlug,
      sectionSlug: section.dataset.cmsSection || "content",
      root: section,
    };
  }

  return automaticSectionScope(element, pageSlug);
}

export function cmsVariantNamespace(documentNode: Document, pageSlug: string) {
  const variant = documentNode.querySelector<HTMLElement>("[data-cms-variant]")?.dataset.cmsVariant?.trim() || "";
  return variant ? `${pageSlug}:${variant}` : "";
}

export function cmsRootForSection(documentNode: Document, pageSlug: string, sectionSlug: string) {
  if (pageSlug === "global") {
    if (sectionSlug === "announcement") return documentNode.querySelector<HTMLElement>(".tso-top-strip");
    if (["navbar", "branding"].includes(sectionSlug)) return documentNode.querySelector<HTMLElement>(".tso-main-header");
    if (sectionSlug === "footer") return documentNode.querySelector<HTMLElement>(".tso-public-footer");
    return documentNode.body;
  }

  const explicit = documentNode.querySelector<HTMLElement>(`[data-cms-section="${CSS.escape(sectionSlug)}"]`);
  if (explicit) return explicit;

  if (sectionSlug === "content") return documentNode.querySelector<HTMLElement>("main") || documentNode.body;

  const automaticMatch = /^auto-(\d+)$/.exec(sectionSlug);
  if (automaticMatch) {
    const main = documentNode.querySelector<HTMLElement>("main");
    if (!main) return null;
    const sections = topLevelMainSections(main);
    return sections[Math.max(0, Number(automaticMatch[1]) - 1)] || null;
  }

  return null;
}

export function collectCmsTextNodes(root: ParentNode) {
  const documentNode = root instanceof Document ? root : root.ownerDocument;
  if (!documentNode) return [] as Text[];
  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "SELECT", "OPTION", "SVG"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-cms-runtime-ignore]")) return NodeFilter.FILTER_REJECT;
      const value = normalizeCmsText(node.nodeValue);
      if (!value || !/[\p{L}\p{N}]/u.test(value)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

export function replaceVisibleElementText(element: HTMLElement, replacement: string) {
  const direct = Array.from(element.childNodes).find(
    (node): node is Text => node.nodeType === Node.TEXT_NODE && Boolean(normalizeCmsText(node.nodeValue)),
  );
  if (direct) {
    const before = direct.nodeValue || "";
    const leading = before.match(/^\s*/)?.[0] || "";
    const trailing = before.match(/\s*$/)?.[0] || "";
    direct.nodeValue = `${leading}${replacement}${trailing}`;
    return true;
  }
  if (!element.children.length) {
    element.textContent = replacement;
    return true;
  }
  const nested = collectCmsTextNodes(element).find((node) => !node.parentElement?.closest("svg"));
  if (nested) {
    nested.nodeValue = replacement;
    return true;
  }
  return false;
}

export function parseCmsFullKey(fullKey: string) {
  const firstDot = fullKey.indexOf(".");
  if (firstDot < 1) return null;
  const secondDot = fullKey.indexOf(".", firstDot + 1);
  if (secondDot < 0) return null;
  return {
    pageSlug: fullKey.slice(0, firstDot),
    sectionSlug: fullKey.slice(firstDot + 1, secondDot),
    fieldKey: fullKey.slice(secondDot + 1),
  };
}
