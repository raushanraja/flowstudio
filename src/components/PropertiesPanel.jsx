import {
  ArrowLeftRight,
  Trash2,
  CopyPlus,
  Wand2,
  AlignLeft,
  AlignCenterVertical,
  AlignRight,
  AlignStartVertical,
  AlignCenterHorizontal,
  AlignEndVertical,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  Unlink,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  SHAPE_DEFS,
  THEMES,
  THEME_ORDER,
  THEME_LABELS,
  presetFill,
  presetText,
  presetStroke,
  presetsForTheme,
} from "../lib/theme.js";
import { colorToHex } from "../lib/utils.js";

const ALIGN_BTNS = [
  ["left", AlignLeft, "Align left"],
  ["hcenter", AlignCenterVertical, "Align horizontal center"],
  ["right", AlignRight, "Align right"],
  ["top", AlignStartVertical, "Align top"],
  ["vcenter", AlignCenterHorizontal, "Align vertical center"],
  ["bottom", AlignEndVertical, "Align bottom"],
];

const DISTRIBUTE_BTNS = [
  ["distribute-h", AlignHorizontalSpaceBetween, "Distribute horizontally (equal gaps)"],
  ["distribute-v", AlignVerticalSpaceBetween, "Distribute vertically (equal gaps)"],
];

