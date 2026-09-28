import { colorToHex } from "./utils.js";

export const THEMES = {
  // --- Dark Themes (from temptheme.jsx) ---
  midnight: {
    id: "midnight",
    name: "Midnight Terminal",
    description: "Deep black terminal aesthetics with slate zinc borders and sky blue accent (Default).",
    mode: "dark",
    bg: "#070709",
    grid: "#18181b",
    gridDot: "#27272a",
    panel: "rgba(10, 10, 14, 0.88)",
    panelSolid: "#0a0a0e",
    border: "#27272a",
    borderHard: "#3f3f46",
    text: "#f4f4f5",
    muted: "#a1a1aa",
    accent: "#38bdf8",
    accentLight: "#082f49",
    accentGlow: "rgba(56, 189, 248, 0.25)",
    handle: "#0a0a0e",
    edge: "#71717a",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  nordic: {
    id: "nordic",
    name: "Nordic Slate",
    description: "Cool polar navy slate inspired by arctic night skies with icy cyan & teal glow.",
    mode: "dark",
    bg: "#080d1a",
    grid: "#111c33",
    gridDot: "#1e293b",
    panel: "rgba(15, 23, 42, 0.88)",
    panelSolid: "#0f172a",
    border: "#1e293b",
    borderHard: "#334155",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#06b6d4",
    accentLight: "#083344",
    accentGlow: "rgba(6, 182, 212, 0.25)",
    handle: "#0f172a",
    edge: "#64748b",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  cyber: {
    id: "cyber",
    name: "Cyber Studio",
    description: "Obsidian void canvas with sharp matrix neon emerald and electric cyan accents.",
    mode: "dark",
    bg: "#05070a",
    grid: "#0e1520",
    gridDot: "#1e2638",
    panel: "rgba(13, 17, 24, 0.88)",
    panelSolid: "#0d1118",
    border: "#1e2638",
    borderHard: "#2e3b52",
    text: "#f0fdf4",
    muted: "#9ca3af",
    accent: "#10b981",
    accentLight: "#064e3b",
    accentGlow: "rgba(16, 185, 129, 0.25)",
    handle: "#0d1118",
    edge: "#6b7280",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  tokyo: {
    id: "tokyo",
    name: "Tokyo Night",
    description: "Vibrant indigo twilight with soft purple lavender and electric cyan highlights.",
    mode: "dark",
    bg: "#13141f",
    grid: "#1c1e2e",
    gridDot: "#292e42",
    panel: "rgba(26, 27, 38, 0.88)",
    panelSolid: "#1a1b26",
    border: "#292e42",
    borderHard: "#3b4261",
    text: "#c0caf5",
    muted: "#7aa2f7",
    accent: "#bb9af7",
    accentLight: "#281b4d",
    accentGlow: "rgba(187, 154, 247, 0.25)",
    handle: "#1a1b26",
    edge: "#565f89",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  retro: {
    id: "retro",
    name: "Retro Phosphor",
    description: "Industrial warm CRT charcoal chassis with glowing amber phosphor and copper accents.",
    mode: "dark",
    bg: "#0d0e10",
    grid: "#1a1c22",
    gridDot: "#282a30",
    panel: "rgba(24, 25, 29, 0.88)",
    panelSolid: "#18191d",
    border: "#282a30",
    borderHard: "#3b3e47",
    text: "#fffbeb",
    muted: "#d97706",
    accent: "#f59e0b",
    accentLight: "#451a03",
    accentGlow: "rgba(245, 158, 11, 0.25)",
    handle: "#18191d",
    edge: "#78716c",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  "catppuccin-mocha": {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    description: "Warm, soothing dark pastel palette from the iconic Catppuccin collection.",
    mode: "dark",
    bg: "#11111b",
    grid: "#1e1e2e",
    gridDot: "#313244",
    panel: "rgba(36, 39, 58, 0.88)",
    panelSolid: "#24273a",
    border: "#313244",
    borderHard: "#45475a",
    text: "#cdd6f4",
    muted: "#a6adc8",
    accent: "#cba6f7",
    accentLight: "#312347",
    accentGlow: "rgba(203, 166, 247, 0.25)",
    handle: "#24273a",
    edge: "#6c7086",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  "gruvbox-dark": {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    description: "Retro groove medium-dark contrast with warm earthy tones and bright orange accents.",
    mode: "dark",
    bg: "#1d2021",
    grid: "#282828",
    gridDot: "#3c3836",
    panel: "rgba(50, 48, 47, 0.88)",
    panelSolid: "#32302f",
    border: "#3c3836",
    borderHard: "#504945",
    text: "#ebdbb2",
    muted: "#a89984",
    accent: "#fe8019",
    accentLight: "#482613",
    accentGlow: "rgba(254, 128, 25, 0.25)",
    handle: "#32302f",
    edge: "#7c6f64",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  dracula: {
    id: "dracula",
    name: "Dracula",
    description: "The classic gothic developer theme with purple void and neon pink highlights.",
    mode: "dark",
    bg: "#1e1f29",
    grid: "#282a36",
    gridDot: "#44475a",
    panel: "rgba(52, 55, 70, 0.88)",
    panelSolid: "#343746",
    border: "#44475a",
    borderHard: "#6272a4",
    text: "#f8f8f2",
    muted: "#bd93f9",
    accent: "#ff79c6",
    accentLight: "#442139",
    accentGlow: "rgba(255, 121, 198, 0.25)",
    handle: "#343746",
    edge: "#6272a4",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  "rose-pine": {
    id: "rose-pine",
    name: "Rosé Pine",
    description: "Dreamy Scandinavian twilight with soothing pine wood tones and soft rose accents.",
    mode: "dark",
    bg: "#14121e",
    grid: "#1c192a",
    gridDot: "#26233a",
    panel: "rgba(31, 29, 46, 0.88)",
    panelSolid: "#1f1d2e",
    border: "#26233a",
    borderHard: "#403d52",
    text: "#e0def4",
    muted: "#908caa",
    accent: "#eb6f92",
    accentLight: "#3d1b28",
    accentGlow: "rgba(235, 111, 146, 0.25)",
    handle: "#1f1d2e",
    edge: "#6e6a86",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  "solarized-dark": {
    id: "solarized-dark",
    name: "Solarized Dark",
    description: "Precision-engineered cyan-teal solar palette by Ethan Schoonover.",
    mode: "dark",
    bg: "#00212b",
    grid: "#042c38",
    gridDot: "#0b4352",
    panel: "rgba(7, 54, 66, 0.88)",
    panelSolid: "#073642",
    border: "#0b4352",
    borderHard: "#155768",
    text: "#93a1a1",
    muted: "#839496",
    accent: "#2aa198",
    accentLight: "#053036",
    accentGlow: "rgba(42, 161, 152, 0.25)",
    handle: "#073642",
    edge: "#586e75",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },
  "github-dark": {
    id: "github-dark",
    name: "GitHub Dark",
    description: "High-contrast developer dark theme modeled directly after GitHub dark mode.",
    mode: "dark",
    bg: "#090d13",
    grid: "#141a24",
    gridDot: "#21262d",
    panel: "rgba(22, 27, 34, 0.88)",
    panelSolid: "#161b22",
    border: "#30363d",
    borderHard: "#3d444d",
    text: "#f0f6fc",
    muted: "#8b949e",
    accent: "#58a6ff",
    accentLight: "#0c2d6b",
    accentGlow: "rgba(88, 166, 255, 0.25)",
    handle: "#161b22",
    edge: "#6e7681",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.65), 0 8px 10px -6px rgba(0, 0, 0, 0.4)",
  },

  // --- Light Themes (from temptheme.jsx) ---
  paper: {
    id: "paper",
    name: "Editorial Paper",
    description: "Clean low-glare warm alabaster daylight theme with crisp typography and terracotta warmth.",
    mode: "light",
    bg: "#f0eee6",
    grid: "#e5e1d5",
    gridDot: "#dedad0",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#dedad0",
    borderHard: "#c7c0b0",
    text: "#1c1917",
    muted: "#78716c",
    accent: "#ea580c",
    accentLight: "#ffedd5",
    accentGlow: "rgba(234, 88, 12, 0.22)",
    handle: "#ffffff",
    edge: "#a8a29e",
    shadow: "0 10px 25px -5px rgba(28, 25, 23, 0.08), 0 8px 10px -6px rgba(28, 25, 23, 0.04)",
  },
  "catppuccin-latte": {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    description: "Soft warm daylight cream palette from the Catppuccin collection.",
    mode: "light",
    bg: "#e6e9ef",
    grid: "#dce0e8",
    gridDot: "#ccd0da",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#ccd0da",
    borderHard: "#bcc0cc",
    text: "#4c4f69",
    muted: "#6c6f85",
    accent: "#8839ef",
    accentLight: "#f2e9fc",
    accentGlow: "rgba(136, 57, 239, 0.22)",
    handle: "#ffffff",
    edge: "#9ca0b0",
    shadow: "0 10px 25px -5px rgba(76, 79, 105, 0.08), 0 8px 10px -6px rgba(76, 79, 105, 0.04)",
  },
  "gruvbox-light": {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    description: "Warm parchment groove palette with rich earthen text and burnt orange accents.",
    mode: "light",
    bg: "#f2e5bc",
    grid: "#ebdbb2",
    gridDot: "#d5c4a1",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#d5c4a1",
    borderHard: "#bdae93",
    text: "#3c3836",
    muted: "#665c54",
    accent: "#af3a03",
    accentLight: "#fbe2d3",
    accentGlow: "rgba(175, 58, 3, 0.22)",
    handle: "#ffffff",
    edge: "#928374",
    shadow: "0 10px 25px -5px rgba(60, 56, 54, 0.08), 0 8px 10px -6px rgba(60, 56, 54, 0.04)",
  },
  "dracula-light": {
    id: "dracula-light",
    name: "Dracula Alabaster",
    description: "Gothic pastel alabaster daylight theme with vivid Dracula accents.",
    mode: "light",
    bg: "#e8ebf2",
    grid: "#dfe4ed",
    gridDot: "#d8dee9",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#d8dee9",
    borderHard: "#c2c9d6",
    text: "#2e3440",
    muted: "#4c566a",
    accent: "#b02a8f",
    accentLight: "#f9e5f4",
    accentGlow: "rgba(176, 42, 143, 0.22)",
    handle: "#ffffff",
    edge: "#7b88a1",
    shadow: "0 10px 25px -5px rgba(46, 52, 64, 0.08), 0 8px 10px -6px rgba(46, 52, 64, 0.04)",
  },
  "rose-pine-dawn": {
    id: "rose-pine-dawn",
    name: "Rosé Pine Dawn",
    description: "Delicate sunrise parchment with soft lavender borders and muted rose accents.",
    mode: "light",
    bg: "#f4eee5",
    grid: "#ede6db",
    gridDot: "#cecacd",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#cecacd",
    borderHard: "#b8b2b7",
    text: "#575279",
    muted: "#797593",
    accent: "#b4637a",
    accentLight: "#f8e7ec",
    accentGlow: "rgba(180, 99, 122, 0.22)",
    handle: "#ffffff",
    edge: "#9893a5",
    shadow: "0 10px 25px -5px rgba(87, 82, 121, 0.08), 0 8px 10px -6px rgba(87, 82, 121, 0.04)",
  },
  "solarized-light": {
    id: "solarized-light",
    name: "Solarized Light",
    description: "Legendary solarized warm parchment with crisp solar contrasts.",
    mode: "light",
    bg: "#f5eed8",
    grid: "#eee8d5",
    gridDot: "#d3cbb5",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#d3cbb5",
    borderHard: "#b7ad93",
    text: "#586e75",
    muted: "#657b83",
    accent: "#268bd2",
    accentLight: "#e1f0fa",
    accentGlow: "rgba(38, 139, 210, 0.22)",
    handle: "#ffffff",
    edge: "#839496",
    shadow: "0 10px 25px -5px rgba(88, 110, 117, 0.08), 0 8px 10px -6px rgba(88, 110, 117, 0.04)",
  },
  "github-light": {
    id: "github-light",
    name: "GitHub Light",
    description: "Clean, crisp, clinical daylight theme modeled directly after GitHub light mode.",
    mode: "light",
    bg: "#f0f2f5",
    grid: "#e6eaef",
    gridDot: "#d0d7de",
    panel: "rgba(255, 255, 255, 0.92)",
    panelSolid: "#ffffff",
    border: "#d0d7de",
    borderHard: "#afb8c1",
    text: "#1f2328",
    muted: "#656d76",
    accent: "#0969da",
    accentLight: "#ddf4ff",
    accentGlow: "rgba(9, 105, 218, 0.22)",
    handle: "#ffffff",
    edge: "#8c959f",
    shadow: "0 10px 25px -5px rgba(31, 35, 40, 0.08), 0 8px 10px -6px rgba(31, 35, 40, 0.04)",
  },

  // --- Classic Core Themes ---
  light: {
    id: "light",
    name: "Classic Light",
    description: "Crisp white canvas with bright modern indigo and sleek frosted glass.",
    mode: "light",
    bg: "#f8fafc",
    grid: "#e2e8f0",
    gridDot: "#cbd5e1",
    panel: "rgba(255, 255, 255, 0.88)",
    panelSolid: "#ffffff",
    border: "rgba(226, 232, 240, 0.8)",
    borderHard: "#cbd5e1",
    text: "#0f172a",
    muted: "#64748b",
    accent: "#6366f1",
    accentLight: "#e0e7ff",
    accentGlow: "rgba(99, 102, 241, 0.22)",
    handle: "#ffffff",
    edge: "#94a3b8",
    shadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
  },
  dark: {
    id: "dark",
    name: "Classic Dark",
    description: "Deep obsidian dark workspace with rich indigo accents and subtle borders.",
    mode: "dark",
    bg: "#090d16",
    grid: "#1e293b",
    gridDot: "#334155",
    panel: "rgba(15, 23, 42, 0.88)",
    panelSolid: "#0f172a",
    border: "rgba(255, 255, 255, 0.08)",
    borderHard: "#334155",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#818cf8",
    accentLight: "#1e1b4b",
    accentGlow: "rgba(129, 140, 248, 0.25)",
    handle: "#0f172a",
    edge: "#64748b",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
  },
  clay: {
    id: "clay",
    name: "Clay Studio",
    description: "Earthy artisan warmth with muted terracotta, bone parchment, and warm charcoal.",
    mode: "dark",
    bg: "#141413",
    grid: "#242320",
    gridDot: "#3a382f",
    panel: "rgba(30, 30, 29, 0.88)",
    panelSolid: "#1E1E1D",
    border: "#333333",
    borderHard: "#444444",
    text: "#E3DACC",
    muted: "#9c9484",
    accent: "#E58D70",
    accentLight: "#3a2620",
    accentGlow: "rgba(229, 141, 112, 0.28)",
    handle: "#1E1E1D",
    edge: "#9ca3af",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
  },
};

export const DEFAULT_THEME_ID = "midnight";

export const THEME_ORDER = [
  "midnight",
  "nordic",
  "cyber",
  "tokyo",
  "retro",
  "catppuccin-mocha",
  "gruvbox-dark",
  "dracula",
  "rose-pine",
  "solarized-dark",
  "github-dark",
  "paper",
  "catppuccin-latte",
  "gruvbox-light",
  "dracula-light",
  "rose-pine-dawn",
  "solarized-light",
  "github-light",
  "light",
  "dark",
  "clay",
];

export const THEME_LABELS = Object.fromEntries(
  Object.entries(THEMES).map(([k, v]) => [k, v.name])
);

export const isTheme = (t) => t in THEMES;

export const nextTheme = (t) => {
  const i = THEME_ORDER.indexOf(t);
  const nextIdx = i === -1 ? 0 : (i + 1) % THEME_ORDER.length;
  return THEME_ORDER[nextIdx] ?? DEFAULT_THEME_ID;
};

export const isDarkTheme = (t) => {
  const def = THEMES[t];
  if (def && def.mode) return def.mode === "dark";
  return t !== "light" && t !== "paper" && t !== "catppuccin-latte" && t !== "gruvbox-light" && t !== "dracula-light" && t !== "rose-pine-dawn" && t !== "solarized-light" && t !== "github-light";
};

/* ---------- Color Luminance & Contrast Utilities ---------- */

export function getLuminance(hex) {
  if (!hex || hex === "transparent" || hex === "none") return 0;
  const h = colorToHex(hex);
  const r = parseInt(h.slice(1, 3), 16) / 255;
  const g = parseInt(h.slice(3, 5), 16) / 255;
  const b = parseInt(h.slice(5, 7), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrast(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Returns an accessible, guaranteed readable text color for any node.
 * Evaluates contrast against the node's fill (or against canvas bg if transparent).
 */
export function getEffectiveTextColor(node, themeOrT = "midnight") {
  if (!node) return "#f4f4f5";
  const T =
    typeof themeOrT === "object" && themeOrT?.bg
      ? themeOrT
      : THEMES[themeOrT] || THEMES[DEFAULT_THEME_ID];

  const isTransparent =
    !node.fill ||
    node.fill === "transparent" ||
    node.fill === "none" ||
    node.type === "text" ||
    node.type === "group";

  const bg = isTransparent ? T.bg : node.fill;
  const textCol = node.textColor || (isTransparent ? T.text : node.stroke || T.text);

  // If contrast between textCol and background is insufficient (< 3.0), auto-correct:
  if (!textCol || getContrast(textCol, bg) < 3.0) {
    const bgLum = getLuminance(bg);
    return bgLum < 0.35 ? T.text || "#ffffff" : "#090d13";
  }

  return textCol;
}

/**
 * Returns an accessible text color for edge labels against their background box.
 */
export function getEffectiveEdgeTextColor(edge, bg, themeOrT = "midnight") {
  const T =
    typeof themeOrT === "object" && themeOrT?.bg
      ? themeOrT
      : THEMES[themeOrT] || THEMES[DEFAULT_THEME_ID];
  const effectiveBg = bg || T.panelSolid || T.bg;
  const col = edge?.textColor || edge?.stroke || T.text;
  if (getContrast(col, effectiveBg) < 3.0) {
    return getLuminance(effectiveBg) < 0.35 ? "#f8fafc" : "#090d13";
  }
  return col;
}

/* ---------- GROUP / FRAME STYLES ---------- */
export const GROUP_STYLES = {
  light: { fill: "rgba(130,130,140,.08)", stroke: "#a1a1aa" },
  dark: { fill: "rgba(255,255,255,.04)", stroke: "#52525b" },
  clay: { fill: "rgba(227,218,204,.06)", stroke: "#3a3835" },
};

export function getGroupStyle(themeKey) {
  if (GROUP_STYLES[themeKey]) return GROUP_STYLES[themeKey];
  const T = THEMES[themeKey] || THEMES[DEFAULT_THEME_ID];
  if (isDarkTheme(themeKey)) {
    return { fill: "rgba(255, 255, 255, 0.04)", stroke: T.borderHard || "#52525b" };
  } else {
    return { fill: "rgba(0, 0, 0, 0.04)", stroke: T.borderHard || "#a1a1aa" };
  }
}

/* ---------- THEME PALETTES ---------- */
export const PALETTES = {
  midnight: [
    { stroke: "#38bdf8", fill: "#0c2d48", text: "#e0f2fe" }, // Sky
    { stroke: "#818cf8", fill: "#1e1b4b", text: "#e0e7ff" }, // Indigo
    { stroke: "#34d399", fill: "#064e3b", text: "#d1fae5" }, // Emerald
    { stroke: "#fbbf24", fill: "#451a03", text: "#fef3c7" }, // Amber
    { stroke: "#f87171", fill: "#4c0519", text: "#fee2e2" }, // Rose
    { stroke: "#c084fc", fill: "#3b0764", text: "#f3e8ff" }, // Purple
    { stroke: "#94a3b8", fill: "#18181b", text: "#f4f4f5" }, // Zinc
  ],
  nordic: [
    { stroke: "#06b6d4", fill: "#083344", text: "#cffafe" }, // Cyan
    { stroke: "#38bdf8", fill: "#0c4a6e", text: "#e0f2fe" }, // Sky
    { stroke: "#2dd4bf", fill: "#134e4a", text: "#ccfbf1" }, // Teal
    { stroke: "#fbbf24", fill: "#451a03", text: "#fef3c7" }, // Amber
    { stroke: "#f43f5e", fill: "#4c0519", text: "#ffe4e6" }, // Rose
    { stroke: "#818cf8", fill: "#1e1b4b", text: "#e0e7ff" }, // Indigo
    { stroke: "#94a3b8", fill: "#0f172a", text: "#f8fafc" }, // Slate
  ],
  cyber: [
    { stroke: "#10b981", fill: "#064e3b", text: "#d1fae5" }, // Emerald
    { stroke: "#06b6d4", fill: "#083344", text: "#cffafe" }, // Cyan
    { stroke: "#a3e635", fill: "#1a2e05", text: "#ecfccb" }, // Lime
    { stroke: "#f59e0b", fill: "#451a03", text: "#fef3c7" }, // Amber
    { stroke: "#f43f5e", fill: "#4c0519", text: "#ffe4e6" }, // Rose
    { stroke: "#8b5cf6", fill: "#2e1065", text: "#ede9fe" }, // Violet
    { stroke: "#64748b", fill: "#0d1118", text: "#f0fdf4" }, // Obsidian
  ],
  tokyo: [
    { stroke: "#bb9af7", fill: "#281b4d", text: "#ede9fe" }, // Purple
    { stroke: "#7aa2f7", fill: "#1a2754", text: "#dbeafe" }, // Blue
    { stroke: "#7dcfff", fill: "#163654", text: "#e0f2fe" }, // Cyan
    { stroke: "#9ece6a", fill: "#1d3618", text: "#dcfce7" }, // Green
    { stroke: "#e0af68", fill: "#3d2c14", text: "#fef3c7" }, // Orange
    { stroke: "#f7768e", fill: "#421824", text: "#ffe4e6" }, // Red
    { stroke: "#565f89", fill: "#1a1b26", text: "#c0caf5" }, // Dark
  ],
  retro: [
    { stroke: "#f59e0b", fill: "#451a03", text: "#fef3c7" }, // Amber
    { stroke: "#fb923c", fill: "#431407", text: "#ffedd5" }, // Orange
    { stroke: "#84cc16", fill: "#1a2e05", text: "#ecfccb" }, // Lime
    { stroke: "#ef4444", fill: "#450a0a", text: "#fee2e2" }, // Red
    { stroke: "#06b6d4", fill: "#083344", text: "#cffafe" }, // Cyan
    { stroke: "#d97706", fill: "#2c1b09", text: "#fffbeb" }, // Copper
    { stroke: "#78716c", fill: "#18191d", text: "#f5f5f4" }, // Charcoal
  ],
  "catppuccin-mocha": [
    { stroke: "#cba6f7", fill: "#312347", text: "#f5e0dc" }, // Mauve
    { stroke: "#89b4fa", fill: "#1e2e4a", text: "#b4befe" }, // Blue
    { stroke: "#a6e3a1", fill: "#1e3825", text: "#a6adc8" }, // Green
    { stroke: "#fab387", fill: "#422518", text: "#f9e2af" }, // Peach
    { stroke: "#f38ba8", fill: "#451c27", text: "#eba0ac" }, // Red
    { stroke: "#94e2d5", fill: "#193b3b", text: "#cdd6f4" }, // Teal
    { stroke: "#6c7086", fill: "#24273a", text: "#cdd6f4" }, // Surface
  ],
  "gruvbox-dark": [
    { stroke: "#fe8019", fill: "#482613", text: "#fbf1c7" }, // Orange
    { stroke: "#83a598", fill: "#1e2f38", text: "#ebdbb2" }, // Blue
    { stroke: "#b8bb26", fill: "#2d3814", text: "#ebdbb2" }, // Green
    { stroke: "#fabd2f", fill: "#403610", text: "#fbf1c7" }, // Yellow
    { stroke: "#fb4934", fill: "#481b17", text: "#fbf1c7" }, // Red
    { stroke: "#d3869b", fill: "#3b202c", text: "#ebdbb2" }, // Purple
    { stroke: "#a89984", fill: "#32302f", text: "#ebdbb2" }, // Gray
  ],
  dracula: [
    { stroke: "#ff79c6", fill: "#442139", text: "#f8f8f2" }, // Pink
    { stroke: "#bd93f9", fill: "#352554", text: "#f8f8f2" }, // Purple
    { stroke: "#8be9fd", fill: "#193d47", text: "#f8f8f2" }, // Cyan
    { stroke: "#50fa7b", fill: "#143d22", text: "#f8f8f2" }, // Green
    { stroke: "#f1fa8c", fill: "#3d3e1f", text: "#f8f8f2" }, // Yellow
    { stroke: "#ffb86c", fill: "#452c16", text: "#f8f8f2" }, // Orange
    { stroke: "#6272a4", fill: "#343746", text: "#f8f8f2" }, // Comment
  ],
  "rose-pine": [
    { stroke: "#eb6f92", fill: "#3d1b28", text: "#e0def4" }, // Love
    { stroke: "#9ccfd8", fill: "#1e333b", text: "#e0def4" }, // Foam
    { stroke: "#31748f", fill: "#162633", text: "#e0def4" }, // Pine
    { stroke: "#f6c177", fill: "#423018", text: "#e0def4" }, // Gold
    { stroke: "#ebbcba", fill: "#3d292d", text: "#e0def4" }, // Rose
    { stroke: "#c4a7e7", fill: "#302447", text: "#e0def4" }, // Iris
    { stroke: "#6e6a86", fill: "#1f1d2e", text: "#e0def4" }, // Muted
  ],
  "solarized-dark": [
    { stroke: "#2aa198", fill: "#073642", text: "#93a1a1" }, // Cyan
    { stroke: "#268bd2", fill: "#0b344d", text: "#93a1a1" }, // Blue
    { stroke: "#859900", fill: "#20360a", text: "#93a1a1" }, // Green
    { stroke: "#b58900", fill: "#382c06", text: "#93a1a1" }, // Yellow
    { stroke: "#dc322f", fill: "#401817", text: "#93a1a1" }, // Red
    { stroke: "#6c71c4", fill: "#23254a", text: "#93a1a1" }, // Violet
    { stroke: "#586e75", fill: "#002b36", text: "#93a1a1" }, // Base
  ],
  "github-dark": [
    { stroke: "#58a6ff", fill: "#0c2d6b", text: "#cae8ff" }, // Blue
    { stroke: "#3fb950", fill: "#11381b", text: "#aff5b4" }, // Green
    { stroke: "#d29922", fill: "#3d2a06", text: "#f8e3a1" }, // Yellow
    { stroke: "#f85149", fill: "#4e1716", text: "#ffdcd7" }, // Red
    { stroke: "#bc8cff", fill: "#361f5e", text: "#eddeff" }, // Purple
    { stroke: "#39c5cf", fill: "#0b3438", text: "#b3f0ff" }, // Cyan
    { stroke: "#6e7681", fill: "#161b22", text: "#f0f6fc" }, // Gray
  ],

  // Light Palettes
  paper: [
    { stroke: "#ea580c", fill: "#ffedd5", text: "#9a3412" }, // Terracotta
    { stroke: "#0284c7", fill: "#e0f2fe", text: "#075985" }, // Sky
    { stroke: "#16a34a", fill: "#dcfce7", text: "#166534" }, // Green
    { stroke: "#d97706", fill: "#fef3c7", text: "#92400e" }, // Amber
    { stroke: "#dc2626", fill: "#fee2e2", text: "#991b1b" }, // Red
    { stroke: "#7c3aed", fill: "#ede9fe", text: "#5b21b6" }, // Violet
    { stroke: "#78716c", fill: "#f5f5f4", text: "#292524" }, // Stone
  ],
  "catppuccin-latte": [
    { stroke: "#8839ef", fill: "#f2e9fc", text: "#4c4f69" }, // Mauve
    { stroke: "#1e66f5", fill: "#e6edfd", text: "#4c4f69" }, // Blue
    { stroke: "#40a02b", fill: "#e8f5e6", text: "#4c4f69" }, // Green
    { stroke: "#fe640b", fill: "#feefe6", text: "#4c4f69" }, // Peach
    { stroke: "#d20f39", fill: "#fae7eb", text: "#4c4f69" }, // Red
    { stroke: "#179299", fill: "#e3f4f5", text: "#4c4f69" }, // Teal
    { stroke: "#7c7f93", fill: "#eff1f5", text: "#4c4f69" }, // Surface
  ],
  "gruvbox-light": [
    { stroke: "#af3a03", fill: "#fbe2d3", text: "#3c3836" }, // Orange
    { stroke: "#076678", fill: "#dbeaf0", text: "#3c3836" }, // Blue
    { stroke: "#79740e", fill: "#edf2d8", text: "#3c3836" }, // Green
    { stroke: "#b57614", fill: "#faedd7", text: "#3c3836" }, // Yellow
    { stroke: "#9d0006", fill: "#fae1e2", text: "#3c3836" }, // Red
    { stroke: "#8f3f71", fill: "#fae6f2", text: "#3c3836" }, // Purple
    { stroke: "#7c6f64", fill: "#ebdbb2", text: "#3c3836" }, // Gray
  ],
  "dracula-light": [
    { stroke: "#b02a8f", fill: "#f9e5f4", text: "#2e3440" }, // Pink
    { stroke: "#6c47b5", fill: "#eee8f9", text: "#2e3440" }, // Purple
    { stroke: "#128299", fill: "#e2f4f8", text: "#2e3440" }, // Cyan
    { stroke: "#1b8a3b", fill: "#e3f6e9", text: "#2e3440" }, // Green
    { stroke: "#ba6b13", fill: "#fdf1e4", text: "#2e3440" }, // Orange
    { stroke: "#c22938", fill: "#fce8eb", text: "#2e3440" }, // Red
    { stroke: "#4c566a", fill: "#f4f6fa", text: "#2e3440" }, // Comment
  ],
  "rose-pine-dawn": [
    { stroke: "#b4637a", fill: "#f8e7ec", text: "#575279" }, // Love
    { stroke: "#56949f", fill: "#e7f2f4", text: "#575279" }, // Foam
    { stroke: "#286983", fill: "#e0edf2", text: "#575279" }, // Pine
    { stroke: "#ea9d34", fill: "#fdf3e5", text: "#575279" }, // Gold
    { stroke: "#d7827e", fill: "#faeeed", text: "#575279" }, // Rose
    { stroke: "#907aa9", fill: "#f1edfa", text: "#575279" }, // Iris
    { stroke: "#797593", fill: "#faf4ed", text: "#575279" }, // Muted
  ],
  "solarized-light": [
    { stroke: "#268bd2", fill: "#e1f0fa", text: "#586e75" }, // Blue
    { stroke: "#2aa198", fill: "#e2f4f3", text: "#586e75" }, // Cyan
    { stroke: "#859900", fill: "#edf2d8", text: "#586e75" }, // Green
    { stroke: "#b58900", fill: "#faf0d8", text: "#586e75" }, // Yellow
    { stroke: "#dc322f", fill: "#fae5e5", text: "#586e75" }, // Red
    { stroke: "#6c71c4", fill: "#eceef8", text: "#586e75" }, // Violet
    { stroke: "#657b83", fill: "#eee8d5", text: "#586e75" }, // Base
  ],
  "github-light": [
    { stroke: "#0969da", fill: "#ddf4ff", text: "#0550ae" }, // Blue
    { stroke: "#1a7f37", fill: "#dafbe1", text: "#116329" }, // Green
    { stroke: "#9a6700", fill: "#fff8c5", text: "#7d4e00" }, // Yellow
    { stroke: "#cf222e", fill: "#ffebe9", text: "#a40e26" }, // Red
    { stroke: "#8250df", fill: "#fbefff", text: "#6639ba" }, // Purple
    { stroke: "#057a85", fill: "#dff7f9", text: "#035961" }, // Cyan
    { stroke: "#57606a", fill: "#f6f8fa", text: "#24292f" }, // Gray
  ],

  // Classic
  light: [
    { stroke: "#4f46e5", fill: "#e0e7ff", text: "#3730a3" }, // Indigo
    { stroke: "#0284c7", fill: "#e0f2fe", text: "#075985" }, // Sky
    { stroke: "#059669", fill: "#d1fae5", text: "#065f46" }, // Emerald
    { stroke: "#d97706", fill: "#fef3c7", text: "#92400e" }, // Amber
    { stroke: "#dc2626", fill: "#fee2e2", text: "#991b1b" }, // Rose
    { stroke: "#9333ea", fill: "#f3e8ff", text: "#6b21a8" }, // Purple
    { stroke: "#475569", fill: "#f1f5f9", text: "#1e293b" }, // Slate
  ],
  dark: [
    { stroke: "#818cf8", fill: "#1e1b4b", text: "#e0e7ff" }, // Indigo
    { stroke: "#38bdf8", fill: "#0c4a6e", text: "#e0f2fe" }, // Sky
    { stroke: "#34d399", fill: "#064e3b", text: "#d1fae5" }, // Emerald
    { stroke: "#fbbf24", fill: "#451a03", text: "#fef3c7" }, // Amber
    { stroke: "#f87171", fill: "#4c0519", text: "#fee2e2" }, // Rose
    { stroke: "#c084fc", fill: "#3b0764", text: "#f3e8ff" }, // Purple
    { stroke: "#94a3b8", fill: "#1e293b", text: "#f8fafc" }, // Slate
  ],
  clay: [
    { stroke: "#E58D70", fill: "#2e211b", text: "#f5d9ce" }, // Terracotta
    { stroke: "#8BA86D", fill: "#23291c", text: "#dce8ce" }, // Olive
    { stroke: "#FBBF24", fill: "#2e2513", text: "#fbe7b8" }, // Amber
    { stroke: "#F87171", fill: "#2e1a1a", text: "#fbd5d5" }, // Red
    { stroke: "#85AEDB", fill: "#1d2733", text: "#d6e4f5" }, // Blue
    { stroke: "#A99F8E", fill: "#26241f", text: "#E3DACC" }, // Bone
    { stroke: "#B786D1", fill: "#291e30", text: "#edd8f7" }, // Violet
  ],
};

export function getPaletteForTheme(themeKey) {
  if (PALETTES[themeKey]) return PALETTES[themeKey];
  const T = THEMES[themeKey] || THEMES[DEFAULT_THEME_ID];
  if (isDarkTheme(themeKey)) {
    return [
      { stroke: T.accent, fill: T.accentLight || "#1e1b4b", text: T.text },
      { stroke: "#38bdf8", fill: "#0c4a6e", text: "#e0f2fe" },
      { stroke: "#34d399", fill: "#064e3b", text: "#d1fae5" },
      { stroke: "#fbbf24", fill: "#451a03", text: "#fef3c7" },
      { stroke: "#f87171", fill: "#4c0519", text: "#fee2e2" },
      { stroke: "#c084fc", fill: "#3b0764", text: "#f3e8ff" },
      { stroke: T.borderHard || "#64748b", fill: T.panelSolid || "#1e293b", text: T.text },
    ];
  } else {
    return [
      { stroke: T.accent, fill: T.accentLight || "#e0e7ff", text: "#1e1b4b" },
      { stroke: "#0284c7", fill: "#e0f2fe", text: "#075985" },
      { stroke: "#059669", fill: "#d1fae5", text: "#065f46" },
      { stroke: "#d97706", fill: "#fef3c7", text: "#92400e" },
      { stroke: "#dc2626", fill: "#fee2e2", text: "#991b1b" },
      { stroke: "#9333ea", fill: "#f3e8ff", text: "#6b21a8" },
      { stroke: "#475569", fill: "#f1f5f9", text: "#1e293b" },
    ];
  }
}

/**
 * Harmonize nodes to match the target theme's palette
 */
export function rethemeDiagram(nodes, targetTheme = "midnight") {
  const pal = getPaletteForTheme(targetTheme);
  const gStyle = getGroupStyle(targetTheme);
  const T = THEMES[targetTheme] || THEMES[DEFAULT_THEME_ID];

  let regularIdx = 0;
  return nodes.map((n) => {
    if (n.type === "group") {
      return {
        ...n,
        fill: gStyle.fill,
        stroke: gStyle.stroke,
        textColor: T.text,
      };
    }
    if (n.type === "text") {
      return {
        ...n,
        fill: "transparent",
        stroke: "transparent",
        textColor: T.text,
      };
    }

    // Try finding matched semantic color from previous palettes to preserve color identity
    let palIdx = regularIdx;
    for (const pList of Object.values(PALETTES)) {
      const idx = pList.findIndex((c) => c.stroke === n.stroke || c.fill === n.fill);
      if (idx !== -1) {
        palIdx = idx;
        break;
      }
    }
    regularIdx++;

    const c = pal[palIdx % pal.length];
    return {
      ...n,
      fill: c.fill,
      stroke: c.stroke,
      textColor: c.text || getEffectiveTextColor({ ...n, fill: c.fill }, targetTheme),
    };
  });
}

/**
 * Harmonize edges to match the target theme
 */
export function rethemeEdges(edges, targetTheme = "midnight") {
  const T = THEMES[targetTheme] || THEMES[DEFAULT_THEME_ID];
  const allThemeEdgeColors = Object.values(THEMES).flatMap((thm) => [thm.edge, thm.border]);

  return edges.map((e) => {
    const isDefaultEdgeStroke = !e.stroke || allThemeEdgeColors.includes(e.stroke);
    const stroke = isDefaultEdgeStroke ? T.edge : e.stroke;
    return {
      ...e,
      stroke,
      textColor: e.textColor
        ? getEffectiveEdgeTextColor(e, e.labelBg || T.panelSolid, targetTheme)
        : undefined,
    };
  });
}

/* ---------- Color Presets for Inspector ---------- */
export const COLOR_PRESETS = [
  {
    label: "Indigo",
    stroke: "#6366f1",
    fillLight: "#e0e7ff",
    fillDark: "#1e1b4b",
    fillClay: "#262240",
    textLight: "#3730a3",
    textDark: "#e0e7ff",
    textClay: "#ded9f7",
  },
  {
    label: "Sky",
    stroke: "#0284c7",
    fillLight: "#e0f2fe",
    fillDark: "#0c4a6e",
    fillClay: "#17293a",
    textLight: "#075985",
    textDark: "#e0f2fe",
    textClay: "#cfe8fb",
  },
  {
    label: "Emerald",
    stroke: "#10b981",
    fillLight: "#d1fae5",
    fillDark: "#064e3b",
    fillClay: "#16302a",
    textLight: "#065f46",
    textDark: "#d1fae5",
    textClay: "#ccf5e1",
  },
  {
    label: "Amber",
    stroke: "#f59e0b",
    fillLight: "#fef3c7",
    fillDark: "#451a03",
    fillClay: "#33281a",
    textLight: "#92400e",
    textDark: "#fef3c7",
    textClay: "#fae7be",
  },
  {
    label: "Rose",
    stroke: "#f43f5e",
    fillLight: "#fee2e2",
    fillDark: "#4c0519",
    fillClay: "#361f22",
    textLight: "#991b1b",
    textDark: "#fee2e2",
    textClay: "#fcd1d7",
  },
  {
    label: "Purple",
    stroke: "#a855f7",
    fillLight: "#f3e8ff",
    fillDark: "#3b0764",
    fillClay: "#2c2138",
    textLight: "#6b21a8",
    textDark: "#f3e8ff",
    textClay: "#eed7fc",
  },
  {
    label: "Slate",
    stroke: "#64748b",
    fillLight: "#f1f5f9",
    fillDark: "#1e293b",
    fillClay: "#24262b",
    textLight: "#1e293b",
    textDark: "#f8fafc",
    textClay: "#e2e8f0",
  },
];

export const CLAY_COLOR_PRESETS = [
  {
    label: "Terracotta",
    stroke: "#E58D70",
    fillLight: "#fdeee8",
    fillDark: "#3b1e16",
    fillClay: "#2e211b",
    textLight: "#8c381c",
    textDark: "#fbd3c6",
    textClay: "#f5d9ce",
  },
  {
    label: "Olive",
    stroke: "#8BA86D",
    fillLight: "#f0f6ea",
    fillDark: "#1e2e18",
    fillClay: "#23291c",
    textLight: "#3d5427",
    textDark: "#d6ebd0",
    textClay: "#dce8ce",
  },
  {
    label: "Amber",
    stroke: "#FBBF24",
    fillLight: "#fef9e8",
    fillDark: "#362804",
    fillClay: "#2e2513",
    textLight: "#875f05",
    textDark: "#fee8a4",
    textClay: "#fbe7b8",
  },
  {
    label: "Red",
    stroke: "#F87171",
    fillLight: "#feeeee",
    fillDark: "#3b1313",
    fillClay: "#2e1a1a",
    textLight: "#9b1c1c",
    textDark: "#fcd1d1",
    textClay: "#fbd5d5",
  },
  {
    label: "Blue",
    stroke: "#85AEDB",
    fillLight: "#edf4fc",
    fillDark: "#152438",
    fillClay: "#1d2733",
    textLight: "#264f7a",
    textDark: "#cee0f5",
    textClay: "#d6e4f5",
  },
  {
    label: "Bone",
    stroke: "#A99F8E",
    fillLight: "#f6f4f1",
    fillDark: "#26241f",
    fillClay: "#26241f",
    textLight: "#4e483e",
    textDark: "#E3DACC",
    textClay: "#E3DACC",
  },
];

export const presetStroke = (p, theme) => {
  if (!p) return "#6366f1";
  if (theme === "clay" && p.strokeClay) return p.strokeClay;
  if (!isDarkTheme(theme) && p.strokeLight) return p.strokeLight;
  if (isDarkTheme(theme) && p.strokeDark) return p.strokeDark;
  return p.stroke;
};

export const presetFill = (p, theme) => {
  if (!p) return "transparent";
  if (theme === "clay") return p.fillClay || p.fill || "#2e211b";
  if (!isDarkTheme(theme)) return p.fillLight || p.fill || "#e0e7ff";
  return p.fillDark || p.fill || "#1e1b4b";
};

export const presetText = (p, theme) => {
  if (!p) return "#ffffff";
  if (theme === "clay") return p.textClay || p.text || "#E3DACC";
  if (!isDarkTheme(theme)) return p.textLight || p.text || p.stroke;
  return p.textDark || p.text || "#ffffff";
};

export const presetsForTheme = (theme) =>
  theme === "clay" ? CLAY_COLOR_PRESETS : COLOR_PRESETS;

/* ---------- SHAPE_DEFS ---------- */
export const SHAPE_DEFS = [
  { type: "rect", label: "Rectangle", key: "R" },
  { type: "rounded", label: "Rounded", key: "U" },
  { type: "pill", label: "Pill", key: "P" },
  { type: "diamond", label: "Diamond", key: "D" },
  { type: "ellipse", label: "Ellipse", key: "O" },
  { type: "cylinder", label: "Database", key: "B" },
  { type: "text", label: "Text", key: "T" },
  { type: "group", label: "Frame / Group", key: "G" },
];
