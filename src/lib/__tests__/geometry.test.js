import { describe, expect, it } from "vitest";
import {
  autoPort,
  boundaryPoint,
  computeSmartGuides,
  edgeGeom,
  mermaidFixCorners,
  nearestPort,
  nodeAt,
  nodeAtInflated,
  normRect,
  portPos,
  shapePoint,
} from "../geometry.js";

const rect = { id: "a", type: "rect", x: 0, y: 0, w: 100, h: 50 };

describe("portPos", () => {
  it("returns the midpoint and outward normal for each side", () => {
    expect(portPos(rect, "top")).toEqual({ x: 50, y: 0, dx: 0, dy: -1 });
    expect(portPos(rect, "right")).toEqual({ x: 100, y: 25, dx: 1, dy: 0 });
    expect(portPos(rect, "bottom")).toEqual({ x: 50, y: 50, dx: 0, dy: 1 });
    expect(portPos(rect, "left")).toEqual({ x: 0, y: 25, dx: -1, dy: 0 });
  });

  it("falls back to the right side for unknown sides", () => {
    expect(portPos(rect, "nope").x).toBe(100);
  });
});

describe("autoPort", () => {
  it("picks horizontal ports when the horizontal delta dominates", () => {
    const b = { x: 300, y: 0, w: 100, h: 50 };
    expect(autoPort(rect, b)).toBe("right");
    expect(autoPort(b, rect)).toBe("left");
  });

  it("picks vertical ports when the vertical delta dominates", () => {
    const b = { x: 0, y: 300, w: 100, h: 50 };
    expect(autoPort(rect, b)).toBe("bottom");
    expect(autoPort(b, rect)).toBe("top");
  });
});

describe("nearestPort", () => {
  it("returns the nearest port within the threshold", () => {
    expect(nearestPort({ x: 108, y: 25 }, rect, 18)).toBe("right");
    expect(nearestPort({ x: 2, y: 25 }, rect, 18)).toBe("left");
  });

  it("returns null when no port is close enough", () => {
    expect(nearestPort({ x: 50, y: 25 }, rect, 18)).toBeNull();
  });
});

describe("boundaryPoint", () => {
  it("clamps points outside the box onto the edge", () => {
    expect(boundaryPoint({ x: 140, y: 25 }, rect)).toEqual({ x: 100, y: 25 });
    expect(boundaryPoint({ x: 50, y: -20 }, rect)).toEqual({ x: 50, y: 0 });
  });

  it("projects the center to the top edge", () => {
    expect(boundaryPoint({ x: 50, y: 25 }, rect)).toEqual({ x: 50, y: 0 });
  });
});

describe("shapePoint", () => {
  it("projects onto an ellipse outline", () => {
    const ellipse = { type: "ellipse", w: 100, h: 50 };
    expect(shapePoint(ellipse, { x: 100, y: 25 })).toEqual({ x: 100, y: 25 });
    expect(shapePoint(ellipse, { x: 50, y: 50 })).toEqual({ x: 50, y: 50 });
  });

  it("projects onto a diamond outline", () => {
    const diamond = { type: "diamond", w: 100, h: 100 };
    expect(shapePoint(diamond, { x: 100, y: 50 })).toEqual({ x: 100, y: 50 });
    expect(shapePoint(diamond, { x: 100, y: 100 })).toEqual({ x: 75, y: 75 });
  });
});

