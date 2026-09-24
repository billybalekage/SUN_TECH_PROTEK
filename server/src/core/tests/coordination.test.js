import { describe, expect, it } from "vitest";
import { checkCoordination } from "../electric-rules/rules/coordination.js";

describe("checkCoordination", () => {
  it("accepts currents strictly within the protection and cable ratings", () => {
    expect(checkCoordination({ ib: 10, inCurrent: 16, iz: 20 })).toEqual({
      isCompliant: true,
      reasons: [],
    });
  });

  it("accepts equality at both coordination boundaries", () => {
    expect(checkCoordination({ ib: 16, inCurrent: 16, iz: 16 })).toEqual({
      isCompliant: true,
      reasons: [],
    });
  });

  it("identifies an undersized protection device", () => {
    expect(checkCoordination({ ib: 20, inCurrent: 16, iz: 25 })).toEqual({
      isCompliant: false,
      reasons: [expect.stringContaining("Ib (20A) dépasse In (16A)")],
    });
  });

  it("identifies a protection rating that exceeds the cable capacity", () => {
    expect(checkCoordination({ ib: 10, inCurrent: 20, iz: 16 })).toEqual({
      isCompliant: false,
      reasons: [expect.stringContaining("In (20A) dépasse Iz (16A)")],
    });
  });

  it("reports both failures when neither inequality holds", () => {
    expect(checkCoordination({ ib: 25, inCurrent: 20, iz: 16 })).toEqual({
      isCompliant: false,
      reasons: [
        expect.stringContaining("Ib (25A) dépasse In (20A)"),
        expect.stringContaining("In (20A) dépasse Iz (16A)"),
      ],
    });
  });

  it.each([
    ["ib", "Ib"],
    ["inCurrent", "In"],
    ["iz", "Iz"],
  ])("rejects zero and negative %s", (field, label) => {
    for (const value of [0, -1]) {
      expect(() =>
        checkCoordination({ ib: 10, inCurrent: 16, iz: 20, [field]: value }),
      ).toThrow(`${label} doit être positif`);
    }
  });
});
