import { beforeEach, describe, expect, it, vi } from "vitest";

import circuitRepository from "../../../src/features/circuits/circuit.repository.js";

const prismaClient = {
  $transaction: vi.fn(),
};
const transaction = {
  differentialDevice: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  circuit: {
    create: vi.fn(),
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
  });

  it("reuses the installation DDR when creating subsequent circuits", async () => {
    const device = {
      id: "device-existing",
      sensitivityMa: 30,
      type: "A",
      ratedCurrent: 40,
    };
    transaction.differentialDevice.findFirst.mockResolvedValue(device);
    transaction.circuit.create.mockResolvedValue({ id: "circuit-2" });

    await circuitRepository.createCircuit(circuitData, prismaClient);

    expect(transaction.differentialDevice.create).not.toHaveBeenCalled();
    expect(transaction.differentialDevice.update).toHaveBeenCalledWith({
      where: { id: "device-existing" },
      data: { sensitivityMa: null, type: null, ratedCurrent: null },
    });
    expect(transaction.circuit.create).toHaveBeenCalledWith({
      data: { ...circuitData, differentialDeviceId: "device-existing" },
      include: { differentialDevice: true },
    });
  });
});
