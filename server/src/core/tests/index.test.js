import { describe, it, expect } from "vitest";
import * as electricRules from "../electric-rules/index";

describe("electric-rules index", () => {
  it("exporte toutes les fonctions attendues", () => {
    expect(typeof electricRules.calculateIb).toBe("function");
    expect(typeof electricRules.calculateDeltaUPercent).toBe("function");
    expect(typeof electricRules.calculateMinSectionByVoltageDrop).toBe(
      "function",
    );
    expect(typeof electricRules.roundToStandardSection).toBe("function");
    expect(typeof electricRules.checkCoordination).toBe("function");
    expect(typeof electricRules.calculateIccMin).toBe("function");
  });

  it("exposes the calculation constants and standard sections", () => {
    expect(electricRules.CONVENTIONAL_COEFFICIENT).toBe(0.8);
    expect(Array.isArray(electricRules.STANDARD_SECTIONS)).toBe(true);
    expect(electricRules.STANDARD_SECTIONS.length).toBeGreaterThan(1);
    expect(electricRules.RESISTIVITY).toBeDefined();
  });
});
