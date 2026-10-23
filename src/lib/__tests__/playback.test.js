import { describe, expect, it } from "vitest";
import { DEFAULT_HOP_MS, createPlayback } from "../playback.js";

const node = (id, extra = {}) => ({
  id,
  type: "rect",
  x: 0,
  y: 0,
  w: 100,
  h: 50,
  text: id,
  ...extra,
});

const edge = (id, from, to, extra = {}) => ({
  id,
  from,
  to,
  strokeWidth: 2,
  ...extra,
});

const chain = () => {
  const nodes = [node("a"), node("b"), node("c")];
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
  return createPlayback({ nodes, edges, startId: "a" });
};

describe("createPlayback", () => {
  it("defaults to a sane hop interval", () => {
    expect(DEFAULT_HOP_MS).toBe(3000);
  });

  it("hops through a linear chain", () => {
    const engine = chain();
    expect(engine.snapshot().activeNode).toBe("a");
    expect(engine.snapshot().done).toBe(false);

    engine.hop();
    expect(engine.snapshot().activeNode).toBe("b");
    engine.hop();
    const end = engine.snapshot();
    expect(end.activeNode).toBe("c");
    expect(end.steps).toBe(2);
    expect(end.done).toBe(true);
    expect(end.history.map((h) => h.edge)).toEqual(["e1", "e2"]);
  });

  it("waits at a branch and honors an explicit choice", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "a", "c")];
    const engine = createPlayback({ nodes, edges, startId: "a" });

    engine.step(1);
    expect(engine.snapshot().awaiting).toBe(true);
    expect(engine.choices().map((c) => c.id)).toEqual(["e1", "e2"]);

    expect(engine.choose("e2")).toBe(true);
    expect(engine.choose("missing")).toBe(false);
    engine.hop();
    expect(engine.snapshot().activeNode).toBe("c");
  });

  it("uses a configured scenario choice automatically", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [edge("e1", "a", "b"), edge("e2", "a", "c")];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      choices: { a: "e2", b: "e1" },
    });

    engine.hop();
    expect(engine.snapshot().activeNode).toBe("c");
  });

  it("steps back through visited hops", () => {
    const engine = chain();
    engine.hop();
    engine.hop();
    expect(engine.snapshot().activeNode).toBe("c");
    engine.back();
    expect(engine.snapshot().activeNode).toBe("b");
    engine.back();
    expect(engine.snapshot().activeNode).toBe("a");
  });

  it("ignores group nodes as edge endpoints", () => {
    const nodes = [node("a"), node("g", { type: "group" })];
    const edges = [edge("e1", "a", "g")];
    const engine = createPlayback({ nodes, edges, startId: "a" });
    engine.hop();
    expect(engine.snapshot().done).toBe(true);
  });

  it("exits a loop via an alternate outgoing edge once retries are spent", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [
      edge("loop", "a", "a"),
      edge("exit", "a", "b"),
    ];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 1,
      choices: { a: "loop" },
    });

    engine.hop();
    expect(engine.snapshot().loopExited).toBe(false);
    engine.hop();
    expect(engine.snapshot().loopExited).toBe(true);
    expect(engine.snapshot().activeNode).toBe("b");
  });
});
