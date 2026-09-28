import { beforeEach, describe, expect, it, vi } from "vitest";
import circuitServiceModule from "../../../src/features/circuits/circuit.service.js";

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
  RESISTIVITY: { COPPER: 0.0172, ALUMINUM: 0.0282 },
  calculateDeltaUPercent: vi.fn(),
  calculateMinSectionByVoltageDrop: vi.fn(),
  roundToStandardSection: vi.fn(),
  selectFinalSection: vi.fn(),
  calculateIccMin: vi.fn(),
  calculateMaxLengthForIccMin: vi.fn(),
  checkCoordination: vi.fn(),
};

let circuitService;

beforeEach(() => {
  vi.clearAllMocks();
  circuitService = circuitServiceModule.createCircuitService({
    circuitRepository: mockCircuitRepository,
    normService: mockNormService,
    electricRules: mockElectricRules,
  });
  mockCircuitRepository.findCircuitById.mockResolvedValue({
    id: "circuit-1",
    circuitType: "ECLAIRAGE",
    numberOfCircuits: 2,
    totalPower: 2300,
    cosPhi: 1,
    farthestLoadDistance: 20,
    installation: {
      id: "installation-1",
      version: 7,
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
      isCompliant: false,
    });
    expect(result.reasons).toContain(
      "Icc,min requis non fourni : la longueur maximale n'est pas vérifiée",
    );
    expect(result.reasons).toContain(
      "Icc,max réseau non fourni : le pouvoir de coupure n'est pas vérifié",
    );
  });

  it("normalizes accents when inferring the lighting usage", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      circuitType: "Éclairage",
      numberOfCircuits: 1,
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

    await circuitService.runCircuitCalculation("user-1", "circuit-1");

    expect(mockNormService.getMaxDeltaUPercent).toHaveBeenCalledWith(
      "ECLAIRAGE",
    );
  });

  it("uses aluminum resistivity when the conductor material is AL", async () => {
    await circuitService.runCircuitCalculation("user-1", "circuit-1", {
      conductorMaterial: "AL",
    });

    expect(
      mockElectricRules.calculateMinSectionByVoltageDrop,
    ).toHaveBeenCalledWith(0.0282, 20, 10, 1, 230, 3, "1N");
  });

  it("marks a circuit non-compliant when voltage drop exceeds its limit", async () => {
    mockElectricRules.calculateDeltaUPercent.mockReturnValueOnce(4);

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(result.isCompliant).toBe(false);
    expect(result.reasons).toContain(
      "La chute de tension (4.00%) dépasse la limite (3%)",
    );
    expect(mockCircuitRepository.saveCalculationResult).toHaveBeenCalledWith(
      "circuit-1",
      expect.objectContaining({ isCompliant: false }),
      "installation-1",
      7,
    );
  });

  it("checks maximum cable length, breaking capacity, and TT differential", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      circuitType: "Éclairage",
      numberOfCircuits: 1,
      totalPower: 2300,
      cosPhi: 1,
      farthestLoadDistance: 20,
      circuitComponents: [
        {
          role: "PROTECTION",
          component: {
            breakingCapacity: 3,
            technicalSpecs: { breakingCapacityUnit: "kA" },
          },
        },
      ],
      installation: {
        nominalVoltage: 230,
        phaseType: "1N",
        neutralRegime: "TT",
        installMode: "B1",
        insulationType: "PVC",
        project: { ownerId: "user-1" },
      },
    });
    mockElectricRules.calculateMaxLengthForIccMin.mockReturnValue(10);

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
      { minimumIcc: 10, maximumIcc: 4000 },
    );

    expect(result.isCompliant).toBe(false);
    expect(result.reasons).toContain(
      "La longueur du circuit (20m) dépasse Lmax (10.00m) pour Icc,min",
    );
    expect(result.reasons).toContain(
      "Aucune protection liée avec une unité de pouvoir de coupure connue ne couvre Icc,max (4000A)",
    );
    expect(result.reasons).toContain(
      "Aucun dispositif différentiel n'est lié au circuit en régime TT",
    );
  });
});
