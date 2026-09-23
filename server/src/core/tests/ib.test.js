import { describe, it, expect } from "vitest";
import { calculateIb } from "../electric-rules/formulas/Ib.js";

describe("calculateIb", () => {
  it("calcule Ib correctement en monophasé", () => {
    // P=2000W, U=230V, cosPhi=1 → Ib = 2000/230 ≈ 8.70A
    expect(calculateIb(2000, 230, 1, "1N")).toBeCloseTo(8.7, 1);
  });

  it("calcule Ib correctement en triphasé", () => {
    // P=6000W, U=400V, cosPhi=0.8 → Ib = 6000/(√3×400×0.8) ≈ 10.83A
    expect(calculateIb(6000, 400, 0.8, "3N")).toBeCloseTo(10.83, 1);
  });

  it("rejette une puissance négative", () => {
    expect(() => calculateIb(-100, 230, 1, "1N")).toThrow();
  });

  it("rejette un cosPhi invalide", () => {
    expect(() => calculateIb(2000, 230, 1.5, "1N")).toThrow();
  });
});
