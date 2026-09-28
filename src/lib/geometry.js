import { curveBasis, curveLinear, line } from "d3-shape";
import { clamp } from "./utils.js";

/*
 * Mermaid-faithful edge rendering.
 *
 * Mermaid's flowchart renderer (dagre-wrapper/edges.ts) produces edge paths
 * like this:
 *   1. dagre layout emits a polyline from source center to target center;
 *   2. both ends are clipped onto the node *shape* boundary via the shape's
 *      intersect() function (these clipped points are what `data-points`
 *      carries — the import stores them verbatim as edge waypoints);
 *   3. `fixCorners` inserts two helper points 5px back along each sharp
 *      orthogonal corner so basis/linear curves turn corners cleanly instead
 *      of bulging through other nodes;
 *   4. the final `d` is a d3 `curveBasis` spline through the fixed points
 *      (flowchart default), or `generateRoundedPath` for orthogonal elbows.
 *
 * The helpers below are direct ports of mermaid v11's code so imported
 * diagrams render pixel-identical to mermaid's own output.
 */

function findAdjacentPoint(pointA, pointB, distance) {
  const xDiff = pointB.x - pointA.x;
  const yDiff = pointB.y - pointA.y;
  const length = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  const ratio = distance / length;
  return { x: pointB.x - ratio * xDiff, y: pointB.y - ratio * yDiff };
}

function extractCornerPoints(points) {
  const cornerPoints = [];
  const cornerPointPositions = [];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (
      prev.x === curr.x &&
      curr.y === next.y &&
      Math.abs(curr.x - next.x) > 5 &&
      Math.abs(curr.y - prev.y) > 5
    ) {
      cornerPoints.push(curr);
      cornerPointPositions.push(i);
    } else if (
      prev.y === curr.y &&
      curr.x === next.x &&
      Math.abs(curr.x - prev.x) > 5 &&
      Math.abs(curr.y - next.y) > 5
    ) {
      cornerPoints.push(curr);
      cornerPointPositions.push(i);
    }
  }
  return { cornerPoints, cornerPointPositions };
}

// Port of mermaid's fixCorners(): doubles the corner control point so
// basis/linear curves hug the elbow instead of overshooting it.
export function mermaidFixCorners(lineData) {
  const { cornerPointPositions } = extractCornerPoints(lineData);
  const newLineData = [];
  for (let i = 0; i < lineData.length; i++) {
    if (cornerPointPositions.includes(i)) {
      const prevPoint = lineData[i - 1];
      const nextPoint = lineData[i + 1];
      const cornerPoint = lineData[i];
      const newPrevPoint = findAdjacentPoint(prevPoint, cornerPoint, 5);
      const newNextPoint = findAdjacentPoint(nextPoint, cornerPoint, 5);
      const xDiff = newNextPoint.x - newPrevPoint.x;
      const yDiff = newNextPoint.y - newPrevPoint.y;
      newLineData.push(newPrevPoint);
      const a = Math.sqrt(2) * 2;
      let newCornerPoint = { x: cornerPoint.x, y: cornerPoint.y };
      if (
        Math.abs(nextPoint.x - prevPoint.x) > 10 &&
        Math.abs(nextPoint.y - prevPoint.y) >= 10
      ) {
        const r = 5;
        if (cornerPoint.x === newPrevPoint.x) {
          newCornerPoint = {
            x: xDiff < 0 ? newPrevPoint.x - r + a : newPrevPoint.x + r - a,
            y: yDiff < 0 ? newPrevPoint.y - a : newPrevPoint.y + a,
          };
        } else {
          newCornerPoint = {
            x: xDiff < 0 ? newPrevPoint.x - a : newPrevPoint.x + a,
            y: yDiff < 0 ? newPrevPoint.y - r + a : newPrevPoint.y + r - a,
          };
        }
      }
      newLineData.push(newCornerPoint, newNextPoint);
    } else {
      newLineData.push(lineData[i]);
    }
  }
  return newLineData;
}

