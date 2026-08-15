export type FacilityCertification = {
  key: string;
  name: string;
  short: string;
  image: string;
  description: string;
};

export const FACILITY_CERTIFICATIONS: FacilityCertification[] = [
  {
    key: "iso-22000",
    name: "ISO 22000",
    short: "ISO",
    image: "/cert-iso.png",
    description: "Food safety management system documentation for the manufacturing and packing facility.",
  },
  {
    key: "haccp",
    name: "HACCP",
    short: "HACCP",
    image: "/cert-haccp.png",
    description: "Hazard analysis and critical control point documentation for food-safety controls.",
  },
  {
    key: "gmp",
    name: "GMP",
    short: "GMP",
    image: "/cert-gmp.png",
    description: "Good manufacturing practice documentation supporting controlled production and packing.",
  },
  {
    key: "halal",
    name: "Halal",
    short: "HALAL",
    image: "/cert-halal.png",
    description: "Halal compliance documentation available for buyer review where applicable.",
  },
  {
    key: "fda-registration",
    name: "FDA Registration",
    short: "FDA",
    image: "/cert-fda.png",
    description: "Facility registration and supporting compliance documentation for relevant export programs.",
  },
  {
    key: "food-safety",
    name: "Food Safety",
    short: "FS",
    image: "/cert-food.png",
    description: "Supporting food-safety and quality documentation maintained by the production facility.",
  },
];

function normalized(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function certificationMatches(record: { document_name?: unknown; category?: unknown }, item: FacilityCertification) {
  const haystack = `${normalized(record.category)} ${normalized(record.document_name)}`;
  const itemName = normalized(item.name);
  const itemKey = normalized(item.key);
  const aliases: Record<string, string[]> = {
    "iso-22000": ["iso", "iso 22000"],
    haccp: ["haccp"],
    gmp: ["gmp", "good manufacturing"],
    halal: ["halal"],
    "fda-registration": ["fda", "fda registration"],
    "food-safety": ["food safety"],
  };
  return [itemName, itemKey, ...(aliases[item.key] || [])].some((needle) => needle && haystack.includes(normalized(needle)));
}
