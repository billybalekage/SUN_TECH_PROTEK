import { beforeEach, describe, expect, it, vi } from "vitest";
import Module from "node:module";

const require = Module.createRequire(import.meta.url);

const mockRepository = {
  findProjectById: vi.fn(),
  findInstallationByProjectId: vi.fn(),
  createInstallation: vi.fn(),
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (
    request === "./installation.repository" ||
    request.endsWith("/installation.repository")
  ) {
    return mockRepository;
  }

  return originalLoad.apply(this, arguments);
};

const installationService = require("./installation.service");

beforeEach(() => vi.clearAllMocks());

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
});
