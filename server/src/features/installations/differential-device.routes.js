const express = require("express");
const router = express.Router();

const controller = require("./differential-device.controller");
const { validate } = require("../../common/middlewares/validator");
const {
  createDifferentialDeviceSchema,
  assignCircuitSchema,
  idParamSchema,
  installationIdParamSchema,
} = require("./differential-device.validator");
const verifyToken = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/roles");

router.use(verifyToken);
router.use(requireRole("ELECTRICIEN"));

router.post("/", validate(createDifferentialDeviceSchema), controller.create);
router.get(
  "/installation/:installationId",
  validate(installationIdParamSchema, "params"),
  controller.listByInstallation,
);
router.post(
  "/assign-circuit",
  validate(assignCircuitSchema),
  controller.assignCircuit,
);
router.get(
  "/:id/coverage",
  validate(idParamSchema, "params"),
  controller.getCoverage,
);
router.get(
  "/installation/:installationId/selectivity",
  validate(installationIdParamSchema, "params"),
  controller.getInstallationSelectivity,
);

module.exports = router;
