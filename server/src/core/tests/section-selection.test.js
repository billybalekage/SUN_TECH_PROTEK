import { describe, it, expect } from "vitest";
import { selectFinalSection } from "../electric-rules/formulas/section-selection";

describe("selectFinalSection", () => {
  it("retient la section la plus grande entre les deux criteres, puis arrondit", () => {
    const result = selectFinalSection({
      sectionByVoltageDrop: 0.844,
      sectionByAmpacity: 4,
    });
    expect(result).toBe(4);
  });

  it("retient le critere de chute de tension s'il est contraignant", () => {
    const result = selectFinalSection({
      sectionByVoltageDrop: 8,
      sectionByAmpacity: 2.5,
    });
    expect(result).toBe(10);
  });

  it("retourne null si aucune section standard ne suffit", () => {
    const result = selectFinalSection({
      sectionByVoltageDrop: 300,
      sectionByAmpacity: 100,
    });
    expect(result).toBeNull();
  });

  it("rejette des valeurs negatives ou nulles", () => {
    expect(() =>
      selectFinalSection({ sectionByVoltageDrop: 0, sectionByAmpacity: 4 }),
    ).toThrow("sectionByVoltageDrop");
    expect(() =>
      selectFinalSection({ sectionByVoltageDrop: 4, sectionByAmpacity: -1 }),
    ).toThrow("sectionByAmpacity");
  });
});
