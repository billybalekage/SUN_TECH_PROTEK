import { beforeEach, describe, expect, it, vi } from "vitest";
import circuitServiceModule from "../../../src/features/circuits/circuit.service.js";

const mockCircuitRepository = {
  findCircuitById: vi.fn(),
  findCircuitsByInstallation: vi.fn(),
  updateCircuit: vi.fn(),
  saveCalculationResult: vi.fn(),
  markCircuitValidated: vi.fn(),
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
  calculateRequiredIccForTripCurve: vi.fn(
    ({ ratedCurrent, tripCurve }) =>
      ratedCurrent * { B: 5, C: 10, D: 20 }[tripCurve],
  ),
  checkCoordination: vi.fn(),
  checkDifferentialSensitivity: vi.fn(
    ({ usageLocation, chosenSensitivityMa }) => ({
      isCompliant:
        Boolean(usageLocation) && Number.isFinite(chosenSensitivityMa),
      reasons: [],
    }),
  ),
};

const mockCoordinationService = {
  calculateDeviceRating: vi.fn(),
};

let circuitService;

beforeEach(() => {
  vi.clearAllMocks();
  circuitService = circuitServiceModule.createCircuitService({
    circuitRepository: mockCircuitRepository,
    normService: mockNormService,
    electricRules: mockElectricRules,
    coordinationService: mockCoordinationService,
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
  mockCircuitRepository.findCircuitsByInstallation.mockResolvedValue([
    { totalPower: 2300, cosPhi: 1 },
  ]);
  mockElectricRules.calculateIb.mockReturnValue(10);
  mockElectricRules.selectProtectionRating.mockReturnValue(16);
  mockElectricRules.calculateCorrectedCurrent.mockReturnValue(20);
  mockElectricRules.calculateMinSectionByVoltageDrop.mockReturnValue(2.5);
  mockElectricRules.selectFinalSection.mockReturnValue(4);
  mockElectricRules.calculateDeltaUPercent.mockReturnValue(1.2);
  mockElectricRules.calculateIccMin.mockReturnValue(3000);
  mockElectricRules.calculateMaxLengthForIccMin.mockReturnValue(25);
  mockElectricRules.checkCoordination.mockReturnValue({
    isCompliant: true,
    reasons: [],
  });
  mockCoordinationService.calculateDeviceRating.mockResolvedValue({
    deviceId: "device-1",
    installationId: "installation-1",
    expectedVersion: 7,
    rating: { sensitivityMa: 30, type: "A", ratedCurrent: 32 },
  });
  mockNormService.getMaxDeltaUPercent.mockResolvedValue(3);
  mockNormService.getGroupingFactor.mockResolvedValue(0.8);
  mockNormService.getTemperatureFactor.mockResolvedValue(1);
  mockNormService.findMinSectionForAmpacity.mockResolvedValue(2.5);
  mockNormService.getBaseAmpacity.mockResolvedValue(28);
});

describe("runCircuitCalculation normative integration", () => {
  it("returns the automatically computed differential protection", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      differentialDeviceId: "device-1",
      circuitType: "ECLAIRAGE",
      numberOfCircuits: 1,
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

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(mockCoordinationService.calculateDeviceRating).toHaveBeenCalledWith(
      "user-1",
      "device-1",
    );
    expect(result.differentialDevice).toMatchObject({
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 32,
    });
    expect(result.generalProtectionRating).toBe(16);
  });

  it("keeps unverified Icc checks as warnings instead of false non-compliance", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      differentialDeviceId: "device-1",
      circuitType: "ECLAIRAGE",
      usageLocation: "ECLAIRAGE",
      numberOfCircuits: 1,
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

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(result.isCompliant).toBe(true);
    expect(result.reasons).toEqual([]);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Courbe de déclenchement du disjoncteur non renseignée",
        ),
        expect.stringContaining("Icc,max réseau non fourni"),
      ]),
    );
    expect(mockCircuitRepository.saveCalculationResult).toHaveBeenCalledWith(
      "circuit-1",
      expect.objectContaining({
        isCompliant: true,
        reasons: [],
        warnings: result.warnings,
      }),
      "installation-1",
      7,
      16,
      {
        id: "device-1",
        sensitivityMa: 30,
        type: "A",
        ratedCurrent: 32,
      },
    );
  });

  it("derives the required minimum Icc from the breaker curve", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      breakerTripCurve: "C",
      circuitType: "ECLAIRAGE",
      numberOfCircuits: 1,
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
    mockElectricRules.calculateMaxLengthForIccMin.mockReturnValueOnce(15);

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(
      mockElectricRules.calculateRequiredIccForTripCurve,
    ).toHaveBeenCalledWith({ ratedCurrent: 16, tripCurve: "C" });
    expect(mockElectricRules.calculateMaxLengthForIccMin).toHaveBeenCalledWith(
      expect.objectContaining({ minimumIcc: 160 }),
    );
    expect(result.reasons).toContain(
      "La longueur du circuit (20m) dépasse Lmax (15.00m) pour Icc,min",
    );
    expect(result.warnings).not.toContain(
      "Courbe de déclenchement du disjoncteur non renseignée : la longueur maximale n'est pas vérifiée",
    );
  });

  it("uses the installation maximum Icc to verify linked protection capacity", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      circuitType: "ECLAIRAGE",
      numberOfCircuits: 1,
      totalPower: 2300,
      cosPhi: 1,
      farthestLoadDistance: 20,
      circuitComponents: [
        {
          role: "PROTECTION",
          component: {
            breakingCapacity: 6,
            technicalSpecs: { breakingCapacityUnit: "kA" },
          },
        },
      ],
      installation: {
        id: "installation-1",
        version: 7,
        nominalVoltage: 230,
        maximumIcc: "4000",
        phaseType: "1N",
        installMode: "B1",
        insulationType: "PVC",
        project: { ownerId: "user-1" },
      },
    });

    const result = await circuitService.runCircuitCalculation(
      "user-1",
      "circuit-1",
    );

    expect(result.warnings).not.toContain(
      "Icc,max réseau non fourni : le pouvoir de coupure n'est pas vérifié",
    );
    expect(result.reasons).not.toContain(
      "Aucune protection liée avec une unité de pouvoir de coupure connue ne couvre Icc,max (4000A)",
    );
  });

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
    expect(result.warnings).toContain(
      "Courbe de déclenchement du disjoncteur non renseignée : la longueur maximale n'est pas vérifiée",
    );
    expect(result.warnings).toContain(
      "Icc,max réseau non fourni : le pouvoir de coupure n'est pas vérifié",
    );
    expect(mockCircuitRepository.saveCalculationResult).toHaveBeenCalledWith(
      "circuit-1",
      expect.objectContaining({ reasons: result.reasons }),
      "installation-1",
      7,
      16,
      null,
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
      16,
      null,
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
      "Aucun dispositif différentiel n'est lié à ce circuit",
    );
  });
});

