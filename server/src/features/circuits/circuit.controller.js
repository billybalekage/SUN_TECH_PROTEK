const {
  createCircuit,
  getCircuit,
  listCircuitsByInstallation,
  updateCircuit,
  deleteCircuit,
  runCircuitCalculation,
} = require("./circuit.service");
const { asyncHandler } = require("../../common/utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const circuit = await createCircuit(req.user.id, req.body);
  res.status(201).json(circuit);
});

const getById = asyncHandler(async (req, res) => {
  const circuit = await getCircuit(req.user.id, req.params.id);
  res.json(circuit);
});

const listByInstallation = asyncHandler(async (req, res) => {
  const circuits = await listCircuitsByInstallation(
    req.user.id,
    req.params.installationId,
  );
  res.json(circuits);
});

const update = asyncHandler(async (req, res) => {
  const circuit = await updateCircuit(req.user.id, req.params.id, req.body);
  res.json(circuit);
});

const remove = asyncHandler(async (req, res) => {
  await deleteCircuit(req.user.id, req.params.id);
  res.status(204).send();
});

const runCalculation = asyncHandler(async (req, res) => {
  const result = await runCircuitCalculation(
    req.user.id,
    req.params.id,
    req.body,
  );
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
