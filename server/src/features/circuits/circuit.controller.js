const circuitRepository = require("../repository/circuit.repository");
const { runCircuitCalculation } = require("../services/circuit.service");
const { asyncHandler } = require("../../../common/utils/asyncHandler");
const { NotFoundError } = require("../../../common/errors/AppErrors");

const create = asyncHandler(async (req, res) => {
  const circuit = await circuitRepository.createCircuit(req.body);
  res.status(201).json(circuit);
});

const getById = asyncHandler(async (req, res) => {
  const circuit = await circuitRepository.findCircuitById(req.params.id);
  if (!circuit) {
    throw new NotFoundError(`Circuit introuvable : ${req.params.id}`);
  }
  res.json(circuit);
});

const listByInstallation = asyncHandler(async (req, res) => {
  const circuits = await circuitRepository.findCircuitsByInstallation(
    req.params.installationId,
  );
  res.json(circuits);
});

const update = asyncHandler(async (req, res) => {
  const circuit = await circuitRepository.updateCircuit(
    req.params.id,
    req.body,
  );
  res.json(circuit);
});

const remove = asyncHandler(async (req, res) => {
  await circuitRepository.deleteCircuit(req.params.id);
  res.status(204).send();
});

const runCalculation = asyncHandler(async (req, res) => {
  const result = await runCircuitCalculation(req.params.id, req.body);
  res.json(result);
});

module.exports = {
  create,
  getById,
  listByInstallation,
  update,
  remove,
  runCalculation,
};
