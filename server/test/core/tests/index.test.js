import { describe, it, expect } from "vitest";
import * as electricRules from "../../../src/core/electric-rules/index.js";

describe("electric-rules index", () => {
  it("exporte toutes les fonctions attendues", () => {
    expect(typeof electricRules.calculateIb).toBe("function");
    expect(typeof electricRules.calculateCorrectedCurrent).toBe("function");
    expect(typeof electricRules.selectProtectionRating).toBe("function");
    expect(typeof electricRules.calculateDeltaUPercent).toBe("function");
    expect(typeof electricRules.calculateMinSectionByVoltageDrop).toBe(
      "function",
    );
    expect(typeof electricRules.roundToStandardSection).toBe("function");
    expect(typeof electricRules.checkCoordination).toBe("function");
    expect(typeof electricRules.calculateIccMin).toBe("function");
    expect(typeof electricRules.calculateMaxLengthForIccMin).toBe("function");
    expect(electricRules.RESISTIVITY).toMatchObject({
      COPPER: expect.any(Number),
      ALUMINUM: expect.any(Number),
    });
  });
});
