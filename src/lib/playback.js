const BASE_MS = 260;
const PER_PX_MS = 0.9;
const MAX_STEPS = 200;

function edgeLength(e, byId) {
  if (e.waypoints && e.waypoints.length >= 2) {
    let len = 0;
    for (let i = 1; i < e.waypoints.length; i++) {
      len += Math.hypot(
        e.waypoints[i].x - e.waypoints[i - 1].x,
        e.waypoints[i].y - e.waypoints[i - 1].y,
      );
    }
    return len;
  }
  const a = byId.get(e.from);
  const b = byId.get(e.to);
  if (!a || !b) return 100;
  return Math.hypot(
    a.x + a.w / 2 - (b.x + b.w / 2),
    a.y + a.h / 2 - (b.y + b.h / 2),
  );
}

function topLeft(a, b) {
  return a.x - b.x || a.y - b.y;
}

/*
 * Tick-based playback engine for a single token traversing a flow.
 *
 * State is immutable-by-convention: step/choose/back/reset produce a new
 * state snapshot and notify listeners. The engine is pure (no DOM, no
 * timers) — the UI owns the rAF loop and calls step(dt, speed).
 *
 * The token model (tokens array, per-token queue, same step loop) is shaped
 * so a multi-token simulation can be added later without reworking the
 * engine's skeleton.
 */
