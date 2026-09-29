import { beforeEach, describe, expect, it, vi } from "vitest";
import coordinationService from "../../../src/features/installations/coordination.service.js";
import { createDifferentialDeviceSchema } from "../../../src/features/installations/differential-device.validator.js";

const repository = {
  findInstallationById: vi.fn(),
  findDeviceById: vi.fn(),
  findDevicesByInstallation: vi.fn(),
  createDevice: vi.fn(),
  saveDeviceRating: vi.fn(),
  findCircuitWithOwnership: vi.fn(),
  assignCircuitToDevice: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  repository.findInstallationById.mockResolvedValue({
    id: "installation-1",
    generalProtectionRating: 40,
    generalProtectionType: "A",
    project: { ownerId: "user-1" },
  });
});

describe("differential device coordination", () => {
  it("accepts only configurable fields when creating a DDR", () => {
    const result = createDifferentialDeviceSchema.safeParse({
      installationId: "123e4567-e89b-12d3-a456-426614174000",
      label: "Tableau étage",
      isSelectiveType: true,
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 40,
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        installationId: "123e4567-e89b-12d3-a456-426614174000",
        label: "Tableau étage",
        isSelectiveType: true,
      },
    });
    expect(result.data).not.toHaveProperty("sensitivityMa");
    expect(result.data).not.toHaveProperty("type");
    expect(result.data).not.toHaveProperty("ratedCurrent");
  });

  it("computes the strictest sensitivity, required type, and total-current rating", async () => {
    const device = {
      id: "device-1",
      circuits: [
        {
          id: "circuit-1",
          usageLocation: "AUTRES",
          circuitType: "ECLAIRAGE",
          totalPower: 2300,
          cosPhi: 1,
        },
        {
          id: "circuit-2",
          usageLocation: "SALLE_DE_BAIN_VOLUME_0_1_2",
          circuitType: "PLAQUE_INDUCTION",
          totalPower: 4600,
          cosPhi: 1,
        },
      ],
      installation: {
        id: "installation-1",
        version: 4,
        nominalVoltage: 230,
        phaseType: "1N",
        project: { ownerId: "user-1" },
      },
    };
    const updatedDevice = {
      ...device,
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 32,
    };
    repository.findDeviceById.mockResolvedValue(device);
    repository.saveDeviceRating.mockResolvedValue(updatedDevice);

    await expect(
      coordinationService.computeDeviceRating("user-1", "device-1", repository),
    ).resolves.toBe(updatedDevice);
    expect(repository.saveDeviceRating).toHaveBeenCalledWith(
      "device-1",
      "installation-1",
      4,
      { sensitivityMa: 30, type: "A", ratedCurrent: 32 },
    );
  });

  it("rejects dimensioning a DDR with no assigned circuits", async () => {
    repository.findDeviceById.mockResolvedValue({
      id: "device-1",
      circuits: [],
      installation: { project: { ownerId: "user-1" } },
    });

    await expect(
      coordinationService.computeDeviceRating("user-1", "device-1", repository),
    ).rejects.toThrow("Aucun circuit assigné");
    expect(repository.saveDeviceRating).not.toHaveBeenCalled();
  });

  it("rejects dimensioning when a circuit has no usage location", async () => {
    repository.findDeviceById.mockResolvedValue({
      id: "device-1",
      circuits: [{ id: "circuit-1", usageLocation: null }],
      installation: { project: { ownerId: "user-1" } },
    });

    await expect(
      coordinationService.computeDeviceRating("user-1", "device-1", repository),
    ).rejects.toThrow("sans emplacement d’usage");
    expect(repository.saveDeviceRating).not.toHaveBeenCalled();
  });

  it("creates a device only for an installation owned by the user", async () => {
    const device = { id: "device-1" };
    repository.createDevice.mockResolvedValue(device);

    await expect(
      coordinationService.createDevice(
        "user-1",
        { installationId: "installation-1" },
        repository,
      ),
    ).resolves.toBe(device);
    expect(repository.createDevice).toHaveBeenCalledWith({
      installationId: "installation-1",
    });
  });

  it("does not expose devices from installations owned by another user", async () => {
    repository.findInstallationById.mockResolvedValueOnce({
      id: "installation-1",
      project: { ownerId: "user-2" },
    });

    await expect(
      coordinationService.listDevicesByInstallation(
        "user-1",
        "installation-1",
        repository,
      ),
    ).rejects.toThrow("Installation introuvable");
    expect(repository.findDevicesByInstallation).not.toHaveBeenCalled();
  });

  it("rejects assigning a circuit to a device from another installation", async () => {
    repository.findCircuitWithOwnership.mockResolvedValue({
      id: "circuit-1",
      installationId: "installation-1",
      installation: { project: { ownerId: "user-1" } },
    });
    repository.findDeviceById.mockResolvedValue({
      id: "device-1",
      installationId: "installation-2",
      installation: { project: { ownerId: "user-1" } },
    });

    await expect(
      coordinationService.assignCircuit(
        "user-1",
        { circuitId: "circuit-1", differentialDeviceId: "device-1" },
        repository,
      ),
    ).rejects.toThrow("même installation");
    expect(repository.assignCircuitToDevice).not.toHaveBeenCalled();
  });

  it("checks the strictest usage sensitivity across assigned circuits", async () => {
    repository.findDeviceById.mockResolvedValue({
      id: "device-1",
      sensitivityMa: 100,
      circuits: [
        {
          id: "circuit-1",
          name: "Salle d'eau",
          usageLocation: "SALLE_DE_BAIN_VOLUME_0_1_2",
        },
      ],
      installation: { project: { ownerId: "user-1" } },
    });

    await expect(
      coordinationService.checkDeviceCoverage("user-1", "device-1", repository),
    ).resolves.toMatchObject({
      isCompliant: false,
      perCircuit: [
        {
          circuitId: "circuit-1",
          maximumSensitivityMa: 30,
          isCompliant: false,
        },
      ],
    });
  });

  it("checks selectivity for every device in an owned installation", async () => {
    repository.findDevicesByInstallation.mockResolvedValue([
      { id: "device-1", sensitivityMa: 30 },
      { id: "device-2", sensitivityMa: 300 },
    ]);

    await expect(
      coordinationService.checkInstallationSelectivity(
        "user-1",
        "installation-1",
        repository,
      ),
    ).resolves.toMatchObject({
      isCompliant: false,
      assumption: {
        upstreamSensitivityMa: 500,
        upstreamIsSelectiveType: true,
      },
      perDevice: [
        { differentialDeviceId: "device-1", isCompliant: true },
        { differentialDeviceId: "device-2", isCompliant: false },
      ],
    });
  });
});
