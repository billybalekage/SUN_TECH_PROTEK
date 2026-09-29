import { describe, expect, it, vi } from "vitest";
import reportsServiceModule from "../../../src/features/reports/reports.service.js";

const project = {
  id: "project-1",
  clientName: "Client exemple",
  address: "Adresse exemple",
  contact: "Contact client",
  status: "IN_PROGRESS",
  owner: {
    fullName: "Electricien Exemple",
    company: "Societe Exemple",
    phone: "0102030405",
    email: "electricien@example.test",
  },
  installation: {
    nominalVoltage: 230,
    phaseType: "1N",
    neutralRegime: "TT",
    installMode: "B1",
    insulationType: "PVC",
    maximumIcc: 6000,
    generalProtectionRating: 40,
    generalProtectionType: "A",
    circuits: [
      {
        id: "circuit-1",
        name: "Eclairage",
        circuitType: "ECLAIRAGE",
        totalPower: 1200,
        cosPhi: 0.8,
        farthestLoadDistance: 15,
        breakerTripCurve: "C",
        usageLocation: "ECLAIRAGE",
        calculationResult: {
          ib: 6,
          inCurrent: 10,
          sectionMm2: 1.5,
          izCurrent: 16,
          deltaUPercent: 1.2,
          icc: 3000,
          isCompliant: true,
          reasons: [],
          warnings: [],
        },
        circuitComponents: [],
        differentialDevice: null,
      },
    ],
    differentialDevices: [],
  },
};

describe("project PDF report", () => {
  it("creates a PDF for a project owned by the requesting user", async () => {
    const repository = {
      findProjectReportData: vi.fn().mockResolvedValue(project),
    };
    const service = reportsServiceModule.createReportsService(repository);

    const pdf = await service.generateProjectReport("project-1", "user-1");

    expect(repository.findProjectReportData).toHaveBeenCalledWith(
      "project-1",
      "user-1",
    );
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it("does not generate a report for a project the user cannot access", async () => {
    const repository = {
      findProjectReportData: vi.fn().mockResolvedValue(null),
    };
    const service = reportsServiceModule.createReportsService(repository);

    await expect(
      service.generateProjectReport("project-1", "user-2"),
    ).rejects.toThrow("Projet introuvable");
  });

  it("marks the report incomplete when installation checks are missing", () => {
    expect(
      reportsServiceModule.reportStatus(project, {
        ...project.installation,
        maximumIcc: null,
      }),
    ).toBe("Controles incomplets");
  });

  it("shows an Ib-based preliminary protection rating before full calculation", () => {
    const circuit = {
      totalPower: 1200,
      cosPhi: 0.8,
      calculationResult: null,
    };

    expect(
      reportsServiceModule.getCircuitProtectionSummary(circuit, {
        nominalVoltage: 230,
        phaseType: "1N",
      }),
    ).toEqual({ ib: 1200 / (230 * 0.8), inCurrent: 10, isPreliminary: true });
  });

  it("uses the persisted protection rating after full circuit calculation", () => {
    expect(
      reportsServiceModule.getCircuitProtectionSummary(
        {
          calculationResult: { ib: 12.3, inCurrent: 16 },
        },
        null,
      ),
    ).toEqual({ ib: 12.3, inCurrent: 16, isPreliminary: false });
  });

  it("formats the saved project validation date for the report", () => {
    expect(
      reportsServiceModule.formatDate(new Date("2026-09-29T10:00:00.000Z")),
    ).toBe("29 septembre 2026");
    expect(reportsServiceModule.formatDate(null)).toBe("Non valide");
  });
});
