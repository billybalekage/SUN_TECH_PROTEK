import { describe, expect, it } from "vitest";
import { calculateIb } from "../electric-rules/formulas/Ib.js";

describe("calculateIb", () => {
  it("calculates single-phase operating current", () => {
    expect(calculateIb(2000, 230, 1, "1N")).toBeCloseTo(2000 / 230);
    expect(calculateIb(2000, 230, 0.8, "1N")).toBeCloseTo(2000 / (230 * 0.8));
  });

  it("accounts for the square-root-of-three factor in three-phase current", () => {
    expect(calculateIb(6000, 400, 0.8, "3N")).toBeCloseTo(
      6000 / (Math.sqrt(3) * 400 * 0.8),
    );
  });

  it.each([
    ["power", 0, 230, 1, "La puissance"],
    ["power", -1, 230, 1, "La puissance"],
    ["voltage", 2000, 0, 1, "La tension"],
    ["voltage", 2000, -230, 1, "La tension"],
    ["power factor", 2000, 230, -0.1, "Le facteur de puissance"],
    ["power factor", 2000, 230, 1.1, "Le facteur de puissance"],
  ])("rejects invalid %s inputs", (_, power, voltage, cosPhi, message) => {
    expect(() => calculateIb(power, voltage, cosPhi, "1N")).toThrow(message);
  });

  it("accepts the documented power-factor endpoints", () => {
    expect(calculateIb(100, 230, 0, "1N")).toBe(Infinity);
    expect(calculateIb(100, 230, 1, "1N")).toBeCloseTo(100 / 230);
  });

  it("returns undefined for an unsupported phase type", () => {
    expect(calculateIb(100, 230, 1, "2N")).toBeUndefined();
  });
});
