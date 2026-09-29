import { beforeEach, describe, expect, it, vi } from "vitest";
import coordinationService from "../../../src/features/installations/coordination.service.js";

const repository = {
  findInstallationById: vi.fn(),
  findDeviceById: vi.fn(),
  findDevicesByInstallation: vi.fn(),
  createDevice: vi.fn(),
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
