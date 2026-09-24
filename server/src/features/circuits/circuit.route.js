const express = require("express");
const router = express.Router();

const circuitController = require("../controller/circuit.controller");
const { validate } = require("../../../common/middlewares/validate.middleware");
const {
  createCircuitSchema,
  updateCircuitSchema,
  runCalculationSchema,
} = require("../validator/circuit.validator");
const verifyToken = require("../../../common/middlewares/auth.middleware");

router.use(verifyToken); // toutes les routes circuits nécessitent une authentification

router.post("/", validate(createCircuitSchema), circuitController.create);
router.get(
  "/installation/:installationId",
  circuitController.listByInstallation,
);
router.get("/:id", circuitController.getById);
router.patch("/:id", validate(updateCircuitSchema), circuitController.update);
router.delete("/:id", circuitController.remove);
router.post(
  "/:id/calculate",
  validate(runCalculationSchema),
  circuitController.runCalculation,
);

module.exports = router;