export function createPlayback({
  nodes,
  edges,
  startId,
  choices,
  loopExits,
  maxLoopRetries = 1,
}) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const realEdges = edges.filter(
    (e) =>
      byId.has(e.from) &&
      byId.has(e.to) &&
      byId.get(e.from).type !== "group" &&
      byId.get(e.to).type !== "group",
  );
  const outgoing = new Map();
  const incoming = new Set();
  for (const e of realEdges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from).push(e.id);
    incoming.add(e.to);
  }
  // Scenario path: per-node preferred edge, pruned to valid outgoing edges.
  const pref = {};
  if (choices && typeof choices === "object") {
    for (const [nodeId, edgeId] of Object.entries(choices)) {
      const outs = outgoing.get(nodeId);
      if (outs && outs.includes(edgeId)) pref[nodeId] = edgeId;
    }
  }
  const exits = {};
  if (loopExits && typeof loopExits === "object") {
    for (const [nodeId, edgeId] of Object.entries(loopExits)) {
      const outs = outgoing.get(nodeId);
      if (outs && outs.includes(edgeId)) exits[nodeId] = edgeId;
    }
  }
  const starts = nodes
    .filter((n) => n.type !== "group" && !incoming.has(n.id))
    .map((n) => n.id);
  const start =
    (startId && byId.has(startId) && byId.get(startId).type !== "group"
      ? startId
      : undefined) ||
    starts[0] ||
    nodes
      .filter((n) => n.type !== "group")
      .sort(topLeft)
      .map((n) => n.id)[0];

  let state = {
    tokens: [{ id: 0, edge: null, t: 0 }],
    activeNode: start || null,
    steps: 0,
    done: !start,
    history: [], // [{ node, edge, to }] one entry per completed hop
    queue: [],
    loopDetected: false,
    loopExited: false,
    loopNode: null,
  };
  const listeners = new Set();
  const emit = () => {
    for (const fn of listeners) fn(state);
  };

  const nextEdge = () => {
    const waiting = state.activeNode;
    if (state.queue.length) return state.queue.shift();
    if (pref[waiting]) return pref[waiting];
    const outs = outgoing.get(waiting);
    return outs && outs.length ? outs[0] : undefined;
  };

  const arrive = (silent) => {
    const token = state.tokens[0];
    const entry = state.history[state.history.length - 1];
    const to = token.edge
      ? realEdges.find((e) => e.id === token.edge)?.to
      : undefined;
    if (entry) entry.to = to;
    token.edge = null;
    token.t = 0;
    state.steps++;
    state.activeNode = to;
    if (state.steps >= MAX_STEPS || !(outgoing.get(to) || []).length)
      state.done = true;
    if (silent) return;
    emit();
  };

  const depart = (edgeId) => {
    let edge = edgeId || nextEdge();
    if (!edge) {
      state.done = true;
      emit();
      return;
    }

    const outs = outgoing.get(state.activeNode) || [];

    // Detect loops: count how many times this (activeNode, edge) pair has been traversed in history
    const count = state.history.filter(
      (h) => h.node === state.activeNode && h.edge === edge,
    ).length;

    // Decision nodes (outs.length > 1) trigger loop exit at count >= maxLoopRetries (default 1 retry for 1-2-1-2-3 sequence).
    // Single-outgoing-edge intermediate nodes pass through to let decision nodes handle loop exit.
    const threshold = outs.length > 1 ? Math.max(1, maxLoopRetries) : 50;

    if (count >= threshold) {
      // Look for custom loop exit step or alternate outgoing edge to escape the loop
      const customExit = exits[state.activeNode];
      const altEdge =
        customExit && outs.includes(customExit) && customExit !== edge
          ? customExit
          : outs.find((eId) => eId !== edge);

      if (altEdge) {
        // Execute nested step out of the loop!
        edge = altEdge;
        state.loopExited = true;
        state.loopNode = state.activeNode;
      } else {
        state.loopDetected = true;
        state.loopNode = state.activeNode;
        state.done = true;
        emit();
        return;
      }
    }

    state.tokens[0].edge = edge;
    state.tokens[0].t = 0;
    state.history.push({ node: state.activeNode, edge, to: null });
    emit();
  };

  const engine = {
    snapshot: () => state,

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // Advance continuous playback; dt in ms already scaled by speed.
    step(dt) {
      if (state.done) return;
      const token = state.tokens[0];
      if (!token.edge) {
        depart();
        return;
      }
      const e = realEdges.find((ed) => ed.id === token.edge);
      if (!e) {
        state.tokens[0].edge = null;
        depart();
        return;
      }
      const duration = BASE_MS + edgeLength(e, byId) * PER_PX_MS;
      token.t += dt / duration;
      if (token.t >= 1) arrive(false);
    },

    // Complete exactly one hop (used by Step Fwd and step replay).
    hop() {
      if (state.done) return;
      const token = state.tokens[0];
      if (token.edge) {
        arrive(false);
      } else {
        depart();
        if (!state.done && state.tokens[0].edge) arrive(false);
      }
    },

    // Manual branch choice, honored at the next depart.
    choose(edgeId) {
      const outs = outgoing.get(state.activeNode) || [];
      if (state.tokens[0].edge || !outs.includes(edgeId)) return false;
      state.queue = [edgeId];
      state.loopDetected = false;
      state.loopExited = false;
      state.loopNode = null;
      state.done = false;
      emit();
      return true;
    },

    // One hop back: undo an in-flight hop, else replay to steps-1.
    back() {
      state.loopDetected = false;
      state.loopExited = false;
      state.loopNode = null;
      const token = state.tokens[0];
      if (token.edge) {
        const last = state.history.pop();
        state.steps = Math.max(0, state.steps - 1);
        token.edge = null;
        token.t = 0;
        state.activeNode = last ? last.node : start;
        state.queue = [];
        state.done = false;
        emit();
        return;
      }
      if (state.steps === 0) return;
      const target = Math.max(0, state.steps - 1);
      const history = state.history;
      state = {
        tokens: [{ id: 0, edge: null, t: 0 }],
        activeNode: start || null,
        steps: 0,
        done: !start,
        history: [],
        queue: [],
        loopDetected: false,
        loopExited: false,
        loopNode: null,
      };
      for (let i = 0; i < target; i++) {
        const h = history[i];
        if (!h) break;
        state.tokens[0].edge = h.edge;
        state.history.push(h);
        state.steps++;
        state.activeNode = h.to;
      }
      state.tokens[0].edge = null;
      state.tokens[0].t = 0;
      state.done = false;
      emit();
    },

    reset() {
      state = {
        tokens: [{ id: 0, edge: null, t: 0 }],
        activeNode: start || null,
        steps: 0,
        done: !start,
        history: [],
        queue: [],
        loopDetected: false,
        loopExited: false,
        loopNode: null,
      };
      emit();
    },

    // Branch options visible at the current waiting node.
    choices() {
      if (state.tokens[0].edge || state.done) return [];
      return (outgoing.get(state.activeNode) || []).map((id) => {
        const e = realEdges.find((ed) => ed.id === id);
        const target = byId.get(e.to);
        return { id, label: e.label || `→ ${target?.text || target?.id || ""}` };
      });
    },
  };

  return engine;
}
