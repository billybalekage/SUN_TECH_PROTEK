import { describe, expect, it } from "vitest";
import {
  CONVENTIONAL_COEFFICIENT,
  calculateIccMin,
} from "../electric-rules/formulas/Icc";

describe("calculateIccMin", () => {
  const singlePhase = {
    voltage: 230,
    section: 2.5,
    length: 20,
    rho: 0.023,
    phaseType: "1N",
  };

  it("applies the conventional coefficient and defaults the phase/neutral ratio to one", () => {
    expect(CONVENTIONAL_COEFFICIENT).toBe(0.8);
    expect(calculateIccMin(singlePhase)).toBeCloseTo(500);
    expect(calculateIccMin({ ...singlePhase, m: 1 })).toBeCloseTo(500);
  });

  it("accounts for a different phase/neutral ratio in single-phase circuits", () => {
    expect(calculateIccMin({ ...singlePhase, m: 2 })).toBeCloseTo(1000 / 3);
  });

  it("uses line voltage and the square-root-of-three divisor in three-phase circuits", () => {
    expect(
      calculateIccMin({ ...singlePhase, voltage: 400, phaseType: "3N" }),
    ).toBeCloseTo(800 / (0.023 * 20 * Math.sqrt(3)));
  });

  it.each([
    ["voltage", 0, "U"],
    ["section", -1, "S"],
    ["length", 0, "L"],
    ["rho", -0.023, "rho"],
    ["m", 0, "m"],
  ])("rejects non-positive %s", (parameter, value, label) => {
    expect(() => calculateIccMin({ ...singlePhase, [parameter]: value })).toThrow(
      `${label} doit être positif`,
    );
  });

  it("rejects an unrecognized phase type", () => {
    expect(() => calculateIccMin({ ...singlePhase, phaseType: "2N" })).toThrow(
      "Type de phase inconnu : 2N",
    );
  });
});