// Port of mermaid's generateRoundedPath(): orthogonal elbows with 5px
// quadratic corner arcs — the `flowchart.curve: 'rounded'` look.
export function mermaidRoundedPath(points, radius = 5) {
  if (points.length < 2) return "";
  let path = "";
  const size = points.length;
  const epsilon = 1e-5;
  for (let i = 0; i < size; i++) {
    const currPoint = points[i];
    const prevPoint = points[i - 1];
    const nextPoint = points[i + 1];
    if (i === 0) {
      path += `M${currPoint.x},${currPoint.y}`;
    } else if (i === size - 1) {
      path += `L${currPoint.x},${currPoint.y}`;
    } else {
      const dx1 = currPoint.x - prevPoint.x;
      const dy1 = currPoint.y - prevPoint.y;
      const dx2 = nextPoint.x - currPoint.x;
      const dy2 = nextPoint.y - currPoint.y;
      const len1 = Math.hypot(dx1, dy1);
      const len2 = Math.hypot(dx2, dy2);
      if (len1 < epsilon || len2 < epsilon) {
        path += `L${currPoint.x},${currPoint.y}`;
        continue;
      }
      const nx1 = dx1 / len1;
      const ny1 = dy1 / len1;
      const nx2 = dx2 / len2;
      const ny2 = dy2 / len2;
      const dot = nx1 * nx2 + ny1 * ny2;
      const clampedDot = Math.max(-1, Math.min(1, dot));
      const angle = Math.acos(clampedDot);
      if (angle < epsilon || Math.abs(Math.PI - angle) < epsilon) {
        path += `L${currPoint.x},${currPoint.y}`;
        continue;
      }
      const cutLen = Math.min(radius / Math.sin(angle / 2), len1 / 2, len2 / 2);
      const startX = currPoint.x - nx1 * cutLen;
      const startY = currPoint.y - ny1 * cutLen;
      const endX = currPoint.x + nx2 * cutLen;
      const endY = currPoint.y + ny2 * cutLen;
      path += `L${startX},${startY}`;
      path += `Q${currPoint.x},${currPoint.y} ${endX},${endY}`;
    }
  }
  return path;
}

const curveLine = line()
  .x((p) => p.x)
  .y((p) => p.y);

export function mermaidBasisPath(points) {
  return curveLine.curve(curveBasis)(mermaidFixCorners(points)) || "";
}

export function mermaidLinearPath(points) {
  return curveLine.curve(curveLinear)(mermaidFixCorners(points)) || "";
}

export function portPos(n, side) {
  switch (side) {
    case "top":
      return { x: n.x + n.w / 2, y: n.y, dx: 0, dy: -1 };
    case "bottom":
      return { x: n.x + n.w / 2, y: n.y + n.h, dx: 0, dy: 1 };
    case "left":
      return { x: n.x, y: n.y + n.h / 2, dx: -1, dy: 0 };
    default:
      return { x: n.x + n.w, y: n.y + n.h / 2, dx: 1, dy: 0 };
  }
}

export function autoPort(a, b) {
  const dx = a.x + a.w / 2 - (b.x + b.w / 2),
    dy = a.y + a.h / 2 - (b.y + b.h / 2);
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "left" : "right";
  return dy > 0 ? "top" : "bottom";
}

