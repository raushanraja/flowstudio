import { useEffect, useState, useRef } from "react";
import {
  Search,
  PlusSquare,
  Sparkles,
  Download,
  Upload,
  Workflow,
  Sun,
  Moon,
  Palette,
  Group,
  BoxSelect,
  Copy,
  Trash2,
  Unlink,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Grid,
  Magnet,
  FilePlus2,
  CopyPlus,
  ClipboardPaste,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenterVertical,
  AlignRight,
  AlignStartVertical,
  AlignCenterHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Image,
  FileImage,
  Code2,
} from "lucide-react";
import {
  SHAPE_DEFS,
  THEME_ORDER,
  THEME_LABELS,
  nextTheme,
  isDarkTheme,
} from "../lib/theme.js";

const getThemeIcon = (t) => {
  if (t === "clay") return Palette;
  return isDarkTheme(t) ? Moon : Sun;
};

export default function CommandPalette({
  isOpen,
  onClose,
  theme,
  onAddNode,
  onUndo,
  onRedo,
  onGroup,
  onUngroup,
  onDuplicate,
  onCopy,
  onPaste,
  onDelete,
  onDeleteConnections,
  onSelectAll,
  onAlign,
  onFit,
  onZoomIn,
  onZoomOut,
  onToggleSnap,
  onToggleGrid,
  onToggleTheme,
  onSetTheme,
  onHarmonizeDiagram,
  onAutoLayout,
  onOpenExport,
  onExportSVG,
  onExportPNG,
  onCopyPNG,
  onCopySVG,
  onCopyMermaid,
  onExportMermaid,
  onNew,
  importFileRef,
  mermaidFileRef,
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex];
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const actions = [
    // Shapes
    ...SHAPE_DEFS.map((s) => ({
      id: `add-${s.type}`,
      category: "Shapes",
      title: `Add ${s.label}`,
      icon: PlusSquare,
      shortcut: `Key ${s.key}`,
      run: () => onAddNode(s.type),
    })),
    // Actions & Selection
    { id: "undo", category: "History", title: "Undo", icon: Undo2, shortcut: "Ctrl+Z", run: onUndo },
    { id: "redo", category: "History", title: "Redo", icon: Redo2, shortcut: "Ctrl+Shift+Z", run: onRedo },
    { id: "duplicate", category: "Edit", title: "Duplicate Selection", icon: CopyPlus, shortcut: "Ctrl+D", run: onDuplicate },
    { id: "copy", category: "Edit", title: "Copy Selection", icon: Copy, shortcut: "Ctrl+C", run: onCopy },
    { id: "paste", category: "Edit", title: "Paste", icon: ClipboardPaste, shortcut: "Ctrl+V", run: onPaste },
    { id: "delete", category: "Edit", title: "Delete Selection", icon: Trash2, shortcut: "Del", run: onDelete },
    { id: "delete-connections", category: "Edit", title: "Delete Connections Only", icon: Unlink, shortcut: "Shift+Del", run: onDeleteConnections },
    { id: "select-all", category: "Edit", title: "Select All", icon: Sparkles, shortcut: "Ctrl+A", run: onSelectAll },
    { id: "group", category: "Organize", title: "Group Selected", icon: Group, shortcut: "Ctrl+G", run: onGroup },
    { id: "ungroup", category: "Organize", title: "Ungroup Selected", icon: BoxSelect, shortcut: "Ctrl+Shift+G", run: onUngroup },
    { id: "layout-tb", category: "Organize", title: "Auto-Layout Diagram (Top-to-Bottom)", icon: Workflow, run: () => onAutoLayout?.("TB") },
    { id: "layout-lr", category: "Organize", title: "Auto-Layout Diagram (Left-to-Right)", icon: Workflow, run: () => onAutoLayout?.("LR") },
    
    // Alignment & Distribution
    { id: "align-left", category: "Align", title: "Align Left", icon: AlignLeft, run: () => onAlign("left") },
    { id: "align-hcenter", category: "Align", title: "Align Horizontal Center", icon: AlignCenterVertical, run: () => onAlign("hcenter") },
    { id: "align-right", category: "Align", title: "Align Right", icon: AlignRight, run: () => onAlign("right") },
    { id: "align-top", category: "Align", title: "Align Top", icon: AlignStartVertical, run: () => onAlign("top") },
    { id: "align-vcenter", category: "Align", title: "Align Vertical Center", icon: AlignCenterHorizontal, run: () => onAlign("vcenter") },
    { id: "align-bottom", category: "Align", title: "Align Bottom", icon: AlignEndVertical, run: () => onAlign("bottom") },
    { id: "distribute-h", category: "Align", title: "Distribute Horizontally", icon: AlignHorizontalSpaceBetween, run: () => onAlign("distribute-h") },
    { id: "distribute-v", category: "Align", title: "Distribute Vertically", icon: AlignVerticalSpaceBetween, run: () => onAlign("distribute-v") },

    // View & Canvas
    { id: "fit", category: "Canvas", title: "Fit View to Contents", icon: Maximize2, run: onFit },
    { id: "zoom-in", category: "Canvas", title: "Zoom In", icon: ZoomIn, run: onZoomIn },
    { id: "zoom-out", category: "Canvas", title: "Zoom Out", icon: ZoomOut, run: onZoomOut },
    { id: "toggle-snap", category: "Canvas", title: "Toggle Grid Snapping", icon: Magnet, run: onToggleSnap },
    { id: "toggle-grid", category: "Canvas", title: "Toggle Canvas Grid", icon: Grid, run: onToggleGrid },
    { id: "toggle-theme", category: "Appearance", title: `Switch to ${THEME_LABELS[nextTheme(theme)] || nextTheme(theme)} Theme`, icon: getThemeIcon(nextTheme(theme)), run: onToggleTheme },
    ...THEME_ORDER.map((t) => ({
      id: `theme-${t}`,
      category: "Appearance",
      title: `Use ${THEME_LABELS[t] || t} Theme${t === theme ? " (current)" : ""}`,
      icon: getThemeIcon(t),
      run: () => onSetTheme?.(t),
    })),
    ...(onHarmonizeDiagram
      ? [
          {
            id: "harmonize-theme",
            category: "Appearance",
            title: `Harmonize All Diagram Colors to ${THEME_LABELS[theme]} Palette`,
            icon: Sparkles,
            run: onHarmonizeDiagram,
          },
        ]
      : []),

    // File & Export
    { id: "export-modal", category: "File", title: "Export Diagram (Customize SVG / PNG / JSON / Mermaid)", icon: Download, run: onOpenExport },
    { id: "copy-mermaid", category: "File", title: "Copy Diagram as Mermaid Code", icon: Code2, run: onCopyMermaid },
    { id: "export-mermaid", category: "File", title: "Export as Mermaid Flowchart (.mmd)", icon: Download, run: onExportMermaid },
    { id: "export-png-trans", category: "File", title: "Export Transparent PNG Image", icon: Image, run: () => onExportPNG?.({ transparent: true, scale: 2 }) },
    { id: "export-svg-trans", category: "File", title: "Export Transparent Vector SVG", icon: FileImage, run: () => onExportSVG?.({ transparent: true }) },
    { id: "copy-png-trans", category: "File", title: "Copy Transparent PNG to Clipboard", icon: Copy, run: () => onCopyPNG?.({ transparent: true, scale: 2 }) },
    { id: "copy-svg-trans", category: "File", title: "Copy Transparent SVG to Clipboard", icon: Copy, run: () => onCopySVG?.({ transparent: true }) },
    { id: "export-png-solid", category: "File", title: "Export PNG with Canvas Background", icon: Image, run: () => onExportPNG?.({ transparent: false, scale: 2 }) },
    { id: "export-svg-solid", category: "File", title: "Export SVG with Canvas Background", icon: FileImage, run: () => onExportSVG?.({ transparent: false }) },
    { id: "import-json", category: "File", title: "Import JSON File", icon: Upload, run: () => importFileRef.current?.click() },
    { id: "import-mermaid", category: "File", title: "Import Mermaid File (.md / .mmd / .txt)", icon: Workflow, run: () => mermaidFileRef.current?.click() },
    { id: "new-doc", category: "File", title: "New Document", icon: FilePlus2, run: onNew },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].run();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fs-modal-backdrop" onClick={onClose}>
      <div
        className="fs-command-modal fs-glass"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "70vh",
        }}
      >
        {/* Search Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Search size={18} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search actions..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              fontSize: 14,
              fontWeight: 500,
            }}
          />
          <span className="fs-kbd">ESC</span>
        </div>

        {/* Action List */}
        <div
          ref={listRef}
          style={{
            overflowY: "auto",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "var(--muted)",
                fontSize: 13,
              }}
            >
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isSelected ? "var(--accent-light)" : "transparent",
                    color: isSelected ? "var(--accent)" : "var(--text)",
                    transition: "all 0.1s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon size={16} style={{ opacity: isSelected ? 1 : 0.7 }} />
                    <span style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13 }}>
                      {item.title}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "var(--muted)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  {item.shortcut && <span className="fs-kbd">{item.shortcut}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
