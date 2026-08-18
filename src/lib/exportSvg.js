import { edgeGeom } from "./geometry.js";
import { THEMES } from "./theme.js";
import { MONO } from "./utils.js";

/**
 * Format a number to 2 decimal places max, omitting trailing zeros
 */
export function fmt(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "0";
  return Number(n.toFixed(2)).toString();
}

/**
 * XML / SVG attribute & text escaping
 */
export function escapeXml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Calculate the bounding box of all nodes, groups, edges, waypoints, and labels
 */
export function getDiagramBounds(nodes, edges, byId, padding = 40) {
  if (!nodes || nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300, vx: 0, vy: 0, vw: 400, vh: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);

    if (n.badge) {
      minX = Math.min(minX, n.x + 2 - 11);
      minY = Math.min(minY, n.y - 11);
      maxX = Math.max(maxX, n.x + 2 + 11);
      maxY = Math.max(maxY, n.y + 11);
    }
  }

  if (edges && Array.isArray(edges)) {
    for (const e of edges) {
      const g = edgeGeom(e, byId);
      if (!g) continue;

      if (e.waypoints && Array.isArray(e.waypoints)) {
        for (const wp of e.waypoints) {
          minX = Math.min(minX, wp.x);
          minY = Math.min(minY, wp.y);
          maxX = Math.max(maxX, wp.x);
          maxY = Math.max(maxY, wp.y);
        }
      }

      if (g.mid && e.label) {
        const fz = e.fontSize || 11;
        const lw = e.label.length * (fz * 0.65) + 16;
        const lh = fz + 10;
        const lx = g.mid.x - (e.label.length * (fz * 0.32) + 8);
        const ly = g.mid.y - fz - 6;
        minX = Math.min(minX, lx);
        minY = Math.min(minY, ly);
        maxX = Math.max(maxX, lx + lw);
        maxY = Math.max(maxY, ly + lh);
      }
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    minX = 0;
    minY = 0;
    maxX = 400;
    maxY = 300;
  }

  const vx = Math.floor(minX - padding);
  const vy = Math.floor(minY - padding);
  const vw = Math.ceil(maxX - minX + padding * 2);
  const vh = Math.ceil(maxY - minY + padding * 2);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: vw,
    height: vh,
    vx,
    vy,
    vw,
    vh,
  };
}

/**
 * Render a node's shape elements
 */