describe("updateCircuit", () => {
  it("updates a circuit after verifying project ownership", async () => {
    const updatedCircuit = { id: "circuit-1", name: "Éclairage séjour" };
    mockCircuitRepository.updateCircuit.mockResolvedValue(updatedCircuit);

    await expect(
      circuitService.updateCircuit("user-1", "circuit-1", {
        name: "Éclairage séjour",
      }),
    ).resolves.toBe(updatedCircuit);
    expect(mockCircuitRepository.updateCircuit).toHaveBeenCalledWith(
      "circuit-1",
      { name: "Éclairage séjour" },
    );
  });
});

describe("validateCircuitCalculation", () => {
  it("returns validation status without changing the circuit", async () => {
    const circuit = {
      id: "circuit-1",
      validatedAt: null,
      calculationResult: { isCompliant: true },
      installation: { project: { ownerId: "user-1" } },
    };
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce(circuit);

    await expect(
      circuitService.getCircuitValidationStatus("user-1", "circuit-1"),
    ).resolves.toEqual({
      circuitId: "circuit-1",
      canValidate: true,
      isCompliant: true,
      validatedAt: null,
    });
    expect(mockCircuitRepository.markCircuitValidated).not.toHaveBeenCalled();
  });

  it("refuses to validate a circuit without a calculation result", async () => {
    await expect(
      circuitService.validateCircuitCalculation("user-1", "circuit-1"),
    ).rejects.toThrow(
      "Le circuit doit être calculé avant de valider son résultat",
    );
    expect(mockCircuitRepository.markCircuitValidated).not.toHaveBeenCalled();
  });

  it("marks a calculated circuit as validated", async () => {
    mockCircuitRepository.findCircuitById.mockResolvedValueOnce({
      id: "circuit-1",
      calculationResult: { isCompliant: true },
      installation: { project: { ownerId: "user-1" } },
    });
    const validatedCircuit = { id: "circuit-1", validatedAt: new Date() };
    mockCircuitRepository.markCircuitValidated.mockResolvedValueOnce(
      validatedCircuit,
    );

    await expect(
      circuitService.validateCircuitCalculation("user-1", "circuit-1"),
    ).resolves.toBe(validatedCircuit);
    expect(mockCircuitRepository.markCircuitValidated).toHaveBeenCalledWith(
      "circuit-1",
    );
  });
});
