const BASE_MS = 260;
const PER_PX_MS = 0.9;
const MAX_STEPS = 200;
export const DEFAULT_HOP_MS = 3000;

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
 * Two modes:
 *   run  — interactive: at an undecided decision node the engine waits
 *          (`awaiting`) until choose() supplies a branch; scenario choices
 *          auto-advance. Length-based travel, finite run, loop detection.
 *   demo — continuous: fixed hop interval (per-edge travelMs / per-node
 *          dwellMs overrides), undecided branches take the scenario choice
 *          or the first edge, dead ends hold and restart forever, and each
 *          restart increments `laps`.
 *
 * State is immutable-by-convention: step/choose/back/reset produce a new
 * state snapshot and notify listeners. The engine is pure (no DOM, no
 * timers) — the UI owns the rAF loop and calls step(dt, speed).
 */
export function createPlayback({
  nodes,
  edges,
  startId,
  choices,
  loopExits,
  maxLoopRetries = 1,
  mode = "run",
  hopInterval = DEFAULT_HOP_MS,
}) {
  const isDemo = mode === "demo";
  const hopMs =
    Number.isFinite(+hopInterval) && +hopInterval > 0
      ? +hopInterval
      : DEFAULT_HOP_MS;
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

  const freshState = (laps = 0) => ({
    tokens: [{ id: 0, edge: null, t: 0 }],
    activeNode: start || null,
    steps: 0,
    done: !start,
    history: [], // [{ node, edge, to }] one entry per completed hop
    queue: [],
    awaiting: false,
    hold: 0,
    restartPending: false,
    laps,
    loopDetected: false,
    loopExited: false,
    loopNode: null,
  });
  let state = freshState();
  const listeners = new Set();
  const emit = () => {
    for (const fn of listeners) fn(state);
  };

  const edgeById = (id) => realEdges.find((e) => e.id === id);

  // Node the next branch decision belongs to: during travel it is the
  // destination being traveled to.
  const departNode = () => {
    const token = state.tokens[0];
    if (token.edge) {
      const e = edgeById(token.edge);
      if (e) return e.to;
    }
    return state.activeNode;
  };

  const restartLap = () => {
    state = freshState(state.laps + 1);
    emit();
  };

  const arrive = (silent) => {
    const token = state.tokens[0];
    const entry = state.history[state.history.length - 1];
    const to = token.edge ? edgeById(token.edge)?.to : undefined;
    if (entry) entry.to = to;
    token.edge = null;
    token.t = 0;
    state.steps++;
    state.activeNode = to;
    const outs = outgoing.get(to) || [];
    if (!outs.length) {
      if (isDemo) {
        // Dead end: hold on the last node, then start a new lap.
        state.restartPending = true;
        state.hold = byId.get(to)?.dwellMs ?? hopMs;
      } else {
        state.done = true;
      }
    } else if (!isDemo && state.steps >= MAX_STEPS) {
      state.done = true;
    } else if (isDemo) {
      state.hold = byId.get(to)?.dwellMs ?? 0;
    }
    if (silent) return;
    emit();
  };

  const depart = (edgeId, opts = {}) => {
    const waiting = state.activeNode;
    const outs = outgoing.get(waiting) || [];
    let edge = edgeId;
    if (!edge) {
      if (state.queue.length) edge = state.queue.shift();
      else if (pref[waiting]) edge = pref[waiting];
      else if (outs.length > 1 && !isDemo && !opts.auto) {
        // Interactive mode: wait for the user to pick a branch.
        state.awaiting = true;
        emit();
        return;
      } else {
        edge = outs[0];
      }
    }
    if (!edge) {
      if (isDemo) {
        state.restartPending = true;
        state.hold = byId.get(waiting)?.dwellMs ?? hopMs;
        emit();
        return;
      }
      state.done = true;
      emit();
      return;
    }

    // Detect loops: count how many times this (activeNode, edge) pair has been
    // traversed in history. Demo mode loops are intentional, so only run mode
    // applies the exit/stop logic.
    if (!isDemo) {
      const count = state.history.filter(
        (h) => h.node === state.activeNode && h.edge === edge,
      ).length;

      // Decision nodes (outs.length > 1) trigger loop exit at count >=
      // maxLoopRetries. Single-outgoing-edge intermediate nodes pass through to
      // let decision nodes handle loop exit.
      const threshold = outs.length > 1 ? Math.max(1, maxLoopRetries) : 50;

      if (count >= threshold) {
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
    }

    state.awaiting = false;
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
      if (state.hold > 0) {
        state.hold -= dt;
        if (state.hold > 0) return;
        state.hold = 0;
        if (state.restartPending) {
          restartLap();
          return;
        }
      }
      if (state.awaiting) return;
      if (!token.edge) {
        depart();
        return;
      }
      const e = edgeById(token.edge);
      if (!e) {
        state.tokens[0].edge = null;
        depart();
        return;
      }
      const duration = isDemo
        ? e.travelMs ?? hopMs
        : BASE_MS + edgeLength(e, byId) * PER_PX_MS;
      token.t += dt / duration;
      if (token.t >= 1) arrive(false);
    },

    // Complete exactly one hop (used by Step Fwd and step replay). While
    // awaiting a branch it falls back to the scenario choice or first edge.
    hop() {
      if (state.done) return;
      const token = state.tokens[0];
      if (state.hold > 0) {
        state.hold = 0;
        if (state.restartPending) {
          restartLap();
          return;
        }
      }
      if (token.edge) {
        arrive(false);
      } else {
        depart(undefined, { auto: true });
        if (!state.done && !state.awaiting && state.tokens[0].edge)
          arrive(false);
      }
    },

    // Manual branch choice, honored at the next depart — including while
    // traveling, where it applies to the destination being reached.
    choose(edgeId) {
      const at = departNode();
      const outs = outgoing.get(at) || [];
      if (!outs.includes(edgeId)) return false;
      state.queue = [edgeId];
      if (!state.tokens[0].edge) state.awaiting = false;
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
      state.awaiting = false;
      state.hold = 0;
      state.restartPending = false;
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
      state = freshState(state.laps);
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
      state = freshState();
      emit();
    },

    // Branch options for the next departing node (the destination while the
    // token is traveling).
    choices() {
      if (!state.tokens[0].edge && (state.done || state.restartPending))
        return [];
      const at = departNode();
      if (!at) return [];
      return (outgoing.get(at) || []).map((id) => {
        const e = edgeById(id);
        const target = byId.get(e.to);
        return { id, label: e.label || `→ ${target?.text || target?.id || ""}` };
      });
    },

    departNode,
  };

  return engine;
}