function renderShapeElement(n) {
  const dashed = n.dashed ? ' stroke-dasharray="6 5"' : "";
  const sw = fmt(n.strokeWidth || 2);
  const x = fmt(n.x);
  const y = fmt(n.y);
  const w = fmt(n.w);
  const h = fmt(n.h);

  switch (n.type) {
    case "rounded":
      return `<rect class="fs-node-shape fs-node-shape-rounded" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
    case "pill":
      return `<rect class="fs-node-shape fs-node-shape-pill" x="${x}" y="${y}" width="${w}" height="${h}" rx="${fmt(n.h / 2)}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
    case "ellipse": {
      const cx = fmt(n.x + n.w / 2);
      const cy = fmt(n.y + n.h / 2);
      const rx = fmt(n.w / 2);
      const ry = fmt(n.h / 2);
      return `<ellipse class="fs-node-shape fs-node-shape-ellipse" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
    }
    case "diamond": {
      const p1 = `${fmt(n.x + n.w / 2)},${y}`;
      const p2 = `${fmt(n.x + n.w)},${fmt(n.y + n.h / 2)}`;
      const p3 = `${fmt(n.x + n.w / 2)},${fmt(n.y + n.h)}`;
      const p4 = `${x},${fmt(n.y + n.h / 2)}`;
      return `<polygon class="fs-node-shape fs-node-shape-diamond" points="${p1} ${p2} ${p3} ${p4}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
    }
    case "cylinder": {
      const ry = Math.min(14, n.h / 4);
      const cx = fmt(n.x + n.w / 2);
      const topCy = fmt(n.y + ry);
      const rx = fmt(n.w / 2);
      const ryFmt = fmt(ry);
      const pathD = `M ${x} ${topCy} A ${rx} ${ryFmt} 0 0 1 ${fmt(n.x + n.w)} ${topCy} L ${fmt(n.x + n.w)} ${fmt(n.y + n.h - ry)} A ${rx} ${ryFmt} 0 0 1 ${x} ${fmt(n.y + n.h - ry)} Z`;
      return `<g class="fs-node-shape fs-node-shape-cylinder"><path class="fs-cylinder-body" d="${pathD}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} /><ellipse class="fs-cylinder-cap" cx="${cx}" cy="${topCy}" rx="${rx}" ry="${ryFmt}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} /></g>`;
    }
    case "text":
      return `<rect class="fs-node-shape fs-node-shape-text" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
    case "rect":
    default:
      return `<rect class="fs-node-shape fs-node-shape-rect" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} />`;
  }
}

/**
 * Render multi-line node text
 */
function renderNodeText(n) {
  const text = (n.text || "").trim();
  if (!text) return "";
  const lines = text.split("\n");
  const fz = n.fontSize || 13;
  const lh = fz * 1.25;
  const startY = n.y + n.h / 2 - ((lines.length - 1) * lh) / 2;
  const centerX = fmt(n.x + n.w / 2);

  const tspans = lines
    .map(
      (l, i) =>
        `<tspan class="fs-node-tspan" x="${centerX}" y="${fmt(startY + i * lh)}" dominant-baseline="middle">${escapeXml(l)}</tspan>`
    )
    .join("");

  return `<text class="fs-node-text" text-anchor="middle" fill="${n.textColor}" font-size="${fmt(fz)}" font-family="${MONO}">${tspans}</text>`;
}

/**
 * Render node badge
 */
function renderNodeBadge(n, T) {
  if (!n.badge) return "";
  const badgeBg = T.bg || "#141413";
  const cx = fmt(n.x + 2);
  const cy = fmt(n.y);

  return `<g class="fs-node-badge" style="--badge-stroke:${n.stroke}; --badge-bg:${badgeBg};"><circle class="fs-node-badge-circle" cx="${cx}" cy="${cy}" r="11" fill="${badgeBg}" stroke="${n.stroke}" stroke-width="2" /><text class="fs-node-badge-text" x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="600" font-family="${MONO}" fill="${n.stroke}">${escapeXml(n.badge)}</text></g>`;
}

/**
 * Render a group node (frame)
 */
function renderGroupNode(n) {
  const dashed = n.dashed ? ' stroke-dasharray="6 5"' : "";
  const sw = fmt(n.strokeWidth || 1.5);
  const x = fmt(n.x);
  const y = fmt(n.y);
  const w = fmt(n.w);
  const h = fmt(n.h);
  const fz = fmt(n.fontSize || 14);

  return `<g class="fs-group fs-group-${escapeXml(n.id)}" id="group-${escapeXml(n.id)}" data-node-id="${escapeXml(n.id)}" style="--group-fill:${n.fill}; --group-stroke:${n.stroke}; --group-text:${n.textColor};"><rect class="fs-group-box" x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${n.fill}" stroke="${n.stroke}" stroke-width="${sw}"${dashed} /><text class="fs-group-label" x="${fmt(n.x + 14)}" y="${fmt(n.y + 24)}" fill="${n.textColor}" font-size="${fz}" font-weight="700" font-family="${MONO}">${escapeXml(n.text)}</text></g>`;
}

/**
 * Render an edge (connector line, arrows, and label)
 */
