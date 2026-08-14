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
};

export const COLOR_PRESETS = [
  { label: "Indigo", stroke: "#6366f1", fillLight: "#e0e7ff", fillDark: "#1e1b4b" },
  { label: "Sky", stroke: "#0284c7", fillLight: "#e0f2fe", fillDark: "#0c4a6e" },
  { label: "Emerald", stroke: "#10b981", fillLight: "#d1fae5", fillDark: "#064e3b" },
  { label: "Amber", stroke: "#f59e0b", fillLight: "#fef3c7", fillDark: "#451a03" },
  { label: "Rose", stroke: "#f43f5e", fillLight: "#fee2e2", fillDark: "#4c0519" },
  { label: "Purple", stroke: "#a855f7", fillLight: "#f3e8ff", fillDark: "#3b0764" },
  { label: "Slate", stroke: "#64748b", fillLight: "#f1f5f9", fillDark: "#1e293b" },
];

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

