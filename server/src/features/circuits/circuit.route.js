const express = require("express");
const circuit = express.Router();

const circuitController = require("./circuit.controller");
const { validateZod } = require("../../common/middlewares/zodValidator");
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

circuit.post("/", validateZod(createCircuitSchema), circuitController.create);
circuit.get(
  "/installation/:installationId",
  validateZod(installationIdParamSchema, "params"),
  circuitController.listByInstallation,
);
circuit.get(
  "/:id",
  validateZod(idParamSchema, "params"),
  circuitController.getById,
);
circuit.patch(
  "/:id",
  validateZod(idParamSchema, "params"),
  validateZod(updateCircuitSchema),
  circuitController.update,
);
circuit.delete(
  "/:id",
  validateZod(idParamSchema, "params"),
  circuitController.remove,
);
circuit.post(
  "/:id/calculate",
  validateZod(idParamSchema, "params"),
  validateZod(runCalculationSchema),
  circuitController.runCalculation,
);

module.exports = circuit;
