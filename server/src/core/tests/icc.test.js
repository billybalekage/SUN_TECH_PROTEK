import { describe, expect, it } from "vitest";
import {
  CONVENTIONAL_COEFFICIENT,
  calculateIccMin,
} from "../electric-rules/formulas/Icc.js";

const cable = {
  voltage: 230,
  section: 2.5,
  length: 20,
  rho: 0.0225,
  phaseType: "1N",
};

describe("calculateIccMin", () => {
  it("uses the conventional coefficient and equal neutral/phase sections by default", () => {
    expect(CONVENTIONAL_COEFFICIENT).toBe(0.8);
    expect(calculateIccMin(cable)).toBeCloseTo(
      (0.8 * 230 * 2.5) / (0.0225 * 20 * 2),
    );
    expect(calculateIccMin({ ...cable, m: 1 })).toBeCloseTo(
      calculateIccMin(cable),
    );
  });

  it("accounts for a smaller neutral section in single-phase circuits", () => {
    expect(calculateIccMin({ ...cable, m: 2 })).toBeCloseTo(
      (0.8 * 230 * 2.5) / (0.0225 * 20 * 3),
    );
  });

  it("uses the three-phase formula without a neutral-section factor", () => {
    const threePhaseCable = { ...cable, voltage: 400, phaseType: "3N" };
    expect(calculateIccMin(threePhaseCable)).toBeCloseTo(
      (0.8 * 400 * 2.5) / (0.0225 * 20 * Math.sqrt(3)),
    );
    expect(calculateIccMin({ ...threePhaseCable, m: 2 })).toBeCloseTo(
      calculateIccMin(threePhaseCable),
    );
  });

  it("decreases as cable length increases and increases as section increases", () => {
    expect(calculateIccMin({ ...cable, length: 40 })).toBeCloseTo(
      calculateIccMin(cable) / 2,
    );
    expect(calculateIccMin({ ...cable, section: 5 })).toBeCloseTo(
      calculateIccMin(cable) * 2,
    );
  });

  it.each([
    ["voltage", "U"],
    ["section", "S"],
    ["length", "L"],
    ["rho", "rho"],
    ["m", "m"],
  ])("rejects zero and negative %s", (field, label) => {
    for (const value of [0, -1]) {
      expect(() => calculateIccMin({ ...cable, [field]: value })).toThrow(
        `${label} doit être positif`,
      );
    }
  });

  it("rejects unknown phase types", () => {
    expect(() => calculateIccMin({ ...cable, phaseType: "2N" })).toThrow(
      "Type de phase inconnu : 2N",
    );
  });
});
