import { describe, expect, it } from "vitest";
import {
  hiddenNodeIds,
  reorderNodeSelection,
  visibleDiagram,
} from "../layers.js";

const node = (id, extra = {}) => ({ id, type: "rect", ...extra });

describe("hiddenNodeIds", () => {
  it("collects hidden nodes and their descendants", () => {
    const nodes = [
      node("group", { type: "group", hidden: true }),
      node("child", { parentId: "group" }),
      node("grandchild", { parentId: "child" }),
      node("plain"),
      node("hidden", { hidden: true }),
    ];
    expect(hiddenNodeIds(nodes)).toEqual(
      new Set(["group", "child", "grandchild", "hidden"]),
    );
  });

  it("survives cyclic parent links", () => {
    const nodes = [
      node("a", { parentId: "b" }),
      node("b", { parentId: "a" }),
    ];
    expect(hiddenNodeIds(nodes).size).toBe(0);
  });
});

describe("visibleDiagram", () => {
  it("filters hidden nodes and every edge touching them", () => {
    const nodes = [
      node("a"),
      node("b", { hidden: true }),
      node("c"),
    ];
    const edges = [
      { id: "ab", from: "a", to: "b" },
      { id: "bc", from: "b", to: "c" },
      { id: "ac", from: "a", to: "c" },
    ];
    const res = visibleDiagram(nodes, edges);
    expect(res.nodes.map((n) => n.id)).toEqual(["a", "c"]);
    expect(res.edges.map((e) => e.id)).toEqual(["ac"]);
  });
});

describe("reorderNodeSelection", () => {
  const nodes = [
    node("g1", { type: "group" }),
    node("a"),
    node("b"),
    node("g2", { type: "group" }),
    node("c"),
  ];

  it("brings plain nodes to the front of the plain stack", () => {
    const res = reorderNodeSelection(nodes, ["a"], true);
    expect(res.map((n) => n.id)).toEqual(["g1", "g2", "b", "c", "a"]);
  });

  it("sends plain nodes to the back of the plain stack", () => {
    const res = reorderNodeSelection(nodes, ["c"], false);
    expect(res.map((n) => n.id)).toEqual(["g1", "g2", "c", "a", "b"]);
  });

  it("keeps groups behind plain nodes when a group is moved", () => {
    const front = reorderNodeSelection(nodes, ["g1"], true);
    expect(front.map((n) => n.id)).toEqual(["g2", "g1", "a", "b", "c"]);
    const back = reorderNodeSelection(nodes, ["g2"], false);
    expect(back.map((n) => n.id)).toEqual(["g2", "g1", "a", "b", "c"]);
  });

  it("is a no-op without a selection", () => {
    expect(reorderNodeSelection(nodes, [], true)).toBe(nodes);
  });
});
