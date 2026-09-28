import { beforeEach, describe, expect, it, vi } from "vitest";
import Module from "node:module";

const require = Module.createRequire(import.meta.url);

const mockDashboardRepository = {
  getDashboardData: vi.fn(),
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (
    request === "./dashboard.repository" ||
    request.endsWith("/dashboard.repository")
  ) {
    return mockDashboardRepository;
  }

  return originalLoad.apply(this, arguments);
};

const dashboardService = require("../../../../src/features/clients/dashboard/dashboard.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("client dashboard service", () => {
  it("returns dashboard data scoped to the authenticated owner", async () => {
    const dashboardData = {
      totalProjects: 3,
      nonCompliantCircuits: 2,
      recentProjects: [
        {
          id: "project-1",
          clientName: "Client récent",
          status: "IN_PROGRESS",
          updatedAt: new Date("2026-09-26T12:00:00.000Z"),
        },
      ],
    };
    mockDashboardRepository.getDashboardData.mockResolvedValue(dashboardData);

    await expect(dashboardService.getDashboard("user-1")).resolves.toBe(
      dashboardData,
    );
    expect(mockDashboardRepository.getDashboardData).toHaveBeenCalledWith(
      "user-1",
    );
  });
});
