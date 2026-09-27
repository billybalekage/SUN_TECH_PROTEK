const express = require("express");
const verifyToken = require("../../common/middlewares/auth");
const { requireRole } = require("../../common/middlewares/roles");
const { validate } = require("../../common/middlewares/validator");
const installationController = require("./installation.controller");
const {
  createInstallationSchema,
  projectIdParamsSchema,
} = require("./installation.validator");

const installation = express.Router();

installation.use(verifyToken);
installation.use(requireRole("ELECTRICIEN"));
installation.post(
  "/",
  validate(createInstallationSchema),
  installationController.create,
);
installation.get(
  "/project/:projectId",
  validate(projectIdParamsSchema, "params"),
  installationController.getByProject,
);

module.exports = installation;
