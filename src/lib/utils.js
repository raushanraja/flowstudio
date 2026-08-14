export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

let _id = 0;
export const uid = (p = "n") =>
  `${p}${++_id}_${Math.random().toString(36).slice(2, 6)}`;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * Convert any CSS color (hex, rgb, rgba, named) to valid 6-character hex #rrggbb
 */
export function colorToHex(color) {
  if (!color || color === "transparent") return "#ffffff";
  if (color.startsWith("#")) {
    if (color.length === 4) {
      return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    return color.slice(0, 7);
  }
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return "#6366f1";
}
