/**
 * Serializes FlowStudio diagram nodes and edges into valid, idiomatic Mermaid flowchart syntax.
 *
 * @param {Object} params
 * @param {Array} params.nodes - Array of node objects
 * @param {Array} params.edges - Array of edge objects
 * @param {"TB" | "LR" | "BT" | "RL"} [params.direction="TB"] - Flowchart layout orientation
 * @returns {string} - Mermaid flowchart code
 */
export function exportMermaid({
  nodes = [],
  edges = [],
  direction = "TB",
}) {
  const lines = [`flowchart ${direction}`];

  // Helper to escape label text for Mermaid
  const esc = (text) =>
    (text == null ? "" : String(text))
      .replace(/"/g, "#quot;")
      .replace(/[\r\n]+/g, "<br/>")
      .trim();

  // Create clean, valid Mermaid identifier map
  const idMap = new Map();
  nodes.forEach((n, idx) => {
    const clean = String(n.id).replace(/[^a-zA-Z0-9_]/g, "");
    const safeId = /^[a-zA-Z]/.test(clean) ? clean : `node_${idx + 1}`;
    idMap.set(n.id, safeId);
  });

  // Render node shape syntax
  const formatNode = (n, indent = "  ") => {
    const mId = idMap.get(n.id) || `node_${n.id}`;
    let label = esc(n.text || "");
    if (n.badge) {
      label = `[${esc(n.badge)}] ${label}`;
    }

    switch (n.type) {
      case "rounded":
        return `${indent}${mId}("${label}")`;
      case "pill":
        return `${indent}${mId}(["${label}"])`;
      case "ellipse":
        return `${indent}${mId}(("${label}"))`;
      case "diamond":
        return `${indent}${mId}{"${label}"}`;
      case "cylinder":
        return `${indent}${mId}[("${label}")]`;
      case "rect":
      case "text":
      default:
        return `${indent}${mId}["${label}"]`;
    }
  };

  // 1. Separate groups from top-level nodes
  const groups = nodes.filter((n) => n.type === "group");
  const groupIds = new Set(groups.map((g) => g.id));
  const childrenByParent = new Map();

  for (const n of nodes) {
    if (n.parentId && groupIds.has(n.parentId)) {
      if (!childrenByParent.has(n.parentId)) {
        childrenByParent.set(n.parentId, []);
      }
      childrenByParent.get(n.parentId).push(n);
    }
  }

  // 2. Render subgraphs (groups)
  for (const g of groups) {
    const gId = idMap.get(g.id) || `subgraph_${g.id}`;
    const gLabel = esc(g.text || "Group");
    lines.push(`  subgraph ${gId} ["${gLabel}"]`);
    const children = childrenByParent.get(g.id) || [];
    for (const child of children) {
      lines.push(formatNode(child, "    "));
    }
    lines.push("  end");
  }

  // 3. Render top-level nodes (not inside any group and not groups themselves)
  const topNodes = nodes.filter((n) => n.type !== "group" && !n.parentId);
  for (const n of topNodes) {
    lines.push(formatNode(n, "  "));
  }

  // 4. Render edges
  const validNodeIds = new Set(nodes.map((n) => n.id));
  for (const e of edges) {
    if (!validNodeIds.has(e.from) || !validNodeIds.has(e.to)) continue;

    const fromId = idMap.get(e.from);
    const toId = idMap.get(e.to);
    if (!fromId || !toId) continue;

    const isDashed = !!e.dashed;
    const isBi = !!e.arrowStart && e.arrow !== false;
    const isUndirected = e.arrow === false;

    let arrowSyntax = "-->";
    if (isDashed) {
      if (isBi) arrowSyntax = "<-.->";
      else if (isUndirected) arrowSyntax = "-.-";
      else arrowSyntax = "-.->";
    } else {
      if (isBi) arrowSyntax = "<-->";
      else if (isUndirected) arrowSyntax = "---";
      else arrowSyntax = "-->";
    }

    const edgeText = esc(e.text || "");
    if (edgeText) {
      if (isDashed) {
        if (isBi) {
          lines.push(`  ${fromId} <-.${edgeText}.-> ${toId}`);
        } else if (isUndirected) {
          lines.push(`  ${fromId} -.-|"${edgeText}"| ${toId}`);
        } else {
          lines.push(`  ${fromId} -. "${edgeText}" .-> ${toId}`);
        }
      } else {
        if (isUndirected) {
          lines.push(`  ${fromId} ---|"${edgeText}"| ${toId}`);
        } else {
          lines.push(`  ${fromId} -- "${edgeText}" --> ${toId}`);
        }
      }
    } else {
      lines.push(`  ${fromId} ${arrowSyntax} ${toId}`);
    }
  }

  return lines.join("\n");
}
