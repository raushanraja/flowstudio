import { useState, useRef } from "react";
import { Map, ChevronDown, ChevronUp } from "lucide-react";

export default function Minimap({
  nodes = [],
  cam = { x: 0, y: 0, zoom: 1 },
  onPanToWorld,
  simMode = false,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const isDraggingRef = useRef(false);

  if (simMode || !nodes.length) return null;

  const MAP_W = 190;
  const MAP_H = 120;
  const PAD = 8;

  const winW = typeof window !== "undefined" ? window.innerWidth : 1200;
  const winH = typeof window !== "undefined" ? window.innerHeight : 800;

  // Viewport in world space
  const viewX = -cam.x / cam.zoom;
  const viewY = -cam.y / cam.zoom;
  const viewW = winW / cam.zoom;
  const viewH = winH / cam.zoom;

  // Combined bounds (nodes + current viewport)
  const nodeMinX = Math.min(...nodes.map((n) => n.x));
  const nodeMinY = Math.min(...nodes.map((n) => n.y));
  const nodeMaxX = Math.max(...nodes.map((n) => n.x + n.w));
  const nodeMaxY = Math.max(...nodes.map((n) => n.y + n.h));

  const bMinX = Math.min(nodeMinX - 80, viewX - 40);
  const bMinY = Math.min(nodeMinY - 80, viewY - 40);
  const bMaxX = Math.max(nodeMaxX + 80, viewX + viewW + 40);
  const bMaxY = Math.max(nodeMaxY + 80, viewY + viewH + 40);

  const bW = Math.max(100, bMaxX - bMinX);
  const bH = Math.max(80, bMaxY - bMinY);

  const scale = Math.min((MAP_W - PAD * 2) / bW, (MAP_H - PAD * 2) / bH);

  const toMapX = (wx) => PAD + (wx - bMinX) * scale;
  const toMapY = (wy) => PAD + (wy - bMinY) * scale;

  const toWorldX = (mx) => bMinX + (mx - PAD) / scale;
  const toWorldY = (my) => bMinY + (my - PAD) / scale;

  // Viewport rect on minimap
  const vpX = toMapX(viewX);
  const vpY = toMapY(viewY);
  const vpW = Math.max(6, viewW * scale);
  const vpH = Math.max(6, viewH * scale);

  const handlePointerAction = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const targetWx = toWorldX(mx);
    const targetWy = toWorldY(my);

    if (onPanToWorld) {
      onPanToWorld(targetWx, targetWy);
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    handlePointerAction(e);

    const onMove = (me) => {
      if (!isDraggingRef.current) return;
      const el = document.getElementById("fs-minimap-svg");
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = me.clientX - rect.left;
      const my = me.clientY - rect.top;
      onPanToWorld(toWorldX(mx), toWorldY(my));
    };

    const onUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="fs-glass"
      style={{
        position: "absolute",
        bottom: 68,
        right: 16,
        zIndex: 25,
        borderRadius: 14,
        padding: collapsed ? "6px 10px" : "8px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
        border: "1px solid var(--border-hard)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        userSelect: "none",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          gap: 12,
        }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Map size={13} style={{ color: "var(--muted)" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text)" }}>
            Radar
          </span>
        </div>
        <button
          type="button"
          className="fs-mini"
          style={{ width: 18, height: 18, padding: 0 }}
          title={collapsed ? "Expand Minimap" : "Collapse Minimap"}
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* SVG Canvas Map */}
      {!collapsed && (
        <svg
          id="fs-minimap-svg"
          width={MAP_W}
          height={MAP_H}
          onMouseDown={handleMouseDown}
          style={{
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: 8,
            cursor: "crosshair",
            overflow: "hidden",
            display: "block",
          }}
        >
          {/* Node Silhouettes */}
          {nodes.map((n) => {
            const nx = toMapX(n.x);
            const ny = toMapY(n.y);
            const nw = Math.max(2, n.w * scale);
            const nh = Math.max(2, n.h * scale);
            const isGroup = n.type === "group";

            return (
              <rect
                key={n.id}
                x={nx}
                y={ny}
                width={nw}
                height={nh}
                rx={isGroup ? 3 : 2}
                fill={isGroup ? "rgba(148, 163, 184, 0.15)" : n.stroke || "var(--accent)"}
                stroke={isGroup ? "rgba(148, 163, 184, 0.4)" : "none"}
                strokeWidth={isGroup ? 0.75 : 0}
                opacity={isGroup ? 0.6 : 0.85}
              />
            );
          })}

          {/* Camera Viewport Indicator */}
          <rect
            x={vpX}
            y={vpY}
            width={vpW}
            height={vpH}
            rx={3}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="var(--accent)"
            strokeWidth={1.5}
            strokeDasharray="3 2"
            pointerEvents="none"
          />
        </svg>
      )}
    </div>
  );
}
