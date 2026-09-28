import { beforeEach, describe, expect, it, vi } from "vitest";
import installationServiceModule from "./installation.service.js";

const mockRepository = {
  findProjectById: vi.fn(),
  findInstallationByProjectId: vi.fn(),
  createInstallation: vi.fn(),
  updateInstallation: vi.fn(),
};

let installationService;

beforeEach(() => {
  vi.clearAllMocks();
  installationService =
    installationServiceModule.createInstallationService(mockRepository);
});

describe("installation service", () => {
  it("creates an installation for a project owned by the current user", async () => {
    const payload = {
      projectId: "project-1",
      nominalVoltage: 230,
      phaseType: "1N",
      neutralRegime: "TT",
      installMode: "B1",
      insulationType: "PVC",
    };
    mockRepository.findProjectById.mockResolvedValue({
      id: "project-1",
      ownerId: "user-1",
    });
    mockRepository.findInstallationByProjectId.mockResolvedValue(null);
    mockRepository.createInstallation.mockResolvedValue({ id: "install-1" });

    await expect(
      installationService.createInstallation("user-1", payload),
    ).resolves.toEqual({ id: "install-1" });
    expect(mockRepository.createInstallation).toHaveBeenCalledWith(payload);
  });

  it("rejects a project owned by another user", async () => {
    mockRepository.findProjectById.mockResolvedValue({
      id: "project-1",
      ownerId: "user-2",
    });

    await expect(
      installationService.createInstallation("user-1", {
        projectId: "project-1",
      }),
    ).rejects.toThrow("Vous n'avez pas accès à ce projet");
    expect(mockRepository.createInstallation).not.toHaveBeenCalled();
  });

  it("updates an installation belonging to the current user", async () => {
    mockRepository.findProjectById.mockResolvedValue({
      id: "project-1",
      ownerId: "user-1",
    });
    mockRepository.findInstallationByProjectId.mockResolvedValue({
      id: "installation-1",
    });
    mockRepository.updateInstallation.mockResolvedValue({
      id: "installation-1",
      nominalVoltage: 400,
      circuits: [{ calculationResult: null }],
    });

    await expect(
      installationService.updateInstallation("user-1", "project-1", {
        nominalVoltage: 400,
      }),
    ).resolves.toMatchObject({ nominalVoltage: 400 });
    expect(mockRepository.updateInstallation).toHaveBeenCalledWith(
      "project-1",
      { nominalVoltage: 400 },
    );
  });
});
