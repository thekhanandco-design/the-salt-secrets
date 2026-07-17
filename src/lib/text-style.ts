export type CmsTextStyle = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  fontStyle?: "normal" | "italic";
  textDecoration?: "none" | "underline";
  textAlign?: "left" | "center" | "right";
  letterSpacing?: string;
  lineHeight?: string;
};

export const defaultCmsTextStyle: CmsTextStyle = {
  fontFamily: "inherit",
  fontSize: "",
  fontWeight: "",
  textTransform: "none",
  fontStyle: "normal",
  textDecoration: "none",
  textAlign: "left",
  letterSpacing: "",
  lineHeight: "",
};

export function styleToReact(style?: CmsTextStyle): React.CSSProperties {
  if (!style) return {};
  return {
    fontFamily: style.fontFamily || undefined,
    fontSize: style.fontSize || undefined,
    fontWeight: style.fontWeight || undefined,
    textTransform: style.textTransform || undefined,
    fontStyle: style.fontStyle || undefined,
    textDecoration: style.textDecoration || undefined,
    textAlign: style.textAlign || undefined,
    letterSpacing: style.letterSpacing || undefined,
    lineHeight: style.lineHeight || undefined,
  };
}
