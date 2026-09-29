import { describe, expect, it } from "vitest";
import {
  createCircuitSchema,
  updateCircuitSchema,
} from "../../../src/features/circuits/circuit.validator.js";

const validCircuit = {
  installationId: "123e4567-e89b-12d3-a456-426614174000",
  name: "Circuit test",
  circuitType: "ECLAIRAGE",
  totalPower: "1200",
  farthestLoadDistance: "15",
};

describe("circuit schemas", () => {
  it("coerces numeric creation values and keeps existing defaults", () => {
    expect(createCircuitSchema.parse(validCircuit)).toMatchObject({
      totalPower: 1200,
      farthestLoadDistance: 15,
      cosPhi: 0.8,
      numberOfCircuits: 1,
    });
  });

  it.each(["B", "C", "D", null])(
    "accepts breaker curve value %s",
    (breakerTripCurve) => {
      expect(
        createCircuitSchema.safeParse({ ...validCircuit, breakerTripCurve })
          .success,
      ).toBe(true);
    },
  );

  it("rejects unsupported breaker curves and empty circuit patches", () => {
    expect(
      createCircuitSchema.safeParse({
        ...validCircuit,
        breakerTripCurve: "E",
      }).success,
    ).toBe(false);
    expect(updateCircuitSchema.safeParse({}).success).toBe(false);
  });

  it("allows nullable breaker curves and coerced values on partial updates", () => {
    expect(updateCircuitSchema.parse({ breakerTripCurve: null })).toEqual({
      breakerTripCurve: null,
    });
    expect(updateCircuitSchema.parse({ totalPower: "2500" })).toEqual({
      totalPower: 2500,
    });
  });
});
