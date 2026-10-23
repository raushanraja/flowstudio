import { describe, expect, it } from "vitest";
import { colorToHex, clamp, uid } from "../utils.js";
import {
  THEMES,
  getContrast,
  getEffectiveTextColor,
  getLuminance,
} from "../theme.js";

describe("utils", () => {
  it("clamps values into range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it("normalizes colors to six-digit hex", () => {
    expect(colorToHex("#abc")).toBe("#aabbcc");
    expect(colorToHex("#aabbccdd")).toBe("#aabbcc");
    expect(colorToHex("rgb(255, 0, 128)")).toBe("#ff0080");
    expect(colorToHex("rgba(1, 2, 3, 0.5)")).toBe("#010203");
    expect(colorToHex("transparent")).toBe("#ffffff");
    expect(colorToHex("red")).toBe("#6366f1");
  });

  it("generates unique prefixed ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid("e")));
    expect(ids.size).toBe(100);
    expect([...ids][0].startsWith("e")).toBe(true);
  });
});

describe("theme contrast helpers", () => {
  it("computes luminance for black and white", () => {
    expect(getLuminance("#000000")).toBe(0);
    expect(getLuminance("#ffffff")).toBeCloseTo(1);
  });

  it("computes the maximum contrast ratio", () => {
    expect(getContrast("#000000", "#ffffff")).toBeCloseTo(21);
    expect(getContrast("#ffffff", "#ffffff")).toBeCloseTo(1);
  });

  it("uses the stored text color when contrast is sufficient", () => {
    expect(
      getEffectiveTextColor(
        { fill: "#ffffff", stroke: "#000000", textColor: "#000000" },
        "light",
      ),
    ).toBe("#000000");
  });

  it("falls back to a readable color on low contrast", () => {
    expect(
      getEffectiveTextColor(
        { fill: "#000000", textColor: "#000000" },
        "midnight",
      ),
    ).toBe(THEMES.midnight.text);
    expect(
      getEffectiveTextColor(
        { fill: "#ffffff", textColor: "#ffffff" },
        "light",
      ),
    ).toBe("#090d13");
  });

  it("treats text nodes and transparent fills as canvas-backed", () => {
    expect(
      getEffectiveTextColor(
        { type: "text", fill: "#000000" },
        "light",
      ),
    ).toBe(THEMES.light.text);
  });
});
