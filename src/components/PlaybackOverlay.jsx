import { useEffect, useMemo, useRef } from "react";
import { edgeGeom } from "../lib/geometry.js";
import { NodeShape } from "./Shapes.jsx";

const SERVICE_COLOR = "#f59e0b";
const NO_SERVICES = [];

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
  mode = "run",
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
  // Run mode: options appear while awaiting a branch or paused at a node.
  // Demo mode: always available (during dwell and even mid-flight, where a
  // click queues the branch for the destination being reached).
  const choices =
    s && !s.done && (s.awaiting || !playing || mode === "demo")
      ? playback.choices()
      : [];
  const choicesNode =
    (token?.edge && activeEdge && byId[activeEdge.to]) || activeNode;
  const services = s?.services ?? NO_SERVICES;
  const tokenRef = useRef(null);
  const serviceRefs = useRef(new Map());
  const trailKey = useRef("");

  // Token position — imperative per frame
  useEffect(() => {
    const place = (el, tk, node) => {
      if (!el) return;
      let x = 0,
        y = 0;
      if (tk?.edge) {
        const path = svgRef?.current?.querySelector(
          `[data-edge-path="${tk.edge}"]`,
        );
        if (path && typeof path.getTotalLength === "function") {
          const len = path.getTotalLength();
          const p = path.getPointAtLength(Math.min(tk.t, 0.999) * len);
          x = p.x;
          y = p.y;
          el.style.opacity = 1;
        } else {
          el.style.opacity = 0;
        }
      } else if (node) {
        x = node.x + node.w / 2;
        y = node.y + node.h / 2;
        el.style.opacity = 1;
      } else {
        el.style.opacity = 0;
      }
      el.setAttribute("cx", x);
      el.setAttribute("cy", y);
    };
    place(tokenRef.current, token, activeNode);
    for (const svc of services) {
      place(serviceRefs.current.get(svc.id), svc, byId[svc.activeNode]);
    }
  }, [frame, playback, byId, svgRef, s, token, activeNode, services]);

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
    const svgEl = svgRef?.current;
    return () => {
      restoreTrailStrokes(svgEl);
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
      {services.map((svc) => {
        const n = byId[svc.activeNode];
        if (!n) return null;
        return (
          <g key={svc.id} opacity={0.85} pointerEvents="none">
            <NodeShape
              n={{
                ...n,
                fill: `${SERVICE_COLOR}12`,
                stroke: SERVICE_COLOR,
                strokeWidth: 2,
                dashed: true,
              }}
            />
          </g>
        );
      })}
      {s.awaiting && choicesNode && (
        <g pointerEvents="none">
          <rect
            x={choicesNode.x + choicesNode.w / 2 - 46}
            y={choicesNode.y - 26}
            width={92}
            height={18}
            rx={9}
            fill={T?.accent || "#6366f1"}
            opacity={0.95}
          />
          <text
            x={choicesNode.x + choicesNode.w / 2}
            y={choicesNode.y - 13}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fontFamily="'JetBrains Mono', monospace"
            fill={T?.bg || "#ffffff"}
          >
            Choose next…
          </text>
        </g>
      )}
      {choices.length > 1 && (
        <g pointerEvents="all">
          {choices.map((c, i) => {
            const n = choicesNode;
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
      {services.map((svc) => (
        <circle
          key={svc.id}
          ref={(el) => {
            if (el) serviceRefs.current.set(svc.id, el);
            else serviceRefs.current.delete(svc.id);
          }}
          data-service-token={svc.id}
          r={4.5}
          fill={SERVICE_COLOR}
          stroke={T?.bg || "#ffffff"}
          strokeWidth={2}
          opacity={0}
          style={{ filter: `drop-shadow(0 0 3px ${SERVICE_COLOR})` }}
        />
      ))}
    </g>
  );
}
