// Layer helpers: effective visibility (hidden nodes hide their descendants),
// filtered diagram data for rendering/export, and z-order moves that keep
// groups behind plain nodes.

export function hiddenNodeIds(nodes = []) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const memo = new Map();
  const visiting = new Set();

  const isHidden = (n) => {
    if (!n) return false;
    if (memo.has(n.id)) return memo.get(n.id);
    if (visiting.has(n.id)) return false;
    visiting.add(n.id);
    const hidden = !!n.hidden || (n.parentId ? isHidden(byId.get(n.parentId)) : false);
    visiting.delete(n.id);
    memo.set(n.id, hidden);
    return hidden;
  };

  return new Set(nodes.filter(isHidden).map((n) => n.id));
}

export function visibleDiagram(nodes = [], edges = []) {
  const hidden = hiddenNodeIds(nodes);
  return {
    hidden,
    nodes: nodes.filter((n) => !hidden.has(n.id)),
    edges: edges.filter((e) => !hidden.has(e.from) && !hidden.has(e.to)),
  };
}

export function reorderNodeSelection(nodes = [], ids, toFront = true) {
  const selected = ids instanceof Set ? ids : new Set(ids || []);
  if (!selected.size) return nodes;

  const picked = nodes.filter((n) => selected.has(n.id));
  const rest = nodes.filter((n) => !selected.has(n.id));
  const groups = (arr) => arr.filter((n) => n.type === "group");
  const plain = (arr) => arr.filter((n) => n.type !== "group");

  return toFront
    ? [...groups(rest), ...groups(picked), ...plain(rest), ...plain(picked)]
    : [...groups(picked), ...groups(rest), ...plain(picked), ...plain(rest)];
}
