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
          locked: 1,
          hidden: "true",
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
      locked: true,
      hidden: true,
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
          loopExits: { a: "e1", b: "nope" },
          notes: { a: "Start here", b: "Finish", missing: "drop" },
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
      notes: { a: "Start here", b: "Finish" },
      maxLoopRetries: 3,
    });
    expect(d.scenarios[1].startId).toBeUndefined();
    expect(d.activeScenarioId).toBe("s1");
  });

  it("keeps valid per-visit step notes", () => {
    const d = normalizeDiagram({
      nodes: [{ id: "a", type: "rect" }],
      scenarios: [
        {
          name: "Steps",
          stepNotes: {
            0: "Start",
            2: "Second loop visit",
            "3": 42,
            "-1": "drop",
            501: "drop",
            x: "drop",
          },
        },
      ],
    });
    expect(d.scenarios[0].stepNotes).toEqual({
      0: "Start",
      2: "Second loop visit",
    });
  });

  it("clamps custom loop retry counts", () => {
    const d = normalizeDiagram({
      nodes: [{ id: "a", type: "rect" }],
      scenarios: [
        { name: "Low", maxLoopRetries: 0 },
        { name: "High", maxLoopRetries: 500 },
        { name: "Fraction", maxLoopRetries: 2.6 },
        { name: "Missing" },
      ],
    });
    expect(d.scenarios.map((s) => s.maxLoopRetries)).toEqual([1, 50, 3, 1]);
  });

  it("drops a loop exit that matches the default branch", () => {
    const d = normalizeDiagram({
      nodes: [
        { id: "a", type: "rect" },
        { id: "b", type: "rect" },
      ],
      edges: [
        { id: "first", from: "a", to: "b" },
        { id: "second", from: "a", to: "b" },
      ],
      scenarios: [
        {
          name: "Default loop",
          loopExits: { a: "first" },
        },
        {
          name: "Explicit loop",
          loopExits: { a: "second" },
          choices: { a: "second" },
        },
      ],
    });
    expect(d.scenarios[0].loopExits).toEqual({});
    expect(d.scenarios[1].loopExits).toEqual({});
  });

  it("resets an unknown active scenario", () => {
    const d = normalizeDiagram({
      nodes: [{ id: "a", type: "rect" }],
      activeScenarioId: "missing",
    });
    expect(d.activeScenarioId).toBeNull();
  });

  it("drops blank step notes and caps long ones", () => {
    const long = "x".repeat(2500);
    const d = normalizeDiagram({
      nodes: [{ id: "a", type: "rect" }],
      scenarios: [
        {
          name: "Notes",
          notes: { a: long, missing: "drop", b: "   " },
        },
      ],
    });
    expect(d.scenarios[0].notes.a).toHaveLength(2000);
    expect(d.scenarios[0].notes.missing).toBeUndefined();
    expect(d.scenarios[0].notes.b).toBeUndefined();
  });
});
