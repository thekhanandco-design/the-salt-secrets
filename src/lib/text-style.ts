export type CmsTextStyle = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  letterSpacing?: string;
  lineHeight?: string;
  hidden?: boolean;
  translateX?: string;
  translateY?: string;
  maxWidth?: string;
};

export const SITE_BODY_FONT = "var(--site-font-body)";
export const SITE_HEADING_FONT = "var(--site-font-heading)";

export const defaultCmsTextStyle: CmsTextStyle = {
  fontFamily: "inherit",
  fontSize: "",
  fontWeight: "",
  color: "",
  backgroundColor: "",
  textTransform: "none",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "left",
  letterSpacing: "",
  lineHeight: "",
  hidden: false,
  translateX: "",
  translateY: "",
  maxWidth: "",
};

export function styleToReact(style?: CmsTextStyle): React.CSSProperties {
  if (!style) return {};

  const selectedFont = style.fontFamily?.trim();
  const fontFamily =
    selectedFont && selectedFont !== "inherit" && selectedFont !== "auto"
      ? selectedFont
      : undefined;

  return {
    fontFamily,
    fontSize: style.fontSize || undefined,
    fontWeight: style.fontWeight || undefined,
    color: style.color || undefined,
    backgroundColor: style.backgroundColor || undefined,
    textTransform: style.textTransform || undefined,
    fontStyle: style.fontStyle || undefined,
    textDecoration: style.textDecoration || undefined,
    textAlign: style.textAlign || undefined,
    letterSpacing: style.letterSpacing || undefined,
    lineHeight: style.lineHeight || undefined,
    display: style.hidden ? "none" : undefined,
    position: style.translateX || style.translateY ? "relative" : undefined,
    transform: style.translateX || style.translateY ? `translate(${style.translateX || "0px"}, ${style.translateY || "0px"})` : undefined,
    maxWidth: style.maxWidth || undefined,
  };
}
