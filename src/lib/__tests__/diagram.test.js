import { describe, expect, it } from "vitest";
import { normalizeDiagram } from "../diagram.js";

describe("normalizeDiagram", () => {
  it("rejects documents without a nodes array", () => {
    expect(normalizeDiagram(null)).toBeNull();
    expect(normalizeDiagram({})).toBeNull();
    expect(normalizeDiagram({ nodes: "nope" })).toBeNull();
  });

  it("fills defaults and sanitizes node fields", () => {
    const d = normalizeDiagram({
      nodes: [
        {
          id: "a",
          type: "bogus",
          x: "12",
          y: 8,
          w: 0,
          h: -5,
          strokeWidth: -1,
          fontSize: "big",
          text: 42,
          dashed: "yes",
        },
      ],
    });
    expect(d.nodes).toHaveLength(1);
    expect(d.nodes[0]).toMatchObject({
      id: "a",
      type: "rect",
      x: 12,
      y: 8,
      w: 180,
      h: 56,
      strokeWidth: 2,
      fontSize: 14,
      text: "",
      dashed: true,
      parentId: null,
    });
  });

  it("regenerates duplicate node ids", () => {
    const d = normalizeDiagram({
      nodes: [
        { id: "dup", type: "rect" },
        { id: "dup", type: "ellipse" },
      ],
    });
    expect(d.nodes[0].id).toBe("dup");
    expect(d.nodes[1].id).not.toBe("dup");
    expect(new Set(d.nodes.map((n) => n.id)).size).toBe(2);
  });

  it("keeps parent links only when the parent exists", () => {
    const d = normalizeDiagram({
      nodes: [
        { id: "group", type: "group" },
        { id: "child", type: "rect", parentId: "group" },
        { id: "orphan", type: "rect", parentId: "missing" },
      ],
    });
    const byId = Object.fromEntries(d.nodes.map((n) => [n.id, n]));
    expect(byId.child.parentId).toBe("group");
    expect(byId.orphan.parentId).toBeNull();
  });

  it("drops invalid edges and normalizes valid ones", () => {
    const d = normalizeDiagram({
      nodes: [
        { id: "a", type: "rect" },
        { id: "b", type: "rect" },
      ],
      edges: [
        { id: "keep", from: "a", to: "b", fromPort: "bogus", dashed: true, arrow: false, label: "go" },
        { id: "x", from: "a", to: "missing" },
        { id: "y", to: "b" },
        {
          id: "waypoints",
          from: "a",
          to: "b",
          travelMs: 0,
          waypoints: [
            { x: 1, y: 2 },
            { x: "nope", y: 3 },
          ],
        },
      ],
    });
    expect(d.edges).toHaveLength(2);
    const edge = d.edges[0];
    expect(edge).toMatchObject({
      id: "keep",
      fromPort: "right",
      toPort: "left",
      dashed: true,
      arrow: false,
      label: "go",
    });
    expect(d.edges[1].travelMs).toBeUndefined();
    expect(d.edges[1].waypoints).toEqual([{ x: 1, y: 2 }]);
  });

  it("keeps only valid scenario choices and start nodes", () => {
    const d = normalizeDiagram({
      nodes: [
        { id: "a", type: "rect" },
        { id: "b", type: "rect" },
      ],
      edges: [{ id: "e1", from: "a", to: "b" }],
      scenarios: [
        {
          id: "s1",
          name: "Happy path",
          startId: "b",
          choices: { a: "e1", b: "e1", missing: "e1" },
          loopExits: { a: "nope" },
          maxLoopRetries: 3,
        },
        { id: "s2", name: "Bad start", startId: "missing" },
        { id: "s3" },
        "not a scenario",
      ],
      activeScenarioId: "s1",
      theme: "light",
    });
    expect(d.scenarios).toHaveLength(2);
    expect(d.scenarios[0]).toMatchObject({
      id: "s1",
      startId: "b",
      choices: { a: "e1" },
      loopExits: {},
      maxLoopRetries: 3,
    });
    expect(d.scenarios[1].startId).toBeUndefined();
    expect(d.activeScenarioId).toBe("s1");
  });

  it("resets an unknown active scenario", () => {
    const d = normalizeDiagram({
      nodes: [{ id: "a", type: "rect" }],
      activeScenarioId: "missing",
    });
    expect(d.activeScenarioId).toBeNull();
  });
});
