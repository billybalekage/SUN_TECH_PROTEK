const express = require("express");
const circuit = express.Router();

const circuitController = require("./circuit.controller");
const { validate } = require("../../common/middlewares/validator");
const {
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
  idParamSchema,
  installationIdParamSchema,
} = require("./circuit.validator");
const verifyToken = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/roles");

circuit.use(verifyToken);
circuit.use(requireRole("ELECTRICIEN"));

circuit.post("/", validate(createCircuitSchema), circuitController.create);
circuit.get(
  "/installation/:installationId",
  validate(installationIdParamSchema, "params"),
  circuitController.listByInstallation,
);
circuit.get(
  "/:id",
  validate(idParamSchema, "params"),
  circuitController.getById,
);
circuit.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCircuitSchema),
  circuitController.update,
);
circuit.delete(
  "/:id",
  validate(idParamSchema, "params"),
  circuitController.remove,
);
circuit.post(
  "/:id/calculate",
  validate(idParamSchema, "params"),
  validate(runCalculationSchema),
  circuitController.runCalculation,
);

module.exports = circuit;
