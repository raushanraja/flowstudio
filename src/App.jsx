import { useEffect, useMemo, useRef, useState } from "react";
import {
  THEMES,
  DEFAULT_THEME_ID,
  SHAPE_DEFS,
  nextTheme,
  isTheme,
  isDarkTheme,
  getGroupStyle,
  GROUP_STYLES,
  getPaletteForTheme,
  getContrast,
  getEffectiveTextColor,
  rethemeDiagram,
  rethemeEdges,
} from "./lib/theme.js";
import { normalizeDiagram } from "./lib/diagram.js";
import { sampleDiagram } from "./lib/sample.js";
import { extractMermaidSource, mermaidTextToDiagram } from "./lib/mermaid.js";
import { createPlayback, DEFAULT_HOP_MS } from "./lib/playback.js";
import { uid, clamp } from "./lib/utils.js";
import {
  autoPort,
  nearestPort,
  nodeAtInflated,
  edgeGeom,
  normRect,
  intersects,
} from "./lib/geometry.js";
import TopBar from "./components/TopBar.jsx";
import Palette from "./components/Palette.jsx";
import Canvas from "./components/Canvas.jsx";
import PropertiesPanel from "./components/PropertiesPanel.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import ExportModal from "./components/ExportModal.jsx";
import { exportDiagramToSvg } from "./lib/exportSvg.js";
import PlayBar from "./components/PlayBar.jsx";
import ScenariosPanel from "./components/ScenariosPanel.jsx";

const INITIAL = sampleDiagram();
const STORAGE_KEY = "fs-document";
const NODE_SIZES = {
  rect: [180, 56],
  rounded: [180, 56],
  pill: [160, 48],
  diamond: [170, 90],
  ellipse: [170, 80],
  cylinder: [150, 90],
  text: [160, 40],
  group: [280, 180],
};
const SHAPE_BY_KEY = Object.fromEntries(
  SHAPE_DEFS.map((s) => [s.key.toLowerCase(), s.type]),
);

function loadDocument() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const d = normalizeDiagram(data);
    if (!d) return null;
    return {
      ...d,
      cam:
        Number.isFinite(+data.cam?.x) &&
        Number.isFinite(+data.cam?.y) &&
        Number.isFinite(+data.cam?.zoom)
          ? { x: +data.cam.x, y: +data.cam.y, zoom: +data.cam.zoom }
          : null,
      snap: typeof data.snap === "boolean" ? data.snap : true,
      showGrid: typeof data.showGrid === "boolean" ? data.showGrid : true,
    };
  } catch {
    return null;
  }
}

