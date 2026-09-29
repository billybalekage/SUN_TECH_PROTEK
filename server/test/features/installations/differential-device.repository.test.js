import { beforeEach, describe, expect, it, vi } from "vitest";

import differentialDeviceRepository from "../../../src/features/installations/differential-device.repository.js";

const prismaClient = {
  $transaction: vi.fn(),
};
const transaction = {
  installation: {
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  differentialDevice: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  circuit: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  calculationResult: {
    deleteMany: vi.fn(),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaClient.$transaction.mockImplementation((callback) =>
    callback(transaction),
  );
  transaction.installation.updateMany.mockResolvedValue({ count: 1 });
  transaction.differentialDevice.update.mockResolvedValue({ id: "device-1" });
  transaction.circuit.findMany.mockResolvedValue([{ id: "circuit-1" }]);
});

describe("assignCircuitToDevice", () => {
  it("invalidates both DDR groups when the circuit moves", async () => {
    transaction.circuit.findUnique.mockResolvedValue({
      differentialDeviceId: "old-device",
      installationId: "installation-1",
    });
    transaction.circuit.findMany.mockResolvedValue([
      { id: "moved-circuit" },
      { id: "old-sibling" },
      { id: "new-sibling" },
    ]);
    transaction.circuit.update.mockResolvedValue({ id: "moved-circuit" });

    await expect(
      differentialDeviceRepository.assignCircuitToDevice(
        "moved-circuit",
        "new-device",
        prismaClient,
      ),
    ).resolves.toEqual({ id: "moved-circuit" });

    expect(transaction.installation.update).toHaveBeenCalledWith({
      where: { id: "installation-1" },
      data: { version: { increment: 1 } },
    });
    expect(transaction.differentialDevice.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["old-device", "new-device"] } },
      data: { sensitivityMa: null, type: null, ratedCurrent: null },
    });
    expect(transaction.calculationResult.deleteMany).toHaveBeenCalledWith({
      where: {
        circuitId: { in: ["moved-circuit", "old-sibling", "new-sibling"] },
      },
    });
    expect(transaction.circuit.updateMany).toHaveBeenCalledWith({
      where: { differentialDeviceId: { in: ["old-device", "new-device"] } },
      data: { validatedAt: null },
    });
  });

  it("does not invalidate or reset ratings when the assignment is unchanged", async () => {
    transaction.circuit.findUnique.mockResolvedValue({
      differentialDeviceId: "device-1",
      installationId: "installation-1",
    });

    await differentialDeviceRepository.assignCircuitToDevice(
      "circuit-1",
      "device-1",
      prismaClient,
    );

    expect(transaction.installation.update).not.toHaveBeenCalled();
    expect(transaction.differentialDevice.updateMany).not.toHaveBeenCalled();
    expect(transaction.calculationResult.deleteMany).not.toHaveBeenCalled();
    expect(transaction.circuit.updateMany).not.toHaveBeenCalled();
  });
});

describe("saveDeviceRating", () => {
  it("persists the rating and invalidates calculations in one transaction", async () => {
    await expect(
      differentialDeviceRepository.saveDeviceRating(
        "device-1",
        "installation-1",
        5,
        { sensitivityMa: 30, type: "A", ratedCurrent: 32 },
        prismaClient,
      ),
    ).resolves.toEqual({ id: "device-1" });

    expect(transaction.installation.updateMany).toHaveBeenCalledWith({
      where: { id: "installation-1", version: 5 },
      data: { version: { increment: 1 } },
    });
    expect(transaction.calculationResult.deleteMany).toHaveBeenCalledWith({
      where: { circuitId: { in: ["circuit-1"] } },
    });
    expect(transaction.circuit.updateMany).toHaveBeenCalledWith({
      where: { differentialDeviceId: "device-1" },
      data: { validatedAt: null },
    });
  });

  it("does not write a rating or invalidate results after a version conflict", async () => {
    transaction.installation.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      differentialDeviceRepository.saveDeviceRating(
        "device-1",
        "installation-1",
        5,
        { sensitivityMa: 30, type: "A", ratedCurrent: 32 },
        prismaClient,
      ),
    ).rejects.toThrow("modifiée pendant le calcul");

    expect(transaction.differentialDevice.update).not.toHaveBeenCalled();
    expect(transaction.calculationResult.deleteMany).not.toHaveBeenCalled();
    expect(transaction.circuit.updateMany).not.toHaveBeenCalled();
  });
});
