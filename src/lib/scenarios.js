// Keep scenario configuration coherent when the diagram changes: remove
// branch choices, loop exits, step notes, and start nodes that point at
// deleted nodes or edges.

export function pruneScenarioRefs(scenarios = [], { nodeIds, edgeIds } = {}) {
  const goneNodes = nodeIds instanceof Set ? nodeIds : new Set(nodeIds || []);
  const goneEdges = edgeIds instanceof Set ? edgeIds : new Set(edgeIds || []);
  if (!goneNodes.size && !goneEdges.size) return scenarios;

  return scenarios.map((s) => {
    const choices = {};
    for (const [nodeId, edgeId] of Object.entries(s.choices || {})) {
      if (!goneNodes.has(nodeId) && !goneEdges.has(edgeId)) choices[nodeId] = edgeId;
    }
    const loopExits = {};
    for (const [nodeId, edgeId] of Object.entries(s.loopExits || {})) {
      if (!goneNodes.has(nodeId) && !goneEdges.has(edgeId)) {
        loopExits[nodeId] = edgeId;
      }
    }
    const notes = {};
    for (const [nodeId, text] of Object.entries(s.notes || {})) {
      if (!goneNodes.has(nodeId)) notes[nodeId] = text;
    }
    return {
      ...s,
      startId:
        s.startId && goneNodes.has(s.startId) ? undefined : s.startId,
      choices,
      loopExits,
      notes,
    };
  });
}