describe("edgeGeom", () => {
  const byId = {
    a: { id: "a", type: "rect", x: 0, y: 0, w: 100, h: 50 },
    b: { id: "b", type: "rect", x: 300, y: 0, w: 100, h: 50 },
  };

  it("returns null when the source node is missing", () => {
    expect(edgeGeom({ from: "missing", to: "b" }, byId)).toBeNull();
  });

  it("builds a bezier between facing ports with a centered midpoint", () => {
    const g = edgeGeom(
      { from: "a", to: "b", fromPort: "right", toPort: "left" },
      byId,
    );
    expect(g.d).toMatch(/^M 100 25 C /);
    expect(g.mid).toEqual({ x: 200, y: 25 });
    expect(g.arrow).toBeTruthy();
    expect(g.arrowStart).toBeTruthy();
  });

  it("supports straight routing", () => {
    const g = edgeGeom(
      {
        from: "a",
        to: "b",
        fromPort: "right",
        toPort: "left",
        routing: "straight",
      },
      byId,
    );
    expect(g.d).toBe("M 100 25 L 300 25");
    expect(g.mid).toEqual({ x: 200, y: 25 });
  });

  it("supports orthogonal routing", () => {
    const g = edgeGeom(
      {
        from: "a",
        to: "b",
        fromPort: "right",
        toPort: "left",
        routing: "orthogonal",
      },
      byId,
    );
    expect(g.d.startsWith("M100,25")).toBe(true);
    expect(g.mid.x).toBeCloseTo(200);
    expect(g.mid.y).toBeCloseTo(25);
  });

  it("routes through waypoints with a mermaid curve", () => {
    const g = edgeGeom(
      {
        from: "a",
        to: "b",
        curve: "basis",
        waypoints: [
          { x: 100, y: 25 },
          { x: 200, y: 100 },
          { x: 300, y: 25 },
        ],
      },
      byId,
    );
    expect(g.d.length).toBeGreaterThan(0);
    expect(g.mid.x).toBeCloseTo(200);
    expect(g.mid.y).toBeCloseTo(100);
  });

  it("appends label offsets to the midpoint", () => {
    const g = edgeGeom(
      {
        from: "a",
        to: "b",
        fromPort: "right",
        toPort: "left",
        labelDx: 12,
        labelDy: -4,
      },
      byId,
    );
    expect(g.mid).toEqual({ x: 212, y: 21 });
  });
});

describe("mermaidFixCorners", () => {
  it("expands a sharp corner into helper points", () => {
    const fixed = mermaidFixCorners([
      { x: 0, y: 0 },
      { x: 0, y: 30 },
      { x: 30, y: 30 },
    ]);
    expect(fixed).toHaveLength(5);
    expect(fixed[1]).toEqual({ x: 0, y: 25 });
    expect(fixed[3]).toEqual({ x: 5, y: 30 });
  });
});

describe("rectangles and hit testing", () => {
  it("normalizes two corners into a rect", () => {
    expect(normRect({ x: 10, y: 20 }, { x: 0, y: 50 })).toEqual({
      x: 0,
      y: 20,
      w: 10,
      h: 30,
    });
  });

  it("prefers the topmost non-group node", () => {
    const low = { id: "low", type: "rect", x: 0, y: 0, w: 100, h: 100 };
    const high = { id: "high", type: "rect", x: 10, y: 10, w: 50, h: 50 };
    expect(nodeAt({ x: 20, y: 20 }, [low, high]).id).toBe("high");
  });

  it("falls back to groups when no plain node hits", () => {
    const group = { id: "g", type: "group", x: 0, y: 0, w: 200, h: 200 };
    expect(nodeAt({ x: 20, y: 20 }, [group]).id).toBe("g");
  });

  it("inflates hit areas for dropping connections", () => {
    expect(nodeAtInflated({ x: 105, y: 25 }, [rect], 12).id).toBe("a");
    expect(nodeAtInflated({ x: 130, y: 25 }, [rect], 12)).toBeNull();
  });
});

describe("computeSmartGuides", () => {
  it("snaps to the nearest shared edge", () => {
    const dragged = { x: 102, y: 400, w: 100, h: 50 };
    const other = { x: 104, y: 0, w: 100, h: 50 };
    const res = computeSmartGuides(dragged, [other], 6);
    expect(res.snappedX).toBe(104);
    expect(res.snappedY).toBe(400);
    expect(res.guides).toEqual([{ type: "x", val: 104 }]);
  });

  it("returns no guides when everything is far apart", () => {
    const res = computeSmartGuides(
      { x: 0, y: 0, w: 10, h: 10 },
      [{ x: 500, y: 500, w: 10, h: 10 }],
      6,
    );
    expect(res.guides).toEqual([]);
  });
});
