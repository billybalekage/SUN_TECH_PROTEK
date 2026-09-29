import { describe, expect, it } from "vitest";
import electricRules from "../../../src/core/electric-rules/index.js";

describe("differential protection requirements", () => {
  it("returns the sensitivity required by each usage location", () => {
    expect(
      electricRules.getRequiredSensitivity("SALLE_DE_BAIN_VOLUME_0_1_2"),
    ).toBe(30);
    expect(electricRules.getRequiredSensitivity("AUTRES")).toBe(300);
    expect(() => electricRules.getRequiredSensitivity("UNKNOWN")).toThrow(
      "Usage/emplacement inconnu",
    );
  });

  it("requires type A for listed loads and type AC otherwise", () => {
    expect(electricRules.getRequiredDifferentialType("PLAQUE_INDUCTION")).toBe(
      "A",
    );
    expect(electricRules.getRequiredDifferentialType("Lave-linge")).toBe("A");
    expect(electricRules.getRequiredDifferentialType("ECLAIRAGE")).toBe("AC");
  });
});
