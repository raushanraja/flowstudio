import { describe, expect, it } from "vitest";
import { exportMermaid } from "../exportMermaid.js";

const nodes = [
  { id: "a", type: "rect", text: "Start" },
  { id: "b", type: "diamond", text: 'He said "hi"' },
  { id: "c", type: "rounded", text: "line1\nline2" },
  { id: "d", type: "cylinder", text: "DB" },
];

describe("exportMermaid", () => {
  it("emits idiomatic shape syntax and escapes labels", () => {
    const code = exportMermaid({ nodes, edges: [], direction: "LR" });
    expect(code.split("\n")[0]).toBe("flowchart LR");
    expect(code).toContain('a["Start"]');
    expect(code).toContain('b{"He said #quot;hi#quot;"}');
    expect(code).toContain('c("line1<br/>line2")');
    expect(code).toContain('d[("DB")]');
  });

  it("sanitizes identifiers and names the group subgraph", () => {
    const code = exportMermaid({
      nodes: [
        { id: "group", type: "group", text: "Auth" },
        { id: "child one", type: "rect", text: "Child", parentId: "group" },
        { id: "123", type: "text", text: "Note" },
      ],
      edges: [],
    });
    expect(code).toContain('subgraph group ["Auth"]');
    expect(code).toContain('    childone["Child"]');
    expect(code).toContain('  end');
    expect(code).toContain('  node_3["Note"]');
    // Grouped children are not repeated at the top level.
    expect(code.match(/childone/g)).toHaveLength(1);
  });

  it("renders edge styles and labels", () => {
    const code = exportMermaid({
      nodes,
      edges: [
        { from: "a", to: "b", label: "go" },
        { from: "b", to: "c", dashed: true, arrow: false, label: "skip" },
        { from: "c", to: "d", arrowStart: true },
        { from: "d", to: "a", dashed: true, arrowStart: true },
        { from: "a", to: "missing" },
      ],
    });
    expect(code).toContain('a -- "go" --> b');
    expect(code).toContain('b -.-|"skip"| c');
    expect(code).toContain("c <--> d");
    expect(code).toContain("d <-.-> a");
    expect(code).not.toContain("missing");
  });
});
