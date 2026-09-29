import { beforeEach, describe, expect, it, vi } from "vitest";

import differentialDeviceRepository from "../../../src/features/installations/differential-device.repository.js";

const prismaClient = {
  $transaction: vi.fn(),
};
const transaction = {
  installation: {
    updateMany: vi.fn(),
  },
  differentialDevice: {
    update: vi.fn(),
  },
  circuit: {
    findMany: vi.fn(),
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
