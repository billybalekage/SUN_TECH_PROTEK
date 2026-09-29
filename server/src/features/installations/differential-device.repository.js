const prisma = require("../../config/database");
const { ConflictError } = require("../../common/errors/AppErrors");

async function findInstallationById(id) {
  return prisma.installation.findUnique({
    where: { id },
    include: { project: true },
  });
}

async function createDevice(data) {
  return prisma.differentialDevice.create({ data });
}

async function findDeviceById(id) {
  return prisma.differentialDevice.findUnique({
    where: { id },
    include: { circuits: true, installation: { include: { project: true } } },
  });
}

async function findDevicesByInstallation(installationId) {
  return prisma.differentialDevice.findMany({
    where: { installationId },
    include: { circuits: { include: { calculationResult: true } } },
    orderBy: { createdAt: "asc" },
  });
}

async function assignCircuitToDevice(
  circuitId,
  differentialDeviceId,
  prismaClient = prisma,
) {
  return prismaClient.$transaction(async (transaction) => {
    const circuit = await transaction.circuit.findUnique({
      where: { id: circuitId },
      select: { differentialDeviceId: true, installationId: true },
    });
    const assignmentChanged =
      circuit?.differentialDeviceId !== differentialDeviceId;
    const affectedDeviceIds = [
      ...new Set(
        [circuit?.differentialDeviceId, differentialDeviceId].filter(Boolean),
      ),
    ];

    if (assignmentChanged) {
      await transaction.installation.update({
        where: { id: circuit.installationId },
        data: { version: { increment: 1 } },
      });
      await transaction.differentialDevice.updateMany({
        where: { id: { in: affectedDeviceIds } },
        data: { sensitivityMa: null, type: null, ratedCurrent: null },
      });
    }

    const updatedCircuit = await transaction.circuit.update({
      where: { id: circuitId },
      data: { differentialDeviceId },
      include: { differentialDevice: true },
    });
    if (assignmentChanged) {
      const affectedCircuits = await transaction.circuit.findMany({
        where: { differentialDeviceId: { in: affectedDeviceIds } },
        select: { id: true },
      });
      await transaction.calculationResult.deleteMany({
        where: {
          circuitId: {
            in: affectedCircuits.map(({ id }) => id),
          },
        },
      });
      await transaction.circuit.updateMany({
        where: { differentialDeviceId: { in: affectedDeviceIds } },
        data: { validatedAt: null },
      });
    }
    return updatedCircuit;
  });
}

async function saveDeviceRating(
  id,
  installationId,
  expectedVersion,
  data,
  prismaClient = prisma,
) {
  return prismaClient.$transaction(async (transaction) => {
    const versionUpdate = await transaction.installation.updateMany({
      where: { id: installationId, version: expectedVersion },
      data: { version: { increment: 1 } },
    });
    if (versionUpdate.count !== 1) {
      throw new ConflictError(
        "L'installation a été modifiée pendant le calcul; relancez le calcul",
      );
    }

    const device = await transaction.differentialDevice.update({
      where: { id },
      data,
    });
    const circuits = await transaction.circuit.findMany({
      where: { differentialDeviceId: id },
      select: { id: true },
    });
    await transaction.calculationResult.deleteMany({
      where: {
        circuitId: { in: circuits.map(({ id: circuitId }) => circuitId) },
      },
    });
    await transaction.circuit.updateMany({
      where: { differentialDeviceId: id },
      data: { validatedAt: null },
    });
    return device;
  });
}

async function findCircuitWithOwnership(circuitId) {
  return prisma.circuit.findUnique({
    where: { id: circuitId },
    include: { installation: { include: { project: true } } },
  });
}

module.exports = {
  findInstallationById,
  createDevice,
  findDeviceById,
  findDevicesByInstallation,
  assignCircuitToDevice,
  saveDeviceRating,
  findCircuitWithOwnership,
};
