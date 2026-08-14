import { uid, MONO } from "./utils.js";
import { autoPort } from "./geometry.js";

const SHAPE_MAP = {
  square: "rect",
  squareRect: "rect",
  rect: "rect",
  rounded: "rounded",
  roundedRect: "rounded",
  stadium: "pill",
  pill: "pill",
  circle: "ellipse",
  ellipse: "ellipse",
  doublecircle: "ellipse",
  diamond: "diamond",
  question: "diamond",
  diam: "diamond",
  cylinder: "cylinder",
  cyl: "cylinder",
  db: "cylinder",
  database: "cylinder",
  hexagon: "rect",
  hex: "rect",
  parallelogram: "rect",
  leanright: "rect",
  leanleft: "rect",
  trapezoid: "rect",
  invtrapezoid: "rect",
  subroutine: "rect",
};

const DEFAULT_COLORS = [
  { stroke: "#2563eb", fill: "#dbeafe", text: "#1d4ed8" },
  { stroke: "#7c3aed", fill: "#ede9fe", text: "#6d28d9" },
  { stroke: "#16a34a", fill: "#dcfce7", text: "#15803d" },
  { stroke: "#ea580c", fill: "#ffedd5", text: "#c2410c" },
  { stroke: "#dc2626", fill: "#fee2e2", text: "#b91c1c" },
  { stroke: "#71717a", fill: "#e8e8ea", text: "#3f3f46" },
];

function parseStyles(styles = []) {
  const out = {};
  for (const s of styles) {
    const i = s.indexOf(":");
    if (i < 0) continue;
    const k = s.slice(0, i).trim().toLowerCase();
    const v = s.slice(i + 1).trim();
    if (k === "fill" && v && v !== "none") out.fill = v;
    else if (k === "stroke" && v && v !== "none") out.stroke = v;
    else if (k === "color" && v) out.text = v;
  }
  return out;
}

function pickColor(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return DEFAULT_COLORS[h % DEFAULT_COLORS.length];
}

export function extractMermaidSource(text) {
  const fences = [...text.matchAll(/```mermaid[\w-]*\s*\n?([\s\S]*?)```/g)];
  if (fences.length) return fences.map((f) => f[1].trim()).find(Boolean) || "";
  return text.trim();
}

let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) mermaidPromise = import("mermaid").then((m) => m.default);
  return mermaidPromise;
}

const attr = (v) => String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

let hostEl = null;
function mountSvg(svgStr) {
  if (!hostEl) {
    hostEl = document.createElement("div");
    hostEl.style.cssText =
      "position:fixed;left:-100000px;top:0;width:10px;height:10px;visibility:hidden;pointer-events:none;overflow:hidden";
    document.body.appendChild(hostEl);
  }
  hostEl.innerHTML = svgStr;
  return hostEl.querySelector("svg");
}

function sideMidpoints(n) {
  return {
    top: { x: n.x + n.w / 2, y: n.y },
    right: { x: n.x + n.w, y: n.y + n.h / 2 },
    bottom: { x: n.x + n.w / 2, y: n.y + n.h },
    left: { x: n.x, y: n.y + n.h / 2 },
  };
}

function nearestSide(n, p) {
  const mids = sideMidpoints(n);
  let best = "right",
    bestD = Infinity;
  for (const side of ["top", "right", "bottom", "left"]) {
    const m = mids[side];
    const d = Math.hypot(m.x - p.x, m.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = side;
    }
  }
  return { side: best, d: bestD, mid: mids[best] };
}

// The polyline stored in mermaid's `data-points` already starts and ends on
// the node *shape* boundary (mermaid clips both ends via the shape intersect
// functions before serializing it). Keeping every point verbatim is what
// makes the re-render identical to mermaid's; only consecutive duplicates
// are dropped.
function dedupePoints(pts) {
  const out = [];
  for (const p of pts) {
    const last = out[out.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 0.5) continue;
    out.push({ x: p.x, y: p.y });
  }
  return out;
}

function deriveRoute(a, b, pts) {
  if (!pts || pts.length < 2) {
    return { fromPort: autoPort(a, b), toPort: autoPort(b, a), waypoints: undefined };
  }
  const start = pts[0];
  const end = pts[pts.length - 1];
  const from = nearestSide(a, start);
  const to = nearestSide(b, end);
  return {
    fromPort: from.side,
    toPort: to.side,
    waypoints: dedupePoints(pts).slice(0, 200),
  };
}

