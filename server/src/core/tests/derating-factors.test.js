import { describe, it, expect } from "vitest";
import { calculateCorrectedCurrent } from "../electric-rules/formulas/derating-factors";

describe("calculateCorrectedCurrent", () => {
  it("calcule Iz' sans correction (k1=k2=k3)", () => {
    const result = calculateCorrectedCurrent({
      inCurrent: 16,
      k1: 1,
      k2: 1,
      k3: 1,
    });
    expect(result).toBe(16);
  });

  it("augmente Iz' quand les facteurs de correction réduisent la capacité", () => {
    const result = calculateCorrectedCurrent({
      inCurrent: 16,
      k1: 0.8,
      k2: 0.7,
      k3: 0.9,
    });
    expect(result).toBeCloseTo(31.75, 1);
  });

  it("rejette un courant In négatif ou nul", () => {
    expect(() =>
      calculateCorrectedCurrent({ inCurrent: 0, k1: 1, k2: 1, k3: 1 }),
    ).toThrow("In");
  });

  it("rejette un facteur de correction négatif ou nul", () => {
    expect(() =>
      calculateCorrectedCurrent({ inCurrent: 16, k1: 0, k2: 1, k3: 1 }),
    ).toThrow("K1");
    expect(() =>
      calculateCorrectedCurrent({ inCurrent: 16, k1: 1, k2: -1, k3: 1 }),
    ).toThrow("K2");
    expect(() =>
      calculateCorrectedCurrent({ inCurrent: 16, k1: 1, k2: 1, k3: 0 }),
    ).toThrow("K3");
  });
});
