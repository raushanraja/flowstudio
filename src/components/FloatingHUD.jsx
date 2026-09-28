import { useState } from "react";
import {
  CopyPlus,
  Trash2,
  Group,
  Spline,
  CornerDownRight,
  ArrowLeftRight,
  Type,
} from "lucide-react";
import { ShapeIcon } from "./Shapes.jsx";
import {
  presetsForTheme,
  presetStroke,
  presetFill,
  presetText,
} from "../lib/theme.js";
import { edgeGeom } from "../lib/geometry.js";

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
  onEditLabel,
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
  let placeBelow = false;

  if (hasNodes) {
    const selectedNodes = nodes.filter((n) => sel.nodes.includes(n.id));
    if (!selectedNodes.length) return null;

    const minX = Math.min(...selectedNodes.map((n) => n.x));
    const minY = Math.min(...selectedNodes.map((n) => n.y));
    const maxX = Math.max(...selectedNodes.map((n) => n.x + n.w));
    const maxY = Math.max(...selectedNodes.map((n) => n.y + n.h));

    cx = cam.x + ((minX + maxX) / 2) * cam.zoom;
    const topScreenY = cam.y + minY * cam.zoom;
    const bottomScreenY = cam.y + maxY * cam.zoom;

    // Generous clearance: place 20px above top handles
    const CLEARANCE = 20;
    if (topScreenY - 60 < 70) {
      cy = bottomScreenY + CLEARANCE;
      placeBelow = true;
    } else {
      cy = topScreenY - CLEARANCE;
      placeBelow = false;
    }
  } else if (hasSingleEdge) {
    const e = edges.find((ed) => ed.id === sel.edges[0]);
    if (!e) return null;

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const g = edgeGeom(e, byId);
    let midPoint = g?.mid;
    if (!midPoint) {
      const nFrom = byId[e.from];
      const nTo = byId[e.to];
      if (nFrom && nTo) {
        midPoint = {
          x: (nFrom.x + nFrom.w / 2 + (nTo.x + nTo.w / 2)) / 2,
          y: (nFrom.y + nFrom.h / 2 + (nTo.y + nTo.h / 2)) / 2,
        };
      }
    }
    if (!midPoint) return null;

    cx = cam.x + midPoint.x * cam.zoom;
    const midScreenY = cam.y + midPoint.y * cam.zoom;
    const CLEARANCE = 26;
    if (midScreenY - 60 < 70) {
      cy = midScreenY + CLEARANCE;
      placeBelow = true;
    } else {
      cy = midScreenY - CLEARANCE;
      placeBelow = false;
    }
  }

  // Viewport clamping
  const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const clampedX = Math.max(180, Math.min(winW - 180, cx));
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
        transform: placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
        zIndex: 28,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 14,
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.32), 0 2px 8px rgba(0, 0, 0, 0.12)",
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
                className={`fs-hud-btn ${showShapePicker ? "on" : ""}`}
                title={`Change Shape (Current: ${single.type})`}
                onClick={() => setShowShapePicker((v) => !v)}
                style={{ width: 34, height: 32 }}
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
                    marginBottom: 10,
                    display: "flex",
                    gap: 4,
                    padding: 6,
                    borderRadius: 12,
                    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
                    border: "1px solid var(--border-hard)",
                  }}
                >
                  {MORPH_SHAPES.map((s) => (
                    <button
                      key={s.type}
                      type="button"
                      className={`fs-hud-btn ${single.type === s.type ? "on" : ""}`}
                      title={s.label}
                      onClick={() => {
                        if (onMorphShape) onMorphShape(s.type);
                        setShowShapePicker(false);
                      }}
                      style={{ width: 34, height: 32 }}
                    >
                      <ShapeIcon type={s.type} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Color Swatches */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 4px" }}>
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
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: fill,
                    border: `2px solid ${stroke}`,
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
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

          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />

          {/* Group button if multiple nodes selected */}
          {sel.nodes.length > 1 && onGroup && (
            <button
              type="button"
              className="fs-hud-btn"
              title="Group Selection (Ctrl+G)"
              onClick={onGroup}
            >
              <Group size={16} />
            </button>
          )}

          {/* Duplicate button */}
          {onDuplicate && (
            <button
              type="button"
              className="fs-hud-btn"
              title="Duplicate (Ctrl+D / Alt+Drag)"
              onClick={onDuplicate}
            >
              <CopyPlus size={16} />
            </button>
          )}

          {/* Delete button */}
          {onDelete && (
            <button
              type="button"
              className="fs-hud-btn"
              title="Delete (Del)"
              onClick={onDelete}
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}

      {/* Edge Controls */}
      {hasSingleEdge && singleEdge && (
        <>
          {/* Routing mode buttons */}
          {[
            {
              mode: "curved",
              title: "Curved Routing",
              icon: <Spline size={16} />,
            },
            {
              mode: "orthogonal",
              title: "Orthogonal Routing",
              icon: <CornerDownRight size={16} />,
            },
            {
              mode: "straight",
              title: "Straight Line",
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
                </svg>
              ),
            },
          ].map(({ mode, title, icon }) => {
            const isSelected = (singleEdge.routing || "curved") === mode;
            return (
              <button
                key={mode}
                type="button"
                className={`fs-hud-btn ${isSelected ? "on" : ""}`}
                title={title}
                onClick={() => onPatchEdge && onPatchEdge({ routing: mode }, "hud_routing")}
              >
                {icon}
              </button>
            );
          })}

          <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px" }} />

          {/* Dashed toggle */}
          <button
            type="button"
            className={`fs-hud-btn ${singleEdge.dashed ? "on" : ""}`}
            title="Toggle Dashed Line"
            onClick={() => onPatchEdge && onPatchEdge({ dashed: !singleEdge.dashed }, "hud_dashed")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="5 4" strokeLinecap="round" />
            </svg>
          </button>

          {/* Edit Label button */}
          {onEditLabel && (
            <button
              type="button"
              className="fs-hud-btn"
              title="Edit Link Label (Double Click on Link)"
              onClick={() => onEditLabel(singleEdge.id, singleEdge.label || "")}
            >
              <Type size={16} />
            </button>
          )}

          {/* Flip direction */}
          <button
            type="button"
            className="fs-hud-btn"
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
            <ArrowLeftRight size={15} />
          </button>

          {/* Delete connection */}
          {onDelete && (
            <button
              type="button"
              className="fs-hud-btn"
              title="Delete Connection"
              onClick={onDelete}
              style={{ color: "#ef4444" }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
