import { describe, it, expect } from "vitest";
import { calculateIb } from "../electric-rules/formulas/Ib.js";

describe("calculateIb", () => {
  it.each([
    ["monophasé à facteur de puissance unitaire", 2000, 230, 1, "1N", 2000 / 230],
    ["monophasé à facteur de puissance réduit", 2000, 230, 0.8, "1N", 2000 / 184],
    ["triphasé à facteur de puissance unitaire", 6000, 400, 1, "3N", 6000 / (Math.sqrt(3) * 400)],
    ["triphasé à facteur de puissance réduit", 6000, 400, 0.8, "3N", 6000 / (Math.sqrt(3) * 320)],
    ["puissance strictement positive proche de zéro", 0.001, 230, 1, "1N", 0.001 / 230],
  ])("calcule Ib en %s", (_description, power, voltage, cosPhi, phaseType, expected) => {
    expect(calculateIb(power, voltage, cosPhi, phaseType)).toBeCloseTo(expected, 10);
  });

  it("applique le facteur racine de trois uniquement en triphasé", () => {
    const singlePhase = calculateIb(6000, 400, 0.8, "1N");
    const threePhase = calculateIb(6000, 400, 0.8, "3N");

    expect(singlePhase / threePhase).toBeCloseTo(Math.sqrt(3), 10);
  });

  it.each([0, -100])("rejette une puissance de %s W", (power) => {
    expect(() => calculateIb(power, 230, 1, "1N")).toThrow("La puissance doit être positive.");
  });

  it.each([0, -230])("rejette une tension de %s V", (voltage) => {
    expect(() => calculateIb(2000, voltage, 1, "3N")).toThrow("La tension doit être positive.");
  });

  it.each([-0.01, 1.01])("rejette un facteur de puissance hors limites (%s)", (cosPhi) => {
    expect(() => calculateIb(2000, 230, cosPhi, "1N")).toThrow(
      "Le facteur de puissance doit être compris entre 0 et 1.",
    );
  });

  it("rejette un facteur de puissance nul plutôt que de retourner Infinity", () => {
    expect(() => calculateIb(2000, 230, 0, "1N")).toThrow();
  });

  it.each(["", "2N", undefined])("rejette un type de phase non reconnu (%s)", (phaseType) => {
    expect(() => calculateIb(2000, 230, 1, phaseType)).toThrow();
  });

  it.each([NaN, Infinity])("rejette une puissance non finie (%s)", (power) => {
    expect(() => calculateIb(power, 230, 1, "1N")).toThrow();
  });
});
