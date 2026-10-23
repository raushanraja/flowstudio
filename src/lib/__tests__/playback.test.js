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

  it("honors multiple retries before taking the loop exit", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [
      edge("loop", "a", "b"),
      edge("back", "b", "a"),
      edge("exit", "a", "c"),
    ];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 2,
      choices: { a: "loop" },
      loopExits: { a: "exit" },
    });

    engine.hop(); // b
    engine.hop(); // a
    engine.hop(); // b
    engine.hop(); // a
    expect(engine.snapshot().loopExited).toBe(false);
    engine.hop(); // exit
    expect(engine.snapshot().loopExited).toBe(true);
    expect(engine.snapshot().activeNode).toBe("c");
  });

  it("detects a decision-free cycle after one lap", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("ab", "a", "b"), edge("ba", "b", "a")];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 1,
    });

    engine.hop();
    expect(engine.snapshot().loopDetected).toBe(false);
    engine.hop();
    const snap = engine.snapshot();
    expect(snap.loopDetected).toBe(true);
    expect(snap.loopNode).toBe("a");
    expect(snap.done).toBe(true);
  });

  it("allows the configured number of decision-free laps before stopping", () => {
    const nodes = [node("a"), node("b")];
    const edges = [edge("ab", "a", "b"), edge("ba", "b", "a")];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 2,
    });

    engine.hop(); // b
    engine.hop(); // a
    expect(engine.snapshot().loopDetected).toBe(false);
    engine.hop(); // b
    engine.hop(); // a
    expect(engine.snapshot().loopDetected).toBe(true);
  });

  it("keeps loop state consistent after stepping back through an exit", () => {
    const nodes = [node("a"), node("b"), node("c")];
    const edges = [
      edge("loop", "a", "b"),
      edge("back", "b", "a"),
      edge("exit", "a", "c"),
    ];
    const engine = createPlayback({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 1,
      choices: { a: "loop" },
      loopExits: { a: "exit" },
    });

    engine.hop(); // b
    engine.hop(); // a
    engine.hop(); // exit -> c
    expect(engine.snapshot().loopExited).toBe(true);
    expect(engine.snapshot().activeNode).toBe("c");

    engine.back(); // replay to a
    engine.hop(); // exit again
    expect(engine.snapshot().loopExited).toBe(true);
    expect(engine.snapshot().loopDetected).toBe(false);
    expect(engine.snapshot().activeNode).toBe("c");
  });
});