function ColorField({ label, value, onChange, allowTransparent = false }) {
  const hex = colorToHex(value);
  return (
    <div className="fs-lbl">
      {label}
      <div className="fs-color-row">
        <label
          className="fs-color-swatch-trigger"
          style={{ background: value === "transparent" ? "none" : value }}
          title="Pick custom color"
        >
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        {allowTransparent && (
          <button
            type="button"
            className="fs-mini"
            style={{
              flex: "0 0 auto",
              padding: "0 8px",
              fontSize: 10,
              fontWeight: 600,
              background: value === "transparent" ? "var(--accent-light)" : "transparent",
              color: value === "transparent" ? "var(--accent)" : "var(--muted)",
            }}
            onClick={() => onChange("transparent")}
            title="Set transparent"
          >
            None
          </button>
        )}
        <input
          type="text"
          className="fs-inp"
          style={{ flex: 1 }}
          value={value || ""}
          placeholder="#ffffff or transparent"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export default function PropertiesPanel({
  theme,
  nodes = [],
  edges = [],
  selEdge,
  single,
  selectedCount,
  selectedEdges,
  patchSelNodes,
  patchEdge,
  patchSelection,
  deleteSelection,
  deleteConnections,
  duplicate,
  onAlign,
  onSetTheme,
  onHarmonizeDiagram,
  onHarmonizeSelection,
  onClose,
}) {
  const isSingleNode = selectedCount === 1 && selectedEdges === 0 && !!single;
  const isSingleEdge = selectedEdges === 1 && selectedCount === 0 && !!selEdge;
  const isMultiNodeOnly = selectedCount > 1 && selectedEdges === 0;
  const isMultiEdgeOnly = selectedEdges > 1 && selectedCount === 0;
  const isMixedSelection = selectedCount > 0 && selectedEdges > 0;

  const doBatchPatch = patchSelection || patchSelNodes;

  const presets = presetsForTheme(theme);

  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        top: 76,
        right: 16,
        width: 290,
        maxHeight: "calc(100vh - 100px)",
        zIndex: 30,
        borderRadius: 18,
        padding: 14,
        overflowX: "hidden",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontSize: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 13, color: "var(--text)" }}>
          Inspector
        </span>
        <button
          className="fs-btn-ghost"
          onClick={onClose}
          style={{ padding: 4, borderRadius: "50%" }}
        >
          <X size={15} />
        </button>
      </div>

      {/* 1. SINGLE CONNECTOR / EDGE SELECTED */}
      {isSingleEdge && selEdge && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            1 Connector Selected
          </div>
          <label className="fs-lbl">
            Label Text
            <input
              className="fs-inp"
              value={selEdge.label || ""}
              placeholder="e.g. Yes / No / Next"
              onChange={(e) => patchEdge({ label: e.target.value }, "elabel")}
            />
          </label>
          <ColorField
            label="Label Text Color"
            value={selEdge.textColor || selEdge.stroke}
            onChange={(val) => patchEdge({ textColor: val }, "etcol")}
          />
          <ColorField
            label="Label Background"
            value={selEdge.labelBg || "var(--panel-solid)"}
            allowTransparent
            onChange={(val) => patchEdge({ labelBg: val }, "elbg")}
          />
          <div className="fs-lbl">
            Label Font Size ({selEdge.fontSize || 11}px)
            <input
              type="range"
              min={9}
              max={28}
              value={selEdge.fontSize || 11}
              onChange={(e) => patchEdge({ fontSize: +e.target.value }, "efs")}
            />
          </div>

          {(selEdge.labelDx || selEdge.labelDy) ? (
            <div className="fs-lbl">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)" }}>
                  Label Offset ({selEdge.labelDx || 0}px, {selEdge.labelDy || 0}px)
                </span>
                <button
                  type="button"
                  className="fs-btn-ghost"
                  title="Reset label position to center midpoint"
                  onClick={() => patchEdge({ labelDx: 0, labelDy: 0 }, "reset_label_pos")}
                  style={{ fontSize: 10, padding: "1px 6px", height: 20 }}
                >
                  <RotateCcw size={11} />
                  Reset Pos
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 10, color: "var(--muted)", fontStyle: "italic", padding: "1px 0" }}>
              💡 Drag the label on canvas to reposition it anywhere on line.
            </div>
          )}

          <div className="fs-row">
            <span className="fs-lbl">From Port</span>
            <select
              className="fs-inp"
              value={selEdge.fromPort}
              onChange={(e) => patchEdge({ fromPort: e.target.value })}
            >
              {["right", "left", "top", "bottom"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="fs-row">
            <span className="fs-lbl">To Port</span>
            <select
              className="fs-inp"
              value={selEdge.toPort}
              onChange={(e) => patchEdge({ toPort: e.target.value })}
            >
              {["left", "right", "top", "bottom"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <label className="fs-lbl" style={{ fontSize: 11 }}>
            Travel Time — demo (ms)
            <input
              className="fs-inp"
              type="number"
              min={0}
              step={100}
              value={selEdge.travelMs ?? ""}
              placeholder="auto (hop interval)"
              onChange={(e) =>
                patchEdge(
                  {
                    travelMs:
                      e.target.value === ""
                        ? undefined
                        : Math.max(0, +e.target.value),
                  },
                  "etravel",
                )
              }
            />
          </label>
          <div className="fs-lbl">
            Stroke Width ({selEdge.strokeWidth || 2}px)
            <input
              type="range"
              min={1}
              max={6}
              value={selEdge.strokeWidth || 2}
              onChange={(e) => patchEdge({ strokeWidth: +e.target.value }, "esw")}
            />
          </div>
          <ColorField
            label="Line Color"
            value={selEdge.stroke}
            onChange={(val) => patchEdge({ stroke: val }, "ecol")}
          />
          {/* Arrowhead Selector */}
          <div className="fs-lbl">
            Arrowheads
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {[
                ["end", "End (→)", { arrow: true, arrowStart: false }],
                ["both", "Both (↔)", { arrow: true, arrowStart: true }],
                ["start", "Start (←)", { arrow: false, arrowStart: true }],
                ["none", "None (—)", { arrow: false, arrowStart: false }],
              ].map(([key, label, patch]) => {
                const isSelected =
                  key === "both"
                    ? selEdge.arrow !== false && !!selEdge.arrowStart
                    : key === "end"
                    ? selEdge.arrow !== false && !selEdge.arrowStart
                    : key === "start"
                    ? selEdge.arrow === false && !!selEdge.arrowStart
                    : selEdge.arrow === false && !selEdge.arrowStart;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`fs-btn-ghost ${isSelected ? "on" : ""}`}
                    style={{
                      flex: 1,
                      padding: "4px 2px",
                      fontSize: 10,
                      justifyContent: "center",
                      border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent-light)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text)",
                    }}
                    onClick={() => patchEdge(patch, "arrow_style")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="fs-lbl" style={{ flexDirection: "row", gap: 6, cursor: "pointer", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={!!selEdge.dashed}
              onChange={(e) => patchEdge({ dashed: e.target.checked })}
            />
            Dashed Line
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="fs-btn"
                style={{ flex: 1, padding: "6px 8px" }}
                title="Reverse edge direction"
                onClick={() =>
                  patchEdge(
                    {
                      from: selEdge.to,
                      to: selEdge.from,
                      fromPort: selEdge.toPort || "right",
                      toPort: selEdge.fromPort || "left",
                      fromPos: selEdge.toPos ? { ...selEdge.toPos } : undefined,
                      toPos: selEdge.fromPos ? { ...selEdge.fromPos } : undefined,
                      waypoints: selEdge.waypoints
                        ? [...selEdge.waypoints].reverse()
                        : null,
                    },
                    "flip_dir"
                  )
                }
              >
                <ArrowLeftRight size={13} />
                Flip Direction
              </button>
              {selEdge.waypoints && selEdge.waypoints.length > 0 && (
                <button
                  className="fs-btn"
                  style={{ flex: 1, padding: "6px 8px" }}
                  title="Remove manual bends and auto-route"
                  onClick={() => patchEdge({ waypoints: null }, "clear_bends")}
                >
                  <Wand2 size={13} />
                  Clear Bends
                </button>
              )}
            </div>
            <button
              className="fs-btn"
              style={{ width: "100%", color: "#ef4444", padding: "6px 8px" }}
              onClick={deleteSelection}
            >
              <Trash2 size={13} />
              Delete Connection
            </button>
          </div>
        </>
      )}

      {/* 2. MULTIPLE CONNECTORS / EDGES SELECTED */}
      {isMultiEdgeOnly && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {selectedEdges} Connectors Selected
          </div>

          <label className="fs-lbl">
            Set Common Label Text
            <input
              className="fs-inp"
              placeholder="e.g. Yes / No / Next"
              onChange={(e) => patchEdge({ label: e.target.value }, "elabel")}
            />
          </label>

          <ColorField
            label="Connector Label Text Color"
            value=""
            onChange={(val) => patchEdge({ textColor: val }, "etcol")}
          />

          <ColorField
            label="Connector Label Background"
            value=""
            allowTransparent
            onChange={(val) => patchEdge({ labelBg: val }, "elbg")}
          />

          <div className="fs-lbl">
            Connector Label Font Size
            <input
              type="range"
              min={9}
              max={28}
              defaultValue={11}
              onChange={(e) => patchEdge({ fontSize: +e.target.value }, "efs")}
            />
          </div>

          <ColorField
            label="Line Color (All Connectors)"
            value=""
            onChange={(val) => patchEdge({ stroke: val }, "ecol")}
          />

          <div className="fs-lbl">
            Line Width (All Connectors)
            <input
              type="range"
              min={1}
              max={6}
              defaultValue={2}
              onChange={(e) => patchEdge({ strokeWidth: +e.target.value }, "esw")}
            />
          </div>

          {/* Arrowhead Selector (All Selected) */}
          <div className="fs-lbl">
            Arrowheads (All Selected)
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {[
                ["end", "End (→)", { arrow: true, arrowStart: false }],
                ["both", "Both (↔)", { arrow: true, arrowStart: true }],
                ["start", "Start (←)", { arrow: false, arrowStart: true }],
                ["none", "None (—)", { arrow: false, arrowStart: false }],
              ].map(([key, label, patch]) => (
                <button
                  key={key}
                  type="button"
                  className="fs-btn-ghost"
                  style={{
                    flex: 1,
                    padding: "4px 2px",
                    fontSize: 10,
                    justifyContent: "center",
                    border: "1px solid var(--border)",
                  }}
                  onClick={() => patchEdge(patch, "arrow_style")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="fs-lbl" style={{ flexDirection: "row", gap: 6, cursor: "pointer", alignItems: "center" }}>
            <input
              type="checkbox"
              onChange={(e) => patchEdge({ dashed: e.target.checked })}
            />
            Dashed Lines
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <button className="fs-btn" style={{ width: "100%" }} onClick={deleteConnections}>
              <Unlink size={14} />
              Delete Connections Only
            </button>
            <button className="fs-btn" style={{ width: "100%", color: "#ef4444" }} onClick={deleteSelection}>
              <Trash2 size={14} />
              Delete Selection
            </button>
          </div>
        </>
      )}

      {/* 3. SINGLE NODE SELECTED */}
      {isSingleNode && single && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            1 Node Selected
          </div>

          {/* Preset Color Swatches */}
          <div className="fs-lbl">
            Preset Palette
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {presets.map((p) => {
                const stroke = presetStroke(p, theme);
                const fill = presetFill(p, theme);
                const isSelected = single.stroke === stroke || single.fill === fill;
                return (
                  <div
                    key={p.label}
                    className={`fs-swatch ${isSelected ? "selected" : ""}`}
                    style={{
                      background: fill,
                      borderColor: stroke,
                    }}
                    title={p.label}
                    onClick={() =>
                      doBatchPatch(
                        {
                          stroke,
                          fill,
                          textColor: presetText(p, theme),
                        },
                        "preset"
                      )
                    }
                  />
                );
              })}
            </div>
          </div>

          <label className="fs-lbl">
            Label Text
            <textarea
              className="fs-inp"
              rows={2}
              value={single.text || ""}
              onChange={(e) =>
                patchSelNodes({ text: e.target.value }, "ntext")
              }
            />
          </label>
          <div className="fs-row">
            <span className="fs-lbl">Badge / Tag</span>
            <input
              className="fs-inp"
              style={{ width: 70 }}
              value={single.badge || ""}
              placeholder="e.g. 1"
              onChange={(e) =>
                patchSelNodes({ badge: e.target.value }, "badge")
              }
            />
          </div>
          <label className="fs-lbl">
            Shape Type
            <select
              className="fs-inp"
              value={single.type}
              onChange={(e) => patchSelNodes({ type: e.target.value })}
            >
              {SHAPE_DEFS.map((s) => (
                <option key={s.type} value={s.type}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="fs-lbl">
            Position & Dimensions
            <div className="fs-row" style={{ marginTop: 4, gap: 4 }}>
              {["x", "y", "w", "h"].map((k) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>{k}</span>
                  <input
                    className="fs-inp"
                    type="number"
                    style={{ textAlign: "center", padding: "4px 2px", fontSize: 11 }}
                    value={Math.round(single[k])}
                    onChange={(e) =>
                      patchSelNodes({ [k]: +e.target.value }, "pos" + k)
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <ColorField
            label="Label Text Color"
            value={single.textColor}
            onChange={(val) => doBatchPatch({ textColor: val }, "tcol")}
          />
          <ColorField
            label="Fill Color"
            value={single.fill}
            allowTransparent
            onChange={(val) => doBatchPatch({ fill: val }, "fill")}
          />
          <ColorField
            label="Border Color"
            value={single.stroke}
            allowTransparent
            onChange={(val) => doBatchPatch({ stroke: val }, "stroke")}
          />

          <div className="fs-lbl">
            Border Width ({single.strokeWidth ?? 2}px)
            <input
              type="range"
              min={1}
              max={8}
              value={single.strokeWidth ?? 2}
              onChange={(e) =>
                doBatchPatch({ strokeWidth: +e.target.value }, "sw")
              }
            />
          </div>
          <label className="fs-lbl" style={{ flexDirection: "row", gap: 6, cursor: "pointer", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={!!single.dashed}
              onChange={(e) => doBatchPatch({ dashed: e.target.checked })}
            />
            Dashed Border
          </label>
          <div className="fs-lbl">
            Font Size ({single.fontSize ?? 14}px)
            <input
              type="range"
              min={9}
              max={32}
              value={single.fontSize ?? 14}
              onChange={(e) =>
                doBatchPatch({ fontSize: +e.target.value }, "fs")
              }
            />
          </div>
          <label className="fs-lbl" style={{ fontSize: 11 }}>
            Dwell Time — demo (ms)
            <input
              className="fs-inp"
              type="number"
              min={0}
              step={100}
              value={single.dwellMs ?? ""}
              placeholder="0"
              onChange={(e) =>
                doBatchPatch(
                  {
                    dwellMs:
                      e.target.value === ""
                        ? undefined
                        : Math.max(0, +e.target.value),
                  },
                  "ndwell",
                )
              }
            />
          </label>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="fs-btn" style={{ flex: 1, padding: "6px 8px" }} onClick={duplicate}>
                <CopyPlus size={13} />
                Duplicate
              </button>
              <button
                className="fs-btn"
                style={{ flex: 1, padding: "6px 8px" }}
                title="Remove all connections of the selection (Shift+Del)"
                onClick={deleteConnections}
              >
                <Unlink size={13} />
                Clear Links
              </button>
            </div>
            <button className="fs-btn" style={{ width: "100%", color: "#ef4444", padding: "6px 8px" }} onClick={deleteSelection}>
              <Trash2 size={13} />
              Delete Node
            </button>
          </div>
        </>
      )}

      {/* 4. MULTIPLE NODES ONLY SELECTED */}
      {isMultiNodeOnly && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {selectedCount} Nodes Selected
          </div>

          {/* Preset Color Swatches */}
          <div className="fs-lbl">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>Preset Palette (All Selected)</span>
              {onHarmonizeSelection && (
                <button
                  type="button"
                  className="fs-btn-ghost"
                  onClick={onHarmonizeSelection}
                  style={{ fontSize: 10, padding: "2px 7px", height: 20, gap: 4 }}
                  title={`Distribute ${THEME_LABELS[theme]} theme colors across selected nodes`}
                >
                  <Sparkles size={11} style={{ color: "var(--accent)" }} />
                  Harmonize
                </button>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {presets.map((p) => {
                const stroke = presetStroke(p, theme);
                const fill = presetFill(p, theme);
                return (
                  <div
                    key={p.label}
                    className="fs-swatch"
                    style={{
                      background: fill,
                      borderColor: stroke,
                    }}
                    title={`Apply ${p.label} to all selected nodes`}
                    onClick={() =>
                      patchSelNodes(
                        {
                          stroke,
                          fill,
                          textColor: presetText(p, theme),
                        },
                        "preset"
                      )
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* Multi-node Alignment & Distribute Bar */}
          <div className="fs-lbl">
            Align & Distribute Nodes
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4, alignItems: "center" }}>
              {ALIGN_BTNS.map(([key, Icon, title]) => (
                <button
                  key={key}
                  className="fs-mini"
                  title={title}
                  onClick={() => onAlign(key)}
                >
                  <Icon size={14} />
                </button>
              ))}
              <div style={{ width: 1, height: 18, background: "var(--border)", margin: "0 2px" }} />
              {DISTRIBUTE_BTNS.map(([key, Icon, title]) => (
                <button
                  key={key}
                  className="fs-mini"
                  title={title}
                  onClick={() => onAlign(key)}
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          <ColorField
            label="Node Labels Text Color"
            value=""
            onChange={(val) => patchSelNodes({ textColor: val }, "tcol")}
          />

          <div className="fs-lbl">
            Node Font Size
            <input
              type="range"
              min={9}
              max={32}
              defaultValue={14}
              onChange={(e) => patchSelNodes({ fontSize: +e.target.value }, "fs")}
            />
          </div>

          <ColorField
            label="Node Fill Color"
            value=""
            allowTransparent
            onChange={(val) => patchSelNodes({ fill: val }, "fill")}
          />

          <ColorField
            label="Node Border Color"
            value=""
            allowTransparent
            onChange={(val) => patchSelNodes({ stroke: val }, "stroke")}
          />

          <div className="fs-lbl">
            Node Border Width
            <input
              type="range"
              min={1}
              max={8}
              defaultValue={2}
              onChange={(e) => patchSelNodes({ strokeWidth: +e.target.value }, "sw")}
            />
          </div>

          <label className="fs-lbl" style={{ flexDirection: "row", gap: 6, cursor: "pointer", alignItems: "center" }}>
            <input
              type="checkbox"
              onChange={(e) => patchSelNodes({ dashed: e.target.checked })}
            />
            Dashed Node Border
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="fs-btn" style={{ flex: 1, padding: "6px 8px" }} onClick={duplicate}>
                <CopyPlus size={13} />
                Duplicate
              </button>
              <button
                className="fs-btn"
                style={{ flex: 1, padding: "6px 8px" }}
                title="Remove all connections of the selection (Shift+Del)"
                onClick={deleteConnections}
              >
                <Unlink size={13} />
                Clear Links
              </button>
            </div>
            <button className="fs-btn" style={{ width: "100%", color: "#ef4444", padding: "6px 8px" }} onClick={deleteSelection}>
              <Trash2 size={13} />
              Delete Nodes
            </button>
          </div>
        </>
      )}

      {/* 5. MIXED SELECTION MODE (NODES + CONNECTORS) */}
      {isMixedSelection && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--accent)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            {selectedCount} Nodes & {selectedEdges} Connectors
          </div>

          {/* Preset Color Swatches for All Selected Elements */}
          <div className="fs-lbl">
            Preset Palette (All Selected)
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {presets.map((p) => {
                const stroke = presetStroke(p, theme);
                const fill = presetFill(p, theme);
                return (
                  <div
                    key={p.label}
                    className="fs-swatch"
                    style={{
                      background: fill,
                      borderColor: stroke,
                    }}
                    title={`Apply ${p.label} to all selected`}
                    onClick={() =>
                      doBatchPatch(
                        {
                          stroke,
                          fill,
                          textColor: presetText(p, theme),
                        },
                        "preset"
                      )
                    }
                  />
                );
              })}
            </div>
          </div>

          {/* Batch Text & Label Styling for ALL selected elements */}
          <ColorField
            label="All Labels Text Color"
            value=""
            onChange={(val) => doBatchPatch({ textColor: val }, "tcol")}
          />

          <div className="fs-lbl">
            All Labels Font Size
            <input
              type="range"
              min={9}
              max={32}
              defaultValue={14}
              onChange={(e) => doBatchPatch({ fontSize: +e.target.value }, "fs")}
            />
          </div>

          <ColorField
            label="All Fill / Connector Background"
            value=""
            allowTransparent
            onChange={(val) => doBatchPatch({ fill: val, labelBg: val }, "fill")}
          />

          <ColorField
            label="All Border / Line Color"
            value=""
            allowTransparent
            onChange={(val) => doBatchPatch({ stroke: val }, "stroke")}
          />

          <div className="fs-lbl">
            All Border / Line Width
            <input
              type="range"
              min={1}
              max={8}
              defaultValue={2}
              onChange={(e) => doBatchPatch({ strokeWidth: +e.target.value }, "sw")}
            />
          </div>

          <label className="fs-lbl" style={{ flexDirection: "row", gap: 6, cursor: "pointer", alignItems: "center" }}>
            <input
              type="checkbox"
              onChange={(e) => doBatchPatch({ dashed: e.target.checked })}
            />
            Dashed Border / Lines
          </label>

          {/* Batch Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="fs-btn" style={{ flex: 1, padding: "6px 8px" }} onClick={duplicate}>
                <CopyPlus size={13} />
                Duplicate
              </button>
              <button
                className="fs-btn"
                style={{ flex: 1, padding: "6px 8px" }}
                title="Remove all connections of the selection (Shift+Del)"
                onClick={deleteConnections}
              >
                <Unlink size={13} />
                Clear Links
              </button>
            </div>
            <button className="fs-btn" style={{ width: "100%", color: "#ef4444", padding: "6px 8px" }} onClick={deleteSelection}>
              <Trash2 size={13} />
              Delete Selection
            </button>
          </div>
        </>
      )}

      {/* Empty State / Canvas Overview */}
      {!selEdge && selectedCount === 0 && selectedEdges === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Theme & Palette Section */}
          <div>
            <div className="fs-lbl" style={{ marginBottom: 6 }}>
              Canvas Theme
            </div>
            <div
              style={{
                display: "flex",
                background: "var(--panel-solid)",
                padding: 3,
                borderRadius: 10,
                border: "1px solid var(--border)",
                gap: 2,
              }}
            >
              {THEME_ORDER.map((t) => {
                const isAct = theme === t;
                const tBg = THEMES[t]?.bg || "#000";
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onSetTheme?.(t)}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "6px 4px",
                      border: "none",
                      borderRadius: 7,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: isAct ? "var(--accent-light)" : "transparent",
                      color: isAct ? "var(--accent)" : "var(--muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: tBg,
                        border: "1px solid rgba(255,255,255,0.35)",
                        display: "inline-block",
                      }}
                    />
                    {THEME_LABELS[t]}
                  </button>
                );
              })}
            </div>

            {onHarmonizeDiagram && (
              <button
                type="button"
                className="fs-btn"
                onClick={onHarmonizeDiagram}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "6px 10px",
                  borderRadius: 10,
                  gap: 6,
                  fontSize: 11,
                }}
                title={`Harmonize all node and group colors to the active ${THEME_LABELS[theme]} palette`}
              >
                <Sparkles size={13} style={{ color: "var(--accent)" }} />
                Harmonize Diagram Colors
              </button>
            )}
          </div>

          {/* Diagram Stats */}
          <div>
            <div className="fs-lbl" style={{ marginBottom: 6 }}>
              Diagram Overview
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "rgba(148, 163, 184, 0.08)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Nodes</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {nodes.filter((n) => n.type !== "group").length}
                </div>
              </div>
              <div
                style={{
                  padding: "8px 10px",
                  borderRadius: 9,
                  background: "rgba(148, 163, 184, 0.08)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: 10, color: "var(--muted)" }}>Connections</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{edges.length}</div>
              </div>
              {nodes.some((n) => n.type === "group") && (
                <div
                  style={{
                    gridColumn: "span 2",
                    padding: "6px 10px",
                    borderRadius: 9,
                    background: "rgba(148, 163, 184, 0.08)",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Group Frames</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {nodes.filter((n) => n.type === "group").length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              color: "var(--muted)",
              fontSize: 11,
              lineHeight: 1.5,
              paddingTop: 6,
              borderTop: "1px solid var(--border)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--text)" }}>Quick Shortcuts</div>
            <div>• <b>Space / H</b>: Pan canvas freely</div>
            <div>• <b>V</b>: Select &amp; box marquee</div>
            <div>• <b>Ctrl+K / ⌘K</b>: Command palette</div>
            <div>• <b>Double-click</b>: Quick-edit text</div>
            <div>• <b>Shift+Click</b>: Multi-select</div>
          </div>
        </div>
      )}
    </div>
  );
}
