import { describe, expect, it } from "vitest";
import { calculateIb } from "../electric-rules/formulas/Ib";

describe("calculateIb", () => {
  it("calculates single-phase operating current", () => {
    expect(calculateIb(4600, 230, 1, "1N")).toBe(20);
    expect(calculateIb(4600, 230, 0.8, "1N")).toBe(25);
  });

  it("accounts for the square-root-of-three factor in three-phase circuits", () => {
    expect(calculateIb(12000, 400, 0.8, "3N")).toBeCloseTo(
      12000 / (Math.sqrt(3) * 400 * 0.8),
    );
  });

  it.each([
    [0, 230, 0.8, "La puissance"],
    [-1, 230, 0.8, "La puissance"],
    [1000, 0, 0.8, "La tension"],
    [1000, -230, 0.8, "La tension"],
    [1000, 230, -0.01, "facteur de puissance"],
    [1000, 230, 1.01, "facteur de puissance"],
  ])("rejects invalid input (%s W, %s V, cosPhi %s)", (power, voltage, cosPhi, message) => {
    expect(() => calculateIb(power, voltage, cosPhi, "1N")).toThrow(message);
  });

  it("preserves the documented zero-power-factor and unsupported-phase behavior", () => {
    expect(calculateIb(1000, 230, 0, "1N")).toBe(Infinity);
    expect(calculateIb(1000, 230, 1, "unknown")).toBeUndefined();
  });
});
