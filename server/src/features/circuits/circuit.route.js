const express = require("express");
const router = express.Router();

const circuitController = require("./circuit.controller");
const { validate } = require("../../../common/middlewares/validator");
const {
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
  idParamSchema,
  installationIdParamSchema,
} = require("./circuit.validator");
const verifyToken = require("../../../common/middlewares/auth");

router.use(verifyToken); // toutes les routes circuits nécessitent une authentification

router.post("/", validate(createCircuitSchema), circuitController.create);
router.get(
  "/installation/:installationId",
  validate(installationIdParamSchema, "params"),
  circuitController.listByInstallation,
);
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  circuitController.getById,
);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateCircuitSchema),
  circuitController.update,
);
router.delete(
  "/:id",
  validate(idParamSchema, "params"),
  circuitController.remove,
);
router.post(
  "/:id/calculate",
  validate(idParamSchema, "params"),
  validate(runCalculationSchema),
  circuitController.runCalculation,
);

module.exports = router;
