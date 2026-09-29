import { beforeEach, describe, expect, it, vi } from "vitest";

import circuitRepository from "../../../src/features/circuits/circuit.repository.js";

const prismaClient = {
  $transaction: vi.fn(),
};
const transaction = {
  installation: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  calculationResult: {
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  differentialDevice: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  circuit: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
};

const circuitData = {
  installationId: "installation-1",
  name: "Éclairage séjour",
  circuitType: "ECLAIRAGE",
  totalPower: 2300,
  farthestLoadDistance: 20,
  cosPhi: 1,
  numberOfCircuits: 1,
  usageLocation: "ECLAIRAGE",
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaClient.$transaction.mockImplementation((callback) =>
    callback(transaction),
  );
  transaction.circuit.findMany.mockResolvedValue([]);
  transaction.installation.updateMany.mockResolvedValue({ count: 1 });
});

describe("createCircuit differential device assignment", () => {
  it("creates one installation DDR and assigns the new circuit when none exists", async () => {
    const device = { id: "device-1" };
    const circuit = { id: "circuit-1", differentialDevice: device };
    transaction.differentialDevice.findFirst.mockResolvedValue(null);
    transaction.differentialDevice.create.mockResolvedValue(device);
    transaction.circuit.create.mockResolvedValue(circuit);

    await expect(
      circuitRepository.createCircuit(circuitData, prismaClient),
    ).resolves.toBe(circuit);

    expect(transaction.differentialDevice.create).toHaveBeenCalledWith({
      data: {
        installationId: "installation-1",
        label: "Protection différentielle",
      },
    });
    expect(transaction.circuit.create).toHaveBeenCalledWith({
      data: { ...circuitData, differentialDeviceId: "device-1" },
      include: { differentialDevice: true },
    });
    expect(transaction.installation.update).toHaveBeenCalledWith({
      where: { id: "installation-1" },
      data: {
        generalProtectionRating: null,
        version: { increment: 1 },
      },
    });
  });

  it("reuses the installation DDR when creating subsequent circuits", async () => {
    const device = {
      id: "device-existing",
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 40,
    };
    transaction.differentialDevice.findFirst.mockResolvedValue(device);
    transaction.circuit.findMany.mockResolvedValue([{ id: "sibling-1" }]);
    transaction.circuit.create.mockResolvedValue({ id: "circuit-2" });

    await circuitRepository.createCircuit(circuitData, prismaClient);

    expect(transaction.differentialDevice.create).not.toHaveBeenCalled();
    expect(transaction.differentialDevice.update).toHaveBeenCalledWith({
      where: { id: "device-existing" },
      data: { sensitivityMa: null, type: null, ratedCurrent: null },
    });
    expect(transaction.calculationResult.deleteMany).toHaveBeenCalledWith({
      where: { circuitId: { in: ["sibling-1"] } },
    });
    expect(transaction.circuit.updateMany).toHaveBeenCalledWith({
      where: { differentialDeviceId: "device-existing" },
      data: { validatedAt: null },
    });
    expect(transaction.circuit.create).toHaveBeenCalledWith({
      data: { ...circuitData, differentialDeviceId: "device-existing" },
      include: { differentialDevice: true },
    });
  });

  it("saves a DDR rating, invalidates sibling results, and upserts atomically", async () => {
    const result = { id: "result-1" };
    transaction.differentialDevice.findUnique.mockResolvedValue({
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 40,
    });
    transaction.circuit.findMany.mockResolvedValue([{ id: "sibling-1" }]);
    transaction.calculationResult.upsert.mockResolvedValue(result);

    await expect(
      circuitRepository.saveCalculationResult(
        "circuit-1",
        { ib: 10 },
        "installation-1",
        3,
        40,
        {
          id: "device-1",
          sensitivityMa: 30,
          type: "A",
          ratedCurrent: 32,
        },
        prismaClient,
      ),
    ).resolves.toBe(result);

    expect(transaction.installation.updateMany).toHaveBeenCalledWith({
      where: { id: "installation-1", version: 3 },
      data: { version: { increment: 1 }, generalProtectionRating: 40 },
    });
    expect(transaction.differentialDevice.update).toHaveBeenCalledWith({
      where: { id: "device-1" },
      data: { sensitivityMa: 30, type: "A", ratedCurrent: 32 },
    });
    expect(transaction.calculationResult.deleteMany).toHaveBeenCalledWith({
      where: { circuitId: { in: ["sibling-1"] } },
    });
    expect(transaction.calculationResult.upsert).toHaveBeenCalledWith({
      where: { circuitId: "circuit-1" },
      create: { circuitId: "circuit-1", ib: 10 },
      update: { ib: 10 },
    });
  });

  it("keeps sibling calculation results when the shared DDR rating is unchanged", async () => {
    const result = { id: "result-2" };
    transaction.differentialDevice.findUnique.mockResolvedValue({
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 32,
    });
    transaction.calculationResult.upsert.mockResolvedValue(result);

    await expect(
      circuitRepository.saveCalculationResult(
        "circuit-2",
        { ib: 12 },
        "installation-1",
        4,
        40,
        {
          id: "device-1",
          sensitivityMa: 30,
          type: "A",
          ratedCurrent: 32,
        },
        prismaClient,
      ),
    ).resolves.toBe(result);

    expect(transaction.calculationResult.deleteMany).not.toHaveBeenCalled();
    expect(transaction.circuit.updateMany).not.toHaveBeenCalled();
    expect(transaction.calculationResult.upsert).toHaveBeenCalledWith({
      where: { circuitId: "circuit-2" },
      create: { circuitId: "circuit-2", ib: 12 },
      update: { ib: 12 },
    });
  });

  it("does not persist DDR or calculation changes after a version conflict", async () => {
    transaction.installation.updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      circuitRepository.saveCalculationResult(
        "circuit-1",
        { ib: 10 },
        "installation-1",
        3,
        40,
        { id: "device-1", sensitivityMa: 30, type: "A", ratedCurrent: 32 },
        prismaClient,
      ),
    ).rejects.toThrow("modifiée pendant le calcul");

    expect(transaction.differentialDevice.update).not.toHaveBeenCalled();
    expect(transaction.calculationResult.deleteMany).not.toHaveBeenCalled();
    expect(transaction.calculationResult.upsert).not.toHaveBeenCalled();
  });
});
