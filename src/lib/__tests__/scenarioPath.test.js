import { describe, expect, it } from "vitest";
import { previewScenario } from "../playback.js";

const node = (id, text = id, extra = {}) => ({
  id,
  type: "rect",
  x: 0,
  y: 0,
  w: 100,
  h: 50,
  text,
  ...extra,
});
const edge = (id, from, to, label = "") => ({
  id,
  from,
  to,
  label,
  strokeWidth: 2,
});

describe("previewScenario", () => {
  it("walks a linear scenario and labels each step", () => {
    const nodes = [node("a", "Start"), node("b", "Middle"), node("c", "End")];
    const edges = [edge("ab", "a", "b", "next"), edge("bc", "b", "c", "finish")];
    const path = previewScenario({ nodes, edges, startId: "a" });

    expect(path.steps.map((s) => s.index)).toEqual([0, 1, 2]);
    expect(path.steps.map((s) => s.nodeLabel)).toEqual([
      "Start",
      "Middle",
      "End",
    ]);
    expect(path.steps.map((s) => s.edgeLabel)).toEqual(["", "next", "finish"]);
    expect(path.complete).toBe(true);
    expect(path.loopDetected).toBe(false);
  });

  it("marks the step where a loop exit is taken", () => {
    const nodes = [
      node("a", "Check"),
      node("b", "Retry"),
      node("c", "Done"),
    ];
    const edges = [
      edge("loop", "a", "b", "retry"),
      edge("back", "b", "a", "back"),
      edge("exit", "a", "c", "ok"),
    ];
    const path = previewScenario({
      nodes,
      edges,
      startId: "a",
      choices: { a: "loop" },
      loopExits: { a: "exit" },
      maxLoopRetries: 1,
    });

    expect(path.steps.map((s) => s.nodeLabel)).toEqual([
      "Check",
      "Retry",
      "Check",
      "Done",
    ]);
    expect(path.steps.findIndex((s) => s.loopExited)).toBe(3);
    expect(path.loopExited).toBe(true);
    expect(path.steps.at(-1).edgeLabel).toBe("ok");
  });

  it("marks a decision-free loop as detected on the repeated visit", () => {
    const nodes = [node("a", "Ping"), node("b", "Pong")];
    const edges = [edge("ab", "a", "b"), edge("ba", "b", "a")];
    const path = previewScenario({
      nodes,
      edges,
      startId: "a",
      maxLoopRetries: 2,
    });

    expect(path.steps.map((s) => s.nodeLabel)).toEqual([
      "Ping",
      "Pong",
      "Ping",
      "Pong",
      "Ping",
    ]);
    expect(path.steps.at(-1).loopDetected).toBe(true);
    expect(path.loopDetected).toBe(true);
    expect(path.complete).toBe(false);
  });

  it("returns no steps when there is no start node", () => {
    const path = previewScenario({
      nodes: [{ id: "g", type: "group", text: "Group" }],
      edges: [],
    });
    expect(path.steps).toEqual([]);
  });
});
