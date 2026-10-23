import { describe, expect, it } from "vitest";
import { pruneScenarioRefs } from "../scenarios.js";

const scenario = () => ({
  id: "s1",
  name: "Scenario",
  startId: "a",
  choices: { a: "e1", b: "e2" },
  loopExits: { a: "e2", c: "e3" },
  notes: { a: "Start", b: "Middle", c: "End" },
  maxLoopRetries: 2,
});

describe("pruneScenarioRefs", () => {
  it("drops references to deleted nodes", () => {
    const [s] = pruneScenarioRefs([scenario()], { nodeIds: ["a", "c"] });
    expect(s.startId).toBeUndefined();
    expect(s.choices).toEqual({ b: "e2" });
    expect(s.loopExits).toEqual({});
    expect(s.notes).toEqual({ b: "Middle" });
    expect(s.maxLoopRetries).toBe(2);
  });

  it("drops references to deleted edges", () => {
    const [s] = pruneScenarioRefs([scenario()], { edgeIds: ["e1", "e2"] });
    expect(s.startId).toBe("a");
    expect(s.choices).toEqual({});
    expect(s.loopExits).toEqual({ c: "e3" });
    expect(s.notes).toEqual({ a: "Start", b: "Middle", c: "End" });
  });

  it("returns the same array when nothing was deleted", () => {
    const list = [scenario()];
    expect(pruneScenarioRefs(list)).toBe(list);
    expect(pruneScenarioRefs(list, { nodeIds: [], edgeIds: [] })).toBe(list);
  });
});
