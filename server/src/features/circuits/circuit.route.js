const express = require("express");
const { validate } = require("../../common/middlewares/validator");
const circuitsController = require("./circuit.controller");
const {
  createCircuitSchema,
  updateCircuitSchema,
} = require("./circuit.validator");

const router = express.Router();

router.post(
  "/circuits",
  validate(createCircuitSchema),
  circuitsController.create,
);
router.get("/circuits/:id", circuitsController.getById);
router.get(
  "/installations/:installationId/circuits",
  circuitsController.listByInstallation,
);
router.patch(
  "/circuits/:id",
  validate(updateCircuitSchema),
  circuitsController.update,
);
router.delete("/circuits/:id", circuitsController.remove);

module.exports = router;
