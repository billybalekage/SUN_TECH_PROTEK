import { describe, expect, it } from "vitest";
import {
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
} from "../electric-rules/formulas/chute-tension";

describe("voltage drop and conductor section", () => {
  const singlePhase = {
    rho: 0.023,
    length: 30,
    ib: 16,
    cosPhi: 0.8,
    section: 2.5,
    voltage: 230,
    phaseType: "1N",
  };

  it("calculates single-phase percentage drop using the round-trip conductor length", () => {
    expect(calculateDeltaUPercent(singlePhase)).toBeCloseTo(3.84);
    expect(calculateDeltaUPercent({ ...singlePhase, length: 60 })).toBeCloseTo(
      7.68,
    );
  });

  it("calculates three-phase percentage drop including the power factor", () => {
    expect(
      calculateDeltaUPercent({ ...singlePhase, voltage: 400, phaseType: "3N" }),
    ).toBeCloseTo((Math.sqrt(3) * 0.023 * 30 * 16 * 0.8 * 100) / (2.5 * 400));
  });

  it("rejects non-positive conductor section and invalid electrical inputs", () => {
    expect(() => calculateDeltaUPercent({ ...singlePhase, section: 0 })).toThrow(
      "section",
    );
    expect(() => calculateDeltaUPercent({ ...singlePhase, voltage: 0 })).toThrow();
    expect(() => calculateDeltaUPercent({ ...singlePhase, cosPhi: 1.1 })).toThrow();
  });

  it("finds the minimum section for a single-phase voltage-drop limit", () => {
    expect(
      calculateMinSectionByVoltageDrop(0.023, 30, 16, 0.8, 230, 5, "1N"),
    ).toBeCloseTo(1.92);
  });

  it("finds the minimum section for a three-phase voltage-drop limit", () => {
    expect(
      calculateMinSectionByVoltageDrop(0.023, 30, 16, 0.8, 400, 5, "3N"),
    ).toBeCloseTo((Math.sqrt(3) * 0.023 * 30 * 16 * 0.8 * 100) / (5 * 400));
  });

  it("rejects a non-positive maximum percentage drop", () => {
    expect(() =>
      calculateMinSectionByVoltageDrop(0.023, 30, 16, 0.8, 230, 0, "1N"),
    ).toThrow();
  });

  it("rounds up at the exact standard-section boundary and returns null above the range", () => {
    expect(STANDARD_SECTIONS.length).toBeGreaterThan(1);
    const [smallest, next] = STANDARD_SECTIONS;
    const largest = STANDARD_SECTIONS.at(-1);
    expect(smallest).toBeLessThan(next);
    expect(roundToStandardSection(smallest)).toBe(smallest);
    expect(roundToStandardSection((smallest + next) / 2)).toBe(next);
    expect(roundToStandardSection(largest + 1)).toBeNull();
  });

  it.each([0, -1])("rejects non-positive sections when rounding (%s)", (section) => {
    expect(() => roundToStandardSection(section)).toThrow("positive");
  });
});
