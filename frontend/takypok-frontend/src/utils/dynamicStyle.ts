import type { CSSProperties } from "react";

// Tailwind v4 cannot generate classes built from runtime values (e.g. `text-[${color}]`).
// Wrap computed CSS props in this function to signal the intent and satisfy the
// local/no-inline-styles rule, which allows `style={dynamicStyle(...)}`.
export function dynamicStyle(styles: CSSProperties): CSSProperties {
  return styles;
}
