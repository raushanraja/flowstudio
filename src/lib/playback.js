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
 * Nodes flagged `isService` additionally spawn their own token (see
 * `state.services`) that keeps ticking on its own interval in either mode —
 * e.g. a background job cycle running alongside the main flow.
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

  // Background services: nodes flagged `isService` get their own token that
  // keeps ticking on an interval, independent of the main token's mode. A
  // flagged group runs its internal flow (entry child → …), staying inside
  // the group; a flagged plain node follows its outgoing edges anywhere.
  const serviceDefs = nodes
    .filter((n) => n.isService)
    .map((n) => {
      const interval =
        Number.isFinite(+n.serviceIntervalMs) && +n.serviceIntervalMs > 0
          ? +n.serviceIntervalMs
          : hopMs;
      if (n.type === "group") {
        const children = nodes.filter(
          (c) => c.parentId === n.id && c.type !== "group",
        );
        if (!children.length) return null;
        const scope = new Set(children.map((c) => c.id));
        const hasIncoming = new Set(
          realEdges
            .filter((e) => scope.has(e.from) && scope.has(e.to))
            .map((e) => e.to),
        );
        const entry =
          children.find((c) => !hasIncoming.has(c.id)) ||
          [...children].sort(topLeft)[0];
        return { rootId: n.id, nodeId: entry.id, interval, scope };
      }
      return { rootId: n.id, nodeId: n.id, interval, scope: null };
    })
    .filter(Boolean);
  const freshServices = () =>
    serviceDefs.map((svc, i) => ({
      id: i + 1,
      rootId: svc.rootId,
      nodeId: svc.nodeId,
      interval: svc.interval,
      scope: svc.scope,
      activeNode: svc.nodeId,
      edge: null,
      t: 0,
      hold: 0,
      restartPending: false,
      steps: 0,
      laps: 0,
    }));
  const freshMain = (laps = 0) => ({
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
  // Rebuilding the main token (laps, stepping back) must not disturb
  // background services mid-flight.
  let state = { ...freshMain(), services: freshServices() };
  const listeners = new Set();
  const emit = () => {
    for (const fn of listeners) fn(state);
  };

  const edgeById = (id) => realEdges.find((e) => e.id === id);

  // One service tick: interval-based travel, scenario choice or first edge,
  // dead ends hold and restart the service loop. Never awaits.
  const stepService = (svc, dt) => {
    if (svc.hold > 0) {
      svc.hold -= dt;
      if (svc.hold > 0) return;
      svc.hold = 0;
      if (svc.restartPending) {
        svc.restartPending = false;
        svc.activeNode = svc.nodeId;
        svc.edge = null;
        svc.t = 0;
        svc.laps++;
        return;
      }
    }
    if (!svc.edge) {
      const outs = (outgoing.get(svc.activeNode) || []).filter(
        (id) => !svc.scope || svc.scope.has(edgeById(id)?.to),
      );
      const preferred = pref[svc.activeNode];
      const edge = preferred && outs.includes(preferred) ? preferred : outs[0];
      if (!edge) {
        svc.restartPending = true;
        svc.hold = byId.get(svc.activeNode)?.dwellMs ?? svc.interval;
        return;
      }
      svc.edge = edge;
      svc.t = 0;
      return;
    }
    const e = edgeById(svc.edge);
    if (!e) {
      svc.edge = null;
      return;
    }
    const duration = e.travelMs ?? svc.interval;
    svc.t += dt / duration;
    if (svc.t < 1) return;
    svc.edge = null;
    svc.t = 0;
    svc.steps++;
    svc.activeNode = e.to;
    const outs = outgoing.get(e.to) || [];
    if (!outs.length) {
      svc.restartPending = true;
      svc.hold = byId.get(e.to)?.dwellMs ?? svc.interval;
    } else {
      svc.hold = byId.get(e.to)?.dwellMs ?? 0;
    }
  };

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
    state = { ...freshMain(state.laps + 1), services: state.services };
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
      // Background services tick regardless of the main token's state
      // (awaiting a branch, holding, even after the run is done).
      for (const svc of state.services) stepService(svc, dt);
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
      state = { ...freshMain(state.laps), services: state.services };
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
      state = { ...freshMain(), services: freshServices() };
      emit();
    },

    // Whether the active scenario already pins a branch for this node.
    isConfigured(nodeId) {
      return !!pref[nodeId];
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
