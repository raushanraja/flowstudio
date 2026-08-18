export const THEMES = {
  light: {
    bg: "#f8fafc",
    grid: "#e2e8f0",
    gridDot: "#cbd5e1",
    panel: "rgba(255, 255, 255, 0.85)",
    panelSolid: "#ffffff",
    border: "rgba(226, 232, 240, 0.8)",
    borderHard: "#cbd5e1",
    text: "#0f172a",
    muted: "#64748b",
    accent: "#6366f1", // Indigo 500
    accentLight: "#e0e7ff",
    handle: "#ffffff",
    edge: "#94a3b8",
    shadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
  },
  dark: {
    bg: "#090d16",
    grid: "#1e293b",
    gridDot: "#334155",
    panel: "rgba(15, 23, 42, 0.85)",
    panelSolid: "#0f172a",
    border: "rgba(255, 255, 255, 0.08)",
    borderHard: "#334155",
    text: "#f8fafc",
    muted: "#94a3b8",
    accent: "#818cf8", // Indigo 400
    accentLight: "#1e1b4b",
    handle: "#0f172a",
    edge: "#64748b",
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
  },
  clay: {
    bg: "#141413", // --COLOR-BG
    grid: "#242320",
    gridDot: "#3a382f",
    panel: "rgba(30, 30, 29, 0.85)", // --COLOR-SURFACE
    panelSolid: "#1E1E1D",
    border: "#333333",
    borderHard: "#333333",
    text: "#E3DACC", // --COLOR-TEXT
    muted: "#9c9484",
    accent: "#E58D70", // --COLOR-ACCENT
    accentLight: "#3a2620",
    handle: "#1E1E1D",
    edge: "#9ca3af",
    success: "#8BA86D", // --COLOR-SUCCESS
    warning: "#FBBF24", // --COLOR-WARNING
    danger: "#F87171", // --COLOR-DANGER
    info: "#85AEDB", // --COLOR-INFO
    shadow: "0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)",
  },
};

export const PALETTES = {
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

/* ---------- theme helpers ---------- */
export const THEME_ORDER = ["light", "dark", "clay"];

export const THEME_LABELS = { light: "Light", dark: "Dark", clay: "Clay" };

export const isTheme = (t) => THEME_ORDER.includes(t);

export const nextTheme = (t) => {
  const i = THEME_ORDER.indexOf(t);
  return THEME_ORDER[(i + 1) % THEME_ORDER.length] ?? "light";
};

export const isDarkTheme = (t) => t !== "light";

/** Fill/stroke used for Frame / Group nodes per theme */
export const GROUP_STYLES = {
  light: { fill: "rgba(130,130,140,.08)", stroke: "#a1a1aa" },
  dark: { fill: "rgba(255,255,255,.04)", stroke: "#52525b" },
  clay: { fill: "rgba(227,218,204,.06)", stroke: "#3a3835" },
};

/** Resolve a preset's stroke for the active theme */
export const presetStroke = (p, theme) => {
  if (!p) return "#6366f1";
  if (theme === "clay" && p.strokeClay) return p.strokeClay;
  if (theme === "light" && p.strokeLight) return p.strokeLight;
  if (theme === "dark" && p.strokeDark) return p.strokeDark;
  return p.stroke;
};

/** Resolve a preset's fill for the active theme */
export const presetFill = (p, theme) => {
  if (!p) return "transparent";
  if (theme === "light") return p.fillLight || p.fill || "#e0e7ff";
  if (theme === "clay") return p.fillClay || p.fill || "#2e211b";
  return p.fillDark || p.fill || "#1e1b4b";
};

/** Resolve a preset's text color for the active theme */
export const presetText = (p, theme) => {
  if (!p) return "#ffffff";
  if (theme === "clay") return p.textClay || p.text || "#E3DACC";
  if (theme === "light") return p.textLight || p.text || p.stroke;
  return p.textDark || p.text || "#ffffff";
};

/* ---------- Clay preset palette (from the Clay color tokens) ---------- */
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

/** Preset list to show for the active theme */
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