export async function mermaidTextToDiagram(source) {
  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    themeVariables: { fontFamily: MONO, fontSize: "14px" },
  });
  const parsed = await mermaid.parse(source);
  if (parsed.diagramType !== "flowchart-v2")
    throw new Error(
      `Only flowchart diagrams are supported (got "${parsed.diagramType}")`,
    );

  const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
  const db = diagram.db;
  const { nodes: srcNodes, edges: srcEdges } = db.getData();

  const renderId = `fs${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
  const { svg } = await mermaid.render(renderId, source);
  const svgEl = mountSvg(svg);

  try {
    const boxes = new Map();
    for (const n of srcNodes) {
      const domId = `${renderId}-${n.domId || n.id}`;
      const el = document.getElementById(domId);
      if (!el || typeof el.getBBox !== "function") continue;
      const bb = el.getBBox();
      if (bb.width <= 0 || bb.height <= 0) continue;
      const tm = /translate\(\s*([-+\d.e]+)[\s,]+([-+\d.e]+)/.exec(
        el.getAttribute("transform") || "",
      );
      const tx = tm ? +tm[1] : 0;
      const ty = tm ? +tm[2] : 0;
      boxes.set(n.id, {
        x: tx + bb.x,
        y: ty + bb.y,
        w: bb.width,
        h: bb.height,
      });
    }
    const routes = new Map();
    for (const e of srcEdges) {
      const p = svgEl.querySelector(
        `path[data-id="${attr(e.id)}"][data-points]`,
      );
      if (!p) continue;
      try {
        const pts = JSON.parse(atob(p.getAttribute("data-points")));
        if (Array.isArray(pts) && pts.length >= 2) routes.set(e.id, pts);
      } catch {
        /* undecodable route — fall back to straight edge */
      }
    }

    const rawStyles = new Map();
    for (const [id, v] of db.getVertices?.() ?? [])
      rawStyles.set(id, parseStyles(v.styles));

    const nodes = srcNodes.map((n) => {
      const type = n.isGroup ? "group" : SHAPE_MAP[n.shape] || "rect";
      const c = { ...pickColor(n.label || n.id), ...rawStyles.get(n.id) };
      const bb = boxes.get(n.id);
      return {
        id: n.id,
        type,
        x: bb ? Math.round(bb.x) : 0,
        y: bb ? Math.round(bb.y) : 0,
        w: bb ? Math.round(bb.w) : 180,
        h: bb ? Math.round(bb.h) : 56,
        fill: n.isGroup ? "rgba(130,130,140,.08)" : c.fill,
        stroke: c.stroke,
        textColor: c.text,
        strokeWidth: 2,
        fontSize: 14,
        text: n.isGroup
          ? n.label || "Group"
          : (n.label || n.id).replace(/<br\/?>/gi, "\n"),
        badge: "",
        parentId: n.parentId || null,
      };
    });

    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    for (const g of nodes.filter((n) => n.type === "group")) {
      if (boxes.get(g.id)) continue;
      const kids = nodes.filter((m) => m.parentId === g.id);
      if (kids.length) {
        const x0 = Math.min(...kids.map((k) => k.x)) - 24;
        const y0 = Math.min(...kids.map((k) => k.y)) - 46;
        const x1 = Math.max(...kids.map((k) => k.x + k.w)) + 24;
        const y1 = Math.max(...kids.map((k) => k.y + k.h)) + 24;
        g.x = x0;
        g.y = y0;
        g.w = x1 - x0;
        g.h = y1 - y0;
      }
    }

    const edges = srcEdges
      .filter((e) => nodeById.has(e.start) && nodeById.has(e.end))
      .map((e) => {
        const route = deriveRoute(nodeById.get(e.start), nodeById.get(e.end), routes.get(e.id));
        return {
          id: uid("e"),
          from: e.start,
          fromPort: route.fromPort,
          to: e.end,
          toPort: route.toPort,
          stroke: "#a1a1aa",
          strokeWidth: 2,
          dashed: e.pattern === "dotted" || e.pattern === "dashed",
          arrow: e.arrowTypeEnd !== "none",
          label: e.label ? e.label.replace(/<br\/?>/gi, "\n") : "",
          curve: "basis",
          waypoints: route.waypoints,
        };
      });

    return { nodes, edges };
  } finally {
    if (hostEl) hostEl.innerHTML = "";
  }
}
