import { uid } from "./utils.js";
import { isTheme } from "./theme.js";

const PORT_SIDES = ["top", "right", "bottom", "left"];
const CURVE_TYPES = ["basis", "rounded", "linear"];
const SHAPE_TYPES = [
  "rect",
  "rounded",
  "pill",
  "diamond",
  "ellipse",
  "cylinder",
  "text",
  "group",
];
const num = (v, fallback) =>
  Number.isFinite(+v) && +v > 0 ? +v : fallback;
const str = (v, fallback) => (typeof v === "string" ? v : fallback);

export function normalizeDiagram(data) {
  if (!data || !Array.isArray(data.nodes)) return null;
  const ids = new Set();
  const nodes = [];
  for (const n of data.nodes) {
    if (!n || typeof n !== "object") continue;
    let id = str(n.id, "");
    if (!id || ids.has(id)) id = uid();
    ids.add(id);
    nodes.push({
      id,
      type: SHAPE_TYPES.includes(n.type) ? n.type : "rect",
      x: Number.isFinite(+n.x) ? +n.x : 0,
      y: Number.isFinite(+n.y) ? +n.y : 0,
      w: num(n.w, 180),
      h: num(n.h, 56),
      fill: str(n.fill, "#ffffff"),
      stroke: str(n.stroke, "#a1a1aa"),
      textColor: str(n.textColor, "#3f3f46"),
      strokeWidth: num(n.strokeWidth, 2),
      fontSize: num(n.fontSize, 14),
      text: str(n.text, ""),
      badge: str(n.badge, ""),
      dashed: !!n.dashed,
      parentId: null,
      dwellMs:
        Number.isFinite(+n.dwellMs) && +n.dwellMs >= 0
          ? +n.dwellMs
          : undefined,
      isService: !!n.isService,
      serviceIntervalMs:
        Number.isFinite(+n.serviceIntervalMs) && +n.serviceIntervalMs > 0
          ? +n.serviceIntervalMs
          : undefined,
    });
  }
  const idSet = new Set(nodes.map((n) => n.id));
  for (const n of data.nodes) {
    if (!n || typeof n !== "object") continue;
    if (n.parentId && idSet.has(n.parentId))
      nodes.find((m) => m.id === n.id).parentId = n.parentId;
  }
  const edges = [];
  if (Array.isArray(data.edges)) {
    const edgeIds = new Set();
    for (const e of data.edges) {
      if (!e || !idSet.has(e.from) || !idSet.has(e.to)) continue;
      const id = str(e.id, "");
      edges.push({
        id: id && !edgeIds.has(id) ? id : uid("e"),
        from: e.from,
        to: e.to,
        fromPort: PORT_SIDES.includes(e.fromPort) ? e.fromPort : "right",
        toPort: PORT_SIDES.includes(e.toPort) ? e.toPort : "left",
        stroke: str(e.stroke, "#a1a1aa"),
        strokeWidth: num(e.strokeWidth, 2),
        dashed: !!e.dashed,
        arrow: e.arrow !== false,
        arrowStart: !!e.arrowStart,
        label: str(e.label, ""),
        textColor: str(e.textColor, undefined),
        labelBg: str(e.labelBg, undefined),
        fontSize: num(e.fontSize, undefined),
        labelDx: Number.isFinite(+e.labelDx) ? +e.labelDx : undefined,
        labelDy: Number.isFinite(+e.labelDy) ? +e.labelDy : undefined,
        curve: CURVE_TYPES.includes(e.curve) ? e.curve : undefined,
        travelMs:
          Number.isFinite(+e.travelMs) && +e.travelMs > 0
            ? +e.travelMs
            : undefined,
        toPos:
          e.toPos &&
          Number.isFinite(+e.toPos.x) &&
          Number.isFinite(+e.toPos.y)
            ? { x: +e.toPos.x, y: +e.toPos.y }
            : undefined,
        fromPos:
          e.fromPos &&
          Number.isFinite(+e.fromPos.x) &&
          Number.isFinite(+e.fromPos.y)
            ? { x: +e.fromPos.x, y: +e.fromPos.y }
            : undefined,
        waypoints: Array.isArray(e.waypoints)
          ? e.waypoints
              .filter(
                (w) => w && Number.isFinite(+w.x) && Number.isFinite(+w.y),
              )
              .slice(0, 200)
              .map((w) => ({ x: +w.x, y: +w.y }))
          : undefined,
      });
      edgeIds.add(edges[edges.length - 1].id);
    }
  }
  const scenarios = [];
  if (Array.isArray(data.scenarios)) {
    const seen = new Set();
    for (const s of data.scenarios) {
      if (!s || typeof s !== "object" || !s.name) continue;
      let id = str(s.id, "");
      if (!id || seen.has(id)) id = uid("sc");
      seen.add(id);
      const choices = {};
      if (s.choices && typeof s.choices === "object") {
        for (const [nodeId, edgeId] of Object.entries(s.choices)) {
          if (
            idSet.has(nodeId) &&
            edges.some((e) => e.from === nodeId && e.id === edgeId)
          )
            choices[nodeId] = edgeId;
        }
      }
      const loopExits = {};
      if (s.loopExits && typeof s.loopExits === "object") {
        for (const [nodeId, edgeId] of Object.entries(s.loopExits)) {
          if (
            idSet.has(nodeId) &&
            edges.some((e) => e.from === nodeId && e.id === edgeId)
          )
            loopExits[nodeId] = edgeId;
        }
      }
      scenarios.push({
        id,
        name: String(s.name).slice(0, 60),
        startId:
          typeof s.startId === "string" && idSet.has(s.startId)
            ? s.startId
            : undefined,
        choices,
        loopExits,
        maxLoopRetries: Number.isFinite(+s.maxLoopRetries) ? +s.maxLoopRetries : 1,
      });
    }
  }
  return {
    nodes,
    edges,
    theme: isTheme(data.theme) ? data.theme : "light",
    scenarios,
    activeScenarioId:
      typeof data.activeScenarioId === "string" &&
      scenarios.some((s) => s.id === data.activeScenarioId)
        ? data.activeScenarioId
        : null,
    playMode: data.playMode === "demo" ? "demo" : "run",
    demoIntervalMs: num(data.demoIntervalMs, 3000),
  };
}