export function nearestPort(p, n, threshold = 18) {
  let best = null,
    bestD = threshold;
  for (const s of ["top", "right", "bottom", "left"]) {
    const q = portPos(n, s);
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function boundaryPoint(p, n) {
  const cx = clamp(p.x, 0, n.w);
  const cy = clamp(p.y, 0, n.h);
  if (cx !== p.x || cy !== p.y) return { x: cx, y: cy };
  const dx = p.x - n.w / 2,
    dy = p.y - n.h / 2;
  if (!dx && !dy) return { x: n.w / 2, y: 0 };
  const sx = dx ? n.w / 2 / Math.abs(dx) : Infinity;
  const sy = dy ? n.h / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: n.w / 2 + dx * s, y: n.h / 2 + dy * s };
}

// Project a local point onto the visible shape outline (not just the bbox), so
// anchors on diamonds/ellipses attach to the shape instead of floating in space.
export function shapePoint(n, local) {
  const cx = n.w / 2,
    cy = n.h / 2;
  const dx = local.x - cx,
    dy = local.y - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  if (n.type === "ellipse") {
    const rx = n.w / 2,
      ry = n.h / 2;
    const t = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
    return { x: cx + dx * t, y: cy + dy * t };
  }
  if (n.type === "diamond") {
    const t = 1 / (Math.abs(dx) / cx + Math.abs(dy) / cy);
    return { x: cx + dx * t, y: cy + dy * t };
  }
  return boundaryPoint(local, n);
}

function arrowPoints(p, ang, L, W) {
  return `${p.x},${p.y} ${p.x - L * Math.cos(ang - W)},${p.y - L * Math.sin(ang - W)} ${p.x - L * Math.cos(ang + W)},${p.y - L * Math.sin(ang + W)}`;
}

function smoothPath(pts) {
  if (pts.length === 2)
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function pathMid(pts) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segs.push(l);
    total += l;
  }
  let t = total / 2;
  for (let i = 0; i < segs.length; i++) {
    if (t <= segs[i] || i === segs.length - 1) {
      const f = segs[i] ? t / segs[i] : 0;
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
      };
    }
    t -= segs[i];
  }
  return { ...pts[0] };
}

// Port of mermaid's getLineFunctionsWithOffset() endpoint adjustment: the
// last path point is pulled back along the final segment by the arrowhead
// marker height (4px for arrow_point) and the first point is pushed forward
// by the start marker height, so arrowheads land exactly on the node
// boundary. Arrow tips are still drawn at the raw boundary points.
function markerOffsetPoints(pts, arrowStart, arrowEnd) {
  if ((!arrowStart && !arrowEnd) || pts.length < 2) return pts;
  const off = 4;
  const out = pts.slice();
  if (arrowEnd) {
    const last = out[out.length - 1],
      prev = out[out.length - 2];
    const dx = last.x - prev.x,
      dy = last.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    out[out.length - 1] = { x: last.x - (off * dx) / len, y: last.y - (off * dy) / len };
  }
  if (arrowStart) {
    const first = out[0],
      second = out[1];
    const dx = second.x - first.x,
      dy = second.y - first.y;
    const len = Math.hypot(dx, dy) || 1;
    out[0] = { x: first.x + (off * dx) / len, y: first.y + (off * dy) / len };
  }
  return out;
}

