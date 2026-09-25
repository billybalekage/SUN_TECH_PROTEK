const prisma = require("../../config/database");

async function findInstallationById(id) {
  return prisma.installation.findUnique({
    where: { id },
    include: { project: true },
  });
}

//Crée un circuit rattaché à une installation.
async function createCircuit(data) {
  return prisma.circuit.create({ data });
}

//Récupère un circuit par son id, avec son résultat de calcul associ et les composants qui lui sont liés (protection + câble).
async function findCircuitById(id) {
  return prisma.circuit.findUnique({
    where: { id },
    include: {
      calculationResult: true,
      circuitComponents: { include: { component: true } },
      installation: { include: { project: true } },
    },
  });
}

//Liste tous les circuits d'une installation donnée.
async function findCircuitsByInstallation(installationId) {
  return prisma.circuit.findMany({
    where: { installationId },
    include: { calculationResult: true },
    orderBy: { createdAt: "asc" },
  });
}

// Met à jour un circuit existant.
async function updateCircuit(id, data) {
  return prisma.circuit.update({
    where: { id },
    data,
  });
}

// Supprime un circuit (cascade sur calculationResult et circuitComponentsvia les contraintes onDelete: Cascade définies dans le schéma Prisma).

async function deleteCircuit(id) {
  return prisma.circuit.delete({ where: { id } });
}

/**
 * Enregistre (ou remplace) le résultat de calcul d'un circuit.
 * Upsert car un circuit n'a qu'un seul résultat (relation 1:1).
 */
async function saveCalculationResult(circuitId, resultData) {
  return prisma.calculationResult.upsert({
    where: { circuitId },
    create: { circuitId, ...resultData },
    update: resultData,
  });
}

module.exports = {
  findInstallationById,
  createCircuit,
  findCircuitById,
  findCircuitsByInstallation,
  updateCircuit,
  deleteCircuit,
  saveCalculationResult,
};
