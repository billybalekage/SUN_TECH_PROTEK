import { beforeEach, describe, expect, it, vi } from "vitest";
import Module from "node:module";

const require = Module.createRequire(import.meta.url);

const mockCircuitRepository = {
  findCircuitById: vi.fn(),
  saveCalculationResult: vi.fn(),
};

const mockNormService = {
  getMaxDeltaUPercent: vi.fn(),
  getGroupingFactor: vi.fn(),
  getTemperatureFactor: vi.fn(),
  findMinSectionForAmpacity: vi.fn(),
  getBaseAmpacity: vi.fn(),
};

const mockElectricRules = {
  calculateIb: vi.fn(),
  calculateCorrectedCurrent: vi.fn(),
  selectProtectionRating: vi.fn(),
  RESISTIVITY: { COPPER: 0.0172 },
  calculateDeltaUPercent: vi.fn(),
  calculateMinSectionByVoltageDrop: vi.fn(),
  roundToStandardSection: vi.fn(),
  selectFinalSection: vi.fn(),
  calculateIccMin: vi.fn(),
  checkCoordination: vi.fn(),
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (
    request === "./circuit.repository" ||
    request.endsWith("/circuit.repository")
  ) {
    return mockCircuitRepository;
  }

  if (request.endsWith("/core/norms/norm")) {
    return mockNormService;
  }

  if (request === "../../core/electric-rules") {
    return mockElectricRules;
  }

  return originalLoad.apply(this, arguments);
};

const circuitService = require("./circuit.service");

beforeEach(() => {
  vi.clearAllMocks();
  mockCircuitRepository.findCircuitById.mockResolvedValue({
    id: "circuit-1",
    circuitType: "ECLAIRAGE",
    numberOfCircuits: 2,
    totalPower: 2300,
    cosPhi: 1,
    farthestLoadDistance: 20,
    installation: {
      nominalVoltage: 230,
      phaseType: "1N",
      installMode: "B1",
      insulationType: "PVC",
      project: { ownerId: "user-1" },
    },
  });
  mockElectricRules.calculateIb.mockReturnValue(10);
  mockElectricRules.selectProtectionRating.mockReturnValue(16);
  mockElectricRules.calculateCorrectedCurrent.mockReturnValue(20);
  mockElectricRules.calculateMinSectionByVoltageDrop.mockReturnValue(2.5);
  mockElectricRules.selectFinalSection.mockReturnValue(4);
  mockElectricRules.calculateDeltaUPercent.mockReturnValue(1.2);
  mockElectricRules.calculateIccMin.mockReturnValue(3000);
  mockElectricRules.checkCoordination.mockReturnValue({
    isCompliant: true,
    reasons: [],
  });
  mockNormService.getMaxDeltaUPercent.mockResolvedValue(3);
  mockNormService.getGroupingFactor.mockResolvedValue(0.8);
  mockNormService.getTemperatureFactor.mockResolvedValue(1);
  mockNormService.findMinSectionForAmpacity.mockResolvedValue(2.5);
  mockNormService.getBaseAmpacity.mockResolvedValue(28);
});

describe("runCircuitCalculation normative integration", () => {
  it("derives voltage-drop limits, ampacity section, and corrected Iz from norms", async () => {
    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(mockNormService.getMaxDeltaUPercent).toHaveBeenCalledWith(
      "ECLAIRAGE",
    );
    expect(mockNormService.getGroupingFactor).toHaveBeenCalledWith(2);
    expect(mockNormService.getTemperatureFactor).toHaveBeenCalledWith({
      ambientTempCelsius: 30,
      insulation: "PVC",
    });
    expect(mockElectricRules.calculateCorrectedCurrent).toHaveBeenCalledWith({
      inCurrent: 16,
      k1: 1,
      k2: 0.8,
      k3: 1,
    });
    expect(mockNormService.findMinSectionForAmpacity).toHaveBeenCalledWith({
      installMethod: "B1",
      insulation: "PVC",
      conductorMaterial: "CU",
      requiredCurrent: 20,
    });
    expect(mockNormService.getBaseAmpacity).toHaveBeenCalledWith({
      installMethod: "B1",
      insulation: "PVC",
      conductorMaterial: "CU",
      section: 4,
    });
    expect(mockElectricRules.checkCoordination).toHaveBeenCalledWith({
      ib: 10,
      inCurrent: 16,
      iz: 22.400000000000002,
    });
    expect(result).toMatchObject({
      sectionMm2: 4,
      izCurrent: 22.400000000000002,
      baseIz: 28,
      deratingFactors: { k1: 1, k2: 0.8, k3: 1 },
      isCompliant: true,
    });
  });
});
