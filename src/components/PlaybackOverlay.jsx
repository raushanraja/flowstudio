import { useEffect, useMemo, useRef } from "react";
import { edgeGeom } from "../lib/geometry.js";
import { NodeShape } from "./Shapes.jsx";

function restoreTrailStrokes(svg) {
  if (!svg) return;
  svg.querySelectorAll("[data-edge-path]").forEach((p) => {
    const base = p.getAttribute("data-base-stroke");
    if (base) p.setAttribute("stroke", base);
  });
}

export default function PlaybackOverlay({
  playback,
  frame,
  playing,
  edges = [],
  byId = {},
  svgRef,
  T = {},
  onChoose,
}) {
  const s = playback?.snapshot() ?? null;
  const token = s?.tokens?.[0] ?? null;
  const activeNode = (s?.activeNode && byId[s.activeNode]) || null;
  const activeEdge = token?.edge
    ? edges.find((e) => e.id === token.edge) || null
    : null;
  const activeGeom = useMemo(
    () => (activeEdge ? edgeGeom(activeEdge, byId) : null),
    [activeEdge, byId],
  );
  const choices =
    s && !token?.edge && !s.done && !playing ? playback.choices() : [];
  const tokenRef = useRef(null);
  const trailKey = useRef("");

  // Token position — imperative per frame
  useEffect(() => {
    const el = tokenRef.current;
    if (!el || !s) return;
    let x = 0,
      y = 0;
    if (token?.edge) {
      const path = svgRef?.current?.querySelector(
        `[data-edge-path="${token.edge}"]`,
      );
      if (path && typeof path.getTotalLength === "function") {
        const len = path.getTotalLength();
        const p = path.getPointAtLength(Math.min(token.t, 0.999) * len);
        x = p.x;
        y = p.y;
        el.style.opacity = 1;
      } else {
        el.style.opacity = 0;
      }
    } else if (activeNode) {
      x = activeNode.x + activeNode.w / 2;
      y = activeNode.y + activeNode.h / 2;
      el.style.opacity = 1;
    } else {
      el.style.opacity = 0;
    }
    el.setAttribute("cx", x);
    el.setAttribute("cy", y);
  }, [frame, playback, byId, svgRef, s, token, activeNode]);

  // Traveled trail: tint the main edge paths accent-colored.
  useEffect(() => {
    if (!s) {
      restoreTrailStrokes(svgRef?.current);
      trailKey.current = "";
      return;
    }
    const trail = new Set(s.history.map((h) => h.edge));
    const key = [...trail].sort().join(",");
    if (key === trailKey.current) return;
    trailKey.current = key;
    const svg = svgRef?.current;
    if (!svg) return;
    svg.querySelectorAll("[data-edge-path]").forEach((p) => {
      const id = p.getAttribute("data-edge-path");
      const base = p.getAttribute("data-base-stroke");
      if (trail.has(id)) p.setAttribute("stroke", `${T?.accent || "#6366f1"}66`);
      else if (base) p.setAttribute("stroke", base);
    });
  }, [frame, s, T, svgRef]);

  // Restore base strokes when the overlay unmounts.
  useEffect(() => {
    return () => {
      restoreTrailStrokes(svgRef?.current);
    };
  }, [svgRef]);

  if (!s) return null;

  return (
    <g data-overlay pointerEvents="none">
      {activeGeom && (
        <path
          d={activeGeom.d}
          pathLength={1}
          fill="none"
          stroke={T?.accent || "#6366f1"}
          strokeWidth={3}
          strokeDasharray="0.14 0.86"
          className="fs-edge-pulse"
        />
      )}
      {activeNode && (
        <g className="fs-node-glow">
          <NodeShape
            n={{
              ...activeNode,
              fill: `${T?.accent || "#6366f1"}1f`,
              stroke: T?.accent || "#6366f1",
              strokeWidth: 3,
              dashed: false,
            }}
          />
        </g>
      )}
      {choices.length > 1 && (
        <g pointerEvents="all">
          {choices.map((c, i) => {
            const n = byId[s.activeNode];
            if (!n) return null;
            const y = n.y + n.h + 10 + i * 24;
            return (
              <g
                key={c.id}
                style={{ cursor: "pointer" }}
                onClick={() => onChoose && onChoose(c.id)}
              >
                <rect
                  x={n.x + n.w / 2 - 52}
                  y={y - 10}
                  width={104}
                  height={20}
                  rx={10}
                  fill={T?.accent || "#6366f1"}
                  stroke={T?.bg || "#ffffff"}
                  strokeWidth={2}
                />
                <text
                  x={n.x + n.w / 2}
                  y={y + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={700}
                  fontFamily="'JetBrains Mono', monospace"
                  fill={T?.bg || "#ffffff"}
                  pointerEvents="none"
                >
                  {c.label.length > 16 ? c.label.slice(0, 15) + "…" : c.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
      <circle
        ref={tokenRef}
        r={6}
        fill={T?.accent || "#6366f1"}
        stroke={T?.bg || "#ffffff"}
        strokeWidth={2.5}
        opacity={0}
        style={{ filter: `drop-shadow(0 0 4px ${T?.accent || "#6366f1"})` }}
      />
    </g>
  );
}
