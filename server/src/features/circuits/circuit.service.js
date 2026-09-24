const circuitRepository = require("./circuit.repository");

function createServiceError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function ensureInstallationExists(installationId) {
  const installation =
    await circuitRepository.findInstallationById(installationId);

  if (!installation) {
    throw createServiceError("Installation introuvable", 404);
  }
}

async function createCircuit(data) {
  await ensureInstallationExists(data.installationId);
  return circuitRepository.createCircuit(data);
}

async function getCircuitById(id) {
  const circuit = await circuitRepository.findCircuitById(id);

  if (!circuit) {
    throw createServiceError("Circuit introuvable", 404);
  }

  return circuit;
}

async function listCircuitsByInstallation(installationId) {
  await ensureInstallationExists(installationId);
  return circuitRepository.findCircuitsByInstallation(installationId);
}

async function updateCircuit(id, data) {
  await getCircuitById(id);

  if (data.installationId) {
    await ensureInstallationExists(data.installationId);
  }

  return circuitRepository.updateCircuit(id, data);
}

async function deleteCircuit(id) {
  await getCircuitById(id);
  await circuitRepository.deleteCircuit(id);
}

async function saveCalculationResult(circuitId, resultData) {
  await getCircuitById(circuitId);
  return circuitRepository.saveCalculationResult(circuitId, resultData);
}

module.exports = {
  createCircuit,
  getCircuitById,
  listCircuitsByInstallation,
  updateCircuit,
  deleteCircuit,
  saveCalculationResult,
};
