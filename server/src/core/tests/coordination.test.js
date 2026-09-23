import { describe, expect, it } from "vitest";
import { checkCoordination } from "../electric-rules/rules/coordination";

describe("checkCoordination", () => {
  it("accepts a compliant protection rating, including equality at both limits", () => {
    expect(checkCoordination({ ib: 12, inCurrent: 16, iz: 20 })).toEqual({
      isCompliant: true,
      reasons: [],
    });
    expect(checkCoordination({ ib: 16, inCurrent: 16, iz: 16 })).toEqual({
      isCompliant: true,
      reasons: [],
    });
  });

  it("explains when the protection rating is smaller than the operating current", () => {
    expect(checkCoordination({ ib: 20, inCurrent: 16, iz: 25 })).toEqual({
      isCompliant: false,
      reasons: [
        expect.stringContaining("Ib (20A) dépasse In (16A)"),
      ],
    });
  });

  it("explains when the cable cannot support the protection rating", () => {
    expect(checkCoordination({ ib: 12, inCurrent: 20, iz: 16 })).toEqual({
      isCompliant: false,
      reasons: [
        expect.stringContaining("In (20A) dépasse Iz (16A)"),
      ],
    });
  });

  it("reports both violations when the ratings are in descending order", () => {
    const result = checkCoordination({ ib: 25, inCurrent: 20, iz: 16 });
    expect(result.isCompliant).toBe(false);
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons[0]).toContain("Ib (25A) dépasse In (20A)");
    expect(result.reasons[1]).toContain("In (20A) dépasse Iz (16A)");
  });

  it.each([
    ["ib", 0, "Ib"],
    ["inCurrent", -1, "In"],
    ["iz", 0, "Iz"],
  ])("rejects non-positive %s", (parameter, value, label) => {
    expect(() =>
      checkCoordination({ ib: 12, inCurrent: 16, iz: 20, [parameter]: value }),
    ).toThrow(`${label} doit être positif`);
  });
});
