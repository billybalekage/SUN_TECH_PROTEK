import { describe, expect, it } from "vitest";
import {
  STANDARD_SECTIONS,
  calculateDeltaUPercent,
  calculateMinSectionByVoltageDrop,
  roundToStandardSection,
} from "../electric-rules/formulas/chute-tension.js";

const cable = {
  rho: 0.0225,
  length: 20,
  ib: 10,
  cosPhi: 0.8,
  section: 2.5,
  voltage: 230,
  phaseType: "1N",
};

describe("calculateDeltaUPercent", () => {
  it("calculates single-phase voltage drop as a percentage", () => {
    expect(calculateDeltaUPercent(cable)).toBeCloseTo(
      (2 * 0.0225 * 20 * 10 * 100) / (2.5 * 230),
    );
  });

  it("calculates three-phase drop with the power factor and square-root-of-three", () => {
    expect(
      calculateDeltaUPercent({ ...cable, voltage: 400, phaseType: "3N" }),
    ).toBeCloseTo(
      (Math.sqrt(3) * 0.0225 * 20 * 10 * 0.8 * 100) / (2.5 * 400),
    );
  });

  it("decreases when the conductor section doubles", () => {
    expect(calculateDeltaUPercent({ ...cable, section: 5 })).toBeCloseTo(
      calculateDeltaUPercent(cable) / 2,
    );
  });

  it.each(["rho", "length", "ib", "section", "voltage"])(
    "rejects non-positive %s",
    (field) => {
      expect(() => calculateDeltaUPercent({ ...cable, [field]: 0 })).toThrow();
      expect(() => calculateDeltaUPercent({ ...cable, [field]: -1 })).toThrow();
    },
  );

  it("rejects power factors outside the range from zero to one", () => {
    expect(() => calculateDeltaUPercent({ ...cable, cosPhi: -0.1 })).toThrow();
    expect(() => calculateDeltaUPercent({ ...cable, cosPhi: 1.1 })).toThrow();
  });

  it("rejects unrecognized phase types", () => {
    expect(() => calculateDeltaUPercent({ ...cable, phaseType: "2N" })).toThrow();
  });
});

describe("calculateMinSectionByVoltageDrop", () => {
  it("inverts the single-phase voltage-drop limit", () => {
    expect(
      calculateMinSectionByVoltageDrop(0.0225, 20, 10, 0.8, 230, 3, "1N"),
    ).toBeCloseTo((2 * 0.0225 * 20 * 10 * 100) / (3 * 230));
  });

  it("inverts the three-phase voltage-drop limit", () => {
    expect(
      calculateMinSectionByVoltageDrop(0.0225, 20, 10, 0.8, 400, 3, "3N"),
    ).toBeCloseTo((Math.sqrt(3) * 0.0225 * 20 * 10 * 0.8 * 100) / (3 * 400));
  });

  it("rejects a zero or negative maximum drop", () => {
    for (const limit of [0, -1]) {
      expect(() =>
        calculateMinSectionByVoltageDrop(0.0225, 20, 10, 0.8, 230, limit, "1N"),
      ).toThrow();
    }
  });
});

describe("roundToStandardSection", () => {
  it("preserves a catalogued size and rounds up between sizes", () => {
    expect(STANDARD_SECTIONS.length).toBeGreaterThan(1);
    expect(roundToStandardSection(STANDARD_SECTIONS[0])).toBe(
      STANDARD_SECTIONS[0],
    );
    expect(
      roundToStandardSection((STANDARD_SECTIONS[0] + STANDARD_SECTIONS[1]) / 2),
    ).toBe(STANDARD_SECTIONS[1]);
  });

  it("returns null when no standard section is large enough", () => {
    const largest = STANDARD_SECTIONS.at(-1);
    expect(roundToStandardSection(largest)).toBe(largest);
    expect(roundToStandardSection(largest + 1)).toBeNull();
  });

  it("rejects non-positive sections", () => {
    expect(() => roundToStandardSection(0)).toThrow();
    expect(() => roundToStandardSection(-1)).toThrow();
  });
});
