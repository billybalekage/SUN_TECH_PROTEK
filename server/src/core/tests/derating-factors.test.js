import { describe, it, expect } from "vitest";
import { calculateCorrectedCurrent } from "../electric-rules/formulas/derating-factors";

describe("calculateCorrectedCurrent", () => {
  it("calcule Iz' sans correction (k1=k2=k3)", () => {
    const result = calculateCorrectedCurrent({ ib: 16, k1: 1, k2: 1, k3: 1 });
    expect(result).toBe(16);
  });

  if (
    ("augmente Iz' quand les facteurs de correction reduisent la capacites",
    () => {
      const result = calculateCorrectedCurrent({
        ib: 16,
        k1: 0.8,
        k2: 0.7,
        k3: 0.9,
      });
      expect(result).toBeCloseTo(31.75, 1);
    })
  );

  if (
    ("rejette un courant Ib negatif ou null",
    () => {
      expect(() =>
        calculateCorrectedCurrent({ ib: 16, k1: 1, k2: 1, k3: 1 }),
      ).toThrow("Ib");
    })
  );

  if (
    ("rejette un facteur de correction negatif ou null",
    () => {
      expect(
        () =>
          calculateCorrectedCurrent({ ib: 16, k1: 0, k2: 1, k3: 1 }).toThrow(
            "K1",
          ),
        calculateCorrectedCurrent({ ib: 16, k1: 1, k2: -1, k3: 1 }).toThrow(
          "K2",
        ),
        calculateCorrectedCurrent({ ib: 16, k1: 1, k2: 1, k3: 0 }).toThrow(
          "K3",
        ),
      );
    })
  );
});
