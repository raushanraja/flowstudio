import { useState } from "react";
import {
  CopyPlus,
  Trash2,
  Group,
  Spline,
  CornerDownRight,
  Minus,
  ArrowLeftRight,
} from "lucide-react";
import { ShapeIcon } from "./Shapes.jsx";
import {
  presetsForTheme,
  presetStroke,
  presetFill,
  presetText,
} from "../lib/theme.js";

const MORPH_SHAPES = [
  { type: "rect", label: "Rectangle" },
  { type: "rounded", label: "Rounded" },
  { type: "pill", label: "Pill" },
  { type: "diamond", label: "Diamond" },
  { type: "ellipse", label: "Ellipse" },
  { type: "cylinder", label: "Cylinder" },
];

export default function FloatingHUD({
  sel = { nodes: [], edges: [] },
  nodes = [],
  edges = [],
  cam = { x: 0, y: 0, zoom: 1 },
  theme = "dark",
  simMode = false,
  onPatchNodes,
  onPatchEdge,
  onMorphShape,
  onDuplicate,
  onDelete,
  onGroup,
}) {
  const [showShapePicker, setShowShapePicker] = useState(false);

  if (simMode) return null;

  const hasNodes = sel.nodes.length > 0;
  const hasSingleEdge = sel.edges.length === 1 && !hasNodes;

  if (!hasNodes && !hasSingleEdge) return null;

  const presets = presetsForTheme(theme);

  // Position calculation
  let cx = 0;
  let cy = 0;

  if (hasNodes) {
    const selectedNodes = nodes.filter((n) => sel.nodes.includes(n.id));
    if (!selectedNodes.length) return null;

    const minX = Math.min(...selectedNodes.map((n) => n.x));
    const minY = Math.min(...selectedNodes.map((n) => n.y));
    const maxX = Math.max(...selectedNodes.map((n) => n.x + n.w));
    const maxY = Math.max(...selectedNodes.map((n) => n.y + n.h));

    cx = cam.x + ((minX + maxX) / 2) * cam.zoom;
    cy = cam.y + minY * cam.zoom - 44;
    // If too close to top bar, position below the selection
    if (cy < 68) {
      cy = cam.y + maxY * cam.zoom + 12;
    }
  } else if (hasSingleEdge) {
    const e = edges.find((ed) => ed.id === sel.edges[0]);
    if (!e) return null;
    const nFrom = nodes.find((n) => n.id === e.from);
    const nTo = nodes.find((n) => n.id === e.to);
    if (!nFrom || !nTo) return null;

    const midX = (nFrom.x + nFrom.w / 2 + (nTo.x + nTo.w / 2)) / 2;
    const midY = (nFrom.y + nFrom.h / 2 + (nTo.y + nTo.h / 2)) / 2;

    cx = cam.x + midX * cam.zoom;
    cy = cam.y + midY * cam.zoom - 36;
    if (cy < 68) cy = 72;
  }

  // Viewport clamping
  const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const clampedX = Math.max(160, Math.min(winW - 160, cx));
  const clampedY = Math.max(68, cy);

  const isSingleNode = sel.nodes.length === 1;
  const single = isSingleNode ? nodes.find((n) => n.id === sel.nodes[0]) : null;
  const singleEdge = hasSingleEdge ? edges.find((ed) => ed.id === sel.edges[0]) : null;

  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        left: clampedX,
        top: clampedY,
        transform: "translate(-50%, 0)",
        zIndex: 28,
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 8px",
        borderRadius: 999,
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.35)",
        border: "1px solid var(--border-hard)",
        animation: "fs-fade-in 0.12s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Node Controls */}
      {hasNodes && (
        <>
          {/* Shape Morpher for single node */}
          {single && single.type !== "group" && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className={`fs-mini ${showShapePicker ? "on" : ""}`}
                title={`Change Shape (Current: ${single.type})`}
                onClick={() => setShowShapePicker((v) => !v)}
                style={{ padding: "4px 6px" }}
              >
                <ShapeIcon type={single.type} />
              </button>

              {/* Popup shape selector */}
              {showShapePicker && (
                <div
                  className="fs-glass"
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: 8,
                    display: "flex",
                    gap: 3,
                    padding: 5,
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
                    border: "1px solid var(--border-hard)",
                  }}
                >
                  {MORPH_SHAPES.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      className={`fs-mini ${single.type === s.type ? "on" : ""}`}
                      title={s.label}
                      onClick={() => {
                        if (onMorphShape) onMorphShape(s.type);
                        setShowShapePicker(false);
                      }}
                    >
                      <ShapeIcon type={s.type} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Color Swatches */}
          <div style={{ display: "flex", alignItems: "center", gap: 3, padding: "0 2px" }}>
            {presets.slice(0, 6).map((p) => {
              const stroke = presetStroke(p, theme);
              const fill = presetFill(p, theme);
              const text = presetText(p, theme);
              return (
                <div
                  key={p.label}
                  className="fs-swatch"
                  title={p.label}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: fill,
                    borderColor: stroke,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (onPatchNodes) {
                      onPatchNodes({ stroke, fill, textColor: text }, "hud_color");
                    }
                  }}
                />
              );
            })}
          </div>

          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

          {/* Group button if multiple nodes selected */}
          {sel.nodes.length > 1 && onGroup && (
            <button
              type="button"
              className="fs-mini"
              title="Group Selection (Ctrl+G)"
              onClick={onGroup}
            >
              <Group size={14} />
            </button>
          )}

          {/* Duplicate button */}
          {onDuplicate && (
            <button
              type="button"
              className="fs-mini"
              title="Duplicate (Ctrl+D / Alt+Drag)"
              onClick={onDuplicate}
            >
              <CopyPlus size={14} />
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              type="button"
              className="fs-mini"
              title="Delete (Del)"
              onClick={onDelete}
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </>
      )}

      {/* Edge Controls */}
      {hasSingleEdge && singleEdge && (
        <>
          {/* Routing mode buttons */}
          {[
            ["curved", Spline, "Curved Routing"],
            ["orthogonal", CornerDownRight, "Orthogonal Routing"],
            ["straight", Minus, "Straight Line"],
          ].map(([mode, Icon, title]) => {
            const isSelected = (singleEdge.routing || "curved") === mode;
            return (
              <button
                key={mode}
                type="button"
                className={`fs-mini ${isSelected ? "on" : ""}`}
                title={title}
                onClick={() => onPatchEdge && onPatchEdge({ routing: mode }, "hud_routing")}
              >
                <Icon size={13} />
              </button>
            );
          })}

          <div style={{ width: 1, height: 16, background: "var(--border)", margin: "0 2px" }} />

          {/* Dashed toggle */}
          <button
            type="button"
            className={`fs-mini ${singleEdge.dashed ? "on" : ""}`}
            title="Toggle Dashed Line"
            onClick={() => onPatchEdge && onPatchEdge({ dashed: !singleEdge.dashed }, "hud_dashed")}
            style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px" }}
          >
            - - -
          </button>

          {/* Flip direction */}
          <button
            type="button"
            className="fs-mini"
            title="Reverse Direction"
            onClick={() =>
              onPatchEdge &&
              onPatchEdge(
                {
                  from: singleEdge.to,
                  to: singleEdge.from,
                  fromPort: singleEdge.toPort || "right",
                  toPort: singleEdge.fromPort || "left",
                  waypoints: singleEdge.waypoints
                    ? [...singleEdge.waypoints].reverse()
                    : null,
                },
                "hud_flip"
              )
            }
          >
            <ArrowLeftRight size={13} />
          </button>

          {/* Delete connection */}
          {onDelete && (
            <button
              type="button"
              className="fs-mini"
              title="Delete Connection"
              onClick={onDelete}
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
