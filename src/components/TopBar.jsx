import {
  Undo2,
  Redo2,
  Hand,
  MousePointer2,
  Moon,
  Sun,
  Palette,
  Download,
  FilePlus2,
  Search,
  SlidersHorizontal,
  Presentation,
  Sparkles,
} from "lucide-react";
import { nextTheme, THEME_LABELS } from "../lib/theme.js";

export default function TopBar({
  tool,
  theme,
  onUndo,
  onRedo,
  onToggleTool,
  onToggleTheme,
  onOpenCmdPalette,
  onOpenExportModal,
  onNew,
  onToggleInspector,
  isInspectorOpen,
  onToggleSim,
}) {
  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        top: 14,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 999,
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          paddingRight: 8,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: "-0.03em",
          color: "var(--text)",
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
          }}
        >
          <Sparkles size={14} />
        </span>
        FlowStudio
      </div>

      <span className="fs-sep" />

      {/* Tool Selector */}
      <div
        style={{
          display: "flex",
          background: "rgba(148, 163, 184, 0.12)",
          padding: 3,
          borderRadius: 999,
          gap: 2,
        }}
      >
        <button
          className={`fs-btn-ghost ${tool === "select" ? "on" : ""}`}
          title="Select Tool (V)"
          onClick={() => onToggleTool("select")}
          style={{ padding: "4px 10px", borderRadius: 999 }}
        >
          <MousePointer2 size={13} />
          Select <span style={{ opacity: 0.65, fontSize: 11 }}>(V)</span>
        </button>
        <button
          className={`fs-btn-ghost ${tool === "pan" ? "on" : ""}`}
          title="Pan Tool (H)"
          onClick={() => onToggleTool("pan")}
          style={{ padding: "4px 10px", borderRadius: 999 }}
        >
          <Hand size={13} />
          Pan <span style={{ opacity: 0.65, fontSize: 11 }}>(H)</span>
        </button>
      </div>

      <span className="fs-sep" />

      {/* Undo / Redo */}
      <button className="fs-btn-ghost" title="Undo (Ctrl+Z)" onClick={onUndo}>
        <Undo2 size={15} />
      </button>
      <button className="fs-btn-ghost" title="Redo (Ctrl+Shift+Z)" onClick={onRedo}>
        <Redo2 size={15} />
      </button>

      <span className="fs-sep" />

      {/* Command Palette Trigger */}
      <button
        className="fs-btn"
        onClick={onOpenCmdPalette}
        style={{
          background: "var(--panel-solid)",
          padding: "5px 14px",
          gap: 8,
          borderRadius: 999,
        }}
      >
        <Search size={13} style={{ color: "var(--muted)" }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Command</span>
        <span className="fs-kbd">⌘K</span>
      </button>

      <span className="fs-sep" />

      {/* New Document */}
      <button className="fs-btn-ghost" title="New Document" onClick={onNew}>
        <FilePlus2 size={15} />
      </button>

      {/* Export */}
      <button
        className="fs-btn-ghost"
        title="Export Diagram"
        onClick={onOpenExportModal}
      >
        <Download size={15} />
      </button>

      {/* Theme Toggle — cycles Light → Dark → Clay */}
      {(() => {
        const next = nextTheme(theme);
        const Icon =
          theme === "light" ? Sun : theme === "clay" ? Palette : Moon;
        return (
          <button
            className="fs-btn-ghost"
            title={`Theme: ${THEME_LABELS[theme]} (Click to switch to ${THEME_LABELS[next]})`}
            onClick={onToggleTheme}
          >
            <Icon size={15} />
          </button>
        );
      })()}

      {/* Inspector Toggle */}
      <button
        className={`fs-btn-ghost ${isInspectorOpen ? "on" : ""}`}
        title="Toggle Inspector"
        onClick={onToggleInspector}
      >
        <SlidersHorizontal size={15} />
      </button>

      {/* Simulation View Toggle */}
      <button
        className="fs-btn-ghost"
        title="Simulation View (S)"
        onClick={onToggleSim}
      >
        <Presentation size={15} />
      </button>
    </div>
  );
}