export default function App() {
  const [saved] = useState(loadDocument);
  const [theme, setThemeState] = useState(() => {
    if (saved?.theme && isTheme(saved.theme)) return saved.theme;
    try {
      const t = localStorage.getItem("fs-theme");
      return isTheme(t) ? t : DEFAULT_THEME_ID;
    } catch {
      return DEFAULT_THEME_ID;
    }
  });
  const T = THEMES[theme] || THEMES[DEFAULT_THEME_ID];
  const [nodes, setNodes] = useState(saved?.nodes ?? INITIAL.nodes);
  const [edges, setEdges] = useState(saved?.edges ?? INITIAL.edges);
  const [scenarios, setScenarios] = useState(saved?.scenarios ?? []);
  const [activeScenarioId, setActiveScenarioId] = useState(
    saved?.activeScenarioId ?? null,
  );
  const [showScenarios, setShowScenarios] = useState(false);
  const [recording, setRecording] = useState(false);
  const [simMode, setSimMode] = useState(false);
  const [sel, setSel] = useState({ nodes: [], edges: [] });
  const [cam, setCam] = useState(
    saved?.cam ?? { x: 20, y: 10, zoom: 1 },
  );
  const [tool, setTool] = useState("select");
  const [hover, setHover] = useState(null);
  const [marquee, setMarquee] = useState(null);
  const [tempEdge, setTempEdge] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [snap, setSnap] = useState(saved?.snap ?? true);
  const [showGrid, setShowGrid] = useState(saved?.showGrid ?? true);
  
  // UI Modal & Inspector States
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const prevSelRef = useRef({ nodes: [], edges: [] });

  useEffect(() => {
    const hasSel = sel.nodes.length > 0 || sel.edges.length > 0;
    const prevHasSel = prevSelRef.current.nodes.length > 0 || prevSelRef.current.edges.length > 0;

    if (hasSel && !prevHasSel) {
      setIsInspectorOpen(true);
    } else if (!hasSel && prevHasSel) {
      setIsInspectorOpen(false);
    }

    prevSelRef.current = sel;
  }, [sel]);

  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const fileRef = useRef(null);
  const merFileRef = useRef(null);
  const scenariosFileRef = useRef(null);
  const camRef = useRef(cam);
  camRef.current = cam;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const selRef = useRef(sel);
  selRef.current = sel;
  const scenariosRef = useRef(scenarios);
  scenariosRef.current = scenarios;
  const activeScenarioRef = useRef(activeScenarioId);
  activeScenarioRef.current = activeScenarioId;
  const recordingRef = useRef(recording);
  recordingRef.current = recording;
  const simModeRef = useRef(simMode);
  simModeRef.current = simMode;
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const coalesce = useRef({});
  const clipboard = useRef(null);
  const lastCanvasClick = useRef(null);

  /* ---------- playback ---------- */
  const [playback, setPlayback] = useState(null);
  const playbackRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [speed, setSpeedState] = useState(1);
  const speedRef = useRef(1);
  const [playFrame, setPlayFrame] = useState(0);
  const rafRef = useRef(null);
  const lastTsRef = useRef(0);
  const [playMode, setPlayModeState] = useState(
    saved?.playMode === "demo" ? "demo" : "run",
  );
  const [demoIntervalMs, setDemoIntervalMsState] = useState(
    saved?.demoIntervalMs ?? DEFAULT_HOP_MS,
  );
  const playModeRef = useRef(playMode);
  playModeRef.current = playMode;
  const demoIntervalRef = useRef(demoIntervalMs);
  demoIntervalRef.current = demoIntervalMs;
  const setPlayMode = (m) => setPlayModeState(m === "demo" ? "demo" : "run");
  const setDemoIntervalMs = (v) =>
    setDemoIntervalMsState(Number.isFinite(+v) && +v > 0 ? +v : DEFAULT_HOP_MS);

  const stopLoop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    playingRef.current = false;
    setPlaying(false);
  };
  const bumpFrame = () => setPlayFrame((f) => f + 1);
  const loop = (ts) => {
    const eng = playbackRef.current;
    if (!eng || !playingRef.current) return;
    const last = lastTsRef.current || ts;
    lastTsRef.current = ts;
    const dt = Math.min(64, ts - last);
    eng.step(dt * (playModeRef.current === "demo" ? 1 : speedRef.current));
    bumpFrame();
    if (eng.snapshot().done) {
      stopLoop();
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  };
  const loopRef = useRef(null);
  loopRef.current = loop;
  const activeScenarioSig = () => {
    const active = scenariosRef.current.find(
      (s) => s.id === activeScenarioRef.current,
    );
    const startId =
      selRef.current.nodes.length === 1
        ? selRef.current.nodes[0]
        : active?.startId || undefined;
    return JSON.stringify({
      choices: active?.choices || {},
      loopExits: active?.loopExits || {},
      maxLoopRetries: active?.maxLoopRetries ?? 1,
      startId,
      mode: playModeRef.current,
      hopInterval: demoIntervalRef.current,
    });
  };
  const buildEngine = () => {
    const active = scenariosRef.current.find(
      (s) => s.id === activeScenarioRef.current,
    );
    const startId =
      selRef.current.nodes.length === 1
        ? selRef.current.nodes[0]
        : active?.startId || undefined;
    const eng = createPlayback({
      nodes: nodesRef.current,
      edges: edgesRef.current,
      startId,
      choices: active?.choices,
      loopExits: active?.loopExits,
      maxLoopRetries: active?.maxLoopRetries ?? 1,
      mode: playModeRef.current,
      hopInterval: demoIntervalRef.current,
    });
    eng._sig = activeScenarioSig();
    return eng;
  };
  // Recording + a single selected node: capture that node as the scenario's
  // start (creating a scenario on the fly, like branch recording does).
  const captureStartFromSelection = () => {
    if (!recordingRef.current) return;
    const selNodes = selRef.current.nodes;
    if (selNodes.length !== 1) return;
    const sid = selNodes[0];
    setScenarios((list) => {
      let id = activeScenarioRef.current;
      if (!id || !list.some((s) => s.id === id)) {
        id = uid("sc");
        setActiveScenarioId(id);
        return [
          ...list,
          { id, name: `Scenario ${list.length + 1}`, choices: {}, startId: sid },
        ];
      }
      const cur = list.find((s) => s.id === id);
      if (cur?.startId === sid) return list;
      return list.map((s) => (s.id === id ? { ...s, startId: sid } : s));
    });
  };
  const startPlayback = () => {
    if (playbackRef.current) {
      // Scenario or start changed since the engine was built — rebuild so
      // the run follows the current path instead of resuming a stale one.
      if (playbackRef.current._sig !== activeScenarioSig()) {
        playbackRef.current = buildEngine();
        setPlayback(playbackRef.current);
        bumpFrame();
      }
      if (playbackRef.current.snapshot().done) {
        playbackRef.current.reset();
        bumpFrame();
      }
      if (!playingRef.current && !playbackRef.current.snapshot().done) {
        playingRef.current = true;
        setPlaying(true);
        lastTsRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
      }
      return;
    }
    captureStartFromSelection();
    const eng = buildEngine();
    playbackRef.current = eng;
    setPlayback(eng);
    bumpFrame();
    playingRef.current = true;
    setPlaying(true);
    lastTsRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
    fitView();
  };
  const stepFwd = () => {
    const eng = playbackRef.current;
    if (!eng) return false;
    stopLoop();
    eng.hop();
    bumpFrame();
    return true;
  };
  const stepBack = () => {
    const eng = playbackRef.current;
    if (!eng) return false;
    stopLoop();
    eng.back();
    bumpFrame();
    return true;
  };
  const restartPlayback = () => {
    const eng = playbackRef.current;
    if (!eng) return;
    stopLoop();
    eng.reset();
    bumpFrame();
  };
  const closePlayback = () => {
    stopLoop();
    playbackRef.current = null;
    setPlayback(null);
    setPlayFrame(0);
  };
  const toggleSim = () => {
    if (!playbackRef.current) startPlayback();
    setSimMode((v) => !v);
  };
  const onPlaybackChoose = (edgeId) => {
    const eng = playbackRef.current;
    if (!eng) return;
    const nodeId = eng.departNode();
    // Choosing a branch departs immediately so the token visibly responds.
    if (eng.choose(edgeId)) eng.hop();
    // Record mode: write the choice into the active scenario (creating one
    // on the fly) so future runs follow the same path.
    if (recordingRef.current && nodeId) {
      setScenarios((list) => {
        let id = activeScenarioRef.current;
        if (!id || !list.some((s) => s.id === id)) {
          id = uid("sc");
          setActiveScenarioId(id);
          return [
            ...list,
            { id, name: `Scenario ${list.length + 1}`, choices: { [nodeId]: edgeId } },
          ];
        }
        return list.map((s) =>
          s.id === id
            ? { ...s, choices: { ...s.choices, [nodeId]: edgeId } }
            : s,
        );
      });
    }
    bumpFrame();
  };
  // Editing the document invalidates the routed flow — stop playback.
  useEffect(() => {
    if (playbackRef.current) {
      stopLoop();
      playbackRef.current = null;
      setPlayback(null);
    }
  }, [nodes, edges]);

  // Scenario edits apply to a live run: rebuild the engine so the token
  // restarts on the updated path instead of keeping the old choices.
  useEffect(() => {
    if (!playbackRef.current) return;
    if (playbackRef.current._sig !== activeScenarioSig()) {
      const wasPlaying = playingRef.current;
      stopLoop();
      playbackRef.current = buildEngine();
      setPlayback(playbackRef.current);
      if (wasPlaying && !playbackRef.current.snapshot().done) {
        playingRef.current = true;
        setPlaying(true);
        lastTsRef.current = 0;
        rafRef.current = requestAnimationFrame(loopRef.current);
      }
      bumpFrame();
    }
  }, [scenarios, activeScenarioId, playMode, demoIntervalMs]);

  const byId = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const ordered = useMemo(
    () => [
      ...nodes.filter((n) => n.type === "group"),
      ...nodes.filter((n) => n.type !== "group"),
    ],
    [nodes],
  );
  const serialize = () =>
    JSON.stringify({
      nodes: nodesRef.current,
      edges: edgesRef.current,
      scenarios: scenariosRef.current,
      activeScenarioId: activeScenarioRef.current,
    });

  function pushUndo(snapShot, key) {
    if (key) {
      const now = Date.now();
      if (coalesce.current[key] && now - coalesce.current[key] < 900) {
        coalesce.current[key] = now;
        return;
      }
      coalesce.current[key] = now;
    }
    undoStack.current.push(snapShot);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current.length = 0;
  }
  const undo = () => {
    const s = undoStack.current.pop();
    if (!s) return;
    redoStack.current.push(serialize());
    const st = JSON.parse(s);
    setNodes(st.nodes || []);
    setEdges(st.edges || []);
    setSel({ nodes: [], edges: [] });
  };
  const redo = () => {
    const s = redoStack.current.pop();
    if (!s) return;
    undoStack.current.push(serialize());
    const st = JSON.parse(s);
    setNodes(st.nodes || []);
    setEdges(st.edges || []);
    setSel({ nodes: [], edges: [] });
  };

  const worldFromEvent = (e) => {
    const r = wrapRef.current.getBoundingClientRect();
    const c = camRef.current;
    return {
      x: (e.clientX - r.left - c.x) / c.zoom,
      y: (e.clientY - r.top - c.y) / c.zoom,
    };
  };
  function dragSession(move, up) {
    const mm = (ev) => move(ev);
    const mu = (ev) => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", mu);
      if (up) up(ev);
    };
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", mu);
  }
  const sn = (v) => (snap ? Math.round(v / 8) * 8 : Math.round(v * 10) / 10);
  const expandGroups = (ids) => {
    const set = new Set(ids);
    const refs = nodesRef.current;
    const by = new Map(refs.map((n) => [n.id, n]));
    refs.forEach((n) => {
      if (set.has(n.parentId)) set.add(n.id);
    });
    refs.forEach((n) => {
      if (set.has(n.id) && by.get(n.id)?.type === "group")
        refs.forEach((c) => {
          if (c.parentId === n.id) set.add(c.id);
        });
    });
    return [...set];
  };

  /* ---------- node factory ---------- */
  function makeNode(type, x, y) {
    const pal = getPaletteForTheme(theme);
    const c = pal[nodesRef.current.length % pal.length];
    const dims = NODE_SIZES[type] || [180, 56];
    const base = {
      id: uid(),
      type,
      x,
      y,
      w: dims[0],
      h: dims[1],
      strokeWidth: 2,
      fontSize: 14,
      badge: "",
      dashed: false,
      parentId: null,
    };
    if (type === "text")
      return {
        ...base,
        fill: "transparent",
        stroke: "transparent",
        textColor: T.text,
        text: "Text",
      };
    if (type === "group") {
      const gStyle = getGroupStyle(theme);
      return {
        ...base,
        fill: gStyle.fill,
        stroke: gStyle.stroke,
        textColor: T.text,
        text: "Frame",
      };
    }
    return {
      ...base,
      fill: c.fill,
      stroke: c.stroke,
      textColor: c.text || getEffectiveTextColor({ fill: c.fill }, theme),
      text: "New Node",
    };
  }
  function addNode(type) {
    const [w, h] = NODE_SIZES[type] || [180, 56];
    const nodes = nodesRef.current;
    const r = wrapRef.current.getBoundingClientRect();
    const c = camRef.current;
    const GAP = 24;
    const view = {
      x: -c.x / c.zoom,
      y: -c.y / c.zoom,
      w: r.width / c.zoom,
      h: r.height / c.zoom,
    };
    const inView = (x, y) =>
      x + w > view.x &&
      x < view.x + view.w &&
      y + h > view.y &&
      y < view.y + view.h;
    const collides = (x, y) =>
      nodes.some(
        (n) =>
          x < n.x + n.w + GAP &&
          x + w + GAP > n.x &&
          y < n.y + n.h + GAP &&
          y + h + GAP > n.y,
      );

    // Anchor at the last canvas click (centered on the cursor), falling back
    // to the viewport center before the first click.
    const click = lastCanvasClick.current;
    let ax, ay;
    if (click) {
      ax = click.x - w / 2;
      ay = click.y - h / 2;
    } else {
      ax = (r.width / 2 - c.x) / c.zoom - w / 2;
      ay = (r.height / 2 - c.y) / c.zoom - h / 2;
    }

    // Spiral outward from the anchor on a collision-free grid, preferring
    // spots that stay inside the current viewport.
    const stepX = w + GAP;
    const stepY = h + GAP;
    const candidates = [];
    for (let ring = 0; ring <= 12; ring++) {
      for (let i = -ring; i <= ring; i++) {
        for (let j = -ring; j <= ring; j++) {
          if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue;
          const x = sn(ax + i * stepX);
          const y = sn(ay + j * stepY);
          candidates.push({ x, y, d: i * i + j * j, visible: inView(x, y) });
        }
      }
    }
    candidates.sort(
      (a, b) => Number(b.visible) - Number(a.visible) || a.d - b.d,
    );
    const spot =
      candidates.find((p) => !collides(p.x, p.y)) || {
        x: sn(ax),
        y: sn(ay),
      };

    const n = makeNode(type, spot.x, spot.y);
    pushUndo(serialize());
    setNodes((ns) => [...ns, n]);
    setSel({ nodes: [n.id], edges: [] });
  }

  /* ---------- mouse interactions ---------- */
  function onCanvasMouseDown(e) {
    if (e.button === 1 || tool === "pan" || e.altKey) {
      if (e.button === 1) e.preventDefault();
      const s = { x: e.clientX, y: e.clientY, cam: { ...camRef.current } };
      dragSession((ev) =>
        setCam({
          x: s.cam.x + ev.clientX - s.x,
          y: s.cam.y + ev.clientY - s.y,
          zoom: s.cam.zoom,
        }),
      );
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    const p = worldFromEvent(e);
    const base = e.shiftKey ? selRef.current.nodes : [];
    if (!e.shiftKey) setSel({ nodes: [], edges: [] });
    setMarquee({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        setMarquee((m) => ({ ...m, x1: q.x, y1: q.y }));
      },
      (ev) => {
        const q = worldFromEvent(ev);
        const r = normRect(p, q);
        if (r.w > 4 || r.h > 4) {
          const hits = nodesRef.current
            .filter((n) => intersects(n, r))
            .map((n) => n.id);
          setSel({ nodes: [...new Set([...base, ...hits])], edges: [] });
        }
        setMarquee(null);
      },
    );
  }
  function onCanvasDoubleClick(e) {
    const p = worldFromEvent(e);
    const n = makeNode("text", sn(p.x - 80), sn(p.y - 20));
    pushUndo(serialize());
    setNodes((ns) => [...ns, n]);
    setSel({ nodes: [n.id], edges: [] });
    setEditing({ id: n.id, value: "" });
  }
  function onNodeMouseDown(e, node) {
    if (tool === "pan") return;
    e.stopPropagation();
    if (e.button !== 0) return;
    e.preventDefault();
    let ids;
    if (e.shiftKey) {
      ids = sel.nodes.includes(node.id)
        ? sel.nodes.filter((i) => i !== node.id)
        : [...sel.nodes, node.id];
      setSel({ nodes: ids, edges: e.shiftKey ? sel.edges : [] });
    } else if (sel.nodes.includes(node.id)) ids = sel.nodes;
    else {
      ids = [node.id];
      setSel({ nodes: ids, edges: e.shiftKey ? sel.edges : [] });
    }
    // Paused playback: clicking a directly-connected node routes the token
    // to it (single-edge hops happen immediately; multi-edge decisions are
    // handled by the branch badges).
    const eng = playbackRef.current;
    if (eng && !playingRef.current && !eng.snapshot().done) {
      const s = eng.snapshot();
      if (s.tokens[0]?.edge == null && s.activeNode && node.id !== s.activeNode) {
        const outs = eng.choices();
        const direct = outs.find(
          (c) => edgesRef.current.find((ed) => ed.id === c.id)?.to === node.id,
        );
        if (outs.length === 1 && direct) {
          eng.choose(direct.id);
          eng.hop();
          bumpFrame();
        }
      }
    }
    const moveSet = expandGroups(ids);
    const orig = {};
    nodesRef.current.forEach((n) => {
      if (moveSet.includes(n.id)) orig[n.id] = { x: n.x, y: n.y };
    });
    const p0 = worldFromEvent(e);
    const snapShot = serialize();
    let moved = false;
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        const dx = q.x - p0.x,
          dy = q.y - p0.y;
        moved = true;
        setNodes((ns) =>
          ns.map((n) =>
            orig[n.id]
              ? { ...n, x: sn(orig[n.id].x + dx), y: sn(orig[n.id].y + dy) }
              : n,
          ),
        );
      },
      () => {
        if (moved) pushUndo(snapShot);
      },
    );
  }
  function onPortMouseDown(e, node, side) {
    if (tool === "pan") return;
    e.stopPropagation();
    e.preventDefault();
    const p = worldFromEvent(e);
    setTempEdge({ from: node.id, fromPort: side, x: p.x, y: p.y });
    const snapShot = serialize();
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        setTempEdge((t) => ({ ...t, x: q.x, y: q.y }));
        const target = nodeAtInflated(
          q,
          nodesRef.current.filter((n) => n.id !== node.id),
        );
        setDropTarget(target ? target.id : null);
      },
      (ev) => {
        setTempEdge(null);
        setDropTarget(null);
        const q = worldFromEvent(ev);
        const target = nodeAtInflated(
          q,
          nodesRef.current.filter((n) => n.id !== node.id),
        );
        if (target) {
          const port = nearestPort(q, target);
          const edge = {
            id: uid("e"),
            from: node.id,
            fromPort: side,
            to: target.id,
            toPort: port ? port : autoPort(node, target),
            toPos: port
              ? undefined
              : { x: q.x - target.x, y: q.y - target.y },
            stroke: T.edge,
            strokeWidth: 2,
            dashed: false,
            arrow: true,
            label: "",
          };
          pushUndo(snapShot);
          setEdges((es) => [...es, edge]);
          setSel({ nodes: [], edges: [edge.id] });
        }
      },
    );
  }
  function onResizeMouseDown(e, n, handle) {
    e.stopPropagation();
    e.preventDefault();
    const p0 = worldFromEvent(e);
    const o = { ...n };
    const snapShot = serialize();
    let moved = false;
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        const dx = q.x - p0.x,
          dy = q.y - p0.y;
        moved = true;
        let { x, y, w, h } = o;
        if (handle.includes("e")) w = Math.max(40, o.w + dx);
        if (handle.includes("s")) h = Math.max(24, o.h + dy);
        if (handle.includes("w")) {
          w = Math.max(40, o.w - dx);
          x = o.x + o.w - w;
        }
        if (handle.includes("n")) {
          h = Math.max(24, o.h - dy);
          y = o.y + o.h - h;
        }
        setNodes((ns) =>
          ns.map((m) =>
            m.id === n.id
              ? { ...m, x: sn(x), y: sn(y), w: sn(w), h: sn(h) }
              : m,
          ),
        );
      },
      () => {
        if (moved) pushUndo(snapShot);
      },
    );
  }
  function onEdgeMouseDown(e, edge) {
    if (tool === "pan") return;
    e.stopPropagation();
    if (e.shiftKey) {
      setSel((s) => ({
        nodes: s.nodes,
        edges: s.edges.includes(edge.id)
          ? s.edges.filter((i) => i !== edge.id)
          : [...s.edges, edge.id],
      }));
    } else {
      setSel({ nodes: [], edges: [edge.id] });
    }
  }
  function onLabelMouseDown(e, edge) {
    if (tool === "pan") return;
    e.stopPropagation();
    e.preventDefault();
    setSel({ nodes: [], edges: [edge.id] });
    const p0 = worldFromEvent(e);
    const startDx = edge.labelDx || 0;
    const startDy = edge.labelDy || 0;
    const snapShot = serialize();
    let moved = false;
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        const dx = q.x - p0.x;
        const dy = q.y - p0.y;
        moved = true;
        setEdges((es) =>
          es.map((item) =>
            item.id === edge.id
              ? {
                  ...item,
                  labelDx: Math.round(startDx + dx),
                  labelDy: Math.round(startDy + dy),
                }
              : item,
          ),
        );
      },
      () => {
        if (moved) pushUndo(snapShot, "move_label");
      },
    );
  }
  function onMidpointMouseDown(e, edge) {
    if (tool === "pan") return;
    e.stopPropagation();
    e.preventDefault();
    const g = edgeGeom(edge, byId);
    if (!g) return;
    const wps = [{ x: sn(g.mid.x), y: sn(g.mid.y) }];
    setEdges((es) =>
      es.map((ed) => (ed.id === edge.id ? { ...ed, waypoints: wps } : ed)),
    );
    const snapShot = serialize();
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        setEdges((es) =>
          es.map((ed) =>
            ed.id === edge.id
              ? { ...ed, waypoints: [{ x: sn(q.x), y: sn(q.y) }] }
              : ed,
          ),
        );
      },
      () => pushUndo(snapShot, "wp"),
    );
  }
  function onWaypointMouseDown(e, edge, i) {
    if (tool === "pan") return;
    e.stopPropagation();
    e.preventDefault();
    const snapShot = serialize();
    let moved = false;
    dragSession(
      (ev) => {
        const q = worldFromEvent(ev);
        moved = true;
        setEdges((es) =>
          es.map((ed) =>
            ed.id === edge.id
              ? {
                  ...ed,
                  waypoints: ed.waypoints.map((wp, j) =>
                    j === i ? { x: sn(q.x), y: sn(q.y) } : wp,
                  ),
                }
              : ed,
          ),
        );
      },
      () => {
        if (moved) pushUndo(snapShot, "wp");
      },
    );
  }
  function onWaypointDoubleClick(e, edge, i) {
    e.stopPropagation();
    e.preventDefault();
    pushUndo(serialize());
    setEdges((es) =>
      es.map((ed) =>
        ed.id === edge.id
          ? {
              ...ed,
              waypoints: ed.waypoints.filter((_, j) => j !== i),
            }
          : ed,
      ),
    );
  }
  const onNodeDoubleClick = (e, n) => {
    e.stopPropagation();
    setEditing({ id: n.id, value: n.text });
  };
  const onNodeHover = (id) => setHover(id);
  const onNodeLeave = (id) => setHover((h) => (h === id ? null : h));

  /* ---------- selection ops ---------- */
  function deleteSelection() {
    const snapShot = serialize();
    const ids = new Set(selRef.current.nodes);
    const eids = new Set(selRef.current.edges);
    if (!ids.size && !eids.size) return;
    pushUndo(snapShot);
    setNodes((ns) =>
      ns
        .filter((n) => !ids.has(n.id))
        .map((n) => (ids.has(n.parentId) ? { ...n, parentId: null } : n)),
    );
    setEdges((es) =>
      es.filter(
        (e) => !eids.has(e.id) && !ids.has(e.from) && !ids.has(e.to),
      ),
    );
    setSel({ nodes: [], edges: [] });
  }
  // Remove connections only: every selected edge plus every edge attached to a
  // selected node. Nodes themselves are kept.
  function deleteConnections() {
    const ids = new Set(selRef.current.nodes);
    const eids = new Set(selRef.current.edges);
    if (!ids.size && !eids.size) return;
    const victims = edgesRef.current.filter(
      (e) => eids.has(e.id) || ids.has(e.from) || ids.has(e.to),
    );
    if (!victims.length) return;
    pushUndo(serialize());
    const gone = new Set(victims.map((e) => e.id));
    setEdges((es) => es.filter((e) => !gone.has(e.id)));
    setSel((s) => ({ ...s, edges: [] }));
  }
  function duplicate() {
    const ids = selRef.current.nodes;
    if (!ids.length) return;
    const snapShot = serialize();
    const map = {};
    const clones = [];
    nodesRef.current
      .filter((n) => ids.includes(n.id))
      .forEach((n) => {
        const c = { ...n, id: uid(), x: n.x + 30, y: n.y + 30, parentId: null };
        map[n.id] = c.id;
        clones.push(c);
      });
    clones.forEach((c) => {
      if (c.parentId && map[c.parentId]) c.parentId = map[c.parentId];
      else c.parentId = null;
    });
    const newEdges = edgesRef.current
      .filter((e) => map[e.from] && map[e.to])
      .map((e) => ({
        ...e,
        id: uid("e"),
        from: map[e.from],
        to: map[e.to],
        toPos: e.toPos
          ? { x: e.toPos.x + 30, y: e.toPos.y + 30 }
          : undefined,
        waypoints: e.waypoints
          ? e.waypoints.map((w) => ({ x: w.x + 30, y: w.y + 30 }))
          : undefined,
      }));
    pushUndo(snapShot);
    setNodes((ns) => [...ns, ...clones]);
    setEdges((es) => [...es, ...newEdges]);
    setSel({ nodes: clones.map((c) => c.id), edges: [] });
  }
  function copySel() {
    const ids = new Set(selRef.current.nodes);
    if (!ids.size) return false;
    clipboard.current = {
      nodes: nodesRef.current.filter((n) => ids.has(n.id)),
      edges: edgesRef.current.filter((e) => ids.has(e.from) && ids.has(e.to)),
    };
    return true;
  }
  function cutSel() {
    if (!copySel()) return false;
    deleteSelection();
    return true;
  }
  function pasteSel() {
    const clip = clipboard.current;
    if (!clip || !clip.nodes.length) return false;
    const snapShot = serialize();
    const idMap = {};
    const clones = clip.nodes.map((n) => {
      const c = { ...n, id: uid(), x: n.x + 30, y: n.y + 30, parentId: null };
      idMap[n.id] = c.id;
      return c;
    });
    clones.forEach((c) => {
      if (c.parentId && idMap[c.parentId]) c.parentId = idMap[c.parentId];
      else c.parentId = null;
    });
    const newEdges = clip.edges
      .filter((e) => idMap[e.from] && idMap[e.to])
      .map((e) => ({
        ...e,
        id: uid("e"),
        from: idMap[e.from],
        to: idMap[e.to],
        toPos: e.toPos
          ? { x: e.toPos.x + 30, y: e.toPos.y + 30 }
          : undefined,
        waypoints: e.waypoints
          ? e.waypoints.map((w) => ({ x: w.x + 30, y: w.y + 30 }))
          : undefined,
      }));
    pushUndo(snapShot);
    setNodes((ns) => [...ns, ...clones]);
    setEdges((es) => [...es, ...newEdges]);
    setSel({ nodes: clones.map((c) => c.id), edges: [] });
    return true;
  }
  function selectAll() {
    setSel({
      nodes: nodesRef.current.map((n) => n.id),
      edges: edgesRef.current.map((e) => e.id),
    });
  }
  function selectOnlyNodes() {
    setSel((s) => ({ nodes: s.nodes, edges: [] }));
  }
  function selectOnlyEdges() {
    setSel((s) => {
      if (s.edges.length > 0) {
        return { nodes: [], edges: s.edges };
      }
      const nodeSet = new Set(s.nodes);
      const connectedEdges = edgesRef.current
        .filter((e) => nodeSet.has(e.from) && nodeSet.has(e.to))
        .map((e) => e.id);
      return {
        nodes: [],
        edges: connectedEdges.length > 0 ? connectedEdges : edgesRef.current.map((e) => e.id),
      };
    });
  }
  function nudgeSel(dx, dy) {
    const ids = selRef.current.nodes;
    if (!ids.length) return false;
    const moveSet = expandGroups(ids);
    pushUndo(serialize(), "nudge");
    setNodes((ns) =>
      ns.map((n) =>
        moveSet.includes(n.id) ? { ...n, x: sn(n.x + dx), y: sn(n.y + dy) } : n,
      ),
    );
    return true;
  }
  function groupSel() {
    const ids = selRef.current.nodes;
    if (!ids.length) return;
    const snapShot = serialize();
    const chosen = nodesRef.current.filter((n) => ids.includes(n.id));
    const bx = Math.min(...chosen.map((n) => n.x)) - 24,
      by = Math.min(...chosen.map((n) => n.y)) - 24;
    const bw = Math.max(...chosen.map((n) => n.x + n.w)) + 24 - bx,
      bh = Math.max(...chosen.map((n) => n.y + n.h)) + 24 - by;
    const gStyle = getGroupStyle(theme);
    const g = {
      id: uid(),
      type: "group",
      x: bx,
      y: by,
      w: bw,
      h: bh,
      strokeWidth: 2,
      fontSize: 14,
      badge: "",
      parentId: null,
      fill: gStyle.fill,
      stroke: gStyle.stroke,
      textColor: T.text,
      text: "Group",
    };
    pushUndo(snapShot);
    setNodes((ns) => [
      g,
      ...ns.map((n) =>
        ids.includes(n.id) && !ids.includes(n.parentId)
          ? { ...n, parentId: g.id }
          : n,
      ),
    ]);
    setSel({ nodes: [g.id], edges: [] });
  }
  function ungroupSel() {
    const ids = selRef.current.nodes;
    const groups = nodesRef.current.filter(
      (n) => ids.includes(n.id) && n.type === "group",
    );
    if (!groups.length) return;
    const snapShot = serialize();
    const gids = new Set(groups.map((g) => g.id));
    pushUndo(snapShot);
    setNodes((ns) =>
      ns
        .filter((n) => !gids.has(n.id))
        .map((n) => (gids.has(n.parentId) ? { ...n, parentId: null } : n)),
    );
    setSel({ nodes: [], edges: [] });
  }
  function alignSel(dir) {
    const ids = selRef.current.nodes;
    if (ids.length < 2) return;
    const snapShot = serialize();
    const chosen = nodesRef.current.filter((n) => ids.includes(n.id));

    if (dir === "distribute-h" || dir === "hdistribute") {
      if (chosen.length < 3) return;
      const sorted = [...chosen].sort((a, b) => a.x - b.x);
      const minX = sorted[0].x;
      const last = sorted[sorted.length - 1];
      const maxX = last.x + last.w;
      const totalNodeW = sorted.reduce((sum, n) => sum + n.w, 0);
      const remainingSpace = maxX - minX - totalNodeW;
      const gap = remainingSpace / (sorted.length - 1);

      const newXMap = new Map();
      let curX = minX;
      for (let i = 0; i < sorted.length; i++) {
        const n = sorted[i];
        if (i === 0) {
          newXMap.set(n.id, n.x);
          curX = n.x + n.w + gap;
        } else if (i === sorted.length - 1) {
          newXMap.set(n.id, n.x);
        } else {
          newXMap.set(n.id, sn(curX));
          curX += n.w + gap;
        }
      }

      pushUndo(snapShot);
      setNodes((ns) =>
        ns.map((n) => (newXMap.has(n.id) ? { ...n, x: newXMap.get(n.id) } : n)),
      );
      return;
    }

    if (dir === "distribute-v" || dir === "vdistribute") {
      if (chosen.length < 3) return;
      const sorted = [...chosen].sort((a, b) => a.y - b.y);
      const minY = sorted[0].y;
      const last = sorted[sorted.length - 1];
      const maxY = last.y + last.h;
      const totalNodeH = sorted.reduce((sum, n) => sum + n.h, 0);
      const remainingSpace = maxY - minY - totalNodeH;
      const gap = remainingSpace / (sorted.length - 1);

      const newYMap = new Map();
      let curY = minY;
      for (let i = 0; i < sorted.length; i++) {
        const n = sorted[i];
        if (i === 0) {
          newYMap.set(n.id, n.y);
          curY = n.y + n.h + gap;
        } else if (i === sorted.length - 1) {
          newYMap.set(n.id, n.y);
        } else {
          newYMap.set(n.id, sn(curY));
          curY += n.h + gap;
        }
      }

      pushUndo(snapShot);
      setNodes((ns) =>
        ns.map((n) => (newYMap.has(n.id) ? { ...n, y: newYMap.get(n.id) } : n)),
      );
      return;
    }

    const minX = Math.min(...chosen.map((n) => n.x)),
      maxX = Math.max(...chosen.map((n) => n.x + n.w));
    const minY = Math.min(...chosen.map((n) => n.y)),
      maxY = Math.max(...chosen.map((n) => n.y + n.h));
    const midX = (minX + maxX) / 2,
      midY = (minY + maxY) / 2;
    pushUndo(snapShot);
    setNodes((ns) =>
      ns.map((n) => {
        if (!ids.includes(n.id)) return n;
        let x = n.x,
          y = n.y;
        if (dir === "left") x = minX;
        else if (dir === "right") x = maxX - n.w;
        else if (dir === "hcenter") x = midX - n.w / 2;
        else if (dir === "top") y = minY;
        else if (dir === "bottom") y = maxY - n.h;
        else if (dir === "vcenter") y = midY - n.h / 2;
        return { ...n, x: sn(x), y: sn(y) };
      }),
    );
  }
  const patchSelNodes = (patch, key) => {
    pushUndo(serialize(), key || "__patch");
    setNodes((ns) =>
      ns.map((n) => (sel.nodes.includes(n.id) ? { ...n, ...patch } : n)),
    );
  };
  const patchEdge = (patch, key) => {
    pushUndo(serialize(), key || "__epatch");
    setEdges((es) =>
      es.map((e) => (sel.edges.includes(e.id) ? { ...e, ...patch } : e)),
    );
  };
  const patchSelection = (patch, key) => {
    pushUndo(serialize(), key || "__patchsel");
    if (sel.nodes.length > 0) {
      setNodes((ns) =>
        ns.map((n) => (sel.nodes.includes(n.id) ? { ...n, ...patch } : n)),
      );
    }
    if (sel.edges.length > 0) {
      const edgePatch = { ...patch };
      if (patch.fill !== undefined && patch.labelBg === undefined) {
        edgePatch.labelBg = patch.fill;
      }
      setEdges((es) =>
        es.map((e) => (sel.edges.includes(e.id) ? { ...e, ...edgePatch } : e)),
      );
    }
  };

  /* ---------- scenarios ---------- */
  const createScenario = () => {
    const id = uid("sc");
    setScenarios((l) => [
      ...l,
      { id, name: `Scenario ${l.length + 1}`, choices: {}, loopExits: {}, maxLoopRetries: 1 },
    ]);
    setActiveScenarioId(id);
    setShowScenarios(true);
  };
  const renameScenario = (id, name) =>
    setScenarios((l) => l.map((s) => (s.id === id ? { ...s, name } : s)));
  const deleteScenario = (id) => {
    setScenarios((l) => l.filter((s) => s.id !== id));
    if (activeScenarioRef.current === id) setActiveScenarioId(null);
  };
  const duplicateScenario = (id) =>
    setScenarios((l) => {
      const s = l.find((x) => x.id === id);
      if (!s) return l;
      return [
        ...l,
        {
          id: uid("sc"),
          name: `${s.name} copy`,
          startId: s.startId,
          choices: { ...s.choices },
          loopExits: { ...(s.loopExits || {}) },
          maxLoopRetries: s.maxLoopRetries ?? 1,
        },
      ];
    });
  const setScenarioStart = (id, nodeId) =>
    setScenarios((l) =>
      l.map((s) => (s.id === id ? { ...s, startId: nodeId || undefined } : s)),
    );
  const setScenarioChoice = (id, nodeId, edgeId) =>
    setScenarios((l) =>
      l.map((s) => {
        if (s.id !== id) return s;
        const choices = { ...s.choices };
        if (edgeId) choices[nodeId] = edgeId;
        else delete choices[nodeId];
        return { ...s, choices };
      }),
    );
  const setScenarioLoopExit = (id, nodeId, edgeId) =>
    setScenarios((l) =>
      l.map((s) => {
        if (s.id !== id) return s;
        const loopExits = { ...(s.loopExits || {}) };
        if (edgeId) loopExits[nodeId] = edgeId;
        else delete loopExits[nodeId];
        return { ...s, loopExits };
      }),
    );
  const setScenarioMaxLoopRetries = (id, count) =>
    setScenarios((l) =>
      l.map((s) =>
        s.id === id ? { ...s, maxLoopRetries: Math.max(1, count) } : s,
      ),
    );
  const exportScenarios = () => {
    if (!scenariosRef.current.length) {
      alert("No scenarios to export");
      return;
    }
    save(
      new Blob(
        [
          JSON.stringify(
            {
              app: "flowstudio",
              version: 1,
              scenarios: scenariosRef.current,
              activeScenarioId: activeScenarioRef.current,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "flowstudio-scenarios.json",
    );
  };
  const importScenarios = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const incoming = Array.isArray(data?.scenarios)
          ? data.scenarios
          : Array.isArray(data)
            ? data
            : null;
        if (!incoming || !incoming.length) {
          alert("No scenarios found in file");
          return;
        }
        const edgesNow = edgesRef.current;
        setScenarios((list) => {
          const usedNames = new Set(list.map((s) => s.name));
          const merged = [...list];
          for (const s of incoming) {
            if (!s || typeof s !== "object" || !s.name) continue;
            let name = String(s.name).slice(0, 60);
            if (usedNames.has(name)) name = `${name} copy`;
            usedNames.add(name);
            const choices = {};
            const loopExits = {};
            if (s.choices && typeof s.choices === "object") {
              for (const [nodeId, edgeId] of Object.entries(s.choices)) {
                if (edgesNow.some((e) => e.from === nodeId && e.id === edgeId))
                  choices[nodeId] = edgeId;
              }
            }
            if (s.loopExits && typeof s.loopExits === "object") {
              for (const [nodeId, edgeId] of Object.entries(s.loopExits)) {
                if (edgesNow.some((e) => e.from === nodeId && e.id === edgeId))
                  loopExits[nodeId] = edgeId;
              }
            }
            const maxLoopRetries = typeof s.maxLoopRetries === "number" ? Math.max(1, s.maxLoopRetries) : 1;
            const nodesNow = nodesRef.current;
            const startId =
              typeof s.startId === "string" &&
              nodesNow.some((n) => n.id === s.startId && n.type !== "group")
                ? s.startId
                : undefined;
            merged.push({ id: uid("sc"), name, startId, choices, loopExits, maxLoopRetries });
          }
          return merged;
        });
        setShowScenarios(true);
      } catch {
        alert("Invalid scenarios file");
      }
    };
    reader.readAsText(file);
  };

  /* ---------- view ---------- */
  function zoomAt(sx, sy, f) {
    const c = camRef.current;
    const zoom = clamp(c.zoom * f, 0.2, 4);
    const wx = (sx - c.x) / c.zoom;
    const wy = (sy - c.y) / c.zoom;
    setCam({ zoom, x: sx - wx * zoom, y: sy - wy * zoom });
  }
  const zoomIn = () => {
    const r = wrapRef.current.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, 1.2);
  };
  const zoomOut = () => {
    const r = wrapRef.current.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, 1 / 1.2);
  };
  function fitView() {
    const ns = nodesRef.current;
    if (!ns.length) return;
    const r = wrapRef.current.getBoundingClientRect();
    const pad = 60;
    const bx = Math.min(...ns.map((n) => n.x)) - pad,
      by = Math.min(...ns.map((n) => n.y)) - pad;
    const bw = Math.max(...ns.map((n) => n.x + n.w)) + pad - bx,
      bh = Math.max(...ns.map((n) => n.y + n.h)) + pad - by;
    const zoom = clamp(Math.min(r.width / bw, r.height / bh), 0.2, 2);
    setCam({
      zoom,
      x: (r.width - bw * zoom) / 2 - bx * zoom,
      y: (r.height - bh * zoom) / 2 - by * zoom,
    });
  }
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            app: "flowstudio",
            version: 1,
            theme,
            nodes,
            edges,
            scenarios,
            activeScenarioId,
            cam,
            snap,
            showGrid,
            playMode,
            demoIntervalMs,
          }),
        );
      } catch {
        /* ignore quota / privacy errors */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [nodes, edges, theme, cam, snap, showGrid, scenarios, activeScenarioId, playMode, demoIntervalMs]);
  useEffect(() => {
    if (!saved) fitView();
  }, [saved]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(
        e.clientX - r.left,
        e.clientY - r.top,
        e.deltaY < 0 ? 1.1 : 1 / 1.1,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  // Remember where the user last clicked on the canvas so new shapes land
  // around that spot instead of at the viewport center.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onDown = (e) => {
      if (e.button === 0) lastCanvasClick.current = worldFromEvent(e);
    };
    svg.addEventListener("mousedown", onDown);
    return () => svg.removeEventListener("mousedown", onDown);
  }, []);

  /* ---------- keyboard ---------- */
  const actionsRef = useRef({});
  actionsRef.current = {
    undo,
    redo,
    deleteSelection,
    deleteConnections,
    duplicate,
    groupSel,
    ungroupSel,
    copySel,
    cutSel,
    pasteSel,
    selectAll,
    nudgeSel,
    addNode,
    escape: () => {
      if (simModeRef.current) {
        setSimMode(false);
        return;
      }
      setShowScenarios(false);
      setSel({ nodes: [], edges: [] });
      setEditing(null);
      setTool((t) => (t === "pan" ? "select" : t));
    },
    togglePlay: () => {
      if (!playbackRef.current) {
        startPlayback();
        return true;
      }
      if (playingRef.current) stopLoop();
      else {
        if (playbackRef.current.snapshot().done) {
          playbackRef.current.reset();
          bumpFrame();
        }
        if (!playbackRef.current.snapshot().done) {
          playingRef.current = true;
          setPlaying(true);
          lastTsRef.current = 0;
          rafRef.current = requestAnimationFrame(loop);
        }
      }
      return true;
    },
    toggleSim,
    restartPlayback,
    stepFwd,
    stepBack,
    closePlayback,
  };
  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const A = actionsRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();

      // Debugger / Simulation Shortcuts
      if (playbackRef.current || simModeRef.current) {
        if (e.key === "F5") {
          e.preventDefault();
          if (e.shiftKey) A.restartPlayback();
          else A.togglePlay();
          return;
        }
        if (
          e.key === "F10" ||
          (e.key === "ArrowRight" && !mod && !selRef.current.nodes.length) ||
          (!mod && k === "n")
        ) {
          e.preventDefault();
          A.stepFwd();
          return;
        }
        if (
          e.key === "F11" ||
          (e.key === "ArrowLeft" && !mod && !selRef.current.nodes.length) ||
          (!mod && k === "b")
        ) {
          e.preventDefault();
          A.stepBack();
          return;
        }
        if (!mod && k === "r") {
          e.preventDefault();
          A.restartPlayback();
          return;
        }
        if (!mod && (e.key === "+" || e.key === "=")) {
          e.preventDefault();
          setSpeed((sp) => Math.min(4, Math.round((sp + 0.25) * 100) / 100));
          return;
        }
        if (!mod && e.key === "-") {
          e.preventDefault();
          setSpeed((sp) => Math.max(0.25, Math.round((sp - 0.25) * 100) / 100));
          return;
        }
      }

      // Cmd+K Command Palette
      if (mod && k === "k") {
        e.preventDefault();
        setIsCmdPaletteOpen((prev) => !prev);
        return;
      }

      if (mod && k === "z" && !e.shiftKey) {
        e.preventDefault();
        A.undo();
      } else if (mod && (k === "y" || (k === "z" && e.shiftKey))) {
        e.preventDefault();
        A.redo();
      } else if (mod && k === "d") {
        e.preventDefault();
        A.duplicate();
      } else if (mod && k === "g") {
        e.preventDefault();
        if (e.shiftKey) A.ungroupSel();
        else A.groupSel();
      } else if (mod && k === "a") {
        e.preventDefault();
        A.selectAll();
      } else if (mod && k === "c" && A.copySel()) {
        e.preventDefault();
      } else if (mod && k === "x" && A.cutSel()) {
        e.preventDefault();
      } else if (mod && k === "v" && A.pasteSel()) {
        e.preventDefault();
      } else if ((e.key === "Delete" || e.key === "Backspace") && e.shiftKey) {
        e.preventDefault();
        A.deleteConnections();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        A.deleteSelection();
      } else if (e.key === "Escape") {
        e.preventDefault();
        A.escape();
      } else if (e.key === " ") {
        if (A.togglePlay()) e.preventDefault();
      } else if (e.key === ",") {
        if (A.stepBack()) e.preventDefault();
      } else if (e.key === ".") {
        if (A.stepFwd()) e.preventDefault();
      } else if (e.key.startsWith("Arrow")) {
        const d = e.shiftKey ? 1 : 8;
        const dx = e.key === "ArrowLeft" ? -d : e.key === "ArrowRight" ? d : 0;
        const dy = e.key === "ArrowUp" ? -d : e.key === "ArrowDown" ? d : 0;
        if (A.nudgeSel(dx, dy)) e.preventDefault();
      } else if (!mod && k === "v") {
        setTool("select");
      } else if (!mod && k === "h") {
        setTool("pan");
      } else if (!mod && k === "s") {
        A.toggleSim();
      } else if (!mod && !simModeRef.current && SHAPE_BY_KEY[k]) {
        e.preventDefault();
        A.addNode(SHAPE_BY_KEY[k]);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ---------- theme harmonization ---------- */
  const harmonizeDiagram = (targetTheme = theme) => {
    pushUndo({ nodes, edges });
    setNodes((curr) => rethemeDiagram(curr, targetTheme));
    setEdges((curr) => rethemeEdges(curr, targetTheme));
  };

  const harmonizeSelection = (targetTheme = theme) => {
    if (!sel.nodes.length) return;
    pushUndo({ nodes, edges });
    const pal = getPaletteForTheme(targetTheme);
    const gStyle = getGroupStyle(targetTheme);
    const targetT = THEMES[targetTheme] || THEMES[DEFAULT_THEME_ID];
    const selSet = new Set(sel.nodes);

    setNodes((curr) => {
      let regIdx = 0;
      return curr.map((n) => {
        if (!selSet.has(n.id)) return n;
        if (n.type === "group") {
          return {
            ...n,
            fill: gStyle.fill,
            stroke: gStyle.stroke,
            textColor: targetT.text,
          };
        }
        if (n.type === "text") {
          return {
            ...n,
            fill: "transparent",
            stroke: "transparent",
            textColor: targetT.text,
          };
        }
        const c = pal[regIdx % pal.length];
        regIdx++;
        return {
          ...n,
          fill: c.fill,
          stroke: c.stroke,
          textColor: c.text || getEffectiveTextColor({ ...n, fill: c.fill }, targetTheme),
        };
      });
    });
  };

  /* ---------- import / export ---------- */
  const save = (blob, name) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  };

  function buildExportSvg(options = {}) {
    const {
      transparent = false,
      padding = 40,
      theme: optTheme = theme,
    } = typeof options === "boolean" ? { transparent: options } : options;
    const ns = nodesRef.current;
    if (!ns || !ns.length) return null;
    return exportDiagramToSvg({
      nodes: ns,
      edges: edgesRef.current,
      theme: optTheme,
      transparent,
      padding,
    });
  }

  const exportSVG = (options = {}) => {
    const { transparent = false, theme: optTheme = theme } =
      typeof options === "boolean" ? { transparent: options } : options;
    const b = buildExportSvg({ transparent, theme: optTheme });
    if (!b) {
      alert("Canvas is empty. Add some nodes before exporting.");
      return;
    }
    const filename = transparent
      ? `flowstudio-${optTheme}-transparent.svg`
      : `flowstudio-${optTheme}.svg`;
    save(new Blob([b.str], { type: "image/svg+xml;charset=utf-8" }), filename);
  };

  const exportPNG = (options = {}) => {
    const { transparent = false, scale = 2, theme: optTheme = theme } =
      typeof options === "boolean" ? { transparent: options } : options;
    const b = buildExportSvg({ transparent, theme: optTheme });
    if (!b) {
      alert("Canvas is empty. Add some nodes before exporting.");
      return;
    }
    const expT = THEMES[optTheme] || T;
    const img = new Image();
    const svgBlob = new Blob([b.str], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(b.w * scale);
      canvas.height = Math.round(b.h * scale);
      const ctx = canvas.getContext("2d");
      if (!transparent) {
        ctx.fillStyle = expT.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((bl) => {
        if (bl) {
          const filename = transparent
            ? `flowstudio-${optTheme}-transparent.png`
            : `flowstudio-${optTheme}.png`;
          save(bl, filename);
        }
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      alert("Failed to generate PNG image.");
    };
    img.src = url;
  };

  const copyPNGToClipboard = async (options = {}) => {
    const { transparent = false, scale = 2, theme: optTheme = theme } =
      typeof options === "boolean" ? { transparent: options } : options;
    const b = buildExportSvg({ transparent, theme: optTheme });
    if (!b) {
      alert("Canvas is empty. Add some nodes before exporting.");
      return false;
    }
    const expT = THEMES[optTheme] || T;

    const renderBlob = () =>
      new Promise((resolve, reject) => {
        const img = new Image();
        const svgBlob = new Blob([b.str], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(b.w * scale);
            canvas.height = Math.round(b.h * scale);
            const ctx = canvas.getContext("2d");
            if (!transparent) {
              ctx.fillStyle = expT.bg;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              URL.revokeObjectURL(url);
              if (blob) resolve(blob);
              else reject(new Error("Canvas toBlob failed"));
            }, "image/png");
          } catch (err) {
            URL.revokeObjectURL(url);
            reject(err);
          }
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        img.src = url;
      });

    // 1. Try modern navigator.clipboard.write with ClipboardItem taking a Promise
    // (Preserves user activation token in Chromium/Safari)
    try {
      if (typeof ClipboardItem !== "undefined" && navigator?.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": renderBlob(),
          }),
        ]);
        return true;
      }
    } catch (err) {
      console.warn("Direct ClipboardItem Promise write failed, falling back:", err);
    }

    // 2. Fallback: await the blob and then try write
    try {
      const blob = await renderBlob();
      if (typeof ClipboardItem !== "undefined" && navigator?.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
        return true;
      }
    } catch (err) {
      console.error("Clipboard copy PNG failed:", err);
    }

    return false;
  };

  function copyTextFallback(text) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "2em";
      ta.style.height = "2em";
      ta.style.padding = "0";
      ta.style.border = "none";
      ta.style.outline = "none";
      ta.style.boxShadow = "none";
      ta.style.background = "transparent";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      const success = document.execCommand("copy");
      document.body.removeChild(ta);
      return !!success;
    } catch (err) {
      console.error("copyTextFallback failed:", err);
      return false;
    }
  }

  const copySVGToClipboard = async (options = {}) => {
    const { transparent = false, theme: optTheme = theme } =
      typeof options === "boolean" ? { transparent: options } : options;
    const b = buildExportSvg({ transparent, theme: optTheme });
    if (!b) {
      alert("Canvas is empty. Add some nodes before exporting.");
      return false;
    }
    // 1. Try modern clipboard writeText if available
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(b.str);
        return true;
      }
    } catch (err) {
      console.warn("navigator.clipboard.writeText failed, using fallback...", err);
    }
    // 2. Fallback using execCommand
    return copyTextFallback(b.str);
  };
  const exportJSON = () =>
    save(
      new Blob(
        [
          JSON.stringify(
            {
              app: "flowstudio",
              theme,
              nodes,
              edges,
              scenarios,
              activeScenarioId,
              playMode,
              demoIntervalMs,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      "flowstudio.json",
    );
  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = normalizeDiagram(JSON.parse(reader.result));
        if (!d) {
          alert("Invalid JSON file");
          return;
        }
        pushUndo(serialize());
        setNodes(d.nodes);
        setEdges(d.edges);
        setScenarios(d.scenarios);
        setActiveScenarioId(d.activeScenarioId);
        if (d.theme) setTheme(d.theme);
        setPlayMode(d.playMode);
        setDemoIntervalMs(d.demoIntervalMs);
        setSel({ nodes: [], edges: [] });
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  }
  async function importMermaid(file) {
    try {
      const source = extractMermaidSource(await file.text());
      if (!source) {
        alert("No mermaid code found in file");
        return;
      }
      const d = await mermaidTextToDiagram(source);
      pushUndo(serialize());
      setNodes(d.nodes);
      setEdges(d.edges);
      setSel({ nodes: [], edges: [] });
      setTimeout(fitView, 0);
    } catch (err) {
      alert("Mermaid import failed: " + (err?.message || String(err)).slice(0, 200));
    }
  }

  const setTheme = (t) => {
    const prevTheme = theme;
    setThemeState(t);
    try {
      localStorage.setItem("fs-theme", t);
    } catch {
      /* ignore */
    }

    const prevT = THEMES[prevTheme] || THEMES[DEFAULT_THEME_ID];
    const nextT = THEMES[t] || THEMES[DEFAULT_THEME_ID];
    const nextGStyle = getGroupStyle(t);

    setNodes((curr) =>
      curr.map((n) => {
        if (n.type === "text") {
          if (!n.textColor || n.textColor === prevT.text || getContrast(n.textColor, nextT.bg) < 3.0) {
            return { ...n, textColor: nextT.text };
          }
        }
        if (n.type === "group") {
          return {
            ...n,
            fill: nextGStyle.fill,
            stroke: nextGStyle.stroke,
            textColor:
              !n.textColor || n.textColor === prevT.text || getContrast(n.textColor, nextT.bg) < 3.0
                ? nextT.text
                : n.textColor,
          };
        }
        const safeText = getEffectiveTextColor(n, t);
        if (safeText !== n.textColor && getContrast(n.textColor, n.fill) < 2.5) {
          return { ...n, textColor: safeText };
        }
        return n;
      })
    );
  };

  function newDocument() {
    if (!confirm("Start a new document? The saved diagram will be cleared."))
      return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setNodes(INITIAL.nodes);
    setEdges(INITIAL.edges);
    setSel({ nodes: [], edges: [] });
    setCam({ x: 20, y: 10, zoom: 1 });
  }

  /* ---------- render ---------- */
  const single = sel.nodes.length === 1 ? byId[sel.nodes[0]] : null;
  const selEdge =
    sel.edges.length === 1 ? edges.find((e) => e.id === sel.edges[0]) : null;
  const z = cam.zoom;

  return (
    <div
      className="fs-root"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: T.bg,
        color: T.text,
        colorScheme: isDarkTheme(theme) ? "dark" : "light",
        accentColor: T.accent,
        "--bg": T.bg,
        "--panel": T.panel,
        "--panel-solid": T.panelSolid,
        "--border": T.border,
        "--border-hard": T.borderHard,
        "--text": T.text,
        "--muted": T.muted,
        "--accent": T.accent,
        "--accent-light": T.accentLight,
        "--accent-glow": T.accentGlow || "rgba(99, 102, 241, 0.2)",
        "--shadow": T.shadow,
      }}
    >
      {/* Floating Island Navigation */}
      {!simMode && (
        <TopBar
          tool={tool}
          theme={theme}
          onUndo={undo}
          onRedo={redo}
          onToggleTool={(t) => setTool(t)}
          onToggleTheme={() => setTheme(nextTheme(theme))}
          onOpenCmdPalette={() => setIsCmdPaletteOpen(true)}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onNew={newDocument}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          isInspectorOpen={isInspectorOpen}
          onToggleSim={toggleSim}
        />
      )}

      {/* Floating Shape Dock */}
      {!simMode && <Palette onAddNode={addNode} />}

      {/* Edge-to-Edge Canvas with HUD Controls */}
      <Canvas
        wrapRef={wrapRef}
        svgRef={svgRef}
        T={T}
        z={z}
        cam={cam}
        snap={snap}
        showGrid={showGrid && !simMode}
        tool={tool}
        ordered={ordered}
        edges={edges}
        byId={byId}
        sel={sel}
        hover={hover}
        marquee={marquee}
        tempEdge={tempEdge}
        dropTarget={dropTarget}
        editing={editing}
        onCanvasMouseDown={onCanvasMouseDown}
        onCanvasDoubleClick={onCanvasDoubleClick}
        onNodeMouseDown={onNodeMouseDown}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeHover={onNodeHover}
        onNodeLeave={onNodeLeave}
        onPortMouseDown={onPortMouseDown}
        onResizeMouseDown={onResizeMouseDown}
        onEdgeMouseDown={onEdgeMouseDown}
        onLabelMouseDown={onLabelMouseDown}
        onMidpointMouseDown={onMidpointMouseDown}
        onWaypointMouseDown={onWaypointMouseDown}
        onWaypointDoubleClick={onWaypointDoubleClick}
        onEditChange={(v) => setEditing((ed) => ({ ...ed, value: v }))}
        onEditCommit={() => {
          if (!editing) return;
          const n = byId[editing.id];
          if (!n) {
            setEditing(null);
            return;
          }
          pushUndo(serialize());
          setNodes((ns) =>
            ns.map((m) =>
              m.id === n.id ? { ...m, text: editing.value } : m,
            ),
          );
          setEditing(null);
        }}
        onEditCancel={() => setEditing(null)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFit={fitView}
        onToggleSnap={() => setSnap((s) => !s)}
        onToggleGrid={() => setShowGrid((s) => !s)}
        onDuplicate={duplicate}
        onDeleteSelection={deleteSelection}
        onDeleteConnections={deleteConnections}
        onGroup={groupSel}
        onUngroup={ungroupSel}
        onSelectOnlyNodes={selectOnlyNodes}
        onSelectOnlyEdges={selectOnlyEdges}
        onSelectAll={selectAll}
        playback={playback}
        playFrame={playFrame}
        playing={playing}
        onPlaybackChoose={onPlaybackChoose}
        simMode={simMode}
        playMode={playMode}
      />

      {/* Playback Controls */}
      {playback && (
        <PlayBar
          playing={playing}
          done={playback.snapshot().done}
          steps={playback.snapshot().steps}
          loopDetected={playback.snapshot().loopDetected}
          loopExited={playback.snapshot().loopExited}
          speed={speed}
          scenarioName={
            scenarios.find((s) => s.id === activeScenarioId)?.name || null
          }
          simMode={simMode}
          mode={playMode}
          onMode={setPlayMode}
          intervalMs={demoIntervalMs}
          onInterval={setDemoIntervalMs}
          laps={playback.snapshot().laps || 0}
          awaiting={playback.snapshot().awaiting}
          serviceCount={playback.snapshot().services?.length || 0}
          onPlay={startPlayback}
          onPause={stopLoop}
          onStepFwd={stepFwd}
          onStepBack={stepBack}
          onRestart={restartPlayback}
          onSpeed={(v) => {
            setSpeedState(v);
            speedRef.current = v;
          }}
          onClose={closePlayback}
          onToggleScenarios={() => setShowScenarios((v) => !v)}
          onToggleSim={() => setSimMode((v) => !v)}
        />
      )}

      {/* Scenarios Panel */}
      {showScenarios && (
        <ScenariosPanel
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          nodes={nodes}
          edges={edges}
          recording={recording}
          loopDetected={playback?.snapshot()?.loopDetected}
          loopExited={playback?.snapshot()?.loopExited}
          loopNodeId={playback?.snapshot()?.loopNode}
          onSelect={setActiveScenarioId}
          onCreate={createScenario}
          onRename={renameScenario}
          onDelete={deleteScenario}
          onDuplicate={duplicateScenario}
          onStart={setScenarioStart}
          onChoice={setScenarioChoice}
          onLoopExit={setScenarioLoopExit}
          onMaxLoopRetries={setScenarioMaxLoopRetries}
          onRecording={(v) => setRecording(v)}
          onClose={() => setShowScenarios(false)}
          onExport={exportScenarios}
          onImport={() => scenariosFileRef.current?.click()}
          simMode={simMode}
        />
      )}

      {/* Floating Right Inspector Panel */}
      {!simMode && isInspectorOpen && (
        <PropertiesPanel
          theme={theme}
          nodes={nodes}
          edges={edges}
          selEdge={selEdge}
          single={single}
          selectedCount={sel.nodes.length}
          selectedEdges={sel.edges.length}
          patchSelNodes={patchSelNodes}
          patchEdge={patchEdge}
          patchSelection={patchSelection}
          deleteSelection={deleteSelection}
          deleteConnections={deleteConnections}
          duplicate={duplicate}
          onAlign={alignSel}
          onSetTheme={setTheme}
          onHarmonizeDiagram={() => harmonizeDiagram(theme)}
          onHarmonizeSelection={() => harmonizeSelection(theme)}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        theme={theme}
        onAddNode={addNode}
        onUndo={undo}
        onRedo={redo}
        onGroup={groupSel}
        onUngroup={ungroupSel}
        onDuplicate={duplicate}
        onCopy={copySel}
        onPaste={pasteSel}
        onDelete={deleteSelection}
        onDeleteConnections={deleteConnections}
        onSelectAll={selectAll}
        onAlign={alignSel}
        onFit={fitView}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onToggleSnap={() => setSnap((s) => !s)}
        onToggleGrid={() => setShowGrid((s) => !s)}
        onToggleTheme={() => setTheme(nextTheme(theme))}
        onSetTheme={setTheme}
        onHarmonizeDiagram={() => harmonizeDiagram(theme)}
        onOpenExport={() => {
          setIsCmdPaletteOpen(false);
          setIsExportModalOpen(true);
        }}
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onCopyPNG={copyPNGToClipboard}
        onCopySVG={copySVGToClipboard}
        onImportJSON={importJSON}
        onImportMermaid={importMermaid}
        onNew={newDocument}
        importFileRef={fileRef}
        mermaidFileRef={merFileRef}
      />

      {/* Export Options Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        theme={theme}
        T={T}
        onExportJSON={exportJSON}
        onExportSVG={exportSVG}
        onExportPNG={exportPNG}
        onCopyPNG={copyPNGToClipboard}
        onCopySVG={copySVGToClipboard}
      />

      {/* Hidden File Input for Import */}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) importJSON(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={merFileRef}
        type="file"
        accept=".md,.mmd,.txt,text/plain,.mermaid"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) importMermaid(e.target.files[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={scenariosFileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files[0]) importScenarios(e.target.files[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
