import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  COMPONENT_TYPES,
  createComponentService,
} = await import("../components/service.js");

describe("matchCommercialComponents", () => {
  let findByType;
  let matchCommercialComponents;

  beforeEach(() => {
    findByType = vi.fn(async (type) => {
      if (type === COMPONENT_TYPES.PROTECTION) {
        return [
          { reference: "BREAKER-16-6", ratedCurrent: "16", breakingCapacity: "6" },
          { reference: "BREAKER-20-6", ratedCurrent: "20", breakingCapacity: "6" },
          { reference: "BREAKER-16-3", ratedCurrent: "16", breakingCapacity: "3" },
        ];
      }
      return [
        {
          reference: "CABLE-CU-6",
          technicalSpecs: {
            sectionMm2: 6,
            conductorMaterial: "CU",
            insulation: "PVC",
          },
        },
        {
          reference: "CABLE-AL-10",
          technicalSpecs: {
            sectionMm2: 10,
            conductorMaterial: "AL",
            insulation: "PVC",
          },
        },
        {
          reference: "CABLE-CU-4",
          technicalSpecs: {
            sectionMm2: 4,
            conductorMaterial: "CU",
            insulation: "PVC",
          },
        },
      ];
    });
    ({ matchCommercialComponents } = createComponentService({ findByType }));
  });

  it("matches the calculated breaker rating and compatible cable specifications", async () => {
    const result = await matchCommercialComponents({
      inCurrent: 16,
      sectionMm2: 6,
      minimumBreakingCapacity: 4.5,
      cableSpecifications: { conductorMaterial: "CU", insulation: "PVC" },
    });

    expect(result.protections.map(({ reference }) => reference)).toEqual([
      "BREAKER-16-6",
    ]);
    expect(result.cables.map(({ reference }) => reference)).toEqual([
      "CABLE-CU-6",
    ]);
    expect(findByType).toHaveBeenCalledWith(COMPONENT_TYPES.PROTECTION);
    expect(findByType).toHaveBeenCalledWith(COMPONENT_TYPES.CABLE);
  });

  it("rejects missing or invalid theoretical sizing results", async () => {
    await expect(
      matchCommercialComponents({ inCurrent: 0, sectionMm2: 6 }),
    ).rejects.toThrow("In");
    await expect(
      matchCommercialComponents({ inCurrent: 16, sectionMm2: -1 }),
    ).rejects.toThrow("section");
  });
});