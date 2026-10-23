import { describe, expect, it } from "vitest";
import { layoutDiagram } from "../layout.js";

const node = (id, x, y, extra = {}) => ({
  id,
  type: "rect",
  x,
  y,
  w: 100,
  h: 50,
  ...extra,
});

const edge = (id, from, to) => ({
  id,
  from,
  to,
  fromPort: "right",
  toPort: "left",
});

describe("layoutDiagram", () => {
  it("returns input untouched for fewer than two nodes", () => {
    const nodes = [node("a", 0, 0)];
    const edges = [];
    const res = layoutDiagram({ nodes, edges });
    expect(res.nodes).toBe(nodes);
    expect(res.edges).toBe(edges);
  });

  it("stacks a chain top-to-bottom with vertical ports", () => {
    const nodes = [node("a", 0, 0), node("b", 0, 500)];
    const edges = [edge("e1", "a", "b")];
    const res = layoutDiagram({ nodes, edges, direction: "TB" });
    const a = res.nodes.find((n) => n.id === "a");
    const b = res.nodes.find((n) => n.id === "b");
    expect(b.y).toBeGreaterThan(a.y);
    expect(res.edges[0].fromPort).toBe("bottom");
    expect(res.edges[0].toPort).toBe("top");
    expect(res.edges[0].waypoints).toBeUndefined();
  });

  it("lays a chain left-to-right with horizontal ports", () => {
    const nodes = [node("a", 0, 0), node("b", 0, 0)];
    const res = layoutDiagram({
      nodes,
      edges: [edge("e1", "a", "b")],
      direction: "LR",
    });
    const a = res.nodes.find((n) => n.id === "a");
    const b = res.nodes.find((n) => n.id === "b");
    expect(b.x).toBeGreaterThan(a.x);
    expect(res.edges[0].fromPort).toBe("right");
    expect(res.edges[0].toPort).toBe("left");
  });

  it("only moves the selected subset", () => {
    const nodes = [node("a", 0, 0), node("b", 500, 0), node("c", 900, 900)];
    const res = layoutDiagram({
      nodes,
      edges: [edge("e1", "a", "b")],
      selectedIds: ["a", "b"],
    });
    const c = res.nodes.find((n) => n.id === "c");
    expect(c.x).toBe(900);
    expect(c.y).toBe(900);
    const a = res.nodes.find((n) => n.id === "a");
    const b = res.nodes.find((n) => n.id === "b");
    // a is the top-left anchor, so it stays put; b is reflowed under it.
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(b.x).toBe(0);
    expect(b.y).toBeGreaterThan(0);
  });

  it("grows groups around their children after layout", () => {
    const group = {
      id: "g",
      type: "group",
      x: 0,
      y: 0,
      w: 300,
      h: 300,
      text: "Group",
    };
    const nodes = [
      group,
      node("a", 20, 40, { parentId: "g" }),
      node("b", 20, 300, { parentId: "g" }),
    ];
    const res = layoutDiagram({
      nodes,
      edges: [edge("e1", "a", "b")],
      direction: "TB",
    });
    const g = res.nodes.find((n) => n.id === "g");
    const a = res.nodes.find((n) => n.id === "a");
    const b = res.nodes.find((n) => n.id === "b");
    expect(g.x).toBeLessThanOrEqual(Math.min(a.x, b.x) - 24);
    expect(g.y).toBeLessThanOrEqual(Math.min(a.y, b.y) - 38);
    expect(g.w).toBeGreaterThan(0);
    expect(g.h).toBeGreaterThan(0);
  });
});