function renderEdge(e, byId, T) {
  const g = edgeGeom(e, byId);
  if (!g) return "";

  const fz = e.fontSize || 11;
  const textColor = e.textColor || e.stroke;
  const sw = fmt(e.strokeWidth || 2);
  const dashed = e.dashed ? ' stroke-dasharray="7 6"' : "";

  let labelHtml = "";
  if (e.label && g.mid) {
    const lw = e.label.length * (fz * 0.65) + 16;
    const lh = fz + 10;
    const lx = g.mid.x - (e.label.length * (fz * 0.32) + 8);
    const ly = g.mid.y - fz - 6;
    const labelBg = e.labelBg !== "transparent" ? (e.labelBg || T.panelSolid || "#1E1E1D") : null;
    const border = T.border || "#333333";

    labelHtml = `<g class="fs-edge-label" style="--edge-label-bg:${labelBg || 'transparent'}; --edge-label-border:${border}; --edge-label-text:${textColor};">${labelBg ? `<rect class="fs-edge-label-box" x="${fmt(lx)}" y="${fmt(ly)}" width="${fmt(lw)}" height="${fmt(lh)}" rx="6" fill="${labelBg}" stroke="${border}" stroke-width="1" opacity="0.95" />` : ""}<text class="fs-edge-label-text" x="${fmt(g.mid.x)}" y="${fmt(g.mid.y - 1)}" text-anchor="middle" font-size="${fmt(fz)}" font-weight="600" font-family="${MONO}" fill="${textColor}">${escapeXml(e.label)}</text></g>`;
  }

  const endArrow = e.arrow !== false && g.arrow
    ? `<polygon class="fs-edge-arrow fs-edge-arrow-end" points="${g.arrow}" fill="${e.stroke}" />`
    : "";
  const startArrow = e.arrowStart && g.arrowStart
    ? `<polygon class="fs-edge-arrow fs-edge-arrow-start" points="${g.arrowStart}" fill="${e.stroke}" />`
    : "";

  return `<g class="fs-edge fs-edge-${escapeXml(e.id)}" id="edge-${escapeXml(e.id)}" data-from="${escapeXml(e.from)}" data-to="${escapeXml(e.to || '')}" style="--edge-stroke:${e.stroke}; --edge-width:${sw}px; --edge-text:${textColor};"><path class="fs-edge-path fs-edge-line" d="${g.d}" fill="none" stroke="${e.stroke}" stroke-width="${sw}"${dashed} />${endArrow}${startArrow}${labelHtml}</g>`;
}

/**
 * Generate a clean, standalone, semantic SVG string for the diagram
 *
 * @param {Object} options
 * @param {Array} options.nodes - Diagram nodes
 * @param {Array} options.edges - Diagram edges
 * @param {string} [options.theme='dark'] - Theme name ('light' | 'dark' | 'clay')
 * @param {boolean} [options.transparent=false] - Transparent canvas background
 * @param {number} [options.padding=40] - Canvas margin around elements
 * @returns {{ str: string, w: number, h: number, minX: number, minY: number, viewBox: string } | null}
 */