export function edgeGeom(e, byId, temp) {
  const a = byId[e.from];
  if (!a) return null;
  let p1;
  if (e.fromPos) {
    const q = shapePoint(a, e.fromPos);
    const len = Math.hypot(q.x - a.w / 2, q.y - a.h / 2) || 1;
    p1 = {
      x: a.x + q.x,
      y: a.y + q.y,
      dx: (q.x - a.w / 2) / len,
      dy: (q.y - a.h / 2) / len,
    };
  } else {
    p1 = portPos(a, e.fromPort);
  }
  const b = e.to ? byId[e.to] : null;
  if (!b && !temp) return null;
  let p2, dx, dy;
  if (b && e.toPos) {
    const q = shapePoint(b, e.toPos);
    p2 = { x: b.x + q.x, y: b.y + q.y };
    const len = Math.hypot(q.x - b.w / 2, q.y - b.h / 2) || 1;
    dx = (q.x - b.w / 2) / len;
    dy = (q.y - b.h / 2) / len;
  } else if (b) {
    p2 = portPos(b, e.toPort);
    dx = p2.dx;
    dy = p2.dy;
  } else {
    p2 = { x: temp.x, y: temp.y };
    dx = 0;
    dy = 0;
  }
  const L = 14,
    W = 0.5;

  // Mermaid-style edges: waypoints carry the full routed polyline (both ends
  // already clipped onto the node shapes), so the path is drawn straight
  // through them with mermaid's own curve — no port re-derivation, no
  // re-smoothing. This keeps imported diagrams identical to mermaid's render.
  const dxOff = e?.labelDx || 0;
  const dyOff = e?.labelDy || 0;
  const offsetMid = (base) => ({
    x: base.x + dxOff,
    y: base.y + dyOff,
  });

  if (
    !temp &&
    e.curve &&
    e.waypoints &&
    e.waypoints.length >= 2
  ) {
    const pts = markerOffsetPoints(
      e.waypoints,
      !!e.arrowStart,
      e.arrow !== false,
    );
    const d =
      e.curve === "rounded"
        ? mermaidRoundedPath(pts, 5)
        : e.curve === "linear"
          ? mermaidLinearPath(pts)
          : mermaidBasisPath(pts);
    if (d) {
      const raw = e.waypoints;
      const seg = (i) => pts[Math.min(i, pts.length - 1)];
      const rawLast = raw[raw.length - 1],
        rawFirst = raw[0];
      const last = seg(pts.length - 1),
        prev = seg(pts.length - 2);
      const ang = Math.atan2(last.y - prev.y, last.x - prev.x);
      const first = seg(0),
        second = seg(1);
      const angStart = Math.atan2(first.y - second.y, first.x - second.x);
      return {
        d,
        arrow: arrowPoints(rawLast, ang, L, W),
        arrowStart: arrowPoints(rawFirst, angStart, L, W),
        mid: offsetMid(pathMid(raw)),
      };
    }
  }

  if (e.waypoints && e.waypoints.length) {
    const pts = [p1, ...e.waypoints, p2];
    const last = pts[pts.length - 2],
      end = pts[pts.length - 1];
    const ang = Math.atan2(end.y - last.y, end.x - last.x);
    const angStart = Math.atan2(pts[0].y - pts[1].y, pts[0].x - pts[1].x);
    return {
      d: smoothPath(pts),
      arrow: arrowPoints(p2, ang, L, W),
      arrowStart: arrowPoints(p1, angStart, L, W),
      mid: offsetMid(pathMid(pts)),
    };
  }
  if (e.routing === "straight") {
    const ang = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angStart = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    return {
      d: `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      arrow: arrowPoints(p2, ang, L, W),
      arrowStart: arrowPoints(p1, angStart, L, W),
      mid: offsetMid({ x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }),
    };
  }

  if (e.routing === "orthogonal") {
    const fromSide =
      e.fromPort ||
      (p1.dx !== 0
        ? p1.dx > 0
          ? "right"
          : "left"
        : p1.dy > 0
          ? "bottom"
          : "top");
    const toSide =
      e.toPort ||
      (dx !== 0 ? (dx > 0 ? "right" : "left") : dy > 0 ? "bottom" : "top");
    const isHoriz1 = fromSide === "left" || fromSide === "right";
    const isHoriz2 = toSide === "left" || toSide === "right";

    const pts = [p1];
    if (isHoriz1 && isHoriz2) {
      const midX = (p1.x + p2.x) / 2;
      pts.push({ x: midX, y: p1.y });
      pts.push({ x: midX, y: p2.y });
    } else if (!isHoriz1 && !isHoriz2) {
      const midY = (p1.y + p2.y) / 2;
      pts.push({ x: p1.x, y: midY });
      pts.push({ x: p2.x, y: midY });
    } else if (isHoriz1 && !isHoriz2) {
      pts.push({ x: p2.x, y: p1.y });
    } else {
      pts.push({ x: p1.x, y: p2.y });
    }
    pts.push(p2);

    const d = mermaidRoundedPath(pts, 8);
    const last = pts[pts.length - 2];
    const ang = Math.atan2(p2.y - last.y, p2.x - last.x);
    const second = pts[1];
    const angStart = Math.atan2(p1.y - second.y, p1.x - second.x);
    return {
      d: d || `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`,
      arrow: arrowPoints(p2, ang, L, W),
      arrowStart: arrowPoints(p1, angStart, L, W),
      mid: offsetMid(pathMid(pts)),
    };
  }

  const k = clamp(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.4, 30, 150);
  const c1 = { x: p1.x + p1.dx * k, y: p1.y + p1.dy * k };
  const c2 = { x: p2.x + dx * k, y: p2.y + dy * k };
  let adx = p2.x - c2.x,
    ady = p2.y - c2.y;
  if (!adx && !ady) {
    adx = p2.x - c1.x;
    ady = p2.y - c1.y;
  }
  const ang = Math.atan2(ady, adx);

  let adxStart = p1.x - c1.x,
    adyStart = p1.y - c1.y;
  if (!adxStart && !adyStart) {
    adxStart = p1.x - c2.x;
    adyStart = p1.y - c2.y;
  }
  const angStart = Math.atan2(adyStart, adxStart);

  return {
    d: `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`,
    arrow: arrowPoints(p2, ang, L, W),
    arrowStart: arrowPoints(p1, angStart, L, W),
    mid: offsetMid({
      x: (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8,
      y: (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8,
    }),
  };
}

export const normRect = (a, b) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  w: Math.abs(a.x - b.x),
  h: Math.abs(a.y - b.y),
});

export const intersects = (n, r) =>
  n.x < r.x + r.w && n.x + n.w > r.x && n.y < r.y + r.h && n.y + n.h > r.y;

export function nodeAt(p, nodes) {
  const nonG = nodes.filter((n) => n.type !== "group").reverse();
  const G = nodes.filter((n) => n.type === "group").reverse();
  for (const n of [...nonG, ...G])
    if (p.x >= n.x && p.x <= n.x + n.w && p.y >= n.y && p.y <= n.y + n.h)
      return n;
  return null;
}

export function nodeAtInflated(p, nodes, margin = 12) {
  const nonG = nodes.filter((n) => n.type !== "group").reverse();
  const G = nodes.filter((n) => n.type === "group").reverse();
  for (const n of [...nonG, ...G])
    if (
      p.x >= n.x - margin &&
      p.x <= n.x + n.w + margin &&
      p.y >= n.y - margin &&
      p.y <= n.y + n.h + margin
    )
      return n;
  return null;
}

export function computeSmartGuides(dragged, others, threshold = 6) {
  let snappedX = dragged.x;
  let snappedY = dragged.y;
  const guides = [];

  const dragXs = [
    { offset: 0, val: dragged.x },
    { offset: dragged.w / 2, val: dragged.x + dragged.w / 2 },
    { offset: dragged.w, val: dragged.x + dragged.w },
  ];
  const dragYs = [
    { offset: 0, val: dragged.y },
    { offset: dragged.h / 2, val: dragged.y + dragged.h / 2 },
    { offset: dragged.h, val: dragged.y + dragged.h },
  ];

  let bestDiffX = threshold;
  let bestXSnap = null;
  let guideX = null;

  for (const n of others) {
    const targetXs = [n.x, n.x + n.w / 2, n.x + n.w];
    for (const dx of dragXs) {
      for (const tx of targetXs) {
        const diff = Math.abs(dx.val - tx);
        if (diff < bestDiffX) {
          bestDiffX = diff;
          bestXSnap = tx - dx.offset;
          guideX = tx;
        }
      }
    }
  }

  if (bestXSnap !== null) {
    snappedX = bestXSnap;
    guides.push({ type: "x", val: guideX });
  }

  let bestDiffY = threshold;
  let bestYSnap = null;
  let guideY = null;

  for (const n of others) {
    const targetYs = [n.y, n.y + n.h / 2, n.y + n.h];
    for (const dy of dragYs) {
      for (const ty of targetYs) {
        const diff = Math.abs(dy.val - ty);
        if (diff < bestDiffY) {
          bestDiffY = diff;
          bestYSnap = ty - dy.offset;
          guideY = ty;
        }
      }
    }
  }

  if (bestYSnap !== null) {
    snappedY = bestYSnap;
    guides.push({ type: "y", val: guideY });
  }

  return { snappedX, snappedY, guides };
}

