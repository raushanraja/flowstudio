import dagre from "dagre";
import { autoPort } from "./geometry.js";

/**
 * Automatically arranges diagram nodes and reroutes edges cleanly using Dagre.
 *
 * @param {Object} params
 * @param {Array} params.nodes - Array of all node objects
 * @param {Array} params.edges - Array of all edge objects
 * @param {"TB" | "LR" | "BT" | "RL"} [params.direction="TB"] - Orientation
 * @param {Array<string>} [params.selectedIds] - Optional subset of node IDs to arrange
 * @param {number} [params.nodeSep=48] - Separation between adjacent nodes
 * @param {number} [params.rankSep=64] - Separation between ranks
 * @returns {{ nodes: Array, edges: Array }}
 */
export function layoutDiagram({
  nodes = [],
  edges = [],
  direction = "TB",
  selectedIds = null,
  nodeSep = 48,
  rankSep = 64,
}) {
  if (!nodes || nodes.length < 2) {
    return { nodes, edges };
  }

  const isSubset =
    Array.isArray(selectedIds) &&
    selectedIds.length >= 2 &&
    selectedIds.length < nodes.length;

  const targetNodeSet = new Set(
    isSubset ? selectedIds : nodes.map((n) => n.id)
  );

  const targetNodes = nodes.filter((n) => targetNodeSet.has(n.id));
  const otherNodes = nodes.filter((n) => !targetNodeSet.has(n.id));

  // Determine top-left anchor of the target nodes to preserve screen location
  const origMinX = Math.min(...targetNodes.map((n) => n.x));
  const origMinY = Math.min(...targetNodes.map((n) => n.y));

  // Non-group nodes + empty groups (groups without children in target set)
  const targetChildren = targetNodes.filter((n) => n.parentId);
  const parentIdsWithChildren = new Set(targetChildren.map((n) => n.parentId));

  const layoutItems = targetNodes.filter(
    (n) => n.type !== "group" || !parentIdsWithChildren.has(n.id)
  );
  const layoutItemIds = new Set(layoutItems.map((n) => n.id));

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 0,
    marginy: 0,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of layoutItems) {
    g.setNode(n.id, {
      width: Math.max(n.w || 120, 30),
      height: Math.max(n.h || 50, 20),
    });
  }

  // Add diagram edges where both endpoints are in layout items
  const relevantEdges = edges.filter(
    (e) => layoutItemIds.has(e.from) && layoutItemIds.has(e.to)
  );

  for (const e of relevantEdges) {
    g.setEdge(e.from, e.to, { weight: 2 });
  }

  // Keep sibling children in the same group close together
  const childrenByGroup = new Map();
  for (const n of layoutItems) {
    if (n.parentId) {
      if (!childrenByGroup.has(n.parentId)) {
        childrenByGroup.set(n.parentId, []);
      }
      childrenByGroup.get(n.parentId).push(n.id);
    }
  }

  for (const siblings of childrenByGroup.values()) {
    for (let i = 0; i < siblings.length - 1; i++) {
      const a = siblings[i];
      const b = siblings[i + 1];
      if (!g.hasEdge(a, b) && !g.hasEdge(b, a)) {
        g.setEdge(a, b, { weight: 1, minlen: 1 });
      }
    }
  }

  // Run Dagre
  dagre.layout(g);

  // Compute bounding box of laid out items to calculate translation delta
  let minNewX = Infinity;
  let minNewY = Infinity;

  const newPosMap = new Map();
  for (const n of layoutItems) {
    const layoutNode = g.node(n.id);
    if (!layoutNode) continue;

    const w = layoutNode.width || n.w;
    const h = layoutNode.height || n.h;
    const x = Math.round(layoutNode.x - w / 2);
    const y = Math.round(layoutNode.y - h / 2);

    newPosMap.set(n.id, { x, y, w, h });
    if (x < minNewX) minNewX = x;
    if (y < minNewY) minNewY = y;
  }

  const offsetX = Number.isFinite(minNewX) ? origMinX - minNewX : 0;
  const offsetY = Number.isFinite(minNewY) ? origMinY - minNewY : 0;

  // Position updated items
  const updatedItems = targetNodes.map((n) => {
    const pos = newPosMap.get(n.id);
    if (!pos) return n;

    return {
      ...n,
      x: pos.x + offsetX,
      y: pos.y + offsetY,
    };
  });

  // Now enclose groups around their updated member children
  const intermediateNodeMap = new Map(
    [...otherNodes, ...updatedItems].map((n) => [n.id, n])
  );

  const finalNodes = [...otherNodes, ...updatedItems].map((n) => {
    if (n.type === "group" && targetNodeSet.has(n.id)) {
      const children = [...intermediateNodeMap.values()].filter(
        (c) => c.parentId === n.id
      );
      if (children.length > 0) {
        const PAD_X = 24;
        const PAD_BOTTOM = 24;
        const PAD_TOP = 38; // space for header title
        const minX = Math.min(...children.map((c) => c.x)) - PAD_X;
        const minY = Math.min(...children.map((c) => c.y)) - PAD_TOP;
        const maxX = Math.max(...children.map((c) => c.x + c.w)) + PAD_X;
        const maxY = Math.max(...children.map((c) => c.y + c.h)) + PAD_BOTTOM;
        return {
          ...n,
          x: Math.round(minX),
          y: Math.round(minY),
          w: Math.round(maxX - minX),
          h: Math.round(maxY - minY),
        };
      }
    }
    return n;
  });

  const finalNodeMap = new Map(finalNodes.map((n) => [n.id, n]));

  // Recalculate edge routing & ports for moved nodes
  const finalEdges = edges.map((e) => {
    const fromMoved = targetNodeSet.has(e.from);
    const toMoved = targetNodeSet.has(e.to);

    if (!fromMoved && !toMoved) {
      return e;
    }

    const nFrom = finalNodeMap.get(e.from);
    const nTo = finalNodeMap.get(e.to);

    if (!nFrom || !nTo) {
      return e;
    }

    const fromPort = autoPort(nFrom, nTo);
    const toPort = autoPort(nTo, nFrom);

    return {
      ...e,
      fromPort,
      toPort,
      fromPos: undefined,
      toPos: undefined,
      waypoints: undefined,
    };
  });

  return {
    nodes: finalNodes,
    edges: finalEdges,
  };
}