export function exportDiagramToSvg({
  nodes = [],
  edges = [],
  theme = "dark",
  transparent = false,
  padding = 40,
} = {}) {
  if (!nodes || nodes.length === 0) return null;

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const bounds = getDiagramBounds(nodes, edges, byId, padding);
  const T = THEMES[theme] || THEMES.dark;

  const groupNodes = nodes.filter((n) => n.type === "group");
  const regularNodes = nodes.filter((n) => n.type !== "group");

  const groupsHtml = groupNodes.map(renderGroupNode).join("\n    ");
  const edgesHtml = edges.map((e) => renderEdge(e, byId, T)).filter(Boolean).join("\n    ");
  const regularNodesHtml = regularNodes
    .map((n) => {
      const shape = renderShapeElement(n);
      const text = renderNodeText(n);
      const badge = renderNodeBadge(n, T);
      const sw = fmt(n.strokeWidth || 2);
      return `<g class="fs-node fs-node-${escapeXml(n.type)} fs-node-${escapeXml(n.id)}" id="node-${escapeXml(n.id)}" data-node-id="${escapeXml(n.id)}" data-node-type="${escapeXml(n.type)}" style="--node-fill:${n.fill}; --node-stroke:${n.stroke}; --node-text:${n.textColor}; --node-stroke-width:${sw}px;">\n      ${shape}${text ? `\n      ${text}` : ""}${badge ? `\n      ${badge}` : ""}\n    </g>`;
    })
    .join("\n    ");

  const backgroundHtml = transparent
    ? ""
    : `<rect class="fs-bg" x="${bounds.vx}" y="${bounds.vy}" width="${bounds.vw}" height="${bounds.vh}" fill="${T.bg}" />\n  `;

  // Semantic stylesheet embedding CSS custom properties with fallbacks
  const styleBlock = `<style>
    :root, .flowstudio-diagram {
      --fs-font: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --fs-bg: ${T.bg};
      --fs-text: ${T.text};
      --fs-border: ${T.border};
      --fs-accent: ${T.accent};
      --fs-edge: ${T.edge};
    }
    .flowstudio-diagram {
      font-family: var(--fs-font);
      text-rendering: geometricPrecision;
      shape-rendering: geometricPrecision;
    }
    .flowstudio-diagram .fs-bg {
      fill: var(--fs-bg);
    }
    .flowstudio-diagram .fs-group-box {
      fill: var(--group-fill, rgba(130, 130, 140, 0.08));
      stroke: var(--group-stroke, #a1a1aa);
    }
    .flowstudio-diagram .fs-group-label {
      fill: var(--group-text, var(--fs-text));
      font-family: var(--fs-font);
    }
    .flowstudio-diagram .fs-edge-path {
      fill: none;
      stroke: var(--edge-stroke, var(--fs-edge));
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .flowstudio-diagram .fs-edge-arrow {
      fill: var(--edge-stroke, var(--fs-edge));
      stroke: none;
    }
    .flowstudio-diagram .fs-edge-label-box {
      fill: var(--edge-label-bg, var(--fs-bg));
      stroke: var(--edge-label-border, var(--fs-border));
    }
    .flowstudio-diagram .fs-edge-label-text {
      fill: var(--edge-label-text, var(--fs-text));
      font-family: var(--fs-font);
    }
    .flowstudio-diagram .fs-node-shape {
      fill: var(--node-fill, var(--fs-bg));
      stroke: var(--node-stroke, var(--fs-edge));
    }
    .flowstudio-diagram .fs-node-text {
      fill: var(--node-text, var(--fs-text));
      font-family: var(--fs-font);
    }
    .flowstudio-diagram .fs-node-badge-circle {
      fill: var(--badge-bg, var(--fs-bg));
      stroke: var(--badge-stroke, var(--node-stroke, var(--fs-accent)));
    }
    .flowstudio-diagram .fs-node-badge-text {
      fill: var(--badge-text, var(--node-stroke, var(--fs-accent)));
      font-family: var(--fs-font);
    }
  </style>`;

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.vx} ${bounds.vy} ${bounds.vw} ${bounds.vh}" width="${bounds.vw}" height="${bounds.vh}" class="flowstudio-diagram flowstudio-theme-${escapeXml(theme)}" data-theme="${escapeXml(theme)}">
  ${styleBlock}
  ${backgroundHtml}${groupsHtml ? `<g class="fs-layer fs-layer-groups">\n    ${groupsHtml}\n  </g>\n  ` : ""}${edgesHtml ? `<g class="fs-layer fs-layer-edges">\n    ${edgesHtml}\n  </g>\n  ` : ""}${regularNodesHtml ? `<g class="fs-layer fs-layer-nodes">\n    ${regularNodesHtml}\n  </g>` : ""}
</svg>`;

  return {
    str: svgStr,
    w: bounds.vw,
    h: bounds.vh,
    minX: bounds.vx,
    minY: bounds.vy,
    viewBox: `${bounds.vx} ${bounds.vy} ${bounds.vw} ${bounds.vh}`,
  };
}
