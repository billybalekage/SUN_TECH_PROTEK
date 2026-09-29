const coordinationService = require("./coordination.service");
const { asyncHandler } = require("../../common/utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const device = await coordinationService.createDevice(req.user.id, req.body);
  res.status(201).json(device);
});

const listByInstallation = asyncHandler(async (req, res) => {
  const devices = await coordinationService.listDevicesByInstallation(
    req.user.id,
    req.params.installationId,
  );
  res.json(devices);
});

const assignCircuit = asyncHandler(async (req, res) => {
  const circuit = await coordinationService.assignCircuit(
    req.user.id,
    req.body,
  );
  res.json(circuit);
});

const computeRating = asyncHandler(async (req, res) => {
  const device = await coordinationService.computeDeviceRating(
    req.user.id,
    req.params.id,
  );
  res.json(device);
});

const getCoverage = asyncHandler(async (req, res) => {
  const result = await coordinationService.checkDeviceCoverage(
    req.user.id,
    req.params.id,
  );
  res.json(result);
});

const getInstallationSelectivity = asyncHandler(async (req, res) => {
  const result = await coordinationService.checkInstallationSelectivity(
    req.user.id,
    req.params.installationId,
  );
  res.json(result);
});

module.exports = {
  create,
  listByInstallation,
  assignCircuit,
  computeRating,
  getCoverage,
  getInstallationSelectivity,
};
