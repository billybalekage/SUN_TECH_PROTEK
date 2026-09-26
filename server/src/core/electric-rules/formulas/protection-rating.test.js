import { describe, expect, it } from "vitest";
import {
  STANDARD_PROTECTION_RATINGS,
  selectProtectionRating,
} from "./protection-rating.js";

describe("selectProtectionRating", () => {
  it("exposes the standardized protection ratings", () => {
    expect(STANDARD_PROTECTION_RATINGS).toEqual([
      2, 4, 6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125,
    ]);
  });

  it.each([
    [1, 2],
    [2, 2],
    [2.1, 4],
    [16, 16],
    [17, 20],
    [125, 125],
    [125.1, null],
  ])("selects the smallest rating for Ib=%s", (ib, expected) => {
    expect(selectProtectionRating(ib)).toBe(expected);
  });

  it.each([0, -1])("rejects non-positive Ib=%s", (ib) => {
    expect(() => selectProtectionRating(ib)).toThrow("Ib");
  });
});
