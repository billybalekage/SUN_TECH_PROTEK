const prisma = require("../../config/database");

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

async function assignCircuitToDevice(circuitId, differentialDeviceId) {
  return prisma.$transaction(async (transaction) => {
    const circuit = await transaction.circuit.findUnique({
      where: { id: circuitId },
      select: { differentialDeviceId: true },
    });
    const affectedDeviceIds = [
      ...new Set(
        [circuit?.differentialDeviceId, differentialDeviceId].filter(Boolean),
      ),
    ];

    await transaction.differentialDevice.updateMany({
      where: { id: { in: affectedDeviceIds } },
      data: { sensitivityMa: null, type: null, ratedCurrent: null },
    });

    return transaction.circuit.update({
      where: { id: circuitId },
      data: { differentialDeviceId },
      include: { differentialDevice: true },
    });
  });
}

async function updateDeviceRating(id, data) {
  return prisma.differentialDevice.update({ where: { id }, data });
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
  updateDeviceRating,
  findCircuitWithOwnership,
};
