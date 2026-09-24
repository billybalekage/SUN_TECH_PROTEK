const circuitService = require("./circuit.service");

function handleControllerError(error, res) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: statusCode === 500 ? "Internal server error" : error.message,
  });
}

async function create(req, res) {
  try {
    const circuit = await circuitService.createCircuit(req.body);
    return res.status(201).json(circuit);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

async function getById(req, res) {
  try {
    const circuit = await circuitService.getCircuitById(req.params.id);
    return res.status(200).json(circuit);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

async function listByInstallation(req, res) {
  try {
    const circuits = await circuitService.listCircuitsByInstallation(
      req.params.installationId,
    );
    return res.status(200).json(circuits);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

async function update(req, res) {
  try {
    const circuit = await circuitService.updateCircuit(req.params.id, req.body);
    return res.status(200).json(circuit);
  } catch (error) {
    return handleControllerError(error, res);
  }
}

async function remove(req, res) {
  try {
    await circuitService.deleteCircuit(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleControllerError(error, res);
  }
}

module.exports = { create, getById, listByInstallation, update, remove };
