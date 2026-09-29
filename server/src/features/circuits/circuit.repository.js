const prisma = require("../../config/database");
const { ConflictError } = require("../../common/errors/AppErrors");

async function invalidateDifferentialDeviceCircuits(
  transaction,
  differentialDeviceId,
  exceptCircuitId,
) {
  const circuits = await transaction.circuit.findMany({
    where: {
      differentialDeviceId,
      ...(exceptCircuitId ? { id: { not: exceptCircuitId } } : {}),
    },
    select: { id: true },
  });
  const circuitIds = circuits.map(({ id }) => id);
  await transaction.calculationResult.deleteMany({
    where: { circuitId: { in: circuitIds } },
  });
  await transaction.circuit.updateMany({
    where: { differentialDeviceId },
    data: { validatedAt: null },
  });
}

async function findInstallationById(id) {
  return prisma.installation.findUnique({
    where: { id },
    include: { project: true },
  });
}

//Crée un circuit rattaché à une installation.
async function createCircuit(data, prismaClient = prisma) {
  return prismaClient.$transaction(async (transaction) => {
    await transaction.installation.update({
      where: { id: data.installationId },
      data: {
        generalProtectionRating: null,
        version: { increment: 1 },
      },
    });
    let differentialDevice = await transaction.differentialDevice.findFirst({
      where: { installationId: data.installationId },
      orderBy: { createdAt: "asc" },
    });

    if (!differentialDevice) {
      differentialDevice = await transaction.differentialDevice.create({
        data: {
          installationId: data.installationId,
          label: "Protection différentielle",
        },
      });
    } else {
      await transaction.differentialDevice.update({
        where: { id: differentialDevice.id },
        data: { sensitivityMa: null, type: null, ratedCurrent: null },
      });
      await invalidateDifferentialDeviceCircuits(
        transaction,
        differentialDevice.id,
      );
    }

    const circuit = await transaction.circuit.create({
      data: {
        ...data,
        differentialDeviceId: differentialDevice.id,
      },
      include: { differentialDevice: true },
    });
    return circuit;
  });
}

//Récupère un circuit par son id, avec son résultat de calcul associ et les composants qui lui sont liés (protection + câble).
async function findCircuitById(id) {
  return prisma.circuit.findUnique({
    where: { id },
    include: {
      calculationResult: true,
      differentialDevice: true,
      circuitComponents: { include: { component: true } },
      installation: { include: { project: true } },
    },
  });
}

//Liste tous les circuits d'une installation donnée.
async function findCircuitsByInstallation(installationId) {
  return prisma.circuit.findMany({
    where: { installationId },
    include: { calculationResult: true, differentialDevice: true },
    orderBy: { createdAt: "asc" },
  });
}

// Met à jour un circuit existant.
async function updateCircuit(id, data) {
  const calculationFields = [
    "circuitType",
    "totalPower",
    "farthestLoadDistance",
    "cosPhi",
    "numberOfCircuits",
    "usageLocation",
    "breakerTripCurve",
  ];
  const requiresRecalculation = calculationFields.some((field) =>
    Object.hasOwn(data, field),
  );
  const requiresDeviceRerating = [
    "circuitType",
    "totalPower",
    "cosPhi",
    "usageLocation",
  ].some((field) => Object.hasOwn(data, field));

  if (!requiresRecalculation) {
    return prisma.circuit.update({ where: { id }, data });
  }

  return prisma.$transaction(async (transaction) => {
    const currentCircuit = await transaction.circuit.findUnique({
      where: { id },
      select: { differentialDeviceId: true, installationId: true },
    });
    if (currentCircuit?.installationId) {
      await transaction.installation.update({
        where: { id: currentCircuit.installationId },
        data: {
          generalProtectionRating: null,
          version: { increment: 1 },
        },
      });
    }
    const updatedCircuit = await transaction.circuit.update({
      where: { id },
      data: { ...data, validatedAt: null },
      include: { calculationResult: true, differentialDevice: true },
    });
    if (requiresDeviceRerating && currentCircuit?.differentialDeviceId) {
      await transaction.differentialDevice.update({
        where: { id: currentCircuit.differentialDeviceId },
        data: { sensitivityMa: null, type: null, ratedCurrent: null },
      });
      await invalidateDifferentialDeviceCircuits(
        transaction,
        currentCircuit.differentialDeviceId,
      );
    } else {
      await transaction.calculationResult.deleteMany({
        where: { circuitId: id },
      });
    }
    return updatedCircuit;
  });
}

// Supprime un circuit (cascade sur calculationResult et circuitComponentsvia les contraintes onDelete: Cascade définies dans le schéma Prisma).

async function deleteCircuit(id) {
  return prisma.$transaction(async (transaction) => {
    const circuit = await transaction.circuit.findUnique({
      where: { id },
      select: { differentialDeviceId: true, installationId: true },
    });
    if (circuit?.installationId) {
      await transaction.installation.update({
        where: { id: circuit.installationId },
        data: {
          generalProtectionRating: null,
          version: { increment: 1 },
        },
      });
    }
    if (circuit?.differentialDeviceId) {
      await transaction.differentialDevice.update({
        where: { id: circuit.differentialDeviceId },
        data: { sensitivityMa: null, type: null, ratedCurrent: null },
      });
      await invalidateDifferentialDeviceCircuits(
        transaction,
        circuit.differentialDeviceId,
      );
    }
    const deletedCircuit = await transaction.circuit.delete({ where: { id } });
    return deletedCircuit;
  });
}

async function markCircuitValidated(id) {
  return prisma.circuit.update({
    where: { id },
    data: { validatedAt: new Date() },
  });
}

/**
 * Enregistre (ou remplace) le résultat de calcul d'un circuit.
 * Upsert car un circuit n'a qu'un seul résultat (relation 1:1).
 */
async function saveCalculationResult(
  circuitId,
  resultData,
  installationId,
  expectedVersion,
  generalProtectionRating,
  differentialDeviceRating,
  prismaClient = prisma,
) {
  return prismaClient.$transaction(async (transaction) => {
    const versionUpdate = await transaction.installation.updateMany({
      where: { id: installationId, version: expectedVersion },
      data: {
        version: { increment: 1 },
        generalProtectionRating,
      },
    });
    if (versionUpdate.count !== 1) {
      throw new ConflictError(
        "L'installation a été modifiée pendant le calcul; relancez le calcul",
      );
    }

    if (differentialDeviceRating) {
      await transaction.differentialDevice.update({
        where: { id: differentialDeviceRating.id },
        data: {
          sensitivityMa: differentialDeviceRating.sensitivityMa,
          type: differentialDeviceRating.type,
          ratedCurrent: differentialDeviceRating.ratedCurrent,
        },
      });
      await invalidateDifferentialDeviceCircuits(
        transaction,
        differentialDeviceRating.id,
        circuitId,
      );
    }

    await transaction.circuit.update({
      where: { id: circuitId },
      data: { validatedAt: null },
    });

    return transaction.calculationResult.upsert({
      where: { circuitId },
      create: { circuitId, ...resultData },
      update: resultData,
    });
  });
}

module.exports = {
  findInstallationById,
  createCircuit,
  findCircuitById,
  findCircuitsByInstallation,
  updateCircuit,
  deleteCircuit,
  markCircuitValidated,
  saveCalculationResult,
};
